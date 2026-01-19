import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";

/**
 * GET /api/manager/activity-feed - Get recent activity logs
 * Returns the latest comments, ticket creations, and file uploads
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has manager or admin role
    if (!["MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Get recent activity logs
    const activities = await prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        workItem: {
          select: {
            id: true,
            title: true,
            ticketNumber: true,
            taskNumber: true,
            type: true,
            status: true,
          },
        },
      },
    });

    // Get recent comments
    const recentComments = await prisma.comment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
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

    // Get recent attachments (file uploads)
    const recentAttachments = await prisma.attachment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
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

    // Get uploader info for attachments
    const uploaderIds = [...new Set(recentAttachments.map((a) => a.uploadedBy))];
    const uploaders = await prisma.user.findMany({
      where: { id: { in: uploaderIds } },
      select: { id: true, name: true, avatar: true },
    });
    const uploaderMap = new Map(uploaders.map((u) => [u.id, u]));

    // Format the response - combine and sort by timestamp
    const formattedActivities = activities.map((activity) => ({
      id: activity.id,
      type: "activity" as const,
      action: activity.action,
      changes: activity.changes,
      user: activity.user,
      workItem: activity.workItem,
      createdAt: activity.createdAt.toISOString(),
    }));

    const formattedComments = recentComments.map((comment) => ({
      id: `comment-${comment.id}`,
      type: "comment" as const,
      action: "comment_added",
      content: comment.content.substring(0, 100) + (comment.content.length > 100 ? "..." : ""),
      isInternal: comment.isInternal,
      user: comment.user,
      workItem: comment.workItem,
      createdAt: comment.createdAt.toISOString(),
    }));

    const formattedAttachments = recentAttachments.map((attachment) => ({
      id: `attachment-${attachment.id}`,
      type: "attachment" as const,
      action: "file_uploaded",
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      user: uploaderMap.get(attachment.uploadedBy) || { id: attachment.uploadedBy, name: "Unknown", avatar: null },
      workItem: attachment.workItem,
      createdAt: attachment.createdAt.toISOString(),
    }));

    // Combine and sort by createdAt (newest first)
    const allActivities = [
      ...formattedActivities,
      ...formattedComments,
      ...formattedAttachments,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Return top N combined activities
    return NextResponse.json(allActivities.slice(0, limit));
  } catch (error) {
    console.error("Error fetching activity feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity feed" },
      { status: 500 }
    );
  }
}
