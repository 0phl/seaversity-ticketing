import { z } from "zod";

/**
 * Validation schema for creating a new task
 */
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
    required_error: "Please select a priority",
  }),
  categoryId: z.string().optional(),
  projectId: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).max(999).optional(),
  // Assignment fields
  assignmentMode: z.enum(["team", "individuals"]).optional(),
  teamId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/**
 * Validation schema for updating a task
 */
export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z
    .enum(["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED", "CANCELLED"])
    .optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
