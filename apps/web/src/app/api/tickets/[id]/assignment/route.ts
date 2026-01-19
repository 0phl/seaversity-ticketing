import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";
import { z } from "zod";

// Validation schema for assignment updates
const assignmentSchema = z.object({
  assigneeId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  claimTicket: z.boolean().optional(), // Special flag for agents claiming a ticket
});

/**
 * PATCH /api/tickets/[id]/assignment - Update ticket assignment
 * Handles team assignment, user assignment, and claim functionality
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

    const { assigneeId, teamId, claimTicket } = validatedFields.data;

    // Find the existing ticket
    const existingTicket = await prisma.workItem.findUnique({
      where: { id: ticketId, type: "TICKET" },
      include: {
        assignee: {
          select: { id: true, name: true },
        },
        team: {
          select: { id: true, name: true },
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

    // Handle claim ticket (AGENT claiming an unassigned ticket)
    if (claimTicket) {
      if (!isAgent && !isManagerOrAdmin) {
        return NextResponse.json(
          { error: "Only agents can claim tickets" },
          { status: 403 }
        );
      }

      if (existingTicket.assigneeId) {
        return NextResponse.json(
          { error: "Ticket is already assigned" },
          { status: 400 }
        );
      }

      // Get current user's name for activity log
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // Claim the ticket: assign to current user and set status to IN_PROGRESS
      const updatedTicket = await prisma.workItem.update({
        where: { id: ticketId },
        data: {
          assigneeId: userId,
          status: "IN_PROGRESS",
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatar: true, role: true },
          },
          team: {
            select: { id: true, name: true, color: true },
          },
        },
      });

      // Create activity log for claiming
      await prisma.activityLog.create({
        data: {
          workItemId: ticketId,
          userId,
          action: "TICKET_CLAIMED",
          changes: {
            assigneeId: { from: null, to: userId },
            status: { from: existingTicket.status, to: "IN_PROGRESS" },
            message: `${currentUser?.name} claimed ${existingTicket.ticketNumber}`,
          },
        },
      });

      return NextResponse.json(updatedTicket);
    }

    // For team/user assignment, check manager/admin permission
    if (!isManagerOrAdmin) {
      return NextResponse.json(
        { error: "Only managers and admins can assign tickets" },
        { status: 403 }
      );
    }

    // Build update data and track changes
    const updateData: Record<string, unknown> = {};
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const activityMessages: string[] = [];

    // Get current user's name for activity log
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Handle team assignment
    if (teamId !== undefined) {
      const newTeamId = teamId === "" || teamId === null ? null : teamId;
      
      if (newTeamId !== existingTicket.teamId) {
        updateData.teamId = newTeamId;
        
        // Get team name for activity log
        let newTeamName = "Unassigned";
        if (newTeamId) {
          const newTeam = await prisma.team.findUnique({
            where: { id: newTeamId },
            select: { name: true },
          });
          newTeamName = newTeam?.name || "Unknown Team";
        }

        changes.teamId = {
          from: existingTicket.team?.name || null,
          to: newTeamName !== "Unassigned" ? newTeamName : null,
        };
        
        activityMessages.push(
          newTeamId
            ? `${currentUser?.name} assigned ${existingTicket.ticketNumber} to team ${newTeamName}`
            : `${currentUser?.name} removed team assignment from ${existingTicket.ticketNumber}`
        );
      }
    }

    // Handle user assignment
    if (assigneeId !== undefined) {
      const newAssigneeId = assigneeId === "" || assigneeId === null ? null : assigneeId;
      
      if (newAssigneeId !== existingTicket.assigneeId) {
        updateData.assigneeId = newAssigneeId;

        // Get assignee name for activity log
        let newAssigneeName = "Unassigned";
        if (newAssigneeId) {
          const newAssignee = await prisma.user.findUnique({
            where: { id: newAssigneeId },
            select: { name: true },
          });
          newAssigneeName = newAssignee?.name || "Unknown User";
        }

        changes.assigneeId = {
          from: existingTicket.assignee?.name || null,
          to: newAssigneeName !== "Unassigned" ? newAssigneeName : null,
        };

        activityMessages.push(
          newAssigneeId
            ? `${currentUser?.name} assigned ${existingTicket.ticketNumber} to ${newAssigneeName}`
            : `${currentUser?.name} unassigned ${existingTicket.ticketNumber}`
        );

        // If assigning to a user and ticket is OPEN, update status to IN_PROGRESS
        if (newAssigneeId && existingTicket.status === "OPEN") {
          updateData.status = "IN_PROGRESS";
          changes.status = { from: "OPEN", to: "IN_PROGRESS" };
        }
      }
    }

    // If no changes, return current ticket
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(existingTicket);
    }

    // Update the ticket
    const updatedTicket = await prisma.workItem.update({
      where: { id: ticketId },
      data: updateData,
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
      },
    });

    // Create activity log for assignment changes
    if (Object.keys(changes).length > 0) {
      await prisma.activityLog.create({
        data: {
          workItemId: ticketId,
          userId,
          action: "TICKET_ASSIGNED",
          changes: {
            ...changes,
            message: activityMessages.join("; "),
          },
        },
      });
    }

    // Create notification for new assignee (if assigned to someone else)
    if (updateData.assigneeId && updateData.assigneeId !== userId) {
      await prisma.notification.create({
        data: {
          userId: updateData.assigneeId as string,
          type: "TICKET_ASSIGNED",
          title: "New Ticket Assigned",
          message: `You have been assigned to ticket ${existingTicket.ticketNumber}: ${existingTicket.title}`,
          link: `/tickets/${ticketId}`,
        },
      });
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket assignment:", error);
    return NextResponse.json(
      { error: "Failed to update ticket assignment" },
      { status: 500 }
    );
  }
}
