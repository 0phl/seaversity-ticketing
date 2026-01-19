import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";
import { createAttachmentSchema } from "@/lib/validations/attachment";

/**
 * POST /api/attachments
 * Save attachment metadata after successful upload to MinIO
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedFields = createAttachmentSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { workItemId, fileName, fileSize, mimeType, storageKey } =
      validatedFields.data;

    // Verify work item exists and user has access
    const workItem = await prisma.workItem.findUnique({
      where: { id: workItemId },
      select: { id: true, creatorId: true, assigneeId: true, teamId: true },
    });

    if (!workItem) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this work item
    const hasAccess =
      session.user.role === "ADMIN" ||
      session.user.role === "MANAGER" ||
      workItem.creatorId === session.user.id ||
      workItem.assigneeId === session.user.id ||
      (workItem.teamId && workItem.teamId === session.user.teamId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this work item" },
        { status: 403 }
      );
    }

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        workItemId,
        fileName,
        fileSize,
        mimeType,
        storageKey,
        uploadedBy: session.user.id,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        workItemId,
        userId: session.user.id,
        action: "ATTACHMENT_ADDED",
        changes: {
          fileName,
          fileSize,
          mimeType,
        },
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Error creating attachment:", error);
    return NextResponse.json(
      { error: "Failed to create attachment" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attachments
 * Get all attachments for a work item
 *
 * Query params:
 * - workItemId: ID of the work item
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workItemId = searchParams.get("workItemId");

    if (!workItemId) {
      return NextResponse.json(
        { error: "Work item ID is required" },
        { status: 400 }
      );
    }

    // Verify work item exists
    const workItem = await prisma.workItem.findUnique({
      where: { id: workItemId },
      select: { id: true, creatorId: true, assigneeId: true, teamId: true },
    });

    if (!workItem) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 }
      );
    }

    // Get attachments
    const attachments = await prisma.attachment.findMany({
      where: { workItemId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}
