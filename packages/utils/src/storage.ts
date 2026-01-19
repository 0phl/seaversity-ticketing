import { Client } from "minio";

/**
 * MinIO Storage Configuration
 * S3-compatible object storage for file attachments
 */

/** Maximum file size in bytes (10MB as per plan) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Presigned URL expiry time in seconds (1 hour) */
export const PRESIGNED_URL_EXPIRY = 3600;

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

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Storage configuration interface
 */
export interface StorageConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

/**
 * Get storage configuration from environment variables
 */
export function getStorageConfig(): StorageConfig {
  const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
  const url = new URL(endpoint);

  return {
    endPoint: url.hostname,
    port: url.port ? parseInt(url.port, 10) : url.protocol === "https:" ? 443 : 9000,
    useSSL: process.env.MINIO_USE_SSL === "true" || url.protocol === "https:",
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
    bucket: process.env.MINIO_BUCKET || "seaversity-uploads",
  };
}

/**
 * MinIO client singleton
 */
let minioClient: Client | null = null;

/**
 * Get or create MinIO client instance
 */
export function getMinioClient(): Client {
  if (!minioClient) {
    const config = getStorageConfig();
    minioClient = new Client({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
  }
  return minioClient;
}

/**
 * Ensure the bucket exists, create if not
 */
export async function ensureBucketExists(): Promise<void> {
  const client = getMinioClient();
  const config = getStorageConfig();

  const bucketExists = await client.bucketExists(config.bucket);
  if (!bucketExists) {
    await client.makeBucket(config.bucket, "us-east-1");
    console.log(`Created bucket: ${config.bucket}`);
  }
}

/**
 * Generate a unique storage key for a file
 * Format: workitems/{workItemId}/{timestamp}-{sanitizedFilename}
 */
export function generateStorageKey(
  workItemId: string,
  originalFileName: string
): string {
  const timestamp = Date.now();
  const sanitizedName = originalFileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "_")
    .replace(/_+/g, "_");

  return `workitems/${workItemId}/${timestamp}-${sanitizedName}`;
}

/**
 * Generate a presigned URL for uploading a file directly to MinIO
 */
export async function getPresignedUploadUrl(
  storageKey: string,
  _contentType?: string
): Promise<string> {
  const client = getMinioClient();
  const config = getStorageConfig();

  // Ensure bucket exists before generating URL
  await ensureBucketExists();

  // Note: MinIO presignedPutObject doesn't support content-type restrictions
  // The content type should be set by the client during upload
  const presignedUrl = await client.presignedPutObject(
    config.bucket,
    storageKey,
    PRESIGNED_URL_EXPIRY
  );

  return presignedUrl;
}

/**
 * Generate a presigned URL for downloading a file from MinIO
 */
export async function getPresignedDownloadUrl(
  storageKey: string
): Promise<string> {
  const client = getMinioClient();
  const config = getStorageConfig();

  const presignedUrl = await client.presignedGetObject(
    config.bucket,
    storageKey,
    PRESIGNED_URL_EXPIRY
  );

  return presignedUrl;
}

/**
 * Delete a file from MinIO
 */
export async function deleteFile(storageKey: string): Promise<void> {
  const client = getMinioClient();
  const config = getStorageConfig();

  await client.removeObject(config.bucket, storageKey);
}

/**
 * Validate file type
 */
export function isValidMimeType(mimeType: string): mimeType is AllowedMimeType {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Get file extension from mime type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
    "text/csv": "csv",
    "application/zip": "zip",
    "application/x-rar-compressed": "rar",
  };

  return mimeToExt[mimeType] || "file";
}

/**
 * Check if a file is an image based on mime type
 */
export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
