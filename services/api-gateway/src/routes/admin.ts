import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// TODO: Add proper authentication middleware
// For now, this is open but should be protected in production

export async function adminRoutes(fastify: FastifyInstance) {
  const PROMPT_SERVICE_URL = process.env.PROMPT_SERVICE_URL || 'http://localhost:3002';

  /**
   * POST /api/admin/seed-prompts
   * Seed all required prompts in the database
   */
  fastify.post('/seed-prompts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      fastify.log.info('Triggering prompt seeding...');

      const response = await fetch(`${PROMPT_SERVICE_URL}/api/v1/admin/seed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to seed prompts');
      }

      const data = await response.json();

      return {
        success: true,
        message: 'Prompts seeded successfully',
        data,
      };
    } catch (error) {
      fastify.log.error({ error }, 'Error seeding prompts');
      return reply.status(500).send({
        success: false,
        error: 'Failed to seed prompts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/admin/seed-status
   * Check which prompts are seeded
   */
  fastify.get('/seed-status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = await fetch(`${PROMPT_SERVICE_URL}/api/v1/admin/seed/status`);

      if (!response.ok) {
        throw new Error('Failed to get seed status');
      }

      const data = await response.json();

      return data;
    } catch (error) {
      fastify.log.error({ error }, 'Error getting seed status');
      return reply.status(500).send({
        error: 'Failed to get seed status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
