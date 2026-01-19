import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";
import { updateTaskSchema } from "@/lib/validations/task";

/**
 * GET /api/tasks/[id] - Get a single task with its comments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;

    // Check if user can view internal comments
    const canViewInternal = ["AGENT", "MANAGER", "ADMIN"].includes(
      session.user.role
    );

    const task = await prisma.workItem.findUnique({
      where: { id: taskId, type: "TASK" },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        category: {
          select: { id: true, name: true, color: true, icon: true },
        },
        team: {
          select: { id: true, name: true, color: true },
        },
        project: {
          select: { id: true, name: true },
        },
        // Multi-user assignees
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
          orderBy: { assignedAt: "asc" },
        },
        comments: {
          where: canViewInternal ? {} : { isInternal: false },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        timeLogs: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { startedAt: "desc" },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
        activityLogs: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user has access to this task
    // Users can see their own tasks or tasks assigned to them
    // Agents/Managers/Admins can see all tasks
    const isAssignee = (task.assignees || []).some(
      (a) => a.userId === session.user.id
    );
    const hasAccess =
      canViewInternal ||
      task.creatorId === session.user.id ||
      task.assigneeId === session.user.id ||
      isAssignee ||
      task.teamId === session.user.teamId;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/[id] - Update a task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
    const body = await request.json();

    // Validate input
    const validatedFields = updateTaskSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    // Find the existing task
    const existingTask = await prisma.workItem.findUnique({
      where: { id: taskId, type: "TASK" },
      include: {
        assignees: {
          select: { userId: true },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check permissions
    const canModify = ["AGENT", "MANAGER", "ADMIN"].includes(session.user.role);
    const isCreator = existingTask.creatorId === session.user.id;
    const isAssignee =
      existingTask.assigneeId === session.user.id ||
      (existingTask.assignees || []).some((a) => a.userId === session.user.id);

    if (!canModify && !isCreator && !isAssignee) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updateData = validatedFields.data;

    // Track changes for activity log
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    if (updateData.title && updateData.title !== existingTask.title) {
      changes.title = { from: existingTask.title, to: updateData.title };
    }
    if (updateData.status && updateData.status !== existingTask.status) {
      changes.status = { from: existingTask.status, to: updateData.status };
    }
    if (updateData.priority && updateData.priority !== existingTask.priority) {
      changes.priority = { from: existingTask.priority, to: updateData.priority };
    }

    // Update the task
    const updatedTask = await prisma.workItem.update({
      where: { id: taskId },
      data: {
        ...updateData,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
        completedAt:
          updateData.status === "RESOLVED" || updateData.status === "CLOSED"
            ? new Date()
            : updateData.status === "OPEN" || updateData.status === "IN_PROGRESS"
            ? null
            : undefined,
      },
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

    // Create activity log if there were changes
    if (Object.keys(changes).length > 0) {
      await prisma.activityLog.create({
        data: {
          workItemId: taskId,
          userId: session.user.id,
          action: "TASK_UPDATED",
          changes,
        },
      });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
