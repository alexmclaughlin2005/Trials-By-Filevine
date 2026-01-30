/**
 * Voir Dire Response API Routes
 * 
 * Endpoints for recording and managing voir dire questions and responses.
 * 
 * Phase 1: Core Voir Dire Functionality
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { VoirDireResponseService } from '../services/voir-dire-response-service';
import { SignalExtractorService } from '../services/signal-extractor';
import { EnsembleMatcher } from '../services/matching/ensemble-matcher';
import { ClaudeClient } from '@juries/ai-client';

const createVoirDireResponseSchema = z.object({
  questionId: z.string().uuid().optional().nullable(),
  questionText: z.string().min(1),
  responseSummary: z.string().min(1),
  entryMethod: z.enum(['TYPED', 'VOICE_TO_TEXT', 'QUICK_SELECT']).default('TYPED'),
  responseTimestamp: z.string().datetime().optional(),
});

const updateVoirDireResponseSchema = createVoirDireResponseSchema.partial();

export async function voirDireRoutes(server: FastifyInstance) {
  const responseService = new VoirDireResponseService(server.prisma);

  // Create voir dire response
  server.post('/jurors/:jurorId/voir-dire-responses', {
    onRequest: [server.authenticate],
    schema: {
      description: 'Create a new voir dire response for a juror',
      tags: ['voir-dire'],
      params: {
        type: 'object',
        properties: {
          jurorId: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['questionText', 'responseSummary'],
        properties: {
          questionId: { type: 'string', format: 'uuid', nullable: true },
          questionText: { type: 'string' },
          responseSummary: { type: 'string' },
          entryMethod: { type: 'string', enum: ['TYPED', 'VOICE_TO_TEXT', 'QUICK_SELECT'] },
          responseTimestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId, userId } = request.user as any;
      const { jurorId } = request.params as any;
      const body = request.body as any;

      // Verify juror belongs to organization
      const juror = await server.prisma.juror.findFirst({
        where: {
          id: jurorId,
          panel: {
            case: { organizationId },
          },
        },
      });

      if (!juror) {
        reply.code(404);
        return { error: 'Juror not found' };
      }

      // Validate request body
      const validationResult = createVoirDireResponseSchema.safeParse(body);
      if (!validationResult.success) {
        reply.code(400);
        return { error: 'Invalid request body', details: validationResult.error.errors };
      }

      try {
        // Create response
        const response = await responseService.createResponse(
          jurorId,
          {
            questionId: validationResult.data.questionId || undefined,
            questionText: validationResult.data.questionText,
            responseSummary: validationResult.data.responseSummary,
            entryMethod: validationResult.data.entryMethod,
            responseTimestamp: validationResult.data.responseTimestamp
              ? new Date(validationResult.data.responseTimestamp)
              : undefined,
          },
          userId
        );

        // Extract signals and update persona matches asynchronously
        // Don't await - let it run in background
        responseService
          .extractSignalsAndUpdateMatches(response.id, organizationId)
          .catch((error) => {
            server.log.error({ error, responseId: response.id }, 'Failed to extract signals/update matches');
          });

        // Return response immediately (signals will be available on next fetch)
        return {
          success: true,
          response: {
            id: response.id,
            jurorId: response.jurorId,
            questionId: response.questionId,
            questionText: response.questionText,
            responseSummary: response.responseSummary,
            responseTimestamp: response.responseTimestamp.toISOString(),
            enteredBy: response.enteredBy,
            entryMethod: response.entryMethod,
            createdAt: response.createdAt.toISOString(),
            extractedSignals: [],
            personaImpacts: [],
          },
        };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to create voir dire response' };
      }
    },
  });

  // List voir dire responses for a juror
  server.get('/jurors/:jurorId/voir-dire-responses', {
    onRequest: [server.authenticate],
    schema: {
      description: 'Get all voir dire responses for a juror',
      tags: ['voir-dire'],
      params: {
        type: 'object',
        properties: {
          jurorId: { type: 'string', format: 'uuid' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'number', minimum: 0, default: 0 },
          orderBy: { type: 'string', enum: ['timestamp', 'created'], default: 'timestamp' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      },
    },
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId } = request.params as any;
      const { limit = 50, offset = 0, orderBy = 'timestamp', order = 'desc' } = request.query as any;

      // Verify juror belongs to organization
      const juror = await server.prisma.juror.findFirst({
        where: {
          id: jurorId,
          panel: {
            case: { organizationId },
          },
        },
      });

      if (!juror) {
        reply.code(404);
        return { error: 'Juror not found' };
      }

      try {
        const responses = await responseService.listResponses(jurorId, {
          limit: parseInt(limit),
          offset: parseInt(offset),
          orderBy: orderBy === 'timestamp' ? 'responseTimestamp' : 'createdAt',
          order: order === 'asc' ? 'asc' : 'desc',
        });

        return {
          success: true,
          responses: responses.map((r) => ({
            id: r.id,
            questionId: r.questionId,
            questionText: r.questionText,
            responseSummary: r.responseSummary,
            responseTimestamp: r.responseTimestamp.toISOString(),
            enteredBy: r.enteredBy,
            entryMethod: r.entryMethod,
            createdAt: r.createdAt.toISOString(),
            extractedSignals: r.extractedSignals.map((s) => ({
              id: s.id,
              signalId: s.signalId,
              signalName: s.signal.name,
              value: s.value,
              confidence: Number(s.confidence),
            })),
            personaImpacts: r.personaImpacts.map((p) => ({
              id: p.id,
              personaId: p.personaId,
              personaName: p.persona.name,
              probabilityDelta: Number(p.probabilityDelta),
              previousProbability: p.previousProbability ? Number(p.previousProbability) : null,
              newProbability: Number(p.newProbability),
              updatedAt: p.updatedAt.toISOString(),
            })),
          })),
          count: responses.length,
        };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to fetch voir dire responses' };
      }
    },
  });

  // Update voir dire response
  server.patch('/jurors/:jurorId/voir-dire-responses/:responseId', {
    onRequest: [server.authenticate],
    schema: {
      description: 'Update a voir dire response',
      tags: ['voir-dire'],
      params: {
        type: 'object',
        properties: {
          jurorId: { type: 'string', format: 'uuid' },
          responseId: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          questionText: { type: 'string' },
          responseSummary: { type: 'string' },
          entryMethod: { type: 'string', enum: ['TYPED', 'VOICE_TO_TEXT', 'QUICK_SELECT'] },
          responseTimestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId, responseId } = request.params as any;
      const body = request.body as any;

      // Verify response belongs to organization
      const response = await server.prisma.voirDireResponse.findFirst({
        where: {
          id: responseId,
          jurorId,
          juror: {
            panel: {
              case: { organizationId },
            },
          },
        },
      });

      if (!response) {
        reply.code(404);
        return { error: 'Voir dire response not found' };
      }

      // Validate request body
      const validationResult = updateVoirDireResponseSchema.safeParse(body);
      if (!validationResult.success) {
        reply.code(400);
        return { error: 'Invalid request body', details: validationResult.error.errors };
      }

      try {
        const updated = await responseService.updateResponse(responseId, {
          questionText: validationResult.data.questionText,
          responseSummary: validationResult.data.responseSummary,
          entryMethod: validationResult.data.entryMethod,
          responseTimestamp: validationResult.data.responseTimestamp
            ? new Date(validationResult.data.responseTimestamp)
            : undefined,
        });

        // Re-extract signals and update matches
        responseService
          .extractSignalsAndUpdateMatches(updated.id, organizationId)
          .catch((error) => {
            server.log.error({ error, responseId: updated.id }, 'Failed to re-extract signals/update matches');
          });

        // Fetch full response with relations
        const fullResponse = await responseService.getResponseWithRelations(updated.id);

        return {
          success: true,
          response: {
            id: fullResponse.id,
            jurorId: fullResponse.jurorId,
            questionId: fullResponse.questionId,
            questionText: fullResponse.questionText,
            responseSummary: fullResponse.responseSummary,
            responseTimestamp: fullResponse.responseTimestamp.toISOString(),
            enteredBy: fullResponse.enteredBy,
            entryMethod: fullResponse.entryMethod,
            createdAt: fullResponse.createdAt.toISOString(),
            extractedSignals: fullResponse.extractedSignals.map((s) => ({
              id: s.id,
              signalId: s.signalId,
              signalName: s.signal.name,
              value: s.value,
              confidence: Number(s.confidence),
            })),
            personaImpacts: fullResponse.personaImpacts.map((p) => ({
              id: p.id,
              personaId: p.personaId,
              personaName: p.persona.name,
              probabilityDelta: Number(p.probabilityDelta),
              previousProbability: p.previousProbability ? Number(p.previousProbability) : null,
              newProbability: Number(p.newProbability),
              updatedAt: p.updatedAt.toISOString(),
            })),
          },
        };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to update voir dire response' };
      }
    },
  });

  // Delete voir dire response
  server.delete('/jurors/:jurorId/voir-dire-responses/:responseId', {
    onRequest: [server.authenticate],
    schema: {
      description: 'Delete a voir dire response',
      tags: ['voir-dire'],
      params: {
        type: 'object',
        properties: {
          jurorId: { type: 'string', format: 'uuid' },
          responseId: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId, responseId } = request.params as any;

      // Verify response belongs to organization
      const response = await server.prisma.voirDireResponse.findFirst({
        where: {
          id: responseId,
          jurorId,
          juror: {
            panel: {
              case: { organizationId },
            },
          },
        },
      });

      if (!response) {
        reply.code(404);
        return { error: 'Voir dire response not found' };
      }

      try {
        await responseService.deleteResponse(responseId);
        return { success: true };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to delete voir dire response' };
      }
    },
  });
}
