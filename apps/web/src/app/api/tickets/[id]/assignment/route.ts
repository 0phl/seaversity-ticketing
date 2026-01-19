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
  // Special flag for agents claiming a ticket (adds to assignees)
  claimTicket: z.boolean().optional(),
});

/**
 * PATCH /api/tickets/[id]/assignment - Update ticket assignment
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

    const ticketId = params.id;
    const body = await request.json();

    // Validate input
    const validatedFields = assignmentSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { assignmentMode, teamId, assigneeIds, assigneeId, claimTicket } =
      validatedFields.data;

    // Find the existing ticket with assignees
    const existingTicket = await prisma.workItem.findUnique({
      where: { id: ticketId, type: "TICKET" },
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

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
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

    // Check if user exists in database (might have old session after DB reset)
    if (!currentUser) {
      return NextResponse.json(
        { error: "Your session is invalid. Please log out and log back in." },
        { status: 401 }
      );
    }

    // Handle claim ticket (AGENT claiming - adds to assignees list)
    if (claimTicket) {
      if (!isAgent && !isManagerOrAdmin) {
        return NextResponse.json(
          { error: "Only agents can claim tickets" },
          { status: 403 }
        );
      }

      // Check if user is already assigned
      const isAlreadyAssigned = (existingTicket.assignees || []).some(
        (a) => a.userId === userId
      );

      if (isAlreadyAssigned) {
        return NextResponse.json(
          { error: "You are already assigned to this ticket" },
          { status: 400 }
        );
      }

      // Add user to assignees using transaction
      await prisma.$transaction(async (tx) => {
        // Add to assignees
        await tx.workItemAssignee.create({
          data: {
            workItemId: ticketId,
            userId,
            assignedBy: userId,
          },
        });

        // Update ticket status and assignment mode
        await tx.workItem.update({
          where: { id: ticketId },
          data: {
            status: existingTicket.status === "OPEN" ? "IN_PROGRESS" : existingTicket.status,
            assignmentMode: "individuals",
            // Clear team assignment when claiming
            teamId: null,
          },
        });

        // Create activity log
        await tx.activityLog.create({
          data: {
            workItemId: ticketId,
            userId,
            action: "TICKET_CLAIMED",
            changes: {
              assigneeAdded: currentUser?.name,
              status:
                existingTicket.status === "OPEN"
                  ? { from: "OPEN", to: "IN_PROGRESS" }
                  : null,
              message: `${currentUser?.name} claimed ${existingTicket.ticketNumber}`,
            },
          },
        });
      });

      // Fetch updated ticket
      const updatedTicket = await getTicketWithAssignees(ticketId);
      return NextResponse.json(updatedTicket);
    }

    // For team/user assignment, check manager/admin permission
    if (!isManagerOrAdmin) {
      return NextResponse.json(
        { error: "Only managers and admins can assign tickets" },
        { status: 403 }
      );
    }

    // Handle TEAM assignment (mutual exclusivity - clears individual assignees)
    if (assignmentMode === "team" || teamId !== undefined) {
      const newTeamId = teamId === "" || teamId === null ? null : teamId;

      await prisma.$transaction(async (tx) => {
        // Get team name for activity log
        let newTeamName = "Unassigned";
        if (newTeamId) {
          const newTeam = await tx.team.findUnique({
            where: { id: newTeamId },
            select: { name: true },
          });
          newTeamName = newTeam?.name || "Unknown Team";
        }

        // Clear all individual assignees when assigning to team
        const previousAssignees = (existingTicket.assignees || []).map(
          (a) => a.user.name
        );

        await tx.workItemAssignee.deleteMany({
          where: { workItemId: ticketId },
        });

        // Update ticket with team assignment
        await tx.workItem.update({
          where: { id: ticketId },
          data: {
            teamId: newTeamId,
            assignmentMode: newTeamId ? "team" : null,
            assigneeId: null, // Clear legacy field
          },
        });

        // Create activity log
        await tx.activityLog.create({
          data: {
            workItemId: ticketId,
            userId,
            action: "TICKET_ASSIGNED",
            changes: {
              teamId: {
                from: existingTicket.team?.name || null,
                to: newTeamId ? newTeamName : null,
              },
              assigneesRemoved:
                previousAssignees.length > 0 ? previousAssignees : null,
              message: newTeamId
                ? `${currentUser?.name} assigned ${existingTicket.ticketNumber} to team ${newTeamName}`
                : `${currentUser?.name} removed team assignment from ${existingTicket.ticketNumber}`,
            },
          },
        });
      });

      const updatedTicket = await getTicketWithAssignees(ticketId);
      return NextResponse.json(updatedTicket);
    }

    // Handle INDIVIDUALS assignment (mutual exclusivity - clears team)
    if (assignmentMode === "individuals" || assigneeIds !== undefined) {
      const newAssigneeIds = assigneeIds || [];

      await prisma.$transaction(async (tx) => {
        // Get current assignee IDs
        const currentAssigneeIds = (existingTicket.assignees || []).map((a) => a.userId);

        // Calculate added and removed
        const addedIds = newAssigneeIds.filter(
          (id) => !currentAssigneeIds.includes(id)
        );
        const removedIds = currentAssigneeIds.filter(
          (id) => !newAssigneeIds.includes(id)
        );

        // Get names for activity log
        const addedUsers =
          addedIds.length > 0
            ? await tx.user.findMany({
                where: { id: { in: addedIds } },
                select: { id: true, name: true },
              })
            : [];

        const removedUsers = (existingTicket.assignees || [])
          .filter((a) => removedIds.includes(a.userId))
          .map((a) => a.user.name);

        // Remove users no longer assigned
        if (removedIds.length > 0) {
          await tx.workItemAssignee.deleteMany({
            where: {
              workItemId: ticketId,
              userId: { in: removedIds },
            },
          });

          // Create activity log for each removed user
          for (const removedName of removedUsers) {
            await tx.activityLog.create({
              data: {
                workItemId: ticketId,
                userId,
                action: "ASSIGNEE_REMOVED",
                changes: {
                  assigneeRemoved: removedName,
                  message: `${currentUser?.name} removed ${removedName} from ${existingTicket.ticketNumber}`,
                },
              },
            });
          }
        }

        // Add new users
        if (addedIds.length > 0) {
          await tx.workItemAssignee.createMany({
            data: addedIds.map((id) => ({
              workItemId: ticketId,
              userId: id,
              assignedBy: userId,
            })),
          });

          // Create activity log for each added user
          for (const addedUser of addedUsers) {
            await tx.activityLog.create({
              data: {
                workItemId: ticketId,
                userId,
                action: "ASSIGNEE_ADDED",
                changes: {
                  assigneeAdded: addedUser.name,
                  message: `${currentUser?.name} assigned ${addedUser.name} to ${existingTicket.ticketNumber}`,
                },
              },
            });

            // Send notification to new assignee
            if (addedUser.id !== userId) {
              await tx.notification.create({
                data: {
                  userId: addedUser.id,
                  type: "TICKET_ASSIGNED",
                  title: "New Ticket Assigned",
                  message: `You have been assigned to ticket ${existingTicket.ticketNumber}: ${existingTicket.title}`,
                  link: `/tickets/${ticketId}`,
                },
              });
            }
          }
        }

        // Update ticket
        await tx.workItem.update({
          where: { id: ticketId },
          data: {
            assignmentMode: newAssigneeIds.length > 0 ? "individuals" : null,
            // Clear team when assigning individuals
            teamId: null,
            // Update legacy assigneeId to first assignee for backward compatibility
            assigneeId: newAssigneeIds.length > 0 ? newAssigneeIds[0] : null,
            // Update status if needed
            status:
              newAssigneeIds.length > 0 && existingTicket.status === "OPEN"
                ? "IN_PROGRESS"
                : existingTicket.status,
          },
        });
      });

      const updatedTicket = await getTicketWithAssignees(ticketId);
      return NextResponse.json(updatedTicket);
    }

    // Handle legacy single assignee assignment (backward compatible)
    if (assigneeId !== undefined) {
      const newAssigneeId =
        assigneeId === "" || assigneeId === null ? null : assigneeId;

      await prisma.$transaction(async (tx) => {
        // Get assignee name for activity log
        let newAssigneeName = "Unassigned";
        if (newAssigneeId) {
          const newAssignee = await tx.user.findUnique({
            where: { id: newAssigneeId },
            select: { name: true },
          });
          newAssigneeName = newAssignee?.name || "Unknown User";
        }

        // Clear existing assignees
        await tx.workItemAssignee.deleteMany({
          where: { workItemId: ticketId },
        });

        // Add single assignee if provided
        if (newAssigneeId) {
          await tx.workItemAssignee.create({
            data: {
              workItemId: ticketId,
              userId: newAssigneeId,
              assignedBy: userId,
            },
          });
        }

        // Update ticket
        await tx.workItem.update({
          where: { id: ticketId },
          data: {
            assigneeId: newAssigneeId,
            assignmentMode: newAssigneeId ? "individuals" : null,
            teamId: null,
            status:
              newAssigneeId && existingTicket.status === "OPEN"
                ? "IN_PROGRESS"
                : existingTicket.status,
          },
        });

        // Create activity log
        await tx.activityLog.create({
          data: {
            workItemId: ticketId,
            userId,
            action: "TICKET_ASSIGNED",
            changes: {
              assigneeId: {
                from: existingTicket.assignee?.name || null,
                to: newAssigneeId ? newAssigneeName : null,
              },
              message: newAssigneeId
                ? `${currentUser?.name} assigned ${existingTicket.ticketNumber} to ${newAssigneeName}`
                : `${currentUser?.name} unassigned ${existingTicket.ticketNumber}`,
            },
          },
        });

        // Send notification
        if (newAssigneeId && newAssigneeId !== userId) {
          await tx.notification.create({
            data: {
              userId: newAssigneeId,
              type: "TICKET_ASSIGNED",
              title: "New Ticket Assigned",
              message: `You have been assigned to ticket ${existingTicket.ticketNumber}: ${existingTicket.title}`,
              link: `/tickets/${ticketId}`,
            },
          });
        }
      });

      const updatedTicket = await getTicketWithAssignees(ticketId);
      return NextResponse.json(updatedTicket);
    }

    // No valid assignment action
    return NextResponse.json(
      { error: "No valid assignment action provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating ticket assignment:", error);
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update ticket assignment", details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Helper function to fetch ticket with all assignees
 */
async function getTicketWithAssignees(ticketId: string) {
  return prisma.workItem.findUnique({
    where: { id: ticketId },
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
