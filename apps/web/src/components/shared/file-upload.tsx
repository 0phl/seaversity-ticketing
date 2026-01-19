"use client";

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import {
  Upload,
  File,
  FileImage,
  FileText,
  FileSpreadsheet,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from "@/lib/validations/attachment";

/** File with upload status */
export interface UploadFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  storageKey?: string;
  error?: string;
}

interface FileUploadProps {
  /** Work item ID to attach files to (optional for new tickets) */
  workItemId?: string;
  /** Callback when files are successfully uploaded */
  onUploadComplete?: (
    files: Array<{
      fileName: string;
      fileSize: number;
      mimeType: string;
      storageKey: string;
    }>
  ) => void;
  /** Callback when pending files change (for new tickets without workItemId) */
  onPendingFilesChange?: (files: File[]) => void;
  /** Maximum number of files allowed */
  maxFiles?: number;
  /** Whether to disable the upload */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Get icon for file based on mime type
 */
function getFileIcon(mimeType: string): React.ReactNode {
  if (mimeType.startsWith("image/")) {
    return <FileImage className="h-5 w-5 text-blue-500" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  ) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  }
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType === "text/plain"
  ) {
    return <FileText className="h-5 w-5 text-blue-600" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function FileUpload({
  workItemId,
  onUploadComplete,
  onPendingFilesChange,
  maxFiles = 5,
  disabled = false,
  className,
}: FileUploadProps): React.ReactElement {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Upload a single file to MinIO using presigned URL
   */
  const uploadSingleFile = useCallback(
    async (
      fileToUpload: UploadFile
    ): Promise<{
      success: boolean;
      storageKey?: string;
    }> => {
      if (!workItemId) {
        return { success: false };
      }

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileToUpload.id
              ? { ...f, status: "uploading" as const }
              : f
          )
        );

        // Get presigned URL
        const presignedResponse = await fetch(
          `/api/uploads/presigned?` +
            new URLSearchParams({
              workItemId,
              fileName: fileToUpload.file.name,
              fileSize: fileToUpload.file.size.toString(),
              mimeType: fileToUpload.file.type,
            })
        );

        if (!presignedResponse.ok) {
          const error = await presignedResponse.json();
          throw new Error(error.error || "Failed to get upload URL");
        }

        const { presignedUrl, storageKey } = await presignedResponse.json();

        // Upload file directly to MinIO
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: fileToUpload.file,
          headers: {
            "Content-Type": fileToUpload.file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file to storage");
        }

        // Save attachment metadata
        const attachmentResponse = await fetch("/api/attachments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workItemId,
            fileName: fileToUpload.file.name,
            fileSize: fileToUpload.file.size,
            mimeType: fileToUpload.file.type,
            storageKey,
          }),
        });

        if (!attachmentResponse.ok) {
          const error = await attachmentResponse.json();
          throw new Error(error.error || "Failed to save attachment");
        }

        // Update status to success
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileToUpload.id
              ? { ...f, status: "success" as const, progress: 100, storageKey }
              : f
          )
        );

        return { success: true, storageKey };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileToUpload.id
              ? { ...f, status: "error" as const, error: message }
              : f
          )
        );

        return { success: false };
      }
    },
    [workItemId]
  );

  /**
   * Handle file drop
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files
      rejectedFiles.forEach((rejection) => {
        const errors = rejection.errors
          .map((e) => {
            if (e.code === "file-too-large") {
              return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
            }
            if (e.code === "file-invalid-type") {
              return "File type not allowed";
            }
            return e.message;
          })
          .join(", ");

        toast({
          title: "Upload Error",
          description: `${rejection.file.name}: ${errors}`,
          variant: "destructive",
        });
      });

      if (acceptedFiles.length === 0) return;

      // Check max files
      const currentCount = files.filter((f) => f.status !== "error").length;
      if (currentCount + acceptedFiles.length > maxFiles) {
        toast({
          title: "Too Many Files",
          description: `You can only upload up to ${maxFiles} files.`,
          variant: "destructive",
        });
        return;
      }

      // Add files to state
      const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
        id: generateId(),
        file,
        status: "pending" as const,
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // If we have a workItemId, upload immediately
      if (workItemId) {
        setIsUploading(true);

        const uploadedFiles: Array<{
          fileName: string;
          fileSize: number;
          mimeType: string;
          storageKey: string;
        }> = [];

        for (const fileToUpload of newFiles) {
          const result = await uploadSingleFile(fileToUpload);
          if (result.success && result.storageKey) {
            uploadedFiles.push({
              fileName: fileToUpload.file.name,
              fileSize: fileToUpload.file.size,
              mimeType: fileToUpload.file.type,
              storageKey: result.storageKey,
            });
          }
        }

        setIsUploading(false);

        if (uploadedFiles.length > 0 && onUploadComplete) {
          onUploadComplete(uploadedFiles);
        }

        if (uploadedFiles.length > 0) {
          toast({
            title: "Upload Complete",
            description: `${uploadedFiles.length} file(s) uploaded successfully.`,
          });
        }
      } else {
        // For new tickets, just track pending files
        if (onPendingFilesChange) {
          const allPendingFiles = [
            ...files.filter((f) => f.status === "pending").map((f) => f.file),
            ...acceptedFiles,
          ];
          onPendingFilesChange(allPendingFiles);
        }
      }
    },
    [
      files,
      maxFiles,
      workItemId,
      onUploadComplete,
      onPendingFilesChange,
      uploadSingleFile,
    ]
  );

  /**
   * Remove a file from the list
   */
  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const newFiles = prev.filter((f) => f.id !== id);
        if (onPendingFilesChange && !workItemId) {
          onPendingFilesChange(
            newFiles.filter((f) => f.status === "pending").map((f) => f.file)
          );
        }
        return newFiles;
      });
    },
    [workItemId, onPendingFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_MIME_TYPES.reduce(
      (acc, mime) => ({ ...acc, [mime]: [] }),
      {}
    ),
    maxSize: MAX_FILE_SIZE,
    maxFiles,
    disabled: disabled || isUploading,
  });

  return (
    <div className={className}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }
          ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          {isDragActive ? (
            <p className="text-sm text-primary">Drop files here...</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, Images, Documents up to 10MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((fileItem) => (
            <div
              key={fileItem.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              {/* File Icon */}
              {getFileIcon(fileItem.file.type)}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {fileItem.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(fileItem.file.size)}
                </p>
              </div>

              {/* Status */}
              {fileItem.status === "uploading" && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {fileItem.status === "success" && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {fileItem.status === "error" && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{fileItem.error}</span>
                </div>
              )}

              {/* Remove Button */}
              {(fileItem.status === "pending" ||
                fileItem.status === "error") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeFile(fileItem.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
