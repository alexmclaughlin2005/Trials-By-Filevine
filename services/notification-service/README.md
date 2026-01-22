# Notification Service

Notification delivery service for Trials by Filevine AI, handling in-app and email notifications with queue-based processing.

## Features

- **Multi-Channel Delivery**: In-app (via Collaboration Service) and email notifications
- **Queue-Based Processing**: Redis queues for reliable delivery
- **User Preferences**: Per-user notification preferences with opt-out support
- **Priority Levels**: Low, Medium, High, Urgent priority handling
- **Batch Notifications**: Send to multiple users efficiently
- **Retry Logic**: Automatic retry on delivery failures
- **Email Templates**: Branded email templates with action buttons

## Tech Stack

- **Server**: Fastify (HTTP API)
- **Queue**: Redis with blocking pop operations
- **Email**: Resend API
- **Database**: PostgreSQL via Prisma
- **Language**: TypeScript

## Architecture

### Components

1. **NotificationService**: Core notification CRUD and preference management
2. **EmailService**: Email template generation and sending via Resend
3. **QueueProcessor**: Background worker for processing notification queues
4. **REST API**: HTTP endpoints for creating and managing notifications

### Notification Flow

```
Create Notification → Check Preferences → Queue (In-App + Email) → Background Processor → Deliver
```

### Queue Structure

- `notifications:in_app:queue` - In-app notifications (delivered via Collaboration Service)
- `notifications:email:queue` - Email notifications (sent via Resend)

## Notification Types

```typescript
enum NotificationType {
  RESEARCH_STARTED = 'research:started',
  RESEARCH_COMPLETED = 'research:completed',
  RESEARCH_FAILED = 'research:failed',
  FOCUS_GROUP_COMPLETED = 'focus_group:completed',
  CASE_ASSIGNED = 'case:assigned',
  CASE_UPDATED = 'case:updated',
  CASE_SHARED = 'case:shared',
  JUROR_IDENTITY_MATCH = 'juror:identity:match',
  JUROR_IDENTITY_CONFLICT = 'juror:identity:conflict',
  COMMENT_MENTION = 'comment:mention',
  COMMENT_REPLY = 'comment:reply',
  SYSTEM_ALERT = 'system:alert',
  SYSTEM_MAINTENANCE = 'system:maintenance',
}
```

## API Endpoints

### Notifications

- `POST /notifications` - Create a notification
- `POST /notifications/batch` - Create batch notifications for multiple users
- `GET /notifications/:userId` - Get user notifications (paginated)
- `GET /notifications/:userId/unread/count` - Get unread count
- `PATCH /notifications/:userId/:notificationId/read` - Mark as read
- `PATCH /notifications/:userId/read-all` - Mark all as read
- `DELETE /notifications/:userId/:notificationId` - Delete notification

### Preferences

- `GET /notifications/:userId/preferences` - Get user preferences
- `PUT /notifications/:userId/preferences` - Update preferences

### Health

- `GET /health` - Service health check
- `GET /ready` - Readiness check

## Setup

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
PORT=3004
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/trialforge
REDIS_HOST=localhost
REDIS_PORT=6379
RESEND_API_KEY=your-resend-api-key
COLLABORATION_SERVICE_URL=http://localhost:3003
JWT_SECRET=your-jwt-secret-here
CORS_ORIGIN=http://localhost:3000
DEFAULT_FROM_EMAIL=notifications@trialforge.ai
DEFAULT_FROM_NAME=Trials by Filevine AI
```

### Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your sending domain
3. Generate an API key
4. Add to `.env` as `RESEND_API_KEY`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Usage Examples

### Create Notification

```typescript
POST /notifications
{
  "userId": "user-123",
  "organizationId": "org-456",
  "type": "research:completed",
  "priority": "high",
  "channel": "both",
  "title": "Juror Research Completed",
  "message": "Research for John Doe is ready for review",
  "actionUrl": "https://app.trialforge.ai/jurors/789",
  "actionLabel": "View Results"
}
```

### Batch Notification

```typescript
POST /notifications/batch
{
  "userIds": ["user-123", "user-456", "user-789"],
  "organizationId": "org-456",
  "type": "case:updated",
  "title": "Case Updated",
  "message": "Case Smith v. Jones has been updated",
  "channel": "in_app"
}
```

### Get Notifications

```typescript
GET /notifications/user-123?limit=20&offset=0&unreadOnly=true
```

### Update Preferences

```typescript
PUT /notifications/user-123/preferences
{
  "emailEnabled": false,
  "inAppEnabled": true,
  "preferences": {
    "research:completed": true,
    "case:updated": false
  }
}
```

## Integration with Other Services

### Collaboration Service

In-app notifications are delivered via the Collaboration Service WebSocket:

1. Notification is created and queued
2. Queue processor publishes to Redis `collaboration:events` channel
3. Collaboration Service broadcasts to connected clients
4. User receives real-time notification

### API Gateway / Other Services

Other services create notifications via HTTP API:

```typescript
// From API Gateway or other service
await fetch('http://notification-service:3004/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-123',
    organizationId: 'org-456',
    type: 'research:completed',
    title: 'Research Complete',
    message: 'Your research results are ready',
  }),
});
```

## Database Schema

Required Prisma models:

```prisma
model Notification {
  id             String            @id @default(cuid())
  userId         String
  organizationId String
  type           String
  priority       String            @default("medium")
  channel        String            @default("both")
  title          String
  message        String
  actionUrl      String?
  actionLabel    String?
  metadata       Json?
  read           Boolean           @default(false)
  readAt         DateTime?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  user           User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([userId, read])
  @@index([organizationId])
  @@index([createdAt])
}

model NotificationPreferences {
  id           String   @id @default(cuid())
  userId       String   @unique
  emailEnabled Boolean  @default(true)
  inAppEnabled Boolean  @default(true)
  preferences  Json?    @default("{}")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Queue Processing

The `QueueProcessor` runs as a background worker:

- **In-App Queue**: Processes notifications for WebSocket delivery
- **Email Queue**: Sends emails via Resend API
- **Retry Logic**: Up to 3 retries on failure
- **Blocking Pop**: Uses `BRPOP` for efficient queue processing

## Email Templates

Email notifications use responsive HTML templates with:

- Branded header with Trials by Filevine AI logo
- Clear title and message
- Optional action button linking to the app
- Footer with sender information

## Security

- JWT authentication required for API endpoints
- Organization-level data isolation
- User can only access their own notifications
- Rate limiting recommended for production

## Monitoring

- Pino structured logging
- Health/readiness endpoints
- Queue depth monitoring (TODO)
- Email delivery tracking (TODO)

## Deployment

### Railway

1. Deploy notification-service
2. Add Redis service
3. Configure Resend API key
4. Set environment variables
5. Connect to Collaboration Service

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

## TODO

- [ ] Add rate limiting for notification creation
- [ ] Implement notification batching for efficiency
- [ ] Add queue depth monitoring and alerts
- [ ] Track email delivery status via webhooks
- [ ] Add notification templates system
- [ ] Implement notification scheduling
- [ ] Add push notification support (mobile)
- [ ] Create admin dashboard for notification analytics
