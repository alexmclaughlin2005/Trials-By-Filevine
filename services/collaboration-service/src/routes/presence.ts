import { FastifyInstance } from 'fastify';
import { PresenceTracker } from '../services/presence-tracker';

interface PresenceRoutesOptions {
  presenceTracker: PresenceTracker;
}

export async function presenceRoutes(
  fastify: FastifyInstance,
  options: PresenceRoutesOptions
) {
  const { presenceTracker } = options;

  // Get user presence
  fastify.get<{ Params: { userId: string } }>(
    '/presence/:userId',
    async (request, reply) => {
      const { userId } = request.params;
      const presence = await presenceTracker.getUserPresence(userId);

      if (!presence) {
        return reply.status(404).send({ error: 'User presence not found' });
      }

      return presence;
    }
  );

  // Get users viewing a resource
  fastify.get<{
    Params: { resourceType: string; resourceId: string };
  }>('/presence/:resourceType/:resourceId/viewers', async (request, reply) => {
    const { resourceType, resourceId } = request.params;
    const viewers = await presenceTracker.getUsersViewingResource(
      resourceType,
      resourceId
    );

    return { viewers };
  });

  // Get resources a user is viewing
  fastify.get<{ Params: { userId: string } }>(
    '/presence/:userId/viewing',
    async (request, reply) => {
      const { userId } = request.params;
      const resources = await presenceTracker.getResourcesUserIsViewing(userId);

      return { resources };
    }
  );

  // Get users typing in a resource
  fastify.get<{
    Params: { resourceType: string; resourceId: string };
  }>('/presence/:resourceType/:resourceId/typing', async (request, reply) => {
    const { resourceType, resourceId } = request.params;
    const typingUsers = await presenceTracker.getUsersTyping(resourceType, resourceId);

    return { typingUsers };
  });
}
