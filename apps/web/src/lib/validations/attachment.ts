import { z } from "zod";

/** Maximum file size in bytes (10MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed MIME types for uploads */
export const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Text
  "text/plain",
  "text/csv",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
] as const;

/**
 * Schema for requesting a presigned upload URL
 */
export const presignedUploadRequestSchema = z.object({
  workItemId: z.string().min(1, "Work item ID is required"),
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name must be less than 255 characters"),
  fileSize: z
    .number()
    .int()
    .positive("File size must be positive")
    .max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`),
  mimeType: z.enum(ALLOWED_MIME_TYPES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "File type not allowed" }),
  }),
});

export type PresignedUploadRequest = z.infer<typeof presignedUploadRequestSchema>;

/**
 * Schema for creating an attachment record after successful upload
 */
export const createAttachmentSchema = z.object({
  workItemId: z.string().min(1, "Work item ID is required"),
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name must be less than 255 characters"),
  fileSize: z
    .number()
    .int()
    .positive("File size must be positive")
    .max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`),
  mimeType: z.string().min(1, "MIME type is required"),
  storageKey: z.string().min(1, "Storage key is required"),
});

export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;

/**
 * Schema for getting attachment download URL
 */
export const getAttachmentDownloadSchema = z.object({
  attachmentId: z.string().min(1, "Attachment ID is required"),
});

export type GetAttachmentDownloadInput = z.infer<typeof getAttachmentDownloadSchema>;

/**
 * Schema for deleting an attachment
 */
export const deleteAttachmentSchema = z.object({
  attachmentId: z.string().min(1, "Attachment ID is required"),
});

export type DeleteAttachmentInput = z.infer<typeof deleteAttachmentSchema>;
