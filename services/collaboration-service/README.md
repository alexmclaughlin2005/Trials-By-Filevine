# Collaboration Service

Real-time collaboration service for TrialForge AI, enabling WebSocket-based communication, user presence tracking, and multi-user collaboration features.

## Features

- **Real-time WebSocket Communication**: Socket.io with Redis pub/sub for horizontal scaling
- **User Presence Tracking**: Track who's viewing what in real-time
- **Typing Indicators**: Show when users are typing in shared contexts
- **Resource Rooms**: Join/leave rooms for cases, jurors, focus groups, etc.
- **Event Broadcasting**: Publish and subscribe to collaboration events
- **Multi-instance Support**: Redis adapter for scaling across multiple instances

## Tech Stack

- **Server**: Fastify (HTTP API) + Socket.io (WebSocket)
- **Cache/Pub-Sub**: Redis with ioredis client
- **Language**: TypeScript
- **Authentication**: JWT tokens

## Architecture

### Components

1. **CollaborationManager**: Handles event publishing, broadcasting, and room management
2. **PresenceTracker**: Tracks user presence, viewing status, and typing indicators
3. **Socket Handlers**: WebSocket event handlers for real-time communication
4. **REST API**: HTTP endpoints for querying presence and session data

### Event Flow

```
Client --> Socket.io --> CollaborationManager --> Redis Pub/Sub --> All Instances --> Clients
```

### Room Structure

- **Organization Room**: `org:{organizationId}` - All users in an organization
- **Resource Rooms**: `{resourceType}:{resourceId}` - Users viewing a specific resource
  - `case:123` - Users viewing case 123
  - `juror:456` - Users viewing juror 456
  - `focusGroup:789` - Users in focus group 789

## API Endpoints

### Health

- `GET /health` - Service health check
- `GET /ready` - Readiness check

### Presence

- `GET /presence/:userId` - Get user presence status
- `GET /presence/:resourceType/:resourceId/viewers` - Get users viewing a resource
- `GET /presence/:userId/viewing` - Get resources a user is viewing
- `GET /presence/:resourceType/:resourceId/typing` - Get users typing in a resource

### Sessions

- `GET /sessions/:resourceType/:resourceId/users` - Get active users in a resource
- `GET /sessions/:resourceType/:resourceId/count` - Get active sessions count
- `GET /sessions/:sessionId/metadata` - Get session metadata
- `POST /sessions/:sessionId/metadata` - Store session metadata

## Socket.io Events

### Client to Server

- `join:room` - Join a resource room
- `leave:room` - Leave a resource room
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `heartbeat` - Keep-alive heartbeat

### Server to Client

- `collaboration:event` - Broadcast collaboration events
- `user:joined` - User joined a room
- `user:left` - User left a room
- `user:disconnected` - User disconnected
- `typing:indicator` - Typing status changed
- `room:viewers` - Current viewers in a room
- `heartbeat:ack` - Heartbeat acknowledgment

## Event Types

```typescript
enum CollaborationEventType {
  USER_JOINED = 'user:joined',
  USER_LEFT = 'user:left',
  USER_TYPING = 'user:typing',
  USER_ACTIVE = 'user:active',
  CASE_UPDATED = 'case:updated',
  CASE_VIEWED = 'case:viewed',
  JUROR_UPDATED = 'juror:updated',
  JUROR_RESEARCH_STARTED = 'juror:research:started',
  JUROR_RESEARCH_COMPLETED = 'juror:research:completed',
  FOCUS_GROUP_STARTED = 'focus_group:started',
  FOCUS_GROUP_COMPLETED = 'focus_group:completed',
  COMMENT_ADDED = 'comment:added',
  COMMENT_UPDATED = 'comment:updated',
  COMMENT_DELETED = 'comment:deleted',
  NOTIFICATION_CREATED = 'notification:created',
}
```

## Setup

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
PORT=3003
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/trialforge
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=your-jwt-secret-here
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

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

## Client Integration

### Next.js Client Example

```typescript
import { io, Socket } from 'socket.io-client';

const socket = io('http://localhost:3003', {
  auth: {
    token: 'your-jwt-token',
  },
  transports: ['websocket', 'polling'],
});

// Join a resource room
socket.emit('join:room', {
  resourceType: 'case',
  resourceId: '123',
});

// Listen for collaboration events
socket.on('collaboration:event', (event) => {
  console.log('Collaboration event:', event);
});

// Listen for users joining/leaving
socket.on('user:joined', (data) => {
  console.log('User joined:', data);
});

socket.on('user:left', (data) => {
  console.log('User left:', data);
});

// Send typing indicators
socket.emit('typing:start', {
  resourceType: 'case',
  resourceId: '123',
});

// Heartbeat
setInterval(() => {
  socket.emit('heartbeat');
}, 30000);
```

## Redis Data Structure

### Presence Keys

- `presence:{userId}` - User presence data (TTL: 5 minutes)
- `viewing:{resourceType}:{resourceId}` - Set of users viewing resource
- `user:viewing:{userId}` - Set of resources user is viewing
- `typing:{resourceType}:{resourceId}` - Set of users typing in resource
- `lastactive:{userId}` - User's last active timestamp

### Pub/Sub Channels

- `collaboration:events` - Collaboration event broadcasts
- `presence:updates` - Presence update broadcasts

### Session Keys

- `session:{sessionId}` - Session metadata (TTL: 1 hour)

## Deployment

### Railway

1. Add Redis service to Railway project
2. Deploy collaboration-service
3. Set environment variables
4. Connect to Redis service via internal URL

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

## Security

- JWT authentication required for WebSocket connections
- Organization-level data isolation
- Rate limiting on HTTP endpoints (TODO)
- CORS configuration for production
- Helmet security headers

## Monitoring

- Pino structured logging
- Health/readiness endpoints
- Redis connection monitoring
- Socket.io metrics (TODO)

## TODO

- [ ] Implement proper JWT verification
- [ ] Add rate limiting
- [ ] Add Socket.io metrics/monitoring
- [ ] Implement reconnection handling
- [ ] Add message persistence for offline users
- [ ] Add encryption for sensitive collaboration data
- [ ] Implement audit logging for collaboration events
