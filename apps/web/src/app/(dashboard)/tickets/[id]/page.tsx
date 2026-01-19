"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Ticket,
  Clock,
  User,
  Calendar,
  Tag,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  PauseCircle,
  XCircle,
  Paperclip,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CommentFeed } from "@/components/tickets/comment-feed";
import { CommentForm } from "@/components/tickets/comment-form";
import { AssignmentControls } from "@/components/tickets/assignment-controls";
import { TimerWidget } from "@/components/time-tracking/timer-widget";
import { TimeLogTable } from "@/components/time-tracking/time-log-table";
import { FileUpload, AttachmentList } from "@/components/shared";

interface TicketUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface TicketCategory {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

interface TicketTeam {
  id: string;
  name: string;
  color: string | null;
}

interface TicketComment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  user: TicketUser;
}

interface TicketTimeLog {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationMins: number | null;
  notes: string | null;
  isRunning: boolean;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface TicketAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  createdAt: string;
  uploadedBy: string;
}

interface TicketAssignee {
  id: string;
  userId: string;
  assignedAt: string;
  user: TicketUser;
}

interface TicketDetail {
  id: string;
  ticketNumber: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  assignmentMode: string | null;
  creator: TicketUser;
  assignee: TicketUser | null;
  assignees: TicketAssignee[];
  category: TicketCategory | null;
  team: TicketTeam | null;
  comments: TicketComment[];
  timeLogs: TicketTimeLog[];
  attachments: TicketAttachment[];
}

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  IN_PROGRESS:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  ON_HOLD: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  RESOLVED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  CLOSED: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  MEDIUM:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "OPEN":
      return <AlertCircle className="h-5 w-5 text-blue-600" />;
    case "IN_PROGRESS":
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case "ON_HOLD":
      return <PauseCircle className="h-5 w-5 text-gray-600" />;
    case "RESOLVED":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "CLOSED":
      return <CheckCircle2 className="h-5 w-5 text-slate-600" />;
    case "CANCELLED":
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Ticket className="h-5 w-5 text-gray-600" />;
  }
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("USER");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);

  const ticketId = params.id as string;

  /**
   * Fetch attachments for the ticket
   */
  const fetchAttachments = useCallback(async () => {
    try {
      const res = await fetch(`/api/attachments?workItemId=${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  }, [ticketId]);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast({
            title: "Ticket not found",
            description: "The ticket you're looking for doesn't exist.",
            variant: "destructive",
          });
          router.push("/tickets");
          return;
        }
        throw new Error("Failed to fetch ticket");
      }
      const data = await res.json();
      setTicket(data);
      // Set attachments from ticket response if available
      if (data.attachments) {
        setAttachments(data.attachments);
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      toast({
        title: "Error",
        description: "Failed to load ticket details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, router, toast]);

  /**
   * Handle attachment upload completion - refresh attachments list
   */
  const handleUploadComplete = useCallback(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  /**
   * Handle attachment deletion - remove from local state
   */
  const handleAttachmentDelete = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Fetch current user session for role and ID
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const session = await res.json();
          if (session?.user) {
            setCurrentUserRole(session.user.role || "USER");
            setCurrentUserId(session.user.id || "");
          }
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    }
    fetchSession();
  }, []);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      setTicket({ ...ticket, status: newStatus });
      toast({
        title: "Status updated",
        description: `Ticket status changed to ${newStatus.replace("_", " ")}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket status.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Ticket not found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          The ticket you're looking for doesn't exist or you don't have access.
        </p>
        <Link href="/tickets" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
        </Link>
      </div>
    );
  }

  const canChangeStatus = ["AGENT", "MANAGER", "ADMIN"].includes(currentUserRole);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/tickets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-muted-foreground">
                {ticket.ticketNumber}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[ticket.status]}`}>
                {ticket.status.replace("_", " ")}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[ticket.priority]}`}>
                {ticket.priority}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{ticket.title}</h1>
          </div>
        </div>

        {/* Status Selector (for agents/managers/admins) */}
        {canChangeStatus && (
          <Select
            value={ticket.status}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[160px]">
              <StatusIcon status={ticket.status} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timer Widget (for AGENT/MANAGER/ADMIN) */}
          {canChangeStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Tracking
                </CardTitle>
                <CardDescription>
                  Track time spent working on this ticket
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimerWidget
                  workItemId={ticket.id}
                  workItemTitle={ticket.title}
                  workItemNumber={ticket.ticketNumber}
                  workItemType="TICKET"
                />
              </CardContent>
            </Card>
          )}

          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.description ? (
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                  {ticket.description}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No description provided.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Attachments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attachments ({attachments.length})
              </CardTitle>
              <CardDescription>
                Files and screenshots attached to this ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Attachments */}
              {attachments.length > 0 && (
                <AttachmentList
                  attachments={attachments}
                  onDelete={handleAttachmentDelete}
                  canDelete={canChangeStatus}
                />
              )}

              {/* Upload New Files */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Add Attachments</h4>
                <FileUpload
                  workItemId={ticket.id}
                  onUploadComplete={handleUploadComplete}
                  maxFiles={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({ticket.comments.length})
              </CardTitle>
              <CardDescription>
                Discussion and updates for this ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comment Feed */}
              <CommentFeed
                comments={ticket.comments}
                currentUserRole={currentUserRole}
              />

              {/* Comment Form */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium mb-3">Add a Comment</h4>
                <CommentForm
                  workItemId={ticket.id}
                  currentUserRole={currentUserRole}
                  onCommentAdded={fetchTicket}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Controls (for AGENT/MANAGER/ADMIN) */}
          {canChangeStatus && (
            <AssignmentControls
              ticketId={ticket.id}
              ticketNumber={ticket.ticketNumber}
              currentAssigneeId={ticket.assignee?.id || null}
              currentTeamId={ticket.team?.id || null}
              currentAssignmentMode={ticket.assignmentMode || null}
              currentAssignees={ticket.assignees || []}
              currentUserRole={currentUserRole}
              currentUserId={currentUserId}
              onAssignmentChange={fetchTicket}
            />
          )}

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Creator */}
              <div className="flex items-center gap-3">
                <Avatar
                  src={ticket.creator.avatar}
                  alt={ticket.creator.name}
                  fallback={ticket.creator.name}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="text-sm font-medium truncate">
                    {ticket.creator.name}
                  </p>
                </div>
              </div>

              {/* Assignees */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Assigned to</p>
                {ticket.assignees && ticket.assignees.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {ticket.assignees.map((assignee) => (
                      <div
                        key={assignee.id}
                        className="flex items-center gap-2 bg-primary/10 rounded-full px-2 py-1"
                      >
                        <Avatar
                          src={assignee.user.avatar}
                          alt={assignee.user.name}
                          fallback={assignee.user.name}
                          size="xs"
                        />
                        <span className="text-sm font-medium text-primary">
                          {assignee.user.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : ticket.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={ticket.assignee.avatar}
                      alt={ticket.assignee.name}
                      fallback={ticket.assignee.name}
                      size="sm"
                    />
                    <span className="text-sm font-medium">
                      {ticket.assignee.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground italic">
                      Unassigned
                    </span>
                  </div>
                )}
              </div>

              {/* Team */}
              {ticket.team && (
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: ticket.team.color || "#6B7280",
                    }}
                  >
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Team</p>
                    <p className="text-sm font-medium">{ticket.team.name}</p>
                  </div>
                </div>
              )}

              {/* Category */}
              {ticket.category && (
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: ticket.category.color || "#6B7280",
                    }}
                  >
                    <Tag className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="text-sm font-medium">{ticket.category.name}</p>
                  </div>
                </div>
              )}

              {/* Due Date */}
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="text-sm font-medium">
                    {ticket.dueDate
                      ? new Date(ticket.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "No due date"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(ticket.updatedAt)}</p>
                </div>
              </div>
              {ticket.completedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p className="font-medium">
                      {formatDate(ticket.completedAt)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Log Card (visible to AGENT/MANAGER/ADMIN) */}
          {canChangeStatus && ticket.timeLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Work Log
                </CardTitle>
                <CardDescription>
                  Time logged on this ticket
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimeLogTable timeLogs={ticket.timeLogs} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
