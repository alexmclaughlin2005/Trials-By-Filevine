import { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      service: 'collaboration-service',
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/ready', async (request, reply) => {
    // Add checks for Redis, Socket.IO, etc.
    return {
      status: 'ready',
      service: 'collaboration-service',
      timestamp: new Date().toISOString(),
    };
  });
}
