import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";
import {
  getPresignedUploadUrl,
  generateStorageKey,
  isValidMimeType,
  isValidFileSize,
} from "@seaversity/utils";
import { presignedUploadRequestSchema } from "@/lib/validations/attachment";

/**
 * GET /api/uploads/presigned
 * Generate a presigned URL for direct upload to MinIO
 *
 * Query params:
 * - workItemId: ID of the work item to attach to
 * - fileName: Original file name
 * - fileSize: File size in bytes
 * - mimeType: MIME type of the file
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const input = {
      workItemId: searchParams.get("workItemId") || "",
      fileName: searchParams.get("fileName") || "",
      fileSize: parseInt(searchParams.get("fileSize") || "0", 10),
      mimeType: searchParams.get("mimeType") || "",
    };

    // Validate input
    const validatedFields = presignedUploadRequestSchema.safeParse(input);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { workItemId, fileName, fileSize, mimeType } = validatedFields.data;

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

    // Validate file type and size
    if (!isValidMimeType(mimeType)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    if (!isValidFileSize(fileSize)) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB limit" },
        { status: 400 }
      );
    }

    // Generate storage key and presigned URL
    const storageKey = generateStorageKey(workItemId, fileName);
    const presignedUrl = await getPresignedUploadUrl(storageKey, mimeType);

    return NextResponse.json({
      presignedUrl,
      storageKey,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
