import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";

/**
 * GET /api/users/task-assignable - Get users who can be assigned to tasks
 * 
 * Unlike tickets (which are assigned to AGENT/MANAGER/ADMIN only),
 * tasks can be assigned to ANY user including USER role.
 * This supports the WFH visibility requirement where team members
 * (e.g., LMS Team with USER role) need to log their work on assigned tasks.
 * 
 * Optional query param: teamId to filter by team
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN, MANAGER, or AGENT can fetch assignable users
    // (they're the ones who can create/assign tasks)
    const canAssign = ["ADMIN", "MANAGER", "AGENT"].includes(session.user.role);
    if (!canAssign) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse optional teamId filter
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        // Include ALL roles - anyone can be assigned a task
        ...(teamId && { teamId }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        teamId: true,
        team: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching task-assignable users:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignable users" },
      { status: 500 }
    );
  }
}
