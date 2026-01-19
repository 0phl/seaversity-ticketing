import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";

/**
 * GET /api/dashboard/stats - Get dashboard statistics for the current user
 * Returns counts for:
 * - Open work items (tickets + tasks) assigned to user
 * - In progress work items
 * - Completed today
 * - Team members online (simplified: active team members count)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userTeamId = session.user.teamId;
    const userRole = session.user.role;
    const isManagerOrAdmin = ["MANAGER", "ADMIN"].includes(userRole);

    // Calculate start of today (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build base filter for work items assigned to user
    // Either directly assigned, in assignees list, or team member
    const assignedToUserFilter = {
      OR: [
        { assigneeId: userId },
        { assignees: { some: { userId } } },
        ...(userTeamId ? [{ teamId: userTeamId, assignmentMode: "team" }] : []),
      ],
    };

    // For managers/admins, show all counts for their team
    const scopeFilter = isManagerOrAdmin && userTeamId
      ? { OR: [{ teamId: userTeamId }, ...assignedToUserFilter.OR] }
      : assignedToUserFilter;

    // Count open tickets and tasks assigned to user
    const openCount = await prisma.workItem.count({
      where: {
        ...scopeFilter,
        status: "OPEN",
      },
    });

    // Count in-progress work items (includes both tickets and tasks)
    const inProgressCount = await prisma.workItem.count({
      where: {
        ...scopeFilter,
        status: "IN_PROGRESS",
      },
    });

    // Count work items completed today (RESOLVED or CLOSED)
    const completedTodayCount = await prisma.workItem.count({
      where: {
        ...scopeFilter,
        status: { in: ["RESOLVED", "CLOSED"] },
        completedAt: {
          gte: today,
        },
      },
    });

    // Count team members (if user has a team)
    let teamMembersCount = 0;
    if (userTeamId) {
      teamMembersCount = await prisma.user.count({
        where: {
          teamId: userTeamId,
          isActive: true,
        },
      });
    }

    // Additional breakdown for detailed view
    const [openTickets, openTasks, inProgressTickets, inProgressTasks] = await Promise.all([
      prisma.workItem.count({
        where: { ...scopeFilter, type: "TICKET", status: "OPEN" },
      }),
      prisma.workItem.count({
        where: { ...scopeFilter, type: "TASK", status: "OPEN" },
      }),
      prisma.workItem.count({
        where: { ...scopeFilter, type: "TICKET", status: "IN_PROGRESS" },
      }),
      prisma.workItem.count({
        where: { ...scopeFilter, type: "TASK", status: "IN_PROGRESS" },
      }),
    ]);

    return NextResponse.json({
      openCount,
      inProgressCount,
      completedTodayCount,
      teamMembersCount,
      breakdown: {
        openTickets,
        openTasks,
        inProgressTickets,
        inProgressTasks,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
