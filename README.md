# Seaversity Ticketing & Work Management System

A comprehensive ticketing and work management system built with a modern TypeScript stack.

## Tech Stack

- **Monorepo:** Turborepo + pnpm
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Queue:** BullMQ
- **File Storage:** MinIO (S3-compatible)
- **Authentication:** NextAuth.js v5

## Project Structure

```
seaversity-ticketing/
├── apps/
│   ├── web/                 # Next.js frontend application
│   └── worker/              # BullMQ background job worker
├── packages/
│   ├── database/            # Prisma schema & client
│   ├── ui/                  # Shared UI components
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Shared utilities
│   ├── email-templates/     # React Email templates
│   └── config/              # Shared configurations
│       ├── eslint-config/
│       ├── typescript-config/
│       └── tailwind-config/
├── docker/                  # Docker configurations
├── scripts/                 # Utility scripts
├── monitoring/              # Prometheus & Grafana configs
└── docs/                    # Documentation
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose (for local development)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd seaversity-ticketing
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the database (requires Docker):
   ```bash
   docker-compose up -d db redis
   ```

5. Run database migrations:
   ```bash
   pnpm db:migrate
   ```

6. Start the development server:
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:3000`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript checks |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:push` | Push schema to database |
| `pnpm db:seed` | Seed the database |
| `pnpm db:studio` | Open Prisma Studio |

## Documentation

See the `docs/` directory for detailed documentation:

- [Project Overview](docs/blueprint/01-PROJECT_OVERVIEW.md)
- [Tech Stack](docs/blueprint/02-TECH_STACK.md)
- [Database Schema](docs/blueprint/03-DATABASE_SCHEMA.md)
- [System Architecture](docs/blueprint/04-SYSTEM_ARCHITECTURE.md)

## License

Private - All rights reserved.
