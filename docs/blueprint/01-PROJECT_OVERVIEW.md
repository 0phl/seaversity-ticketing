# Seaversity Ticketing System - Project Overview

## Project Information

| Field | Value |
|-------|-------|
| **Project Name** | Seaversity Ticketing System |
| **Purpose** | Enterprise ticketing and work management platform for IT and LMS teams |
| **Deployment** | Rocky Linux 9.5 with Docker |
| **Architecture** | Monorepo structure (Turborepo) |
| **Timeline** | 12-14 weeks (3 phases) |

---

## Goals & Objectives

### Primary Goals
1. Streamline IT support ticket management
2. Enable efficient task and project tracking
3. Provide real-time collaboration features
4. Integrate with Moodle LMS for automated ticket creation
5. Deliver comprehensive reporting and analytics

### Key Features
- **Ticket Management** - Create, assign, track, and resolve support tickets
- **Task Management** - Internal task tracking with Kanban boards
- **Time Tracking** - Built-in timer and manual time entry
- **SLA Management** - Automated SLA tracking and breach alerts
- **Daily Summaries** - End-of-day reporting for teams
- **Real-time Updates** - Live notifications via WebSocket

---

## Design System

### Brand Colors

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

| Usage | Font | Weight |
|-------|------|--------|
| **Primary Font** | Inter (Google Fonts) | - |
| **Headings** | Inter | 600-700 (semibold-bold) |
| **Body Text** | Inter | 400 (normal) |
| **Code/Mono** | JetBrains Mono | 400 |

---

## Team Roles

### User Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **ADMIN** | System administrator | Full access, user management, settings |
| **MANAGER** | Team manager | Team oversight, reports, assignments |
| **AGENT** | Support agent | Ticket handling, time tracking |
| **USER** | End user/requester | Create tickets, view own tickets |

### Team Structure
- Teams are the primary organizational unit
- Each team has a designated manager
- Agents belong to one team
- Tickets and tasks can be assigned to teams or individuals

---

## Success Metrics

### KPIs to Track
- Average ticket resolution time
- SLA compliance rate
- Team utilization (time tracked vs available)
- Ticket volume trends
- Customer satisfaction (if feedback implemented)

### Reporting Capabilities
- Ticket trends over time
- Team performance metrics
- Time distribution analysis
- Category breakdown
- SLA compliance reports
- Export to PDF/Excel
