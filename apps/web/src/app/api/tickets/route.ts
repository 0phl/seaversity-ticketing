import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";
import { createTicketSchema } from "@/lib/validations/ticket";

/**
 * Generate the next ticket number in format T-XXXX
 */
async function generateTicketNumber(): Promise<string> {
  const lastTicket = await prisma.workItem.findFirst({
    where: { type: "TICKET" },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });

  if (!lastTicket?.ticketNumber) {
    return "T-0001";
  }

  // Extract the number part and increment
  const lastNumber = parseInt(lastTicket.ticketNumber.replace("T-", ""), 10);
  const nextNumber = lastNumber + 1;
  return `T-${nextNumber.toString().padStart(4, "0")}`;
}

/**
 * GET /api/tickets - List all tickets
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

    const where: Record<string, unknown> = {
      type: "TICKET",
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const [tickets, total] = await Promise.all([
      prisma.workItem.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          assignee: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          category: {
            select: { id: true, name: true, color: true, icon: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workItem.count({ where }),
    ]);

    return NextResponse.json({
      data: tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets - Create a new ticket
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedFields = createTicketSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, priority, categoryId, dueDate, assigneeId } =
      validatedFields.data;

    // Generate unique ticket number
    const ticketNumber = await generateTicketNumber();

    // Create the ticket
    const ticket = await prisma.workItem.create({
      data: {
        type: "TICKET",
        ticketNumber,
        title,
        description,
        priority,
        status: "OPEN",
        creatorId: session.user.id,
        categoryId: categoryId || null,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId: session.user.teamId || null,
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

    // Create activity log
    await prisma.activityLog.create({
      data: {
        workItemId: ticket.id,
        userId: session.user.id,
        action: "TICKET_CREATED",
        changes: {
          ticketNumber,
          title,
          priority,
          status: "OPEN",
        },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
