import { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/ready', async (request, reply) => {
    return {
      status: 'ready',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
    };
  });
}
