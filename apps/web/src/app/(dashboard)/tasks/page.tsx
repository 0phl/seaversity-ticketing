"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  ListTodo,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  Briefcase,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";

interface TaskAssignee {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface TaskItem {
  id: string;
  taskNumber: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  dueDate: string | null;
  estimatedHours: number | null;
  assignmentMode: string | null;
  creator: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  assignee: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  assignees: TaskAssignee[];
  team: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  category: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
  project: {
    id: string;
    name: string;
  } | null;
}

interface TasksResponse {
  data: TaskItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  ON_HOLD: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  CLOSED: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "OPEN":
      return <AlertCircle className="h-4 w-4 text-blue-600" />;
    case "IN_PROGRESS":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "RESOLVED":
    case "CLOSED":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    default:
      return <ListTodo className="h-4 w-4 text-gray-600" />;
  }
};

interface CurrentUser {
  id: string;
  role: string;
  teamId: string | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Fetch current user session
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const session = await res.json();
          if (session?.user) {
            setCurrentUser(session.user);
          }
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    }
    fetchSession();
  }, []);

  // Check if user can create tasks (ADMIN, MANAGER, AGENT only)
  const canCreateTasks = currentUser && ["ADMIN", "MANAGER", "AGENT"].includes(currentUser.role);

  useEffect(() => {
    async function fetchTasks() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== "all") {
          params.set("status", statusFilter);
        }
        if (priorityFilter && priorityFilter !== "all") {
          params.set("priority", priorityFilter);
        }

        const res = await fetch(`/api/tasks?${params.toString()}`);
        if (res.ok) {
          const data: TasksResponse = await res.json();
          setTasks(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      task.taskNumber.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ListTodo className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              {currentUser?.role === "USER" 
                ? "Your assigned work tasks" 
                : "Manage and track internal work tasks"}
            </p>
          </div>
        </div>
        {canCreateTasks && (
          <Link href="/tasks/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredTasks.length} Task{filteredTasks.length !== 1 ? "s" : ""}
          </CardTitle>
          <CardDescription>
            Click on a task to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No tasks found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your filters"
                  : currentUser?.role === "USER"
                  ? "You don't have any assigned tasks yet"
                  : "Create your first task to get started"}
              </p>
              {!searchQuery && statusFilter === "all" && priorityFilter === "all" && canCreateTasks && (
                <Link href="/tasks/new" className="mt-4 inline-block">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
                  </Button>
                </Link>
              )}
              {!searchQuery && statusFilter === "all" && priorityFilter === "all" && currentUser?.role === "USER" && (
                <p className="text-xs text-muted-foreground mt-4">
                  Contact your manager to have tasks assigned to you.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block"
                >
                  <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    <StatusIcon status={task.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-mono text-muted-foreground">
                          {task.taskNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            statusColors[task.status] || "bg-gray-100"
                          }`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            priorityColors[task.priority] || "bg-gray-100"
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.project && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {task.project.name}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium truncate">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span>Created {formatDate(task.createdAt)}</span>
                        <span>by {task.creator.name}</span>
                        {task.dueDate && (
                          <span className="text-orange-600">
                            Due {formatDate(task.dueDate)}
                          </span>
                        )}
                        {/* Show assignment */}
                        {task.assignmentMode === "team" && task.team ? (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {task.team.name}
                          </span>
                        ) : task.assignees?.length > 0 ? (
                          <span className="flex items-center gap-1">
                            <div className="flex -space-x-1">
                              {task.assignees.slice(0, 3).map((assignee) => (
                                <Avatar
                                  key={assignee.id}
                                  src={assignee.user.avatar}
                                  alt={assignee.user.name}
                                  fallback={assignee.user.name}
                                  size="xs"
                                  className="ring-2 ring-background"
                                />
                              ))}
                            </div>
                            {task.assignees.length > 3 && (
                              <span>+{task.assignees.length - 3}</span>
                            )}
                          </span>
                        ) : task.assignee ? (
                          <span>→ {task.assignee.name}</span>
                        ) : null}
                        {task.category && (
                          <span className="flex items-center gap-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: task.category.color || "#6B7280",
                              }}
                            />
                            {task.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
