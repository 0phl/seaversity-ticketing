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
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY packages/database/package.json ./packages/database/
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/email-templates/package.json ./packages/email-templates/
COPY packages/config/eslint-config/package.json ./packages/config/eslint-config/
COPY packages/config/typescript-config/package.json ./packages/config/typescript-config/
COPY packages/config/tailwind-config/package.json ./packages/config/tailwind-config/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Builder stage: Build the application
# ============================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules

# Copy source files
COPY . .

# Generate Prisma client
RUN pnpm --filter @seaversity/database db:generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @seaversity/web build

# ============================================
# Runner stage: Production image
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Copy Prisma files for migrations
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.pnpm/prisma*/node_modules/prisma ./node_modules/prisma

# Set correct permissions
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start the application
CMD ["node", "apps/web/server.js"]
