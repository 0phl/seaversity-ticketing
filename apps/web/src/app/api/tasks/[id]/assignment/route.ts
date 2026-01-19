import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";
import { z } from "zod";

// Validation schema for assignment updates
const assignmentSchema = z.object({
  // Assignment mode: "team" or "individuals"
  assignmentMode: z.enum(["team", "individuals"]).optional(),
  // For team assignment
  teamId: z.string().nullable().optional(),
  // For multi-user assignment (array of user IDs)
  assigneeIds: z.array(z.string()).optional(),
  // Legacy single assignee (backward compatible)
  assigneeId: z.string().nullable().optional(),
  // Special flag for agents claiming a task (adds to assignees)
  claimTask: z.boolean().optional(),
});

/**
 * PATCH /api/tasks/[id]/assignment - Update task assignment
 * Supports:
 * - Team assignment (clears individual assignees)
 * - Multi-user assignment (clears team assignment)
 * - Agent claiming (adds to assignees list)
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
    const validatedFields = assignmentSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { assignmentMode, teamId, assigneeIds, assigneeId, claimTask } =
      validatedFields.data;

    // Find the existing task with assignees
    const existingTask = await prisma.workItem.findUnique({
      where: { id: taskId, type: "TASK" },
      include: {
        assignee: {
          select: { id: true, name: true },
        },
        team: {
          select: { id: true, name: true },
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const userRole = session.user.role;
    const userId = session.user.id;
    const isManagerOrAdmin = ["MANAGER", "ADMIN"].includes(userRole);
    const isAgent = userRole === "AGENT";

    // Get current user's name for activity log
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Check if user exists in database
    if (!currentUser) {
      return NextResponse.json(
        { error: "Your session is invalid. Please log out and log back in." },
        { status: 401 }
      );
    }

    // Handle claim task (AGENT claiming - adds to assignees list)
    if (claimTask) {
      if (!isAgent && !isManagerOrAdmin) {
        return NextResponse.json(
          { error: "Only agents can claim tasks" },
          { status: 403 }
        );
      }

      // Check if user is already assigned
      const isAlreadyAssigned = (existingTask.assignees || []).some(
        (a) => a.userId === userId
      );

      if (isAlreadyAssigned) {
        return NextResponse.json(
          { error: "You are already assigned to this task" },
          { status: 400 }
        );
      }

      // Add user to assignees using transaction
      await prisma.$transaction(async (tx) => {
        // Add to assignees
        await tx.workItemAssignee.create({
          data: {
            workItemId: taskId,
            userId,
            assignedBy: userId,
          },
        });

        // Update task status and assignment mode
        await tx.workItem.update({
          where: { id: taskId },
          data: {
            status: existingTask.status === "OPEN" ? "IN_PROGRESS" : existingTask.status,
            assignmentMode: "individuals",
            teamId: null,
          },
        });

        // Create activity log
        await tx.activityLog.create({
          data: {
            workItemId: taskId,
            userId,
            action: "TASK_CLAIMED",
            changes: {
              assigneeAdded: currentUser?.name,
              status:
                existingTask.status === "OPEN"
                  ? { from: "OPEN", to: "IN_PROGRESS" }
                  : null,
              message: `${currentUser?.name} claimed ${existingTask.taskNumber}`,
            },
          },
        });
      });

      // Fetch updated task
      const updatedTask = await getTaskWithAssignees(taskId);
      return NextResponse.json(updatedTask);
    }

    // For team/user assignment, check manager/admin permission
    if (!isManagerOrAdmin) {
      return NextResponse.json(
        { error: "Only managers and admins can assign tasks" },
        { status: 403 }
      );
    }

    // Handle TEAM assignment
    if (assignmentMode === "team" || teamId !== undefined) {
      const newTeamId = teamId === "" || teamId === null ? null : teamId;

      await prisma.$transaction(async (tx) => {
        let newTeamName = "Unassigned";
        if (newTeamId) {
          const newTeam = await tx.team.findUnique({
            where: { id: newTeamId },
            select: { name: true },
          });
          newTeamName = newTeam?.name || "Unknown Team";
        }

        const previousAssignees = (existingTask.assignees || []).map(
          (a) => a.user.name
        );

        await tx.workItemAssignee.deleteMany({
          where: { workItemId: taskId },
        });

        await tx.workItem.update({
          where: { id: taskId },
          data: {
            teamId: newTeamId,
            assignmentMode: newTeamId ? "team" : null,
            assigneeId: null,
          },
        });

        await tx.activityLog.create({
          data: {
            workItemId: taskId,
            userId,
            action: "TASK_ASSIGNED",
            changes: {
              teamId: {
                from: existingTask.team?.name || null,
                to: newTeamId ? newTeamName : null,
              },
              assigneesRemoved:
                previousAssignees.length > 0 ? previousAssignees : null,
              message: newTeamId
                ? `${currentUser?.name} assigned ${existingTask.taskNumber} to team ${newTeamName}`
                : `${currentUser?.name} removed team assignment from ${existingTask.taskNumber}`,
            },
          },
        });
      });

      const updatedTask = await getTaskWithAssignees(taskId);
      return NextResponse.json(updatedTask);
    }

    // Handle INDIVIDUALS assignment
    if (assignmentMode === "individuals" || assigneeIds !== undefined) {
      const newAssigneeIds = assigneeIds || [];

      await prisma.$transaction(async (tx) => {
        const currentAssigneeIds = (existingTask.assignees || []).map((a) => a.userId);

        const addedIds = newAssigneeIds.filter(
          (id) => !currentAssigneeIds.includes(id)
        );
        const removedIds = currentAssigneeIds.filter(
          (id) => !newAssigneeIds.includes(id)
        );

        const addedUsers =
          addedIds.length > 0
            ? await tx.user.findMany({
                where: { id: { in: addedIds } },
                select: { id: true, name: true },
              })
            : [];

        const removedUsers = (existingTask.assignees || [])
          .filter((a) => removedIds.includes(a.userId))
          .map((a) => a.user.name);

        if (removedIds.length > 0) {
          await tx.workItemAssignee.deleteMany({
            where: {
              workItemId: taskId,
              userId: { in: removedIds },
            },
          });

          for (const removedName of removedUsers) {
            await tx.activityLog.create({
              data: {
                workItemId: taskId,
                userId,
                action: "ASSIGNEE_REMOVED",
                changes: {
                  assigneeRemoved: removedName,
                  message: `${currentUser?.name} removed ${removedName} from ${existingTask.taskNumber}`,
                },
              },
            });
          }
        }

        if (addedIds.length > 0) {
          await tx.workItemAssignee.createMany({
            data: addedIds.map((id) => ({
              workItemId: taskId,
              userId: id,
              assignedBy: userId,
            })),
          });

          for (const addedUser of addedUsers) {
            await tx.activityLog.create({
              data: {
                workItemId: taskId,
                userId,
                action: "ASSIGNEE_ADDED",
                changes: {
                  assigneeAdded: addedUser.name,
                  message: `${currentUser?.name} assigned ${addedUser.name} to ${existingTask.taskNumber}`,
                },
              },
            });

            if (addedUser.id !== userId) {
              await tx.notification.create({
                data: {
                  userId: addedUser.id,
                  type: "TICKET_ASSIGNED",
                  title: "New Task Assigned",
                  message: `You have been assigned to task ${existingTask.taskNumber}: ${existingTask.title}`,
                  link: `/tasks/${taskId}`,
                },
              });
            }
          }
        }

        await tx.workItem.update({
          where: { id: taskId },
          data: {
            assignmentMode: newAssigneeIds.length > 0 ? "individuals" : null,
            teamId: null,
            assigneeId: newAssigneeIds.length > 0 ? newAssigneeIds[0] : null,
            status:
              newAssigneeIds.length > 0 && existingTask.status === "OPEN"
                ? "IN_PROGRESS"
                : existingTask.status,
          },
        });
      });

      const updatedTask = await getTaskWithAssignees(taskId);
      return NextResponse.json(updatedTask);
    }

    // Handle legacy single assignee assignment
    if (assigneeId !== undefined) {
      const newAssigneeId =
        assigneeId === "" || assigneeId === null ? null : assigneeId;

      await prisma.$transaction(async (tx) => {
        let newAssigneeName = "Unassigned";
        if (newAssigneeId) {
          const newAssignee = await tx.user.findUnique({
            where: { id: newAssigneeId },
            select: { name: true },
          });
          newAssigneeName = newAssignee?.name || "Unknown User";
        }

        await tx.workItemAssignee.deleteMany({
          where: { workItemId: taskId },
        });

        if (newAssigneeId) {
          await tx.workItemAssignee.create({
            data: {
              workItemId: taskId,
              userId: newAssigneeId,
              assignedBy: userId,
            },
          });
        }

        await tx.workItem.update({
          where: { id: taskId },
          data: {
            assigneeId: newAssigneeId,
            assignmentMode: newAssigneeId ? "individuals" : null,
            teamId: null,
            status:
              newAssigneeId && existingTask.status === "OPEN"
                ? "IN_PROGRESS"
                : existingTask.status,
          },
        });

        await tx.activityLog.create({
          data: {
            workItemId: taskId,
            userId,
            action: "TASK_ASSIGNED",
            changes: {
              assigneeId: {
                from: existingTask.assignee?.name || null,
                to: newAssigneeId ? newAssigneeName : null,
              },
              message: newAssigneeId
                ? `${currentUser?.name} assigned ${existingTask.taskNumber} to ${newAssigneeName}`
                : `${currentUser?.name} unassigned ${existingTask.taskNumber}`,
            },
          },
        });

        if (newAssigneeId && newAssigneeId !== userId) {
          await tx.notification.create({
            data: {
              userId: newAssigneeId,
              type: "TICKET_ASSIGNED",
              title: "New Task Assigned",
              message: `You have been assigned to task ${existingTask.taskNumber}: ${existingTask.title}`,
              link: `/tasks/${taskId}`,
            },
          });
        }
      });

      const updatedTask = await getTaskWithAssignees(taskId);
      return NextResponse.json(updatedTask);
    }

    return NextResponse.json(
      { error: "No valid assignment action provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating task assignment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update task assignment", details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Helper function to fetch task with all assignees
 */
async function getTaskWithAssignees(taskId: string) {
  return prisma.workItem.findUnique({
    where: { id: taskId },
    include: {
      creator: {
        select: { id: true, name: true, email: true, avatar: true, role: true },
      },
      assignee: {
        select: { id: true, name: true, email: true, avatar: true, role: true },
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
    },
  });
}
