---
description: Global behavior and coding standards for Seaversity Ticketing System
globs: **/*
alwaysApply: true
---

# Core Standards

## Project Context
- **Project:** Seaversity Ticketing & Work Management System
- **Architecture:** Turborepo Monorepo
- **Runtime:** Node.js 20 (Alpine)
- **Package Manager:** pnpm

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types unless absolutely necessary
- Use interfaces for object shapes, types for unions/primitives
- Explicit return types on exported functions

### Naming Conventions
- **Files:** kebab-case (e.g., `ticket-list.tsx`, `use-timer.ts`)
- **Components:** PascalCase (e.g., `TicketCard`, `TimerWidget`)
- **Functions/Variables:** camelCase (e.g., `getTicketById`, `isActive`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `MAX_FILE_SIZE`, `API_BASE_URL`)
- **Database Models:** PascalCase singular (e.g., `User`, `Ticket`, `WorkItem`)

### File Organization
- Keep files under 300 lines when possible
- One component per file
- Co-locate related files (component + styles + tests)
- Use barrel exports (`index.ts`) for packages

## Error Handling
- Always use try-catch for async operations
- Log errors with context using Pino logger
- Return user-friendly error messages
- Track errors in Sentry for production

## Security Standards
- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user inputs with Zod
- Sanitize data before database operations
- Apply rate limiting on sensitive endpoints

## Documentation
- Add JSDoc comments for public APIs
- Include README for each package
- Document complex business logic inline
