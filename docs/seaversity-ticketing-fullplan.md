# Seaversity Ticketing & Work Management System
## Complete Project Plan & Technical Specification

---

## 🎯 Project Overview

**Project Name:** Seaversity Ticketing System  
**Purpose:** Enterprise ticketing and work management platform for IT and LMS teams  
**Deployment:** Rocky Linux 9.5 with Docker  
**Architecture:** Monorepo structure  
**Timeline:** 12-14 weeks (3 phases)

---

## 🎨 Design System

### Brand Colors (from Seaversity Logo)
```css
/* Primary Colors */
--primary-blue: #0099FF;        /* Seaversity Blue */
--primary-dark: #4A5568;        /* Seaversity Dark Gray */

/* UI Colors */
--accent-blue: #0080DD;         /* Darker blue for hover states */
--light-blue: #E6F7FF;          /* Light blue backgrounds */
--success: #10B981;             /* Green for success states */
--warning: #F59E0B;             /* Amber for warnings */
--error: #EF4444;               /* Red for errors */
--info: #3B82F6;                /* Blue for info */

/* Neutral Colors */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-500: #6B7280;
--gray-700: #374151;
--gray-900: #111827;

/* Dark Mode */
--dark-bg: #1F2937;
--dark-surface: #374151;
--dark-text: #F9FAFB;
```

### Typography
- **Font Family:** Inter (Google Fonts)
- **Headings:** 600-700 weight
- **Body:** 400 weight
- **Code:** JetBrains Mono

---

## 🛠️ Technology Stack (Final Selection)

### **Monorepo Management**
- **Turborepo** - Fast build system with caching

### **Frontend**
- **Next.js 14** (App Router) - React framework
- **TypeScript 5.3** - Type safety
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - Component library
- **Radix UI** - Accessible primitives
- **Lucide React** - Icon library
- **TanStack Query v5** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Recharts** - Data visualization

### **Backend**
- **Next.js API Routes** - API endpoints
- **Prisma 5.8** - ORM
- **PostgreSQL 16** - Primary database
- **Redis 7** - Caching & sessions
- **BullMQ** - Job queue
- **Socket.io** - WebSocket server

### **Authentication**
- **NextAuth.js v5** - Authentication
- **bcrypt** - Password hashing
- **jose** - JWT handling

### **File Storage**
- **MinIO** - S3-compatible object storage

### **Email**
- **Brevo (Sendinblue)** - Email service
- **React Email** - Email templates

### **Real-time**
- **Socket.io** - WebSocket communication
- **Redis Adapter** - Socket.io scaling

### **Monitoring & Logging**
- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **Sentry** - Error tracking
- **Pino** - Structured logging
- **Uptime Kuma** - Uptime monitoring

### **DevOps**
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy
- **Let's Encrypt** - SSL certificates
- **GitHub Actions** - CI/CD

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting
- **Commitlint** - Commit message linting

---

## 📁 Monorepo File Structure

