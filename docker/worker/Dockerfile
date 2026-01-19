# syntax=docker/dockerfile:1

# ============================================
# Base stage: Install dependencies
# ============================================
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.14.1 --activate

# Set working directory
WORKDIR /app

# ============================================
# Dependencies stage: Install all dependencies
# ============================================
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/typescript-config/package.json ./packages/config/typescript-config/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @seaversity/worker...

# ============================================
# Builder stage: Build the application
# ============================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules

# Copy source files
COPY . .

# Generate Prisma client
RUN pnpm --filter @seaversity/database db:generate

# Build the worker
RUN pnpm --filter @seaversity/worker build

# ============================================
# Runner stage: Production image
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

# Copy built files
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma files
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client ./node_modules/@prisma/client

# Set correct permissions
USER worker

# Start the worker
CMD ["node", "apps/worker/dist/index.js"]
