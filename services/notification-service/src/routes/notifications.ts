import { FastifyInstance } from 'fastify';
import { NotificationService } from '../services/notification-service';
import {
  CreateNotificationSchema,
  BatchNotificationSchema,
  NotificationPreferencesSchema,
} from '../types/notification';

interface NotificationRoutesOptions {
  notificationService: NotificationService;
}

export async function notificationRoutes(
  fastify: FastifyInstance,
  options: NotificationRoutesOptions
) {
  const { notificationService } = options;

  // Create notification
  fastify.post('/notifications', async (request, reply) => {
    const data = CreateNotificationSchema.parse(request.body);
    const notification = await notificationService.createNotification(data);
    return notification;
  });

  // Create batch notifications
  fastify.post('/notifications/batch', async (request, reply) => {
    const data = BatchNotificationSchema.parse(request.body);
    const notifications = await notificationService.createBatchNotifications(data);
    return { notifications, count: notifications.length };
  });

  // Get user notifications
  fastify.get<{
    Params: { userId: string };
    Querystring: { limit?: string; offset?: string; unreadOnly?: string };
  }>('/notifications/:userId', async (request, reply) => {
    const { userId } = request.params;
    const { limit, offset, unreadOnly } = request.query;

    const result = await notificationService.getUserNotifications(userId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      unreadOnly: unreadOnly === 'true',
    });

    return result;
  });

  // Get unread count
  fastify.get<{ Params: { userId: string } }>(
    '/notifications/:userId/unread/count',
    async (request, reply) => {
      const { userId } = request.params;
      const count = await notificationService.getUnreadCount(userId);
      return { count };
    }
  );

  // Mark notification as read
  fastify.patch<{
    Params: { userId: string; notificationId: string };
  }>('/notifications/:userId/:notificationId/read', async (request, reply) => {
    const { userId, notificationId } = request.params;
    await notificationService.markAsRead(notificationId, userId);
    return { success: true };
  });

  // Mark all as read
  fastify.patch<{ Params: { userId: string } }>(
    '/notifications/:userId/read-all',
    async (request, reply) => {
      const { userId } = request.params;
      await notificationService.markAllAsRead(userId);
      return { success: true };
    }
  );

  // Delete notification
  fastify.delete<{
    Params: { userId: string; notificationId: string };
  }>('/notifications/:userId/:notificationId', async (request, reply) => {
    const { userId, notificationId } = request.params;
    await notificationService.deleteNotification(notificationId, userId);
    return { success: true };
  });

  // Get user preferences
  fastify.get<{ Params: { userId: string } }>(
    '/notifications/:userId/preferences',
    async (request, reply) => {
      const { userId } = request.params;
      const preferences = await notificationService.getUserPreferences(userId);
      return preferences;
    }
  );

  // Update user preferences
  fastify.put<{
    Params: { userId: string };
    Body: Partial<typeof NotificationPreferencesSchema._type>;
  }>('/notifications/:userId/preferences', async (request, reply) => {
    const { userId } = request.params;
    const preferences = await notificationService.updateUserPreferences(
      userId,
      request.body
    );
    return preferences;
  });
}
