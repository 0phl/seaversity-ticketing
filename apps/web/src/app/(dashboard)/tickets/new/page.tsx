"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Ticket, Loader2, Paperclip } from "lucide-react";
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
import {
  createTicketSchema,
  type CreateTicketInput,
} from "@/lib/validations/ticket";

interface Category {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      categoryId: undefined,
      dueDate: undefined,
    },
  });

  const priority = watch("priority");
  const categoryId = watch("categoryId");

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

  const onSubmit = async (data: CreateTicketInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create ticket");
      }

      const ticket = await response.json();

      // Upload pending files if any
      let uploadedFilesCount = 0;
      if (pendingFiles.length > 0) {
        setIsUploadingFiles(true);
        uploadedFilesCount = await uploadPendingFiles(ticket.id);
        setIsUploadingFiles(false);
      }

      const fileMessage =
        uploadedFilesCount > 0
          ? ` with ${uploadedFilesCount} attachment(s)`
          : "";

      toast({
        title: "Ticket Created",
        description: `Ticket ${ticket.ticketNumber} has been created successfully${fileMessage}.`,
        variant: "success",
      });

      router.push("/tickets");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create ticket";
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Ticket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Ticket</h1>
            <p className="text-sm text-muted-foreground">
              Create a new support ticket
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
          <CardDescription>
            Fill in the information below to create a new ticket. Required fields are marked with *.
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
                placeholder="Brief summary of the issue"
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
                placeholder="Provide detailed information about the issue..."
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
                    setValue("priority", value as CreateTicketInput["priority"])
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

            {/* Due Date */}
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
                Optional. Set a target date for resolution.
              </p>
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
                Optional. Attach up to 5 files (max 10MB each). Files will be uploaded after ticket creation.
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
                    Create Ticket
                    {pendingFiles.length > 0 && (
                      <span className="ml-1 text-xs">
                        ({pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </>
                )}
              </Button>
              <Link href="/tickets">
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
