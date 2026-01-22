import { FastifyInstance } from 'fastify';
import { CollaborationManager } from '../services/collaboration-manager';

interface SessionRoutesOptions {
  collaborationManager: CollaborationManager;
}

export async function sessionRoutes(
  fastify: FastifyInstance,
  options: SessionRoutesOptions
) {
  const { collaborationManager } = options;

  // Get active users in a resource
  fastify.get<{
    Params: { resourceType: string; resourceId: string };
  }>('/sessions/:resourceType/:resourceId/users', async (request, reply) => {
    const { resourceType, resourceId } = request.params;
    const activeUsers = await collaborationManager.getActiveUsers(
      resourceType,
      resourceId
    );

    return { activeUsers };
  });

  // Get active sessions count
  fastify.get<{
    Params: { resourceType: string; resourceId: string };
  }>('/sessions/:resourceType/:resourceId/count', async (request, reply) => {
    const { resourceType, resourceId } = request.params;
    const count = await collaborationManager.getActiveSessionsCount(
      resourceType,
      resourceId
    );

    return { count };
  });

  // Get session metadata
  fastify.get<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId/metadata',
    async (request, reply) => {
      const { sessionId } = request.params;
      const metadata = await collaborationManager.getSessionMetadata(sessionId);

      if (!metadata) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      return metadata;
    }
  );

  // Store session metadata
  fastify.post<{
    Params: { sessionId: string };
    Body: { metadata: Record<string, any> };
  }>('/sessions/:sessionId/metadata', async (request, reply) => {
    const { sessionId } = request.params;
    const { metadata } = request.body;

    await collaborationManager.storeSessionMetadata(sessionId, metadata);

    return { success: true };
  });
}
