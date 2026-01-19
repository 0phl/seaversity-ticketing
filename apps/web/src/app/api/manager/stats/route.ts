import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";

/**
 * GET /api/manager/stats - Get dashboard statistics
 * Returns ticket counts, SLA compliance, and team workload
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has manager or admin role
    if (!["MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch ticket counts for today
    const [
      openTicketsToday,
      resolvedTicketsToday,
      totalOpenTickets,
      totalInProgressTickets,
      slaBreachedTickets,
      totalTicketsWithSla,
    ] = await Promise.all([
      // Open tickets created today
      prisma.workItem.count({
        where: {
          type: "TICKET",
          createdAt: { gte: today, lt: tomorrow },
          status: { in: ["OPEN", "IN_PROGRESS", "ON_HOLD"] },
        },
      }),
      // Resolved tickets today
      prisma.workItem.count({
        where: {
          type: "TICKET",
          completedAt: { gte: today, lt: tomorrow },
          status: { in: ["RESOLVED", "CLOSED"] },
        },
      }),
      // Total open tickets
      prisma.workItem.count({
        where: {
          type: "TICKET",
          status: { in: ["OPEN"] },
        },
      }),
      // Total in-progress tickets
      prisma.workItem.count({
        where: {
          type: "TICKET",
          status: { in: ["IN_PROGRESS"] },
        },
      }),
      // SLA breached tickets
      prisma.workItem.count({
        where: {
          type: "TICKET",
          slaBreachedAt: { not: null },
          status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] },
        },
      }),
      // Total tickets with SLA policy
      prisma.workItem.count({
        where: {
          type: "TICKET",
          slaPolicyId: { not: null },
          status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] },
        },
      }),
    ]);

    // Calculate SLA compliance percentage
    const slaCompliance =
      totalTicketsWithSla > 0
        ? Math.round(
            ((totalTicketsWithSla - slaBreachedTickets) / totalTicketsWithSla) *
              100
          )
        : 100;

    // Get team workload distribution
    const teams = await prisma.team.findMany({
      where: {
        name: {
          in: ["IT", "LMS", "IT Team", "LMS Team"],
        },
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    const teamWorkload = await Promise.all(
      teams.map(async (team) => {
        const [openCount, inProgressCount, resolvedTodayCount] =
          await Promise.all([
            prisma.workItem.count({
              where: {
                type: "TICKET",
                teamId: team.id,
                status: "OPEN",
              },
            }),
            prisma.workItem.count({
              where: {
                type: "TICKET",
                teamId: team.id,
                status: "IN_PROGRESS",
              },
            }),
            prisma.workItem.count({
              where: {
                type: "TICKET",
                teamId: team.id,
                completedAt: { gte: today, lt: tomorrow },
              },
            }),
          ]);

        return {
          teamId: team.id,
          teamName: team.name,
          teamColor: team.color || "#0099FF",
          open: openCount,
          inProgress: inProgressCount,
          resolvedToday: resolvedTodayCount,
          total: openCount + inProgressCount,
        };
      })
    );

    // Get hourly ticket data for today (for chart)
    const hourlyData = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(today);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(today);
      hourEnd.setHours(hour + 1, 0, 0, 0);

      // Only include hours up to current hour
      if (hourStart > new Date()) break;

      const [created, resolved] = await Promise.all([
        prisma.workItem.count({
          where: {
            type: "TICKET",
            createdAt: { gte: hourStart, lt: hourEnd },
          },
        }),
        prisma.workItem.count({
          where: {
            type: "TICKET",
            completedAt: { gte: hourStart, lt: hourEnd },
          },
        }),
      ]);

      hourlyData.push({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        created,
        resolved,
      });
    }

    return NextResponse.json({
      ticketStats: {
        openToday: openTicketsToday,
        resolvedToday: resolvedTicketsToday,
        totalOpen: totalOpenTickets,
        totalInProgress: totalInProgressTickets,
      },
      slaCompliance,
      teamWorkload,
      hourlyData,
    });
  } catch (error) {
    console.error("Error fetching manager stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
