"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send, Lock, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  createCommentSchema,
  type CreateCommentInput,
} from "@/lib/validations/comment";

interface CommentFormProps {
  workItemId: string;
  currentUserRole: string;
  onCommentAdded: () => void;
}

export function CommentForm({
  workItemId,
  currentUserRole,
  onCommentAdded,
}: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const { toast } = useToast();

  const canCreateInternal = ["AGENT", "MANAGER", "ADMIN"].includes(
    currentUserRole
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCommentInput>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: {
      workItemId,
      content: "",
      isInternal: false,
    },
  });

  const onSubmit = async (data: CreateCommentInput) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          isInternal: canCreateInternal ? isInternal : false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add comment");
      }

      toast({
        title: "Comment added",
        description: isInternal
          ? "Your internal comment has been added."
          : "Your comment has been added.",
      });

      reset();
      setIsInternal(false);
      onCommentAdded();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content" className="sr-only">
          Add a comment
        </Label>
        <Textarea
          id="content"
          placeholder="Write your comment here..."
          rows={4}
          className={`resize-none ${
            isInternal
              ? "border-amber-300 focus-visible:ring-amber-400"
              : ""
          }`}
          disabled={isSubmitting}
          {...register("content")}
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        {/* Internal Comment Toggle */}
        {canCreateInternal && (
          <div className="flex items-center gap-3">
            <Switch
              id="isInternal"
              checked={isInternal}
              onCheckedChange={setIsInternal}
              disabled={isSubmitting}
            />
            <Label
              htmlFor="isInternal"
              className={`flex items-center gap-2 text-sm cursor-pointer ${
                isInternal ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"
              }`}
            >
              {isInternal ? (
                <>
                  <Lock className="h-4 w-4" />
                  Internal note (only visible to agents)
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" />
                  Public comment (visible to requester)
                </>
              )}
            </Label>
          </div>
        )}

        {!canCreateInternal && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            Public comment
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Add Comment
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
