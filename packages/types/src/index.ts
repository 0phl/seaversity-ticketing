// Shared TypeScript types - Export all shared types here
// These types mirror the Prisma schema for use across packages

// =============================================================================
// ENUMS
// =============================================================================

export type Role = "ADMIN" | "MANAGER" | "AGENT" | "USER";

export type WorkItemType = "TICKET" | "TASK";

export type Status =
  | "OPEN"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type NotificationType =
  | "TICKET_ASSIGNED"
  | "TICKET_UPDATED"
  | "COMMENT_ADDED"
  | "MENTION"
  | "DUE_DATE"
  | "SLA_BREACH"
  | "SYSTEM";

// =============================================================================
// CORE INTERFACES
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  teamId: string | null;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  managerId: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkItem {
  id: string;
  type: WorkItemType;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  assigneeId: string | null;
  creatorId: string;
  teamId: string | null;
  projectId: string | null;
  categoryId: string | null;
  dueDate: Date | null;
  estimatedHours: number | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Ticket-specific
  ticketNumber: string | null;
  slaPolicyId: string | null;
  slaBreachedAt: Date | null;
  // Task-specific
  taskNumber: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  teamId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  teamId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SUPPORTING INTERFACES
// =============================================================================

export interface TimeLog {
  id: string;
  workItemId: string;
  userId: string;
  startedAt: Date;
  endedAt: Date | null;
  durationMins: number | null;
  notes: string | null;
  isRunning: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  workItemId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  workItemId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface DailySummary {
  id: string;
  userId: string;
  date: Date;
  completed: string[]; // Array of work item IDs
  inProgress: string[]; // Array of work item IDs
  blockers: string | null;
  notes: string | null;
  totalHours: number | null;
  submittedAt: Date;
}

export interface SlaPolicy {
  id: string;
  name: string;
  priority: Priority;
  responseTime: number; // Minutes
  resolutionTime: number; // Minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  workItemId: string | null;
  userId: string;
  action: string;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  dueDate: Date;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Work item with all relations loaded */
export interface WorkItemWithRelations extends WorkItem {
  assignee?: User | null;
  creator?: User;
  team?: Team | null;
  project?: Project | null;
  category?: Category | null;
  comments?: Comment[];
  attachments?: Attachment[];
  timeLogs?: TimeLog[];
}

/** Ticket-specific type (WorkItem where type = TICKET) */
export type Ticket = WorkItem & { type: "TICKET" };

/** Task-specific type (WorkItem where type = TASK) */
export type Task = WorkItem & { type: "TASK" };

/** Pagination parameters */
export interface PaginationParams {
  page: number;
  limit: number;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** API error response */
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
