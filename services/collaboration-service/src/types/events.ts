import { z } from 'zod';

// Event Types
export enum CollaborationEventType {
  // User presence
  USER_JOINED = 'user:joined',
  USER_LEFT = 'user:left',
  USER_TYPING = 'user:typing',
  USER_ACTIVE = 'user:active',

  // Case events
  CASE_UPDATED = 'case:updated',
  CASE_VIEWED = 'case:viewed',

  // Juror events
  JUROR_UPDATED = 'juror:updated',
  JUROR_RESEARCH_STARTED = 'juror:research:started',
  JUROR_RESEARCH_COMPLETED = 'juror:research:completed',

  // Focus group events
  FOCUS_GROUP_STARTED = 'focus_group:started',
  FOCUS_GROUP_COMPLETED = 'focus_group:completed',

  // Comment events
  COMMENT_ADDED = 'comment:added',
  COMMENT_UPDATED = 'comment:updated',
  COMMENT_DELETED = 'comment:deleted',

  // Notification events
  NOTIFICATION_CREATED = 'notification:created',
}

// User Presence Schema
export const UserPresenceSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string().email(),
  status: z.enum(['online', 'away', 'busy', 'offline']),
  lastActive: z.string().datetime(),
});

export type UserPresence = z.infer<typeof UserPresenceSchema>;

// Room/Resource Schema
export const ResourceSchema = z.object({
  resourceType: z.enum(['case', 'juror', 'focusGroup', 'panel']),
  resourceId: z.string(),
});

export type Resource = z.infer<typeof ResourceSchema>;

// Collaboration Event Schema
export const CollaborationEventSchema = z.object({
  eventType: z.nativeEnum(CollaborationEventType),
  userId: z.string(),
  organizationId: z.string(),
  resource: ResourceSchema,
  payload: z.record(z.any()),
  timestamp: z.string().datetime(),
});

export type CollaborationEvent = z.infer<typeof CollaborationEventSchema>;

// Typing Indicator Schema
export const TypingIndicatorSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  isTyping: z.boolean(),
});

export type TypingIndicator = z.infer<typeof TypingIndicatorSchema>;

// Socket Authentication Schema
export const SocketAuthSchema = z.object({
  token: z.string(),
});

export type SocketAuth = z.infer<typeof SocketAuthSchema>;

// Join Room Schema
export const JoinRoomSchema = z.object({
  resourceType: z.enum(['case', 'juror', 'focusGroup', 'panel']),
  resourceId: z.string(),
});

export type JoinRoom = z.infer<typeof JoinRoomSchema>;
