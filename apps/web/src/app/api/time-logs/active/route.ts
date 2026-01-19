import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";

/**
 * GET /api/time-logs/active - Get the user's currently running timer
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find any running timer for this user
    const activeTimer = await prisma.timeLog.findFirst({
      where: {
        userId: session.user.id,
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
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(activeTimer);
  } catch (error) {
    console.error("Error fetching active timer:", error);
    return NextResponse.json(
      { error: "Failed to fetch active timer" },
      { status: 500 }
    );
  }
}
