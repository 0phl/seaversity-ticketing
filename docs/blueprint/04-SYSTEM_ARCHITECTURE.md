# System Architecture

## Overview

The Seaversity Ticketing System uses a monorepo architecture with Docker containerization for deployment.

---

## Architecture Diagram

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

## Monorepo File Structure

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
│   │   │   ├── app/                  # App Router pages
│   │   │   │   ├── (auth)/           # Auth route group
│   │   │   │   ├── (dashboard)/      # Dashboard route group
│   │   │   │   └── api/              # API routes
│   │   │   ├── components/           # React components
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   ├── layout/           # Layout components
│   │   │   │   ├── tickets/          # Ticket components
│   │   │   │   ├── tasks/            # Task components
│   │   │   │   ├── time-tracking/    # Timer components
│   │   │   │   ├── dashboard/        # Dashboard widgets
│   │   │   │   ├── forms/            # Form components
│   │   │   │   ├── charts/           # Chart components
│   │   │   │   └── shared/           # Shared components
│   │   │   ├── lib/                  # Utilities
│   │   │   ├── hooks/                # Custom hooks
│   │   │   ├── stores/               # Zustand stores
│   │   │   └── types/                # TypeScript types
│   │   └── package.json
│   └── worker/                       # Background job worker
│       ├── src/
│       │   ├── jobs/                 # Job definitions
│       │   └── processors/           # Job processors
│       └── package.json
├── packages/
│   ├── database/                     # Prisma schema & migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── package.json
│   ├── ui/                           # Shared UI components
│   ├── types/                        # Shared TypeScript types
│   ├── utils/                        # Shared utilities
│   ├── email-templates/              # React Email templates
│   └── config/                       # Shared configurations
│       ├── eslint-config/
│       ├── typescript-config/
│       └── tailwind-config/
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
│   │   └── provisioning/
│   └── alerts/
│       └── alert-rules.yml
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

---

## Docker Services

### Service Ports

| Service | Internal Port | External Port |
|---------|--------------|---------------|
| Web (Next.js) | 3000 | 3000 |
| PostgreSQL | 5432 | 5432 |
| Redis | 6379 | 6379 |
| MinIO (API) | 9000 | 9000 |
| MinIO (Console) | 9001 | 9001 |
| Prometheus | 9090 | 9090 |
| Grafana | 3000 | 3001 |
| Uptime Kuma | 3001 | 3002 |

### Docker Compose Services

```yaml
services:
  web:           # Next.js application
  worker:        # BullMQ background worker
  db:            # PostgreSQL 16
  redis:         # Redis 7
  minio:         # MinIO object storage
  prometheus:    # Metrics collection
  grafana:       # Metrics dashboard
  uptime-kuma:   # Uptime monitoring
```

---

## Nginx Configuration Highlights

### Rate Limiting
- API endpoints: 10 requests/second with burst of 20
- Login endpoint: 5 requests/minute with burst of 3

### SSL/TLS
- TLS 1.2 and 1.3 only
- Strong cipher suites
- HSTS enabled

### WebSocket Support
- Socket.io path: `/socket.io/`
- Connection upgrade handling
- Extended timeouts (86400s)

### Static File Caching
- `/_next/static/` cached for 365 days
- Immutable cache headers

---

## Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL
DB_PASSWORD

# Redis
REDIS_URL
REDIS_PASSWORD

# Auth
NEXTAUTH_SECRET
NEXTAUTH_URL

# MinIO
MINIO_ENDPOINT
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
MINIO_BUCKET

# Email
BREVO_API_KEY
EMAIL_FROM
EMAIL_FROM_NAME

# Monitoring
SENTRY_DSN
GRAFANA_PASSWORD
```

### Feature Flags

```env
ENABLE_MOODLE_INTEGRATION=false
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_DAILY_SUMMARIES=true
```

---

## Deployment Target

- **OS:** Rocky Linux 9.5
- **Containerization:** Docker & Docker Compose
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt (Certbot)
