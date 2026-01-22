import { FastifyInstance } from 'fastify';
import { PromptService } from '../services/prompt-service.js';
import { z } from 'zod';

// Validation schemas
const renderPromptSchema = z.object({
  variables: z.record(z.any()),
  version: z.string().optional().default('latest'),
  abTestEnabled: z.boolean().optional().default(true),
});

const trackResultSchema = z.object({
  versionId: z.string().uuid(),
  abTestId: z.string().uuid().optional(),
  success: z.boolean(),
  tokensUsed: z.number().int().optional(),
  latencyMs: z.number().int().optional(),
  confidence: z.number().min(0).max(1).optional(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function promptRoutes(
  fastify: FastifyInstance,
  options: { promptService: PromptService }
) {
  const { promptService } = options;

  /**
   * GET /api/v1/prompts/:serviceId
   * Get prompt metadata
   */
  fastify.get('/:serviceId', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };

    try {
      const prompt = await promptService.getPrompt(serviceId);

      if (!prompt) {
        return reply.status(404).send({
          error: 'Prompt not found',
          serviceId,
        });
      }

      return {
        id: prompt.id,
        serviceId: prompt.serviceId,
        name: prompt.name,
        description: prompt.description,
        category: prompt.category,
        currentVersionId: prompt.currentVersionId,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to get prompt',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/prompts/:serviceId/render
   * Render a prompt with variables
   */
  fastify.post('/:serviceId/render', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };

    try {
      const body = renderPromptSchema.parse(request.body);

      const rendered = await promptService.renderPrompt(
        serviceId,
        body.variables,
        body.version,
        body.abTestEnabled
      );

      return rendered;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to render prompt',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/prompts/:serviceId/results
   * Track prompt execution result
   */
  fastify.post('/:serviceId/results', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };

    try {
      const body = trackResultSchema.parse(request.body);

      await promptService.trackResult(serviceId, body);

      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to track result',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/prompts/:serviceId/versions/:versionId/analytics
   * Get analytics for a prompt version
   */
  fastify.get('/:serviceId/versions/:versionId/analytics', async (request, reply) => {
    const { versionId } = request.params as { versionId: string };
    const { limit } = request.query as { limit?: string };

    try {
      const analytics = await promptService.getAnalytics(
        versionId,
        limit ? parseInt(limit, 10) : undefined
      );

      // Calculate aggregates
      const total = analytics.length;
      const successful = analytics.filter((a) => a.success).length;
      const avgTokens =
        analytics.reduce((sum, a) => sum + (a.tokensUsed || 0), 0) / total || 0;
      const avgLatency =
        analytics.reduce((sum, a) => sum + (a.latencyMs || 0), 0) / total || 0;
      const avgConfidence =
        analytics.reduce((sum, a) => sum + (a.confidence || 0), 0) / total || 0;

      return {
        versionId,
        total,
        successRate: total > 0 ? successful / total : 0,
        avgTokens: Math.round(avgTokens),
        avgLatencyMs: Math.round(avgLatency),
        avgConfidence: avgConfidence,
        recent: analytics.slice(0, 10), // Last 10 executions
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to get analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
