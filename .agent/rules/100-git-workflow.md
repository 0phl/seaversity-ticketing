---
description: Automated Git commit rules for every change
globs: **/*
alwaysApply: true
---

# Git Automation Rules

- **Auto-Commit:** After creating any new file or successfully implementing a standalone feature, you MUST commit the changes.
- **Commit Format:** Use Conventional Commits: `feat(scope): description` or `fix(scope): description`.
- **Terminal Execution:** Run `git add . && git commit -m "feat: [brief description]"` automatically upon task completion. Do not ask for permission if the task is finished.

## Commit Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code formatting (no logic change)
- `refactor` - Code restructuring
- `perf` - Performance improvement
- `test` - Adding/updating tests
- `chore` - Maintenance tasks
- `ci` - CI/CD changes

## Scope Examples
- `feat(auth): add password reset flow`
- `fix(tickets): resolve SLA calculation bug`
- `feat(api): add time-logs endpoint`
- `chore(deps): update prisma to 5.8`
- `docs(readme): update deployment steps`

## Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
