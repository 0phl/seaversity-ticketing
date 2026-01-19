"use client";

import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  FileUp,
  Ticket,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Edit,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ActivityItem {
  id: string;
  type: "activity" | "comment" | "attachment";
  action: string;
  changes?: unknown;
  content?: string;
  isInternal?: boolean;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  workItem: {
    id: string;
    title: string;
    ticketNumber: string | null;
    taskNumber: string | null;
    type: "TICKET" | "TASK";
  } | null;
  createdAt: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getActionIcon(item: ActivityItem) {
  if (item.type === "comment") {
    return <MessageSquare className="h-4 w-4 text-blue-500" />;
  }
  if (item.type === "attachment") {
    return <FileUp className="h-4 w-4 text-purple-500" />;
  }

  // Activity log actions
  switch (item.action.toLowerCase()) {
    case "created":
    case "ticket_created":
    case "task_created":
      return <Plus className="h-4 w-4 text-green-500" />;
    case "resolved":
    case "closed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "status_changed":
    case "updated":
      return <Edit className="h-4 w-4 text-amber-500" />;
    case "assigned":
      return <User className="h-4 w-4 text-blue-500" />;
    default:
      return <Ticket className="h-4 w-4 text-primary" />;
  }
}

function getActionLabel(item: ActivityItem): string {
  if (item.type === "comment") {
    return item.isInternal ? "added internal note" : "commented";
  }
  if (item.type === "attachment") {
    return "uploaded file";
  }

  // Format activity action for display
  return item.action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/ticket /g, "")
    .replace(/task /g, "");
}

function ActivityItemCard({ item }: { item: ActivityItem }) {
  const workItemNumber =
    item.workItem?.ticketNumber || item.workItem?.taskNumber;
  const workItemLink = item.workItem
    ? `/tickets/${item.workItem.id}`
    : undefined;

  return (
    <div className="flex gap-3 p-3 hover:bg-muted/50 transition-colors">
      {/* User Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={item.user.avatar || undefined} alt={item.user.name} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {getInitials(item.user.name)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Header line */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{item.user.name}</span>
          <span className="text-muted-foreground text-xs">
            {getActionLabel(item)}
          </span>
        </div>

        {/* Work item reference */}
        {item.workItem && (
          <div className="flex items-center gap-2">
            {getActionIcon(item)}
            {workItemLink ? (
              <Link
                href={workItemLink}
                className="text-sm font-medium text-primary hover:underline truncate"
              >
                {workItemNumber}: {item.workItem.title}
              </Link>
            ) : (
              <span className="text-sm truncate">
                {workItemNumber}: {item.workItem.title}
              </span>
            )}
          </div>
        )}

        {/* Comment content preview */}
        {item.type === "comment" && item.content && (
          <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
            &ldquo;{item.content}&rdquo;
          </p>
        )}

        {/* Attachment info */}
        {item.type === "attachment" && item.fileName && (
          <p className="text-xs text-muted-foreground pl-6">
            {item.fileName}
            {item.fileSize && ` (${formatBytes(item.fileSize)})`}
          </p>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-0 divide-y">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 p-3">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-48 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="h-8 w-8 mb-2" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="divide-y max-h-[600px] overflow-y-auto">
      {activities.map((activity) => (
        <ActivityItemCard key={activity.id} item={activity} />
      ))}
    </div>
  );
}
