import { z } from "zod";

/**
 * Validation schema for creating a new comment
 */
export const createCommentSchema = z.object({
  workItemId: z.string().min(1, "Work item ID is required"),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(10000, "Comment must be less than 10000 characters"),
  isInternal: z.boolean().default(false),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/**
 * Validation schema for updating a comment
 */
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(10000, "Comment must be less than 10000 characters")
    .optional(),
  isInternal: z.boolean().optional(),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
