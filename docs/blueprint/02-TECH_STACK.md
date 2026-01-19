# Technology Stack

## Overview

The Seaversity Ticketing System uses a modern JavaScript/TypeScript stack with a monorepo architecture managed by Turborepo.

---

## Monorepo Management

| Tool | Purpose |
|------|---------|
| **Turborepo** | Fast build system with caching |
| **pnpm** | Package manager with workspaces |

---

## Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14 (App Router) | React framework with SSR/SSG |
| **TypeScript** | 5.3 | Type safety |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **shadcn/ui** | Latest | Component library |
| **Radix UI** | Latest | Accessible primitives |
| **Lucide React** | Latest | Icon library |
| **TanStack Query** | v5 | Server state management |
| **Zustand** | Latest | Client state management |
| **React Hook Form** | Latest | Form handling |
| **Zod** | Latest | Schema validation |
| **Recharts** | Latest | Data visualization |

---

## Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 14 | API endpoints |
| **Prisma** | 5.8 | ORM |
| **PostgreSQL** | 16 | Primary database |
| **Redis** | 7 | Caching & sessions |
| **BullMQ** | Latest | Job queue |
| **Socket.io** | Latest | WebSocket server |

### BullMQ Job Queue

BullMQ handles background processing for:

```
Jobs:
├── email.job.ts          # Send email notifications
├── report.job.ts         # Generate reports (PDF/Excel)
├── notification.job.ts   # Push notifications
└── automation.job.ts     # SLA checks, auto-assignment
```

**Configuration:**
- Redis-backed for persistence
- Automatic retries with exponential backoff
- Job prioritization support
- Scheduled/recurring jobs for daily summaries

---

## Authentication

| Technology | Purpose |
|------------|---------|
| **NextAuth.js v5** | Authentication framework |
| **bcrypt** | Password hashing |
| **jose** | JWT handling |

---

## File Storage - MinIO

MinIO provides S3-compatible object storage for file attachments.

### Configuration
```env
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="your_minio_secret_key"
MINIO_BUCKET="seaversity-uploads"
MINIO_USE_SSL="false"
```

### Features
- S3-compatible API
- Self-hosted (data privacy)
- Web console on port 9001
- Bucket policies for access control
- Supports presigned URLs for secure uploads

### File Limits
- Max file size: 10MB per file
- Supported formats: PDF, images, documents
- Inline image preview support

---

## Real-time - Socket.io

Socket.io enables real-time features across the application.

### Client → Server Events
```javascript
socket.emit('join:ticket', { ticketId })
socket.emit('join:task', { taskId })
socket.emit('leave:ticket', { ticketId })
socket.emit('typing:start', { workItemId })
socket.emit('typing:stop', { workItemId })
socket.emit('timer:start', { workItemId })
socket.emit('timer:stop', { workItemId })
```

### Server → Client Events
```javascript
socket.on('ticket:updated', (data) => { })
socket.on('task:updated', (data) => { })
socket.on('comment:added', (data) => { })
socket.on('user:typing', (data) => { })
socket.on('timer:updated', (data) => { })
socket.on('notification:new', (data) => { })
socket.on('activity:new', (data) => { })
socket.on('user:online', (data) => { })
socket.on('user:offline', (data) => { })
```

### Scaling
- Redis Adapter for multi-instance support
- Sticky sessions via Nginx
- Long polling fallback

---

## Email - Brevo (Sendinblue)

| Component | Purpose |
|-----------|---------|
| **Brevo API** | Email delivery service |
| **React Email** | Email template components |

### Email Templates
- `ticket-assigned.tsx` - New assignment notification
- `ticket-updated.tsx` - Status change alerts
- `daily-summary.tsx` - EOD summary prompt
- `weekly-report.tsx` - Weekly digest

---

## Monitoring & Logging

| Tool | Purpose |
|------|---------|
| **Prometheus** | Metrics collection |
| **Grafana** | Metrics visualization |
| **Sentry** | Error tracking |
| **Pino** | Structured logging |
| **Uptime Kuma** | Uptime monitoring |

---

## DevOps

| Tool | Purpose |
|------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Nginx** | Reverse proxy & SSL termination |
| **Let's Encrypt** | SSL certificates |
| **GitHub Actions** | CI/CD pipelines |

---

## Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |
| **lint-staged** | Pre-commit linting |
| **Commitlint** | Commit message linting |
