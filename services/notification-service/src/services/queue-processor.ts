import Redis from 'ioredis';
import { NotificationService } from './notification-service';
import { Notification } from '../types/notification';
import { prisma } from '@trialforge/database';

export class QueueProcessor {
  private redis: Redis;
  private notificationService: NotificationService;
  private isRunning = false;
  private pollingInterval = 1000; // 1 second

  constructor(redis: Redis, notificationService: NotificationService) {
    this.redis = redis;
    this.notificationService = notificationService;
  }

  /**
   * Start processing queues
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Queue processor is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting queue processor...');

    // Start processing both queues
    this.processInAppQueue();
    this.processEmailQueue();
  }

  /**
   * Stop processing queues
   */
  async stop(): Promise<void> {
    console.log('Stopping queue processor...');
    this.isRunning = false;
  }

  /**
   * Process in-app notification queue
   */
  private async processInAppQueue(): Promise<void> {
    while (this.isRunning) {
      try {
        const result = await this.redis.brpop('notifications:in_app:queue', 5);

        if (result) {
          const [, data] = result;
          const notification: Notification = JSON.parse(data);

          await this.deliverInAppNotification(notification);
        }
      } catch (error) {
        console.error('Error processing in-app notification:', error);
        await this.sleep(this.pollingInterval);
      }
    }
  }

  /**
   * Process email notification queue
   */
  private async processEmailQueue(): Promise<void> {
    while (this.isRunning) {
      try {
        const result = await this.redis.brpop('notifications:email:queue', 5);

        if (result) {
          const [, data] = result;
          const notification: Notification = JSON.parse(data);

          await this.deliverEmailNotification(notification);
        }
      } catch (error) {
        console.error('Error processing email notification:', error);
        await this.sleep(this.pollingInterval);
      }
    }
  }

  /**
   * Deliver in-app notification via Collaboration Service
   */
  private async deliverInAppNotification(notification: Notification): Promise<void> {
    try {
      // Send via Collaboration Service WebSocket
      const collaborationServiceUrl =
        process.env.COLLABORATION_SERVICE_URL || 'http://localhost:3003';

      // Publish to Redis for Collaboration Service to broadcast
      await this.redis.publish(
        'collaboration:events',
        JSON.stringify({
          eventType: 'notification:created',
          userId: notification.userId,
          organizationId: notification.organizationId,
          resource: {
            resourceType: 'notification',
            resourceId: notification.id,
          },
          payload: notification,
          timestamp: new Date().toISOString(),
        })
      );

      console.log(`Delivered in-app notification ${notification.id} to user ${notification.userId}`);
    } catch (error) {
      console.error(`Failed to deliver in-app notification ${notification.id}:`, error);
      // Re-queue on failure
      await this.redis.lpush('notifications:in_app:queue', JSON.stringify(notification));
    }
  }

  /**
   * Deliver email notification
   */
  private async deliverEmailNotification(notification: Notification): Promise<void> {
    try {
      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        select: { email: true, name: true },
      });

      if (!user || !user.email) {
        console.error(`User ${notification.userId} not found or has no email`);
        return;
      }

      // Send email
      const emailService = this.notificationService['emailService'];
      const html = emailService.generateNotificationEmail({
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
      });

      const text = emailService.generateNotificationText({
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
      });

      await emailService.sendEmail({
        to: user.email,
        subject: notification.title,
        html,
        text,
      });

      console.log(`Delivered email notification ${notification.id} to ${user.email}`);
    } catch (error) {
      console.error(`Failed to deliver email notification ${notification.id}:`, error);
      // Re-queue on failure (with max retry limit)
      const retryKey = `notification:${notification.id}:retries`;
      const retries = await this.redis.incr(retryKey);
      await this.redis.expire(retryKey, 3600); // 1 hour TTL

      if (retries < 3) {
        await this.redis.lpush('notifications:email:queue', JSON.stringify(notification));
      } else {
        console.error(`Max retries reached for notification ${notification.id}`);
      }
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
