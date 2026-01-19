import { z } from "zod";

export const createTicketSchema = z.object({
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
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = createTicketSchema.partial().extend({
  status: z.enum(["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED", "CANCELLED"]).optional(),
});

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
