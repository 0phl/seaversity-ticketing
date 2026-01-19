"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ListTodo, Loader2, Paperclip, Users, UserPlus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/shared";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";
import {
  createTaskSchema,
  type CreateTaskInput,
} from "@/lib/validations/task";

interface Category {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

interface Team {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  _count: {
    members: number;
  };
}

interface Agent {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  teamId: string | null;
  team: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

interface Project {
  id: string;
  name: string;
}

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
}

type AssignmentTab = "team" | "individuals";

export default function NewTaskPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  
  // Assignment state
  const [activeTab, setActiveTab] = useState<AssignmentTab>("team");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      categoryId: undefined,
      projectId: undefined,
      dueDate: undefined,
      estimatedHours: undefined,
    },
  });

  const priority = watch("priority");
  const categoryId = watch("categoryId");
  const projectId = watch("projectId");

  // Fetch session to get current user's team
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const session = await res.json();
          if (session?.user) {
            setCurrentUser(session.user);
            // Default team to current user's team
            if (session.user.teamId) {
              setSelectedTeamId(session.user.teamId);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    }
    fetchSession();
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch teams
  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data = await res.json();
          setTeams(data);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setIsLoadingTeams(false);
      }
    }
    fetchTeams();
  }, []);

  // Fetch agents
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/users/agents");
        if (res.ok) {
          const data = await res.json();
          setAgents(data);
        }
      } catch (error) {
        console.error("Error fetching agents:", error);
      } finally {
        setIsLoadingAgents(false);
      }
    }
    fetchAgents();
  }, []);

  // Convert agents to MultiSelect options
  const agentOptions: MultiSelectOption[] = agents.map((agent) => ({
    value: agent.id,
    label: agent.name,
    avatar: agent.avatar,
    description: agent.role,
  }));

  /**
   * Upload pending files to a work item
   */
  const uploadPendingFiles = async (workItemId: string): Promise<number> => {
    let successCount = 0;

    for (const file of pendingFiles) {
      try {
        // Get presigned URL
        const presignedResponse = await fetch(
          `/api/uploads/presigned?` +
            new URLSearchParams({
              workItemId,
              fileName: file.name,
              fileSize: file.size.toString(),
              mimeType: file.type,
            })
        );

        if (!presignedResponse.ok) {
          console.error(`Failed to get presigned URL for ${file.name}`);
          continue;
        }

        const { presignedUrl, storageKey } = await presignedResponse.json();

        // Upload to MinIO
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          console.error(`Failed to upload ${file.name} to storage`);
          continue;
        }

        // Save attachment metadata
        const attachmentResponse = await fetch("/api/attachments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workItemId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            storageKey,
          }),
        });

        if (attachmentResponse.ok) {
          successCount++;
        }
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
      }
    }

    return successCount;
  };

  const onSubmit = async (data: CreateTaskInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Build submission data with assignment
      const submissionData: CreateTaskInput = {
        ...data,
        assignmentMode: activeTab,
        teamId: activeTab === "team" ? selectedTeamId || currentUser?.teamId || undefined : undefined,
        assigneeIds: activeTab === "individuals" ? selectedAssigneeIds : undefined,
      };

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      const task = await response.json();

      // Upload pending files if any
      let uploadedFilesCount = 0;
      if (pendingFiles.length > 0) {
        setIsUploadingFiles(true);
        uploadedFilesCount = await uploadPendingFiles(task.id);
        setIsUploadingFiles(false);
      }

      const fileMessage =
        uploadedFilesCount > 0
          ? ` with ${uploadedFilesCount} attachment(s)`
          : "";

      toast({
        title: "Task Created",
        description: `Task ${task.taskNumber} has been created successfully${fileMessage}.`,
        variant: "success",
      });

      router.push("/tasks");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create task";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsUploadingFiles(false);
    }
  };

  const priorityOptions = [
    { value: "LOW", label: "Low", color: "text-green-600" },
    { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
    { value: "HIGH", label: "High", color: "text-orange-600" },
    { value: "CRITICAL", label: "Critical", color: "text-red-600" },
  ];

  const isManagerOrAdmin = currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ListTodo className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Task</h1>
            <p className="text-sm text-muted-foreground">
              Create a new internal work task
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
          <CardDescription>
            Fill in the information below to create a new task. Required fields are marked with *.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Brief summary of the task"
                disabled={isSubmitting}
                {...register("title")}
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about the task..."
                rows={6}
                disabled={isSubmitting}
                {...register("description")}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Priority and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">
                  Priority <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={priority}
                  onValueChange={(value) =>
                    setValue("priority", value as CreateTaskInput["priority"])
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    className={errors.priority ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={option.color}>{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-sm text-destructive">
                    {errors.priority.message}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={categoryId || ""}
                  onValueChange={(value) =>
                    setValue("categoryId", value || undefined)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          {cat.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                          )}
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date and Estimated Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  disabled={isSubmitting}
                  {...register("dueDate")}
                  min={new Date().toISOString().split("T")[0]}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Set a target completion date.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="999"
                  placeholder="0"
                  disabled={isSubmitting}
                  {...register("estimatedHours", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Estimated time to complete.
                </p>
              </div>
            </div>

            {/* Assignment Section */}
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <Label className="text-base font-semibold">Assignment</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Assign this task to a team or specific individuals.
              </p>

              {/* Tab Selector */}
              <div className="flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("team")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    activeTab === "team"
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Users className="h-4 w-4" />
                  Assign to Team
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("individuals")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    activeTab === "individuals"
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <UserPlus className="h-4 w-4" />
                  Assign to Individuals
                </button>
              </div>

              {/* Team Assignment Tab */}
              {activeTab === "team" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {currentUser?.teamId
                      ? "Defaults to your team. Change if needed."
                      : "Select a team to assign this task."}
                  </p>
                  {isLoadingTeams ? (
                    <div className="h-10 bg-muted animate-pulse rounded-md" />
                  ) : (
                    <Select
                      value={selectedTeamId || ""}
                      onValueChange={setSelectedTeamId}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: team.color || "#6B7280",
                                }}
                              />
                              <span>{team.name}</span>
                              <span className="text-muted-foreground text-xs">
                                ({team._count.members} members)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Individuals Assignment Tab */}
              {activeTab === "individuals" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Select one or more users to assign this task.
                  </p>
                  <MultiSelect
                    options={agentOptions}
                    selected={selectedAssigneeIds}
                    onChange={setSelectedAssigneeIds}
                    placeholder="Select assignees..."
                    emptyText="No agents found."
                    disabled={isSubmitting}
                    isLoading={isLoadingAgents}
                  />
                </div>
              )}
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </Label>
              <FileUpload
                onPendingFilesChange={setPendingFiles}
                maxFiles={5}
                disabled={isSubmitting || isUploadingFiles}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Attach up to 5 files (max 10MB each). Files will be uploaded after task creation.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting || isUploadingFiles}>
                {isSubmitting || isUploadingFiles ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploadingFiles ? "Uploading files..." : "Creating..."}
                  </>
                ) : (
                  <>
                    Create Task
                    {pendingFiles.length > 0 && (
                      <span className="ml-1 text-xs">
                        ({pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </>
                )}
              </Button>
              <Link href="/tasks">
                <Button type="button" variant="outline" disabled={isSubmitting || isUploadingFiles}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