```
seaversity-ticketing/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy.yml
│       └── test.yml
├── apps/
│   ├── web/                          # Next.js frontend application
│   │   ├── public/
│   │   │   ├── images/
│   │   │   └── favicon.ico
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── tickets/
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── tasks/
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── projects/
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── team/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── reports/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── settings/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── api/
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   └── [...nextauth]/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   ├── tickets/
│   │   │   │   │   │   ├── route.ts
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   ├── tasks/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── projects/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── time-logs/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── comments/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── uploads/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── users/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── teams/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── reports/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/                    # shadcn/ui components
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   │   ├── select.tsx
│   │   │   │   │   ├── table.tsx
│   │   │   │   │   ├── badge.tsx
│   │   │   │   │   ├── avatar.tsx
│   │   │   │   │   ├── toast.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── layout/
│   │   │   │   │   ├── navbar.tsx
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   ├── footer.tsx
│   │   │   │   │   └── breadcrumb.tsx
│   │   │   │   ├── tickets/
│   │   │   │   │   ├── ticket-list.tsx
│   │   │   │   │   ├── ticket-card.tsx
│   │   │   │   │   ├── ticket-form.tsx
│   │   │   │   │   ├── ticket-details.tsx
│   │   │   │   │   ├── ticket-status-badge.tsx
│   │   │   │   │   └── ticket-priority-badge.tsx
│   │   │   │   ├── tasks/
│   │   │   │   │   ├── task-list.tsx
│   │   │   │   │   ├── task-card.tsx
│   │   │   │   │   ├── task-form.tsx
│   │   │   │   │   └── task-board.tsx
│   │   │   │   ├── time-tracking/
│   │   │   │   │   ├── timer-widget.tsx
│   │   │   │   │   ├── time-log-list.tsx
│   │   │   │   │   ├── time-entry-form.tsx
│   │   │   │   │   └── time-summary.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── stats-card.tsx
│   │   │   │   │   ├── activity-feed.tsx
│   │   │   │   │   ├── team-overview.tsx
│   │   │   │   │   └── quick-actions.tsx
│   │   │   │   ├── forms/
│   │   │   │   │   ├── login-form.tsx
│   │   │   │   │   ├── register-form.tsx
│   │   │   │   │   └── profile-form.tsx
│   │   │   │   ├── charts/
│   │   │   │   │   ├── ticket-trend-chart.tsx
│   │   │   │   │   ├── team-performance-chart.tsx
│   │   │   │   │   └── time-distribution-chart.tsx
│   │   │   │   └── shared/
│   │   │   │       ├── loading-spinner.tsx
│   │   │   │       ├── error-boundary.tsx
│   │   │   │       ├── empty-state.tsx
│   │   │   │       └── confirmation-dialog.tsx
│   │   │   ├── lib/
│   │   │   │   ├── utils.ts
│   │   │   │   ├── api.ts
│   │   │   │   ├── socket.ts
│   │   │   │   └── validations.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-tickets.ts
│   │   │   │   ├── use-tasks.ts
│   │   │   │   ├── use-timer.ts
│   │   │   │   ├── use-socket.ts
│   │   │   │   └── use-current-user.ts
│   │   │   ├── stores/
│   │   │   │   ├── timer-store.ts
│   │   │   │   ├── ui-store.ts
│   │   │   │   └── notification-store.ts
│   │   │   └── types/
│   │   │       ├── ticket.ts
│   │   │       ├── task.ts
│   │   │       ├── user.ts
│   │   │       └── index.ts
│   │   ├── .env.example
│   │   ├── .env.local
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── worker/                          # Background job worker
│       ├── src/
│       │   ├── jobs/
│       │   │   ├── email.job.ts
│       │   │   ├── report.job.ts
│       │   │   ├── notification.job.ts
│       │   │   └── automation.job.ts
│       │   ├── processors/
│       │   │   ├── email.processor.ts
│       │   │   ├── report.processor.ts
│       │   │   └── automation.processor.ts
│       │   ├── index.ts
│       │   └── config.ts
│       ├── Dockerfile
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── database/                        # Prisma schema & migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── ui/                              # Shared UI components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── types/                           # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── ticket.ts
│   │   │   ├── task.ts
│   │   │   ├── user.ts
│   │   │   ├── time-log.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── utils/                           # Shared utilities
│   │   ├── src/
│   │   │   ├── date.ts
│   │   │   ├── format.ts
│   │   │   ├── validation.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── email-templates/                 # React Email templates
│   │   ├── src/
│   │   │   ├── templates/
│   │   │   │   ├── ticket-assigned.tsx
│   │   │   │   ├── ticket-updated.tsx
│   │   │   │   ├── daily-summary.tsx
│   │   │   │   └── weekly-report.tsx
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── config/                          # Shared configurations
│       ├── eslint-config/
│       │   ├── next.js
│       │   ├── library.js
│       │   └── package.json
│       ├── typescript-config/
│       │   ├── base.json
│       │   ├── nextjs.json
│       │   ├── library.json
│       │   └── package.json
│       └── tailwind-config/
│           ├── tailwind.config.ts
│           └── package.json
├── docker/
│   ├── web/
│   │   └── Dockerfile
│   ├── worker/
│   │   └── Dockerfile
│   ├── nginx/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   └── docker-compose.yml
├── scripts/
│   ├── setup.sh
│   ├── backup.sh
│   ├── restore.sh
│   └── deploy.sh
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   ├── dashboards/
│   │   │   ├── system-overview.json
│   │   │   ├── application-metrics.json
│   │   │   └── database-performance.json
│   │   └── provisioning/
│   └── alerts/
│       └── alert-rules.yml
├── .gitignore
├── .env.example
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── README.md
└── LICENSE
```

