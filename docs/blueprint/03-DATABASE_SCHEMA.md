# Database Schema

## Overview

The database uses **PostgreSQL 16** with **Prisma 5.8** as the ORM. The schema follows a polymorphic pattern for work items (tickets and tasks).

---

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────<│   WorkItem  │>────│   Project   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Team     │     │   Comment   │     │  Milestone  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
             ┌───────────┐ ┌───────────┐
             │ Attachment│ │  TimeLog  │
             └───────────┘ └───────────┘
```

---

## Core Models

### User

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  password      String
  role          Role      @default(AGENT)
  teamId        String?
  team          Team?     @relation(fields: [teamId], references: [id])
  avatar        String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  assignedTickets     Ticket[]      @relation("AssignedTickets")
  createdTickets      Ticket[]      @relation("CreatedTickets")
  assignedTasks       Task[]        @relation("AssignedTasks")
  createdTasks        Task[]        @relation("CreatedTasks")
  timeLogs            TimeLog[]
  comments            Comment[]
  dailySummaries      DailySummary[]
  notifications       Notification[]
  activityLogs        ActivityLog[]
}

enum Role {
  ADMIN
  MANAGER
  AGENT
  USER
}
```

### Team

```prisma
model Team {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  managerId   String?
  manager     User?    @relation("TeamManager", fields: [managerId], references: [id])
  color       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  members     User[]
  tickets     Ticket[]
  tasks       Task[]
  projects    Project[]
}
```

### WorkItem (Polymorphic Base)

```prisma
model WorkItem {
  id              String        @id @default(cuid())
  type            WorkItemType
  title           String
  description     String?       @db.Text
  status          Status        @default(OPEN)
  priority        Priority      @default(MEDIUM)
  
  assigneeId      String?
  assignee        User?         @relation("AssignedTickets", fields: [assigneeId], references: [id])
  
  creatorId       String
  creator         User          @relation("CreatedTickets", fields: [creatorId], references: [id])
  
  teamId          String?
  team            Team?         @relation(fields: [teamId], references: [id])
  
  projectId       String?
  project         Project?      @relation(fields: [projectId], references: [id])
  
  categoryId      String?
  category        Category?     @relation(fields: [categoryId], references: [id])
  
  dueDate         DateTime?
  estimatedHours  Float?
  completedAt     DateTime?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  comments        Comment[]
  attachments     Attachment[]
  timeLogs        TimeLog[]
  activityLogs    ActivityLog[]
  
  // Ticket-specific fields
  ticketNumber    String?       @unique
  slaPolicy       SlaPolicy?    @relation(fields: [slaPolicyId], references: [id])
  slaPolicyId     String?
  slaBreachedAt   DateTime?
  
  // Task-specific fields
  taskNumber      String?       @unique
  
  @@index([type, status])
  @@index([assigneeId])
  @@index([teamId])
  @@index([createdAt])
}

enum WorkItemType {
  TICKET
  TASK
}

enum Status {
  OPEN
  IN_PROGRESS
  ON_HOLD
  RESOLVED
  CLOSED
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

### Project

```prisma
model Project {
  id            String        @id @default(cuid())
  name          String
  description   String?       @db.Text
  status        ProjectStatus @default(ACTIVE)
  teamId        String?
  team          Team?         @relation(fields: [teamId], references: [id])
  startDate     DateTime?
  endDate       DateTime?
  progress      Int           @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  // Relations
  workItems     WorkItem[]
  milestones    Milestone[]
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  ON_HOLD
  COMPLETED
  CANCELLED
}
```

### Category

```prisma
model Category {
  id          String      @id @default(cuid())
  name        String
  description String?
  color       String?
  icon        String?
  teamId      String?
  team        Team?       @relation(fields: [teamId], references: [id])
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  // Relations
  workItems   WorkItem[]
}
```

---

## Supporting Models

### TimeLog

```prisma
model TimeLog {
  id            String      @id @default(cuid())
  workItemId    String
  workItem      WorkItem    @relation(fields: [workItemId], references: [id], onDelete: Cascade)
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  startedAt     DateTime
  endedAt       DateTime?
  durationMins  Int?
  notes         String?     @db.Text
  isRunning     Boolean     @default(false)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([userId])
  @@index([workItemId])
  @@index([startedAt])
}
```

### Comment

```prisma
model Comment {
  id            String      @id @default(cuid())
  workItemId    String
  workItem      WorkItem    @relation(fields: [workItemId], references: [id], onDelete: Cascade)
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  content       String      @db.Text
  isInternal    Boolean     @default(false)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([workItemId])
  @@index([createdAt])
}
```

### Attachment

```prisma
model Attachment {
  id            String      @id @default(cuid())
  workItemId    String
  workItem      WorkItem    @relation(fields: [workItemId], references: [id], onDelete: Cascade)
  fileName      String
  fileSize      Int
  mimeType      String
  storageKey    String
  uploadedBy    String
  createdAt     DateTime    @default(now())
  
  @@index([workItemId])
}
```

### DailySummary

```prisma
model DailySummary {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  date            DateTime    @db.Date
  completed       Json        // Array of completed work item IDs
  inProgress      Json        // Array of in-progress work item IDs
  blockers        String?     @db.Text
  notes           String?     @db.Text
  totalHours      Float?
  submittedAt     DateTime    @default(now())
  
  @@unique([userId, date])
  @@index([date])
}
```

### SlaPolicy

```prisma
model SlaPolicy {
  id                String      @id @default(cuid())
  name              String
  priority          Priority
  responseTime      Int         // Minutes
  resolutionTime    Int         // Minutes
  isActive          Boolean     @default(true)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  // Relations
  workItems         WorkItem[]
}
```

### Notification

```prisma
model Notification {
  id            String           @id @default(cuid())
  userId        String
  user          User             @relation(fields: [userId], references: [id])
  type          NotificationType
  title         String
  message       String           @db.Text
  link          String?
  isRead        Boolean          @default(false)
  createdAt     DateTime         @default(now())
  
  @@index([userId, isRead])
  @@index([createdAt])
}

enum NotificationType {
  TICKET_ASSIGNED
  TICKET_UPDATED
  COMMENT_ADDED
  MENTION
  DUE_DATE
  SLA_BREACH
  SYSTEM
}
```

### ActivityLog

```prisma
model ActivityLog {
  id            String      @id @default(cuid())
  workItemId    String?
  workItem      WorkItem?   @relation(fields: [workItemId], references: [id], onDelete: Cascade)
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  action        String
  changes       Json?
  ipAddress     String?
  createdAt     DateTime    @default(now())
  
  @@index([workItemId])
  @@index([userId])
  @@index([createdAt])
}
```

### Milestone

```prisma
model Milestone {
  id            String      @id @default(cuid())
  projectId     String
  project       Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name          String
  description   String?     @db.Text
  dueDate       DateTime
  isCompleted   Boolean     @default(false)
  completedAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([projectId])
}
```

---

## Numbering Conventions

| Type | Format | Example |
|------|--------|---------|
| Ticket | `T-XXXX` | T-0001, T-0002 |
| Task | `TASK-XXXX` | TASK-0001, TASK-0002 |

Auto-generated on creation with zero-padded sequential numbers.
