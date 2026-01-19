# Moodle Integration

## Overview

The Moodle integration enables SSO authentication, user synchronization, and automatic ticket creation from LMS events. This is a **Phase 3** feature that can be enabled via feature flag.

---

## Feature Flag

```env
ENABLE_MOODLE_INTEGRATION=false  # Set to true to enable
```

---

## Integration Components

### 1. Single Sign-On (SSO)

#### OAuth/SAML Configuration
```env
MOODLE_URL="https://your-moodle-site.com"
MOODLE_TOKEN="your_moodle_webservice_token"
MOODLE_WEBHOOK_SECRET="your_webhook_secret"
```

#### Authentication Flow
```
┌──────────┐     ┌──────────────┐     ┌────────────┐
│  User    │────>│  Seaversity  │────>│   Moodle   │
│          │     │  Login Page  │     │   OAuth    │
└──────────┘     └──────────────┘     └────────────┘
                        │                    │
                        │<───────────────────│
                        │   (Token/User)     │
                        ▼
                 ┌──────────────┐
                 │   Create/    │
                 │   Update     │
                 │   User       │
                 └──────────────┘
```

### 2. User Synchronization

#### Sync Process
1. Fetch users from Moodle via Web Services API
2. Match users by email address
3. Create new users or update existing
4. Assign to appropriate team (LMS Team)
5. Set role based on Moodle role

#### Moodle to Seaversity Role Mapping

| Moodle Role | Seaversity Role |
|-------------|-----------------|
| Site Admin | ADMIN |
| Manager | MANAGER |
| Teacher | AGENT |
| Student | USER |

### 3. Webhook Listener

#### Endpoint
```
POST /api/webhooks/moodle
GET  /api/webhooks/moodle/verify
```

#### Supported Events
- `user_created` - New user registered
- `user_updated` - User profile changed
- `course_enrollment_created` - User enrolled in course
- `course_enrollment_deleted` - User unenrolled
- `grade_item_updated` - Grade changed
- `assignment_submitted` - Assignment submission
- `quiz_attempt_submitted` - Quiz completed

#### Event Processing
```typescript
// Example webhook payload
{
  "event_type": "course_enrollment_created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "user_id": 12345,
    "user_email": "student@example.com",
    "course_id": 101,
    "course_name": "Introduction to Programming",
    "role": "student"
  }
}
```

### 4. Automatic Ticket Creation

#### Trigger Events

| Moodle Event | Ticket Category | Priority |
|--------------|-----------------|----------|
| Enrollment Error | Enrollment Issues | HIGH |
| Grade Sync Failed | Grade Issues | MEDIUM |
| Quiz Access Denied | Access Issues | HIGH |
| Assignment Submit Error | Technical Issues | MEDIUM |
| Course Not Found | Course Issues | CRITICAL |

#### Auto-Created Ticket Template
```typescript
{
  type: "TICKET",
  title: `[Moodle] ${eventType}: ${courseName}`,
  description: `
    **Event:** ${eventType}
    **User:** ${userEmail}
    **Course:** ${courseName}
    **Time:** ${timestamp}
    
    **Details:**
    ${eventDetails}
  `,
  priority: determinePriority(eventType),
  category: determineCatergory(eventType),
  team: "LMS Support Team",
  source: "MOODLE_WEBHOOK"
}
```

---

## Categories for Moodle Issues

### Suggested Category Structure

```
LMS Support
├── Enrollment Issues
│   ├── Cannot Enroll
│   ├── Enrollment Not Showing
│   └── Wrong Course Access
├── Grade Issues
│   ├── Missing Grades
│   ├── Incorrect Grades
│   └── Grade Sync Problems
├── Access Issues
│   ├── Login Problems
│   ├── Course Access Denied
│   └── Content Not Loading
├── Technical Issues
│   ├── Assignment Submission
│   ├── Quiz Problems
│   └── Video Playback
└── Content Issues
    ├── Missing Materials
    ├── Broken Links
    └── Outdated Content
```

---

## API Endpoints

### Webhook Endpoints
```
POST /api/webhooks/moodle
  - Receives webhook events from Moodle
  - Validates webhook signature
  - Processes event and creates tickets

GET /api/webhooks/moodle/verify
  - Verification endpoint for Moodle
  - Returns challenge response
```

### Sync Endpoints (Admin Only)
```
POST /api/moodle/sync/users
  - Triggers full user sync from Moodle
  
GET /api/moodle/sync/status
  - Returns last sync status and timestamp

POST /api/moodle/sync/courses
  - Syncs course list for category mapping
```

---

## Security Considerations

### Webhook Verification
```typescript
// Verify webhook signature
const signature = req.headers['x-moodle-signature'];
const payload = JSON.stringify(req.body);
const expectedSignature = crypto
  .createHmac('sha256', MOODLE_WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### Token Security
- Store Moodle tokens in environment variables
- Rotate tokens periodically
- Use separate tokens for different operations
- Log all API calls for audit

### Data Privacy
- Only sync necessary user fields
- Respect Moodle privacy settings
- Allow users to opt-out of sync
- Comply with data retention policies

---

## Configuration Steps

### 1. Moodle Setup
1. Enable Web Services in Moodle
2. Create external service for Seaversity
3. Generate API token
4. Configure outgoing webhooks

### 2. Seaversity Setup
1. Set environment variables
2. Enable feature flag
3. Configure category mappings
4. Set up LMS Support team

### 3. Testing
1. Test SSO flow
2. Verify user sync
3. Test webhook delivery
4. Confirm ticket creation

---

## Monitoring

### Metrics to Track
- Webhook events received/processed
- Sync success/failure rate
- Auto-created ticket volume
- SSO login attempts

### Alerts
- Webhook processing failures
- Sync errors
- High volume of auto-tickets (potential issue)
- Authentication failures
