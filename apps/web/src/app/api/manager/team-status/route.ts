import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";

/**
 * GET /api/manager/team-status - Get team members with their current status
 * Returns users from IT and LMS teams with active timers and today's hours
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

    // Get teams (IT and LMS) with their members
    const teams = await prisma.team.findMany({
      where: {
        name: {
          in: ["IT", "LMS", "IT Team", "LMS Team", "IT Support Team"],
        },
      },
      include: {
        members: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            lastLoginAt: true,
            teamId: true,
          },
        },
      },
    });

    // Get all user IDs from teams
    const userIds = teams.flatMap((team) => team.members.map((m) => m.id));

    // Get active timers for all team members
    const activeTimers = await prisma.timeLog.findMany({
      where: {
        userId: { in: userIds },
        isRunning: true,
      },
      include: {
        workItem: {
          select: {
            id: true,
            title: true,
            ticketNumber: true,
            taskNumber: true,
            type: true,
          },
        },
      },
    });

    // Get today's completed time logs for all team members
    const todayTimeLogs = await prisma.timeLog.findMany({
      where: {
        userId: { in: userIds },
        startedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        userId: true,
        durationMins: true,
        isRunning: true,
        startedAt: true,
      },
    });

    // Calculate hours per user
    const userHours: Record<string, number> = {};
    todayTimeLogs.forEach((log) => {
      const currentHours = userHours[log.userId] ?? 0;
      if (log.durationMins) {
        userHours[log.userId] = currentHours + log.durationMins;
      } else if (log.isRunning) {
        // Calculate running time in minutes
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - new Date(log.startedAt).getTime()) / 60000
        );
        userHours[log.userId] = currentHours + elapsed;
      }
    });

    // Create a map of active timers by user ID
    const timerMap = new Map(
      activeTimers.map((timer) => [
        timer.userId,
        {
          id: timer.id,
          workItemId: timer.workItem.id,
          workItemNumber:
            timer.workItem.ticketNumber || timer.workItem.taskNumber || "",
          workItemTitle: timer.workItem.title,
          workItemType: timer.workItem.type,
          startedAt: timer.startedAt.toISOString(),
        },
      ])
    );

    // Determine online status (active within last 5 minutes or has running timer)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Build the response
    const teamStatus = teams.map((team) => ({
      id: team.id,
      name: team.name,
      color: team.color,
      members: team.members.map((member) => {
        const activeTimer = timerMap.get(member.id);
        const isOnline =
          !!activeTimer ||
          (member.lastLoginAt && new Date(member.lastLoginAt) > fiveMinutesAgo);

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          avatar: member.avatar,
          role: member.role,
          isOnline,
          activeTimer: activeTimer || null,
          todayHours: (userHours[member.id] || 0) / 60, // Convert to hours
        };
      }),
    }));

    return NextResponse.json(teamStatus);
  } catch (error) {
    console.error("Error fetching team status:", error);
    return NextResponse.json(
      { error: "Failed to fetch team status" },
      { status: 500 }
    );
  }
}
