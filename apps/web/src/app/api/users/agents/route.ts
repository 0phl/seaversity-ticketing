import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";

/**
 * GET /api/users/agents - Get users who can be assigned to tickets
 * Returns users with AGENT, MANAGER, or ADMIN roles
 * Optional query param: teamId to filter by team
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse optional teamId filter
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ["AGENT", "MANAGER", "ADMIN"],
        },
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
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
