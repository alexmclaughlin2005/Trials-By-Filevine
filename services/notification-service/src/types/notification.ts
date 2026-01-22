import { z } from 'zod';

// Notification Types
export enum NotificationType {
  // Research notifications
  RESEARCH_STARTED = 'research:started',
  RESEARCH_COMPLETED = 'research:completed',
  RESEARCH_FAILED = 'research:failed',

  // Focus group notifications
  FOCUS_GROUP_COMPLETED = 'focus_group:completed',

  // Case notifications
  CASE_ASSIGNED = 'case:assigned',
  CASE_UPDATED = 'case:updated',
  CASE_SHARED = 'case:shared',

  // Juror notifications
  JUROR_IDENTITY_MATCH = 'juror:identity:match',
  JUROR_IDENTITY_CONFLICT = 'juror:identity:conflict',

  // Collaboration notifications
  COMMENT_MENTION = 'comment:mention',
  COMMENT_REPLY = 'comment:reply',

  // System notifications
  SYSTEM_ALERT = 'system:alert',
  SYSTEM_MAINTENANCE = 'system:maintenance',
}

// Notification Priority
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Notification Channel
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  BOTH = 'both',
}

// Base Notification Schema
export const NotificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  organizationId: z.string(),
  type: z.nativeEnum(NotificationType),
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.MEDIUM),
  channel: z.nativeEnum(NotificationChannel).default(NotificationChannel.BOTH),
  title: z.string(),
  message: z.string(),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  read: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  readAt: z.string().datetime().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// Create Notification Request
export const CreateNotificationSchema = NotificationSchema.omit({
  id: true,
  read: true,
  createdAt: true,
  readAt: true
});

export type CreateNotificationRequest = z.infer<typeof CreateNotificationSchema>;

// Email Notification Schema
export const EmailNotificationSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  text: z.string().optional(),
  from: z.string().email().optional(),
  fromName: z.string().optional(),
  replyTo: z.string().email().optional(),
});

export type EmailNotification = z.infer<typeof EmailNotificationSchema>;

// Batch Notification Request
export const BatchNotificationSchema = z.object({
  userIds: z.array(z.string()),
  organizationId: z.string(),
  type: z.nativeEnum(NotificationType),
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.MEDIUM),
  channel: z.nativeEnum(NotificationChannel).default(NotificationChannel.BOTH),
  title: z.string(),
  message: z.string(),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type BatchNotificationRequest = z.infer<typeof BatchNotificationSchema>;

// Notification Preferences Schema
export const NotificationPreferencesSchema = z.object({
  userId: z.string(),
  emailEnabled: z.boolean().default(true),
  inAppEnabled: z.boolean().default(true),
  preferences: z.record(z.boolean()).optional(), // Per-notification-type preferences
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
