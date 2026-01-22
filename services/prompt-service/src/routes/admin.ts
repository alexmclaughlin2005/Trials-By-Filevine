import { FastifyInstance } from 'fastify';
import { PromptService } from '../services/prompt-service.js';
import { z } from 'zod';

// Validation schemas
const createPromptSchema = z.object({
  serviceId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
});

const createVersionSchema = z.object({
  version: z.string(),
  systemPrompt: z.string().optional(),
  userPromptTemplate: z.string(),
  config: z.object({
    model: z.string(),
    maxTokens: z.number().int().positive(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().int().positive().optional(),
  }).passthrough(),
  variables: z.record(z.any()),
  outputSchema: z.any().optional(),
  notes: z.string().optional(),
  isDraft: z.boolean().optional(),
});

const deployVersionSchema = z.object({
  versionId: z.string().uuid(),
});

export async function adminRoutes(
  fastify: FastifyInstance,
  options: { promptService: PromptService }
) {
  const { promptService } = options;

  // TODO: Add authentication middleware here
  // fastify.addHook('preHandler', async (request, reply) => {
  //   // Verify JWT and check admin/attorney role
  // });

  /**
   * GET /api/v1/admin/prompts
   * List all prompts
   */
  fastify.get('/prompts', async (request, reply) => {
    try {
      const prompts = await promptService.listPrompts();

      return prompts.map((p) => ({
        id: p.id,
        serviceId: p.serviceId,
        name: p.name,
        description: p.description,
        category: p.category,
        currentVersionId: p.currentVersionId,
        latestVersion: p.versions[0]?.version || null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to list prompts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/admin/prompts
   * Create a new prompt
   */
  fastify.post('/prompts', async (request, reply) => {
    try {
      const body = createPromptSchema.parse(request.body);

      const prompt = await promptService.createPrompt(body);

      return prompt;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to create prompt',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/admin/prompts/:id/versions
   * Get all versions of a prompt
   */
  fastify.get('/prompts/:id/versions', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const prompt = await promptService.getPromptById(id);

      if (!prompt) {
        return reply.status(404).send({
          error: 'Prompt not found',
          id,
        });
      }

      return prompt.versions;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to get versions',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/admin/prompts/:id/versions
   * Create a new version of a prompt
   */
  fastify.post('/prompts/:id/versions', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const body = createVersionSchema.parse(request.body);

      // TODO: Get user ID from JWT
      const createdBy = 'system'; // Replace with actual user ID

      const version = await promptService.createPromptVersion({
        promptId: id,
        ...body,
        createdBy,
      });

      return version;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to create version',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/admin/prompts/:serviceId/deploy
   * Deploy a prompt version (set as current)
   */
  fastify.post('/prompts/:serviceId/deploy', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };

    try {
      const body = deployVersionSchema.parse(request.body);

      await promptService.deployPromptVersion(serviceId, body.versionId);

      return { success: true, message: 'Version deployed successfully' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to deploy version',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/admin/prompts/:serviceId/rollback
   * Rollback to a previous version
   */
  fastify.post('/prompts/:serviceId/rollback', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };

    try {
      const body = deployVersionSchema.parse(request.body);

      await promptService.deployPromptVersion(serviceId, body.versionId);

      return { success: true, message: 'Rolled back successfully' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to rollback',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
