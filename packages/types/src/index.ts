// Shared TypeScript types - Export all shared types here

export type UserRole = "ADMIN" | "MANAGER" | "STAFF";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  department: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

// Additional types will be added as features are implemented
