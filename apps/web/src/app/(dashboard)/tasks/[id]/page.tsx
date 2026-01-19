"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ListTodo,
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
  FolderKanban,
  Timer,
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
import { TaskAssignmentControls } from "@/components/tasks/assignment-controls";
import { TimerWidget } from "@/components/time-tracking/timer-widget";
import { TimeLogTable } from "@/components/time-tracking/time-log-table";
import { FileUpload, AttachmentList } from "@/components/shared";

interface TaskUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface TaskCategory {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

interface TaskTeam {
  id: string;
  name: string;
  color: string | null;
}

interface TaskProject {
  id: string;
  name: string;
}

interface TaskComment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  user: TaskUser;
}

interface TaskTimeLog {
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

interface TaskAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  createdAt: string;
  uploadedBy: string;
}

interface TaskAssignee {
  id: string;
  userId: string;
  assignedAt: string;
  user: TaskUser;
}

interface TaskDetail {
  id: string;
  taskNumber: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedHours: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  assignmentMode: string | null;
  creator: TaskUser;
  assignee: TaskUser | null;
  assignees: TaskAssignee[];
  category: TaskCategory | null;
  team: TaskTeam | null;
  project: TaskProject | null;
  comments: TaskComment[];
  timeLogs: TaskTimeLog[];
  attachments: TaskAttachment[];
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
      return <ListTodo className="h-5 w-5 text-gray-600" />;
  }
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("USER");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);

  const taskId = params.id as string;

  /**
   * Fetch attachments for the task
   */
  const fetchAttachments = useCallback(async () => {
    try {
      const res = await fetch(`/api/attachments?workItemId=${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  }, [taskId]);

  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast({
            title: "Task not found",
            description: "The task you're looking for doesn't exist.",
            variant: "destructive",
          });
          router.push("/tasks");
          return;
        }
        throw new Error("Failed to fetch task");
      }
      const data = await res.json();
      setTask(data);
      // Set attachments from task response if available
      if (data.attachments) {
        setAttachments(data.attachments);
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      toast({
        title: "Error",
        description: "Failed to load task details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [taskId, router, toast]);

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
    fetchTask();
  }, [fetchTask]);

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      setTask({ ...task, status: newStatus });
      toast({
        title: "Status updated",
        description: `Task status changed to ${newStatus.replace("_", " ")}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status.",
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

  // Calculate total time logged
  const totalTimeLoggedMins = task?.timeLogs.reduce((acc, log) => {
    return acc + (log.durationMins || 0);
  }, 0) || 0;

  const formatHoursAndMins = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Task not found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          The task you're looking for doesn't exist or you don't have access.
        </p>
        <Link href="/tasks" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
      </div>
    );
  }

  // Permission checks
  const isStaff = ["AGENT", "MANAGER", "ADMIN"].includes(currentUserRole);
  const isAssigned = task?.assignees?.some((a) => a.userId === currentUserId) || 
                     task?.assignee?.id === currentUserId;
  
  // Users assigned to tasks can change status and use time tracking
  // This is essential for WFH - they need to track their work
  const canChangeStatus = isStaff || isAssigned;
  
  // Only managers/admins can reassign tasks
  const canReassign = ["MANAGER", "ADMIN"].includes(currentUserRole);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/tasks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-sm font-mono text-muted-foreground">
                {task.taskNumber}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[task.status]}`}>
                {task.status.replace("_", " ")}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
              {task.project && (
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                  <FolderKanban className="h-3 w-3" />
                  {task.project.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
          </div>
        </div>

        {/* Status Selector (for agents/managers/admins) */}
        {canChangeStatus && (
          <Select
            value={task.status}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[160px]">
              <StatusIcon status={task.status} />
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
                  Track time spent working on this task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimerWidget
                  workItemId={task.id}
                  workItemTitle={task.title}
                  workItemNumber={task.taskNumber}
                  workItemType="TASK"
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
              {task.description ? (
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                  {task.description}
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
                Files and documents attached to this task
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
                  workItemId={task.id}
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
                Comments ({task.comments.length})
              </CardTitle>
              <CardDescription>
                Discussion and updates for this task
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comment Feed */}
              <CommentFeed
                comments={task.comments}
                currentUserRole={currentUserRole}
              />

              {/* Comment Form */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium mb-3">Add a Comment</h4>
                <CommentForm
                  workItemId={task.id}
                  currentUserRole={currentUserRole}
                  onCommentAdded={fetchTask}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Controls (only MANAGER/ADMIN can reassign) */}
          {canReassign && (
            <TaskAssignmentControls
              taskId={task.id}
              taskNumber={task.taskNumber}
              currentAssigneeId={task.assignee?.id || null}
              currentTeamId={task.team?.id || null}
              currentAssignmentMode={task.assignmentMode || null}
              currentAssignees={task.assignees || []}
              currentUserRole={currentUserRole}
              currentUserId={currentUserId}
              onAssignmentChange={fetchTask}
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
                  src={task.creator.avatar}
                  alt={task.creator.name}
                  fallback={task.creator.name}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="text-sm font-medium truncate">
                    {task.creator.name}
                  </p>
                </div>
              </div>

              {/* Assignees */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Assigned to</p>
                {task.assignees && task.assignees.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {task.assignees.map((assignee) => (
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
                ) : task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={task.assignee.avatar}
                      alt={task.assignee.name}
                      fallback={task.assignee.name}
                      size="sm"
                    />
                    <span className="text-sm font-medium">
                      {task.assignee.name}
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
              {task.team && (
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: task.team.color || "#6B7280",
                    }}
                  >
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Team</p>
                    <p className="text-sm font-medium">{task.team.name}</p>
                  </div>
                </div>
              )}

              {/* Category */}
              {task.category && (
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: task.category.color || "#6B7280",
                    }}
                  >
                    <Tag className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="text-sm font-medium">{task.category.name}</p>
                  </div>
                </div>
              )}

              {/* Estimated Hours */}
              {task.estimatedHours && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated</p>
                    <p className="text-sm font-medium">{task.estimatedHours}h</p>
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
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("en-US", {
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
                  <p className="font-medium">{formatDate(task.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(task.updatedAt)}</p>
                </div>
              </div>
              {task.completedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p className="font-medium">
                      {formatDate(task.completedAt)}
                    </p>
                  </div>
                </div>
              )}
              {totalTimeLoggedMins > 0 && (
                <div className="flex items-center gap-3 text-sm border-t pt-3">
                  <Timer className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-muted-foreground">Time Logged</p>
                    <p className="font-medium text-primary">
                      {formatHoursAndMins(totalTimeLoggedMins)}
                      {task.estimatedHours && (
                        <span className="text-muted-foreground font-normal">
                          {" "}/ {task.estimatedHours}h estimated
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Log Card (visible to AGENT/MANAGER/ADMIN) */}
          {canChangeStatus && task.timeLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Work Log
                </CardTitle>
                <CardDescription>
                  Time logged on this task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimeLogTable timeLogs={task.timeLogs} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
