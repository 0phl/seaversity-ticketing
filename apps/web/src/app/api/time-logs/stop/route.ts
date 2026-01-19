import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";
import { z } from "zod";

const stopTimerSchema = z.object({
  timeLogId: z.string().min(1, "Time log ID is required"),
  notes: z.string().optional(),
});

/**
 * POST /api/time-logs/stop - Stop a running timer
 * Calculates duration and sets endedAt
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedFields = stopTimerSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { timeLogId, notes } = validatedFields.data;

    // Find the time log
    const timeLog = await prisma.timeLog.findUnique({
      where: { id: timeLogId },
      include: {
        workItem: {
          select: { id: true, title: true },
        },
      },
    });

    if (!timeLog) {
      return NextResponse.json(
        { error: "Time log not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this time log
    if (timeLog.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only stop your own timers" },
        { status: 403 }
      );
    }

    // Check if already stopped
    if (!timeLog.isRunning) {
      return NextResponse.json(
        { error: "This timer is already stopped" },
        { status: 400 }
      );
    }

    // Calculate duration
    const endedAt = new Date();
    const durationMins = Math.floor(
      (endedAt.getTime() - new Date(timeLog.startedAt).getTime()) / 60000
    );

    // Update the time log
    const updatedTimeLog = await prisma.timeLog.update({
      where: { id: timeLogId },
      data: {
        isRunning: false,
        endedAt,
        durationMins,
        notes: notes || timeLog.notes,
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
        workItemId: timeLog.workItemId,
        userId: session.user.id,
        action: "TIMER_STOPPED",
        changes: {
          timeLogId: timeLog.id,
          durationMins,
        },
      },
    });

    return NextResponse.json(updatedTimeLog);
  } catch (error) {
    console.error("Error stopping timer:", error);
    return NextResponse.json(
      { error: "Failed to stop timer" },
      { status: 500 }
    );
  }
}
