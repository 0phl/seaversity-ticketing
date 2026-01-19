import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";
import { createCommentSchema } from "@/lib/validations/comment";

/**
 * POST /api/comments - Create a new comment
 * Comments can be marked as internal (only visible to AGENT/MANAGER/ADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedFields = createCommentSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { workItemId, content, isInternal } = validatedFields.data;

    // Verify the work item exists
    const workItem = await prisma.workItem.findUnique({
      where: { id: workItemId },
      select: { id: true, creatorId: true },
    });

    if (!workItem) {
      return NextResponse.json(
        { error: "Work item not found" },
        { status: 404 }
      );
    }

    // Only AGENT, MANAGER, and ADMIN can create internal comments
    const canCreateInternal = ["AGENT", "MANAGER", "ADMIN"].includes(
      session.user.role
    );

    if (isInternal && !canCreateInternal) {
      return NextResponse.json(
        { error: "You do not have permission to create internal comments" },
        { status: 403 }
      );
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        workItemId,
        userId: session.user.id,
        content,
        isInternal: canCreateInternal ? isInternal : false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        workItemId,
        userId: session.user.id,
        action: "COMMENT_ADDED",
        changes: {
          commentId: comment.id,
          isInternal: comment.isInternal,
        },
      },
    });

    // Create notification for work item creator if it's a public comment
    // and the commenter is not the creator
    if (!comment.isInternal && workItem.creatorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: workItem.creatorId,
          type: "COMMENT_ADDED",
          title: "New comment on your ticket",
          message: `${session.user.name} added a comment to your ticket`,
          link: `/tickets/${workItemId}`,
        },
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
