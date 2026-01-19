"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Lock, Globe } from "lucide-react";

interface CommentUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
}

interface CommentFeedProps {
  comments: Comment[];
  currentUserRole: string;
}

/**
 * Format a date string to relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  // For older dates, show the actual date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Get the role badge color based on user role
 */
function getRoleBadgeVariant(
  role: string
): "default" | "secondary" | "info" | "warning" {
  switch (role) {
    case "ADMIN":
      return "default";
    case "MANAGER":
      return "info";
    case "AGENT":
      return "secondary";
    default:
      return "secondary";
  }
}

export function CommentFeed({ comments, currentUserRole }: CommentFeedProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No comments yet.</p>
        <p className="text-sm mt-1">Be the first to add a comment!</p>
      </div>
    );
  }

  const canSeeInternal = ["AGENT", "MANAGER", "ADMIN"].includes(currentUserRole);

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className={`relative flex gap-4 p-4 rounded-lg border ${
            comment.isInternal
              ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
              : "bg-card border-border"
          }`}
        >
          {/* User Avatar */}
          <Avatar
            src={comment.user.avatar}
            alt={comment.user.name}
            fallback={comment.user.name}
            size="md"
          />

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">
                {comment.user.name}
              </span>
              <Badge
                variant={getRoleBadgeVariant(comment.user.role)}
                className="text-[10px] px-1.5 py-0"
              >
                {comment.user.role}
              </Badge>
              {comment.isInternal ? (
                <Badge variant="internal" className="text-[10px] px-1.5 py-0">
                  <Lock className="h-3 w-3 mr-1" />
                  Internal
                </Badge>
              ) : (
                <Badge variant="info" className="text-[10px] px-1.5 py-0">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>

            {/* Comment Body */}
            <div className="mt-2 text-sm text-foreground whitespace-pre-wrap break-words">
              {comment.content}
            </div>

            {/* Show if comment was edited */}
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-muted-foreground mt-2 inline-block">
                (edited)
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
