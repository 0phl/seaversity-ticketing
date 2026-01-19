import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";
import { getPresignedDownloadUrl, deleteFile } from "@seaversity/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/attachments/[id]
 * Get a presigned download URL for an attachment
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find attachment with work item info
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        workItem: {
          select: { id: true, creatorId: true, assigneeId: true, teamId: true },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Generate presigned download URL
    const downloadUrl = await getPresignedDownloadUrl(attachment.storageKey);

    return NextResponse.json({
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      downloadUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error getting attachment:", error);
    return NextResponse.json(
      { error: "Failed to get attachment" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/attachments/[id]
 * Delete an attachment (and its file from storage)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find attachment with work item info
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        workItem: {
          select: { id: true, creatorId: true, assigneeId: true, teamId: true },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Check if user can delete (uploader, work item creator/assignee, or admin/manager)
    const canDelete =
      session.user.role === "ADMIN" ||
      session.user.role === "MANAGER" ||
      attachment.uploadedBy === session.user.id ||
      attachment.workItem.creatorId === session.user.id ||
      attachment.workItem.assigneeId === session.user.id;

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this attachment" },
        { status: 403 }
      );
    }

    // Delete file from MinIO
    try {
      await deleteFile(attachment.storageKey);
    } catch (storageError) {
      console.error("Error deleting file from storage:", storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete attachment record
    await prisma.attachment.delete({
      where: { id },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        workItemId: attachment.workItemId,
        userId: session.user.id,
        action: "ATTACHMENT_DELETED",
        changes: {
          fileName: attachment.fileName,
          fileSize: attachment.fileSize,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
