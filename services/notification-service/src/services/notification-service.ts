import Redis from 'ioredis';
import { prisma } from '@juries/database';
import type { Notification as PrismaNotification } from '@juries/database';
import {
  Notification,
  CreateNotificationRequest,
  BatchNotificationRequest,
  NotificationChannel,
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
} from '../types/notification';
import { EmailService } from './email-service';

// Helper to transform Prisma notification to API notification format
function transformNotification(prismaNotification: PrismaNotification): Notification {
  return {
    id: prismaNotification.id,
    userId: prismaNotification.userId,
    organizationId: prismaNotification.organizationId,
    type: prismaNotification.type as NotificationType,
    priority: prismaNotification.priority as NotificationPriority,
    channel: prismaNotification.channel as NotificationChannel,
    title: prismaNotification.title,
    message: prismaNotification.message,
    actionUrl: prismaNotification.actionUrl ?? undefined,
    actionLabel: prismaNotification.actionLabel ?? undefined,
    metadata: (prismaNotification.metadata as Record<string, any>) ?? undefined,
    read: prismaNotification.read,
    createdAt: prismaNotification.createdAt.toISOString(),
    readAt: prismaNotification.readAt?.toISOString(),
  };
}

export class NotificationService {
  private redis: Redis;
  private emailService: EmailService;

  constructor(redis: Redis, emailService: EmailService) {
    this.redis = redis;
    this.emailService = emailService;
  }

  /**
   * Create a notification
   */
  async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    // Check user preferences
    const preferences = await this.getUserPreferences(request.userId);

    // Store in database
    const notification = await prisma.notification.create({
      data: {
        userId: request.userId,
        organizationId: request.organizationId,
        type: request.type,
        priority: request.priority,
        channel: request.channel,
        title: request.title,
        message: request.message,
        actionUrl: request.actionUrl,
        actionLabel: request.actionLabel,
        metadata: request.metadata as any,
        read: false,
      },
    });

    // Transform to API format
    const transformedNotification = transformNotification(notification);

    // Queue for delivery based on channel and preferences
    if (this.shouldSendInApp(request.channel, preferences)) {
      await this.queueInAppNotification(transformedNotification);
    }

    if (this.shouldSendEmail(request.channel, preferences)) {
      await this.queueEmailNotification(transformedNotification);
    }

    return transformedNotification;
  }

  /**
   * Create multiple notifications (batch)
   */
  async createBatchNotifications(
    request: BatchNotificationRequest
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const userId of request.userIds) {
      const notification = await this.createNotification({
        userId,
        organizationId: request.organizationId,
        type: request.type,
        priority: request.priority,
        channel: request.channel,
        title: request.title,
        message: request.message,
        actionUrl: request.actionUrl,
        actionLabel: request.actionLabel,
        metadata: request.metadata,
      });
      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { limit = 50, offset = 0, unreadOnly = false } = options;

    const where = {
      userId,
      ...(unreadOnly && { read: false }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map(transformNotification),
      total,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Return defaults
      return {
        userId,
        emailEnabled: true,
        inAppEnabled: true,
      };
    }

    return preferences as NotificationPreferences;
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const updated = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: preferences as any,
      create: {
        userId,
        ...preferences,
      } as any,
    });

    return updated as NotificationPreferences;
  }

  /**
   * Queue in-app notification for delivery
   */
  private async queueInAppNotification(notification: Notification): Promise<void> {
    await this.redis.lpush(
      'notifications:in_app:queue',
      JSON.stringify(notification)
    );
  }

  /**
   * Queue email notification for delivery
   */
  private async queueEmailNotification(notification: Notification): Promise<void> {
    await this.redis.lpush(
      'notifications:email:queue',
      JSON.stringify(notification)
    );
  }

  /**
   * Check if should send in-app notification
   */
  private shouldSendInApp(
    channel: NotificationChannel,
    preferences: NotificationPreferences
  ): boolean {
    return (
      preferences.inAppEnabled &&
      (channel === NotificationChannel.IN_APP || channel === NotificationChannel.BOTH)
    );
  }

  /**
   * Check if should send email notification
   */
  private shouldSendEmail(
    channel: NotificationChannel,
    preferences: NotificationPreferences
  ): boolean {
    return (
      preferences.emailEnabled &&
      (channel === NotificationChannel.EMAIL || channel === NotificationChannel.BOTH)
    );
  }
}
