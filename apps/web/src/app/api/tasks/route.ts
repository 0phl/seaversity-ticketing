import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";
import { createTaskSchema } from "@/lib/validations/task";

/**
 * Generate the next task number in format TASK-XXXX
 * Uses separate sequence from tickets
 */
async function generateTaskNumber(): Promise<string> {
  const lastTask = await prisma.workItem.findFirst({
    where: { type: "TASK" },
    orderBy: { taskNumber: "desc" },
    select: { taskNumber: true },
  });

  if (!lastTask?.taskNumber) {
    return "TASK-0001";
  }

  // Extract the number part and increment
  const lastNumber = parseInt(lastTask.taskNumber.replace("TASK-", ""), 10);
  const nextNumber = lastNumber + 1;
  return `TASK-${nextNumber.toString().padStart(4, "0")}`;
}

/**
 * GET /api/tasks - List all tasks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToMe = searchParams.get("assignedToMe") === "true";

    const where: Record<string, unknown> = {
      type: "TASK",
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    // Filter for tasks assigned to current user
    if (assignedToMe) {
      where.OR = [
        { assigneeId: session.user.id },
        {
          assignees: {
            some: { userId: session.user.id },
          },
        },
        { teamId: session.user.teamId },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.workItem.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          assignee: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
            orderBy: { assignedAt: "asc" },
          },
          team: {
            select: { id: true, name: true, color: true },
          },
          category: {
            select: { id: true, name: true, color: true, icon: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workItem.count({ where }),
    ]);

    return NextResponse.json({
      data: tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedFields = createTaskSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      priority,
      categoryId,
      projectId,
      dueDate,
      estimatedHours,
      assignmentMode,
      teamId,
      assigneeIds,
    } = validatedFields.data;

    // Generate unique task number
    const taskNumber = await generateTaskNumber();

    // Determine final team ID (default to creator's team if assigning to team)
    const finalTeamId =
      assignmentMode === "team"
        ? teamId || session.user.teamId
        : null;

    // Create the task with transaction for multi-user assignment
    const task = await prisma.$transaction(async (tx) => {
      // Create the work item
      const createdTask = await tx.workItem.create({
        data: {
          type: "TASK",
          taskNumber,
          title,
          description,
          priority,
          status: "OPEN",
          creatorId: session.user.id,
          categoryId: categoryId || null,
          projectId: projectId || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          estimatedHours: estimatedHours || null,
          assignmentMode: assignmentMode || null,
          teamId: finalTeamId,
          // Set legacy assigneeId for backward compatibility
          assigneeId:
            assignmentMode === "individuals" && assigneeIds?.length
              ? assigneeIds[0]
              : null,
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          team: {
            select: { id: true, name: true, color: true },
          },
          category: {
            select: { id: true, name: true, color: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
      });

      // Create multi-user assignments if individuals mode
      if (assignmentMode === "individuals" && assigneeIds?.length) {
        await tx.workItemAssignee.createMany({
          data: assigneeIds.map((userId) => ({
            workItemId: createdTask.id,
            userId,
            assignedBy: session.user.id,
          })),
        });

        // Send notifications to assignees
        const assignees = await tx.user.findMany({
          where: { id: { in: assigneeIds } },
          select: { id: true, name: true },
        });

        for (const assignee of assignees) {
          if (assignee.id !== session.user.id) {
            await tx.notification.create({
              data: {
                userId: assignee.id,
                type: "TICKET_ASSIGNED",
                title: "New Task Assigned",
                message: `You have been assigned to task ${taskNumber}: ${title}`,
                link: `/tasks/${createdTask.id}`,
              },
            });
          }
        }
      }

      // Create activity log
      await tx.activityLog.create({
        data: {
          workItemId: createdTask.id,
          userId: session.user.id,
          action: "TASK_CREATED",
          changes: {
            taskNumber,
            title,
            priority,
            status: "OPEN",
            assignmentMode,
            teamId: finalTeamId,
            assigneeCount: assigneeIds?.length || 0,
          },
        },
      });

      return createdTask;
    });

    // Fetch the complete task with assignees
    const completeTask = await prisma.workItem.findUnique({
      where: { id: task.id },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { assignedAt: "asc" },
        },
        team: {
          select: { id: true, name: true, color: true },
        },
        category: {
          select: { id: true, name: true, color: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(completeTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
