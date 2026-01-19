"use client";

import { useState } from "react";
import Image from "next/image";
import {
  File,
  FileImage,
  FileText,
  FileSpreadsheet,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

/** Attachment data from API */
export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  createdAt: string;
  uploadedBy: string;
}

interface AttachmentListProps {
  /** List of attachments */
  attachments: Attachment[];
  /** Callback when an attachment is deleted */
  onDelete?: (id: string) => void;
  /** Whether deletion is allowed */
  canDelete?: boolean;
  /** Show as compact list */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Get icon for file based on mime type
 */
function getFileIcon(mimeType: string, size: "sm" | "md" = "md"): React.ReactNode {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  if (mimeType.startsWith("image/")) {
    return <FileImage className={`${sizeClass} text-blue-500`} />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className={`${sizeClass} text-red-500`} />;
  }
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  ) {
    return <FileSpreadsheet className={`${sizeClass} text-green-500`} />;
  }
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType === "text/plain"
  ) {
    return <FileText className={`${sizeClass} text-blue-600`} />;
  }
  return <File className={`${sizeClass} text-gray-500`} />;
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
 * Check if a file is an image based on mime type
 */
function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * AttachmentItem component for individual attachment
 */
function AttachmentItem({
  attachment,
  onDelete,
  canDelete,
  compact,
}: {
  attachment: Attachment;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  compact?: boolean;
}): React.ReactElement {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /**
   * Handle download
   */
  const handleDownload = async (): Promise<void> => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/attachments/${attachment.id}`);
      if (!response.ok) {
        throw new Error("Failed to get download URL");
      }

      const { downloadUrl } = await response.json();

      // Open download in new tab
      window.open(downloadUrl, "_blank");
    } catch (error) {
      toast({
        title: "Download Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = async (): Promise<void> => {
    if (!confirm("Are you sure you want to delete this attachment?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/attachments/${attachment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete attachment");
      }

      if (onDelete) {
        onDelete(attachment.id);
      }

      toast({
        title: "Attachment Deleted",
        description: "The attachment has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Error",
        description: "Failed to delete attachment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Load image preview
   */
  const loadPreview = async (): Promise<void> => {
    if (!isImage(attachment.mimeType) || previewUrl) return;

    try {
      const response = await fetch(`/api/attachments/${attachment.id}`);
      if (!response.ok) throw new Error("Failed to get preview URL");

      const { downloadUrl } = await response.json();
      setPreviewUrl(downloadUrl);
    } catch (error) {
      console.error("Failed to load preview:", error);
    }
  };

  // For compact mode
  if (compact) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
        {getFileIcon(attachment.mimeType, "sm")}
        <span
          className="flex-1 text-sm truncate cursor-pointer hover:text-primary"
          onClick={handleDownload}
        >
          {attachment.fileName}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatFileSize(attachment.fileSize)}
        </span>
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDownload}
          >
            <Download className="h-3 w-3" />
          </Button>
        )}
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    );
  }

  // Full mode with preview support
  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Image Preview */}
      {isImage(attachment.mimeType) && (
        <div
          className="relative aspect-video bg-muted cursor-pointer"
          onClick={handleDownload}
          onMouseEnter={loadPreview}
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={attachment.fileName}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <FileImage className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      {/* File Info */}
      <div className="p-3 flex items-center gap-3">
        {!isImage(attachment.mimeType) && getFileIcon(attachment.mimeType)}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(attachment.fileSize)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * AttachmentList component displays a list of file attachments
 * with preview support for images and download/delete actions
 */
export function AttachmentList({
  attachments,
  onDelete,
  canDelete = false,
  compact = false,
  className,
}: AttachmentListProps): React.ReactElement | null {
  if (attachments.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={`space-y-1 ${className || ""}`}>
        {attachments.map((attachment) => (
          <AttachmentItem
            key={attachment.id}
            attachment={attachment}
            onDelete={onDelete}
            canDelete={canDelete}
            compact
          />
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {attachments.map((attachment) => (
          <AttachmentItem
            key={attachment.id}
            attachment={attachment}
            onDelete={onDelete}
            canDelete={canDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default AttachmentList;
