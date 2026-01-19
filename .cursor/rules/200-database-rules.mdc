---
description: Prisma ORM and PostgreSQL database rules
globs: 
  - "packages/database/**/*"
  - "**/*.prisma"
  - "**/prisma/**/*"
alwaysApply: false
---

# Database Rules (Prisma & PostgreSQL)

## Prisma Schema Standards

### Model Naming
- Use PascalCase singular names: `User`, `Ticket`, `WorkItem`
- Relation fields use camelCase: `assignedTickets`, `createdBy`

### Required Fields
Every model MUST have:
```prisma
id        String   @id @default(cuid())
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

### Indexing Strategy
- Always index foreign keys
- Add composite indexes for common query patterns
- Index fields used in WHERE clauses frequently

```prisma
@@index([type, status])
@@index([assigneeId])
@@index([teamId])
@@index([createdAt])
```

### Soft Deletes
- Use `isActive Boolean @default(true)` for user records
- Use `deletedAt DateTime?` for recoverable records
- Hard delete only for truly ephemeral data

## Query Patterns

### Use Transactions for Related Operations
```typescript
await prisma.$transaction([
  prisma.ticket.update({ ... }),
  prisma.activityLog.create({ ... }),
  prisma.notification.create({ ... })
])
```

### Pagination Standard
```typescript
{
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
}
```

### Select Only Needed Fields
```typescript
// Good
prisma.user.findMany({
  select: { id: true, name: true, email: true }
})

// Avoid fetching all fields unnecessarily
```

## Migration Rules
- Never edit existing migrations
- Use descriptive migration names: `add_sla_policy_to_tickets`
- Always test migrations on dev before production
- Run `prisma migrate deploy` in production (not `dev`)

## Connection Pooling
- Use PgBouncer in production
- Set `connection_limit` appropriately
- Handle connection errors gracefully

## PostgreSQL Specific
- Use `@db.Text` for long strings (descriptions, content)
- Use `@db.Date` for date-only fields
- Use `Json` type sparingly, prefer normalized tables
