import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";
import { updateTicketSchema } from "@/lib/validations/ticket";

/**
 * GET /api/tickets/[id] - Get a single ticket with its comments
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

    const ticketId = params.id;

    // Check if user can view internal comments
    const canViewInternal = ["AGENT", "MANAGER", "ADMIN"].includes(
      session.user.role
    );

    const ticket = await prisma.workItem.findUnique({
      where: { id: ticketId, type: "TICKET" },
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
              select: { id: true, name: true },
            },
          },
          orderBy: { startedAt: "desc" },
          take: 10,
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

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check if user has access to this ticket
    // Users can see their own tickets or tickets assigned to them
    // Agents/Managers/Admins can see all tickets
    const hasAccess =
      canViewInternal ||
      ticket.creatorId === session.user.id ||
      ticket.assigneeId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tickets/[id] - Update a ticket
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
    const validatedFields = updateTicketSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    // Find the existing ticket
    const existingTicket = await prisma.workItem.findUnique({
      where: { id: ticketId, type: "TICKET" },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check permissions
    const canModify = ["AGENT", "MANAGER", "ADMIN"].includes(session.user.role);
    const isCreator = existingTicket.creatorId === session.user.id;
    const isAssignee = existingTicket.assigneeId === session.user.id;

    if (!canModify && !isCreator && !isAssignee) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updateData = validatedFields.data;

    // Track changes for activity log
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    if (updateData.title && updateData.title !== existingTicket.title) {
      changes.title = { from: existingTicket.title, to: updateData.title };
    }
    if (updateData.status && updateData.status !== existingTicket.status) {
      changes.status = { from: existingTicket.status, to: updateData.status };
    }
    if (updateData.priority && updateData.priority !== existingTicket.priority) {
      changes.priority = { from: existingTicket.priority, to: updateData.priority };
    }

    // Update the ticket
    const updatedTicket = await prisma.workItem.update({
      where: { id: ticketId },
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
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    // Create activity log if there were changes
    if (Object.keys(changes).length > 0) {
      await prisma.activityLog.create({
        data: {
          workItemId: ticketId,
          userId: session.user.id,
          action: "TICKET_UPDATED",
          changes,
        },
      });
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}
