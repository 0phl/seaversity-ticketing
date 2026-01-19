import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";
import { z } from "zod";

const startTimerSchema = z.object({
  workItemId: z.string().min(1, "Work item ID is required"),
  notes: z.string().optional(),
});

/**
 * POST /api/time-logs/start - Start a timer for a work item
 * Automatically stops any other running timer for the user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedFields = startTimerSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { workItemId, notes } = validatedFields.data;

    // Verify the work item exists
    const workItem = await prisma.workItem.findUnique({
      where: { id: workItemId },
      select: {
        id: true,
        title: true,
        ticketNumber: true,
        taskNumber: true,
        type: true,
      },
    });

    if (!workItem) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 }
      );
    }

    // Stop any currently running timer for this user
    const runningTimer = await prisma.timeLog.findFirst({
      where: {
        userId: session.user.id,
        isRunning: true,
      },
    });

    if (runningTimer) {
      const endedAt = new Date();
      const durationMins = Math.floor(
        (endedAt.getTime() - new Date(runningTimer.startedAt).getTime()) / 60000
      );

      await prisma.timeLog.update({
        where: { id: runningTimer.id },
        data: {
          isRunning: false,
          endedAt,
          durationMins,
        },
      });
    }

    // Create new time log with isRunning: true
    const timeLog = await prisma.timeLog.create({
      data: {
        workItemId,
        userId: session.user.id,
        startedAt: new Date(),
        isRunning: true,
        notes: notes || null,
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

    // Create activity log
    await prisma.activityLog.create({
      data: {
        workItemId,
        userId: session.user.id,
        action: "TIMER_STARTED",
        changes: {
          timeLogId: timeLog.id,
        },
      },
    });

    return NextResponse.json(timeLog, { status: 201 });
  } catch (error) {
    console.error("Error starting timer:", error);
    return NextResponse.json(
      { error: "Failed to start timer" },
      { status: 500 }
    );
  }
}