---

## 📊 Database Schema

### **Core Tables**

#### **users**
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

#### **teams**
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

#### **work_items** (polymorphic base)
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

#### **projects**
```prisma
model Project {
  id            String      @id @default(cuid())
  name          String
  description   String?     @db.Text
  status        ProjectStatus @default(ACTIVE)
  teamId        String?
  team          Team?       @relation(fields: [teamId], references: [id])
  startDate     DateTime?
  endDate       DateTime?
  progress      Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
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

#### **categories**
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

#### **time_logs**
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

#### **comments**
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

#### **attachments**
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

#### **daily_summaries**
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

#### **sla_policies**
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

#### **notifications**
```prisma
model Notification {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  type          NotificationType
  title         String
  message       String      @db.Text
  link          String?
  isRead        Boolean     @default(false)
  createdAt     DateTime    @default(now())
  
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

#### **activity_logs**
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

#### **milestones**
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

## 🎯 Core Features

### **Phase 1: Foundation (Weeks 1-4)**

#### 1.1 Authentication & Authorization
- Email/password login
- JWT-based sessions
- Role-based access control (ADMIN, MANAGER, AGENT, USER)
- Team-based permissions
- Password reset flow

#### 1.2 User Management
- User registration (admin only)
- Profile management
- Avatar upload
- Team assignment
- User activation/deactivation

#### 1.3 Ticket Management
- Create tickets with rich text editor
- Assign tickets to team members
- Set priority (LOW, MEDIUM, HIGH, CRITICAL)
- Set status (OPEN, IN_PROGRESS, ON_HOLD, RESOLVED, CLOSED)
- Add categories
- Due date tracking
- Ticket number auto-generation (T-0001, T-0002, etc.)

#### 1.4 Basic Task Management
- Create internal tasks
- Assign to team members
- Track status and priority
- Task number auto-generation (TASK-0001, etc.)

#### 1.5 Comments & Communication
- Add comments to tickets/tasks
- Internal vs public comments
- Mention users with @username
- Rich text formatting

#### 1.6 Time Tracking
- Start/stop timer on work items
- Manual time entry
- View time logs
- Edit/delete own time entries

#### 1.7 File Attachments
- Upload files to tickets/tasks
- Support common formats (PDF, images, docs)
- File size limit: 10MB per file
- Preview images inline

### **Phase 2: Enhanced Features (Weeks 5-8)**

#### 2.1 Advanced Dashboard
- Personal dashboard:
  - My assigned tickets/tasks
  - Current timer widget
  - Today's time summary
  - Recent activity feed
- Manager dashboard:
  - Team workload overview
  - Active timers display
  - Ticket/task metrics
  - Team performance charts

#### 2.2 Project Management
- Create projects
- Add multiple tasks to projects
- Project milestones
- Progress tracking
- Gantt chart view (optional)

#### 2.3 Daily Summaries
- End-of-day summary prompt
- List completed items
- Note in-progress work
- Report blockers
- Auto-email to manager

#### 2.4 SLA Management
- Define SLA policies per priority
- Auto-assign SLA to tickets
- SLA breach warnings
- SLA reports

#### 2.5 Automation Rules
- Auto-assignment based on category
- Auto-escalation on SLA breach
- Auto-close stale tickets
- Notification rules

#### 2.6 Email Notifications
- Ticket assigned
- Ticket updated
- Comment added
- Mention notification
- Daily summary reminder
- Weekly report

#### 2.7 Real-time Features
- Live ticket updates
- Active user indicators
- Real-time timer sync
- Toast notifications

### **Phase 3: Advanced & Integration (Weeks 9-12)**

#### 3.1 Advanced Reporting
- Ticket trends over time
- Team performance metrics
- Time distribution analysis
- Category breakdown
- SLA compliance reports
- Export to PDF/Excel

#### 3.2 Knowledge Base
- Create help articles
- Categorize articles
- Search functionality
- Public vs internal articles
- Link to tickets

#### 3.3 Moodle Integration
- SSO with Moodle (OAuth/SAML)
- User sync from Moodle
- Webhook listener for Moodle events
- Auto-create tickets from Moodle errors
- Course/enrollment issue categories

#### 3.4 Search & Filtering
- Full-text search across tickets/tasks
- Advanced filters (status, priority, assignee, date range)
- Saved filters
- Quick filters

#### 3.5 Kanban Board View
- Drag-and-drop task board
- Group by status
- Swimlanes by assignee/priority
- WIP limits per column
- Bulk actions

#### 3.6 Mobile Responsiveness
- Fully responsive design
- Touch-optimized UI
- Mobile-friendly timer
- Swipe gestures
- Progressive Web App (PWA) support

#### 3.7 User Preferences
- Custom notification settings
- Email digest preferences
- Theme customization
- Timezone settings
- Dashboard layout preferences

#### 3.8 Activity Feed
- Real-time activity stream
- Filter by user/team/type
- Infinite scroll
- Activity grouping

---

## 🔄 System Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Next.js App (Port 3000)                      │  │
│  │  - Server Components (SSR)                                │  │
│  │  - Client Components (CSR)                                │  │
│  │  - API Routes                                             │  │
│  │  - Socket.io Client                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                    NGINX REVERSE PROXY                           │
│                    (SSL Termination)                             │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      DOCKER NETWORK                              │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │   Next.js Web      │  │   BullMQ Worker    │                │
│  │   - API Routes     │  │   - Email Jobs     │                │
│  │   - Socket.io      │  │   - Report Jobs    │                │
│  │   - Auth           │  │   - Automation     │                │
│  └────────────────────┘  └────────────────────┘                │
│           ↕                        ↕                             │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │   PostgreSQL 16    │  │      Redis 7       │                │
│  │   - Prisma ORM     │  │   - Cache          │                │
│  │   - Full-text      │  │   - Sessions       │                │
│  │     Search         │  │   - Queue          │                │
│  └────────────────────┘  └────────────────────┘                │
│           ↕                                                      │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │      MinIO         │  │   Monitoring       │                │
│  │   - File Storage   │  │   - Prometheus     │                │
│  │   - S3 API         │  │   - Grafana        │                │
│  └────────────────────┘  │   - Uptime Kuma    │                │
│                          └────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  - Brevo (Email Sending)                                        │
│  - Sentry (Error Tracking)                                      │
│  - Moodle LMS (Integration)                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoints Specification

### **Authentication**
```
POST   /api/auth/login              - User login
POST   /api/auth/register           - User registration (admin only)
POST   /api/auth/logout             - User logout
POST   /api/auth/refresh            - Refresh JWT token
POST   /api/auth/forgot-password    - Request password reset
POST   /api/auth/reset-password     - Reset password with token
GET    /api/auth/session            - Get current session
```

### **Users**
```
GET    /api/users                   - List users (paginated)
GET    /api/users/:id               - Get user details
POST   /api/users                   - Create user (admin only)
PATCH  /api/users/:id               - Update user
DELETE /api/users/:id               - Delete user (admin only)
PATCH  /api/users/:id/avatar        - Upload user avatar
GET    /api/users/me                - Get current user profile
PATCH  /api/users/me                - Update current user profile
GET    /api/users/:id/activity      - Get user activity log
```

### **Teams**
```
GET    /api/teams                   - List teams
GET    /api/teams/:id               - Get team details
POST   /api/teams                   - Create team (admin only)
PATCH  /api/teams/:id               - Update team
DELETE /api/teams/:id               - Delete team (admin only)
GET    /api/teams/:id/members       - Get team members
GET    /api/teams/:id/stats         - Get team statistics
```

### **Tickets**
```
GET    /api/tickets                 - List tickets (with filters)
GET    /api/tickets/:id             - Get ticket details
POST   /api/tickets                 - Create ticket
PATCH  /api/tickets/:id             - Update ticket
DELETE /api/tickets/:id             - Delete ticket
POST   /api/tickets/:id/assign      - Assign ticket
POST   /api/tickets/:id/comments    - Add comment
GET    /api/tickets/:id/comments    - Get comments
GET    /api/tickets/:id/activity    - Get ticket activity
POST   /api/tickets/:id/attachments - Upload attachment
GET    /api/tickets/:id/attachments - Get attachments
DELETE /api/tickets/:id/attachments/:attachmentId - Delete attachment
```

### **Tasks**
```
GET    /api/tasks                   - List tasks (with filters)
GET    /api/tasks/:id               - Get task details
POST   /api/tasks                   - Create task
PATCH  /api/tasks/:id               - Update task
DELETE /api/tasks/:id               - Delete task
POST   /api/tasks/:id/assign        - Assign task
POST   /api/tasks/:id/comments      - Add comment
GET    /api/tasks/:id/comments      - Get comments
```

### **Projects**
```
GET    /api/projects                - List projects
GET    /api/projects/:id            - Get project details
POST   /api/projects                - Create project
PATCH  /api/projects/:id            - Update project
DELETE /api/projects/:id            - Delete project
GET    /api/projects/:id/tasks      - Get project tasks
POST   /api/projects/:id/milestones - Create milestone
GET    /api/projects/:id/milestones - Get milestones
```

### **Time Logs**
```
GET    /api/time-logs               - List time logs (with filters)
GET    /api/time-logs/:id           - Get time log details
POST   /api/time-logs               - Create time log
PATCH  /api/time-logs/:id           - Update time log
DELETE /api/time-logs/:id           - Delete time log
POST   /api/time-logs/start         - Start timer
POST   /api/time-logs/stop          - Stop timer
GET    /api/time-logs/active        - Get active timers
GET    /api/time-logs/summary       - Get time summary (daily/weekly)
```

### **Comments**
```
GET    /api/comments/:id            - Get comment
PATCH  /api/comments/:id            - Update comment
DELETE /api/comments/:id            - Delete comment
```

### **Categories**
```
GET    /api/categories              - List categories
GET    /api/categories/:id          - Get category
POST   /api/categories              - Create category
PATCH  /api/categories/:id          - Update category
DELETE /api/categories/:id          - Delete category
```

### **Daily Summaries**
```
GET    /api/summaries               - List daily summaries
GET    /api/summaries/:id           - Get summary details
POST   /api/summaries               - Create summary
PATCH  /api/summaries/:id           - Update summary
GET    /api/summaries/today         - Get today's summary
```

### **Reports**
```
GET    /api/reports/tickets         - Ticket reports
GET    /api/reports/tasks           - Task reports
GET    /api/reports/time            - Time tracking reports
GET    /api/reports/team            - Team performance reports
GET    /api/reports/sla             - SLA compliance reports
POST   /api/reports/export          - Export report (PDF/CSV)
```

### **Notifications**
```
GET    /api/notifications           - List notifications
PATCH  /api/notifications/:id/read  - Mark as read
PATCH  /api/notifications/read-all  - Mark all as read
DELETE /api/notifications/:id       - Delete notification
```

### **SLA Policies**
```
GET    /api/sla-policies            - List SLA policies
GET    /api/sla-policies/:id        - Get SLA policy
POST   /api/sla-policies            - Create SLA policy
PATCH  /api/sla-policies/:id        - Update SLA policy
DELETE /api/sla-policies/:id        - Delete SLA policy
```

### **Search**
```
GET    /api/search                  - Global search (tickets, tasks, users)
GET    /api/search/tickets          - Search tickets
GET    /api/search/tasks            - Search tasks
```

### **Dashboard**
```
GET    /api/dashboard/stats         - Dashboard statistics
GET    /api/dashboard/activity      - Recent activity feed
GET    /api/dashboard/team          - Team overview
```

### **Settings**
```
GET    /api/settings                - Get system settings
PATCH  /api/settings                - Update settings (admin only)
GET    /api/settings/user           - Get user preferences
PATCH  /api/settings/user           - Update user preferences
```

### **Uploads**
```
POST   /api/uploads                 - Upload file (general)
DELETE /api/uploads/:key            - Delete file
GET    /api/uploads/:key            - Get file URL
```

### **Webhooks** (Moodle Integration)
```
POST   /api/webhooks/moodle         - Receive Moodle events
GET    /api/webhooks/moodle/verify  - Webhook verification
```

---

## 🔌 WebSocket Events (Socket.io)

### **Client → Server**
```javascript
// Join room for real-time updates
socket.emit('join:ticket', { ticketId })
socket.emit('join:task', { taskId })
socket.emit('leave:ticket', { ticketId })

// Typing indicators
socket.emit('typing:start', { workItemId })
socket.emit('typing:stop', { workItemId })

// Timer events
socket.emit('timer:start', { workItemId })
socket.emit('timer:stop', { workItemId })
```

### **Server → Client**
```javascript
// Work item updates
socket.on('ticket:updated', (data) => { /* ... */ })
socket.on('task:updated', (data) => { /* ... */ })

// Comments
socket.on('comment:added', (data) => { /* ... */ })

// Typing indicators
socket.on('user:typing', (data) => { /* ... */ })

// Timer sync
socket.on('timer:updated', (data) => { /* ... */ })

// Notifications
socket.on('notification:new', (data) => { /* ... */ })

// Activity feed
socket.on('activity:new', (data) => { /* ... */ })

// User presence
socket.on('user:online', (data) => { /* ... */ })
socket.on('user:offline', (data) => { /* ... */ })
```

---

## 🐳 Docker Configuration

### **docker-compose.yml**
```yaml
version: '3.9'

services:
  web:
    build:
      context: .
      dockerfile: docker/web/Dockerfile
    container_name: seaversity-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/seaversity
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - MINIO_ENDPOINT=http://minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - BREVO_API_KEY=${BREVO_API_KEY}
      - SENTRY_DSN=${SENTRY_DSN}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    volumes:
      - ./apps/web/.next:/app/apps/web/.next
    networks:
      - seaversity-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  worker:
    build:
      context: .
      dockerfile: docker/worker/Dockerfile
    container_name: seaversity-worker
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/seaversity
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - BREVO_API_KEY=${BREVO_API_KEY}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - seaversity-network

  db:
    image: postgres:16-alpine
    container_name: seaversity-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=seaversity
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    networks:
      - seaversity-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    command:
      - "postgres"
      - "-c"
      - "max_connections=200"
      - "-c"
      - "shared_buffers=1GB"
      - "-c"
      - "effective_cache_size=3GB"
      - "-c"
      - "work_mem=16MB"
      - "-c"
      - "maintenance_work_mem=256MB"

  redis:
    image: redis:7-alpine
    container_name: seaversity-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - seaversity-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: seaversity-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    networks:
      - seaversity-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  prometheus:
    image: prom/prometheus:latest
    container_name: seaversity-prometheus
    restart: unless-stopped
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    networks:
      - seaversity-network

  grafana:
    image: grafana/grafana:latest
    container_name: seaversity-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=https://ticketing.seaversity.com/grafana
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    networks:
      - seaversity-network

  uptime-kuma:
    image: louislam/uptime-kuma:latest
    container_name: seaversity-uptime
    restart: unless-stopped
    volumes:
      - uptime_data:/app/data
    ports:
      - "3002:3001"
    networks:
      - seaversity-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  minio_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
  uptime_data:
    driver: local

networks:
  seaversity-network:
    driver: bridge
```

### **Dockerfile - Web (apps/web)**
```dockerfile
# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm --filter database prisma generate

# Build application
RUN pnpm --filter web build

# Production stage
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
```

### **Dockerfile - Worker (apps/worker)**
```dockerfile
FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy source code
COPY apps/worker ./apps/worker
COPY packages ./packages

# Generate Prisma client
RUN pnpm --filter database prisma generate

# Build worker
RUN pnpm --filter worker build

ENV NODE_ENV=production

CMD ["node", "apps/worker/dist/index.js"]
```

### **Nginx Configuration**
```nginx
# /etc/nginx/conf.d/seaversity.conf

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Upstream Next.js
upstream nextjs_backend {
    server localhost:3000;
    keepalive 64;
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name ticketing.seaversity.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ticketing.seaversity.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/ticketing.seaversity.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ticketing.seaversity.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Max upload size
    client_max_body_size 50M;
    
    # Logging
    access_log /var/log/nginx/seaversity-access.log;
    error_log /var/log/nginx/seaversity-error.log;

    # Next.js application
    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # API routes with rate limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Auth endpoints with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login_limit burst=3 nodelay;
        
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
    
    # Static files caching
    location /_next/static/ {
        proxy_pass http://nextjs_backend;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
    
    # Grafana (optional, if exposing)
    location /grafana/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔐 Environment Variables

### **.env.example**
```bash
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/seaversity"
DB_PASSWORD="your_secure_db_password"

# Redis
REDIS_URL="redis://:your_password@localhost:6379"
REDIS_PASSWORD="your_secure_redis_password"

# NextAuth
NEXTAUTH_SECRET="your_nextauth_secret_min_32_chars"
NEXTAUTH_URL="https://ticketing.seaversity.com"

# MinIO
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="your_minio_secret_key"
MINIO_BUCKET="seaversity-uploads"
MINIO_USE_SSL="false"

# Email (Brevo)
BREVO_API_KEY="your_brevo_api_key"
EMAIL_FROM="noreply@seaversity.com"
EMAIL_FROM_NAME="Seaversity Support"

# Sentry (Optional)
SENTRY_DSN="your_sentry_dsn"
SENTRY_AUTH_TOKEN="your_sentry_auth_token"

# Monitoring
GRAFANA_PASSWORD="your_grafana_password"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://ticketing.seaversity.com"
NEXT_PUBLIC_API_URL="https://ticketing.seaversity.com/api"

# Moodle Integration (Optional)
MOODLE_URL="https://your-moodle-site.com"
MOODLE_TOKEN="your_moodle_webservice_token"
MOODLE_WEBHOOK_SECRET="your_webhook_secret"

# Features flags
ENABLE_MOODLE_INTEGRATION="false"
ENABLE_EMAIL_NOTIFICATIONS="true"
ENABLE_DAILY_SUMMARIES="true"

# Rate Limiting
RATE_LIMIT_API="100"
RATE_LIMIT_WINDOW="60000"
```

---

## 🚀 Deployment Steps (Rocky Linux 9.5)

### **1. Initial Server Setup**
```bash
# Update system
sudo dnf update -y

# Install essential packages
sudo dnf install -y git vim htop curl wget firewalld

# Configure firewall
sudo systemctl enable --now firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Install Docker
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Install Nginx
sudo dnf install -y nginx
sudo systemctl enable --now nginx

# Install Certbot for SSL
sudo dnf install -y certbot python3-certbot-nginx
```

### **2. Clone Repository**
```bash
# Create application directory
sudo mkdir -p /var/www/seaversity
sudo chown $USER:$USER /var/www/seaversity

# Clone repository
cd /var/www/seaversity
git clone https://github.com/seaversity/ticketing-system.git .
```

### **3. Configure Environment**
```bash
# Copy environment file
cp .env.example .env

# Edit environment variables
vim .env

# Generate secure secrets
# For NEXTAUTH_SECRET: openssl rand -base64 32
# For DB_PASSWORD: openssl rand -base64 24
# For REDIS_PASSWORD: openssl rand -base64 24
```

### **4. SSL Certificate**
```bash
# Get SSL certificate
sudo certbot --nginx -d ticketing.seaversity.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### **5. Configure Nginx**
```bash
# Copy Nginx configuration
sudo cp docker/nginx/nginx.conf /etc/nginx/conf.d/seaversity.conf

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### **6. Build and Deploy**
```bash
# Build Docker images
docker compose build

# Start services
docker compose up -d

# Check logs
docker compose logs -f

# Run database migrations
docker compose exec web pnpm --filter database prisma migrate deploy

# Seed database with initial data
docker compose exec web pnpm --filter database prisma db seed
```

### **