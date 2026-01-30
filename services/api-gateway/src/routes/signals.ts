/**
 * Signal Management API Routes
 * 
 * Endpoints for managing signals and extracting signals from juror data.
 * 
 * Phase 1: Foundation - Signal System & Data Models
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SignalExtractorService } from '../services/signal-extractor';

export async function signalsRoutes(server: FastifyInstance) {
  // Get all signals
  server.get('/', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { category, extractionMethod } = request.query as any;

      const where: any = {};
      if (category) {
        where.category = category;
      }
      if (extractionMethod) {
        where.extractionMethod = extractionMethod;
      }

      const signals = await server.prisma.signal.findMany({
        where,
        orderBy: {
          category: 'asc',
        },
      });

      return { signals };
    },
  });

  // Get signal by ID
  server.get('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { id } = request.params as any;

      const signal = await server.prisma.signal.findUnique({
        where: { id },
        include: {
          personaWeights: {
            include: {
              persona: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!signal) {
        reply.code(404);
        return { error: 'Signal not found' };
      }

      return { signal };
    },
  });

  // Get signals for a juror
  server.get('/jurors/:jurorId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId } = request.params as any;
      const { category } = request.query as any;

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

      const extractor = new SignalExtractorService(server.prisma);

      let signals;
      if (category) {
        signals = await extractor.getJurorSignalsByCategory(jurorId, category);
      } else {
        signals = await extractor.getJurorSignals(jurorId);
      }

      return { signals };
    },
  });

  // Extract signals from questionnaire
  server.post('/jurors/:jurorId/extract/questionnaire', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId } = request.params as any;
      const { questionnaireData } = request.body as any;

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

      if (!questionnaireData || typeof questionnaireData !== 'object') {
        reply.code(400);
        return { error: 'questionnaireData is required' };
      }

      const extractor = new SignalExtractorService(server.prisma);
      const extractedSignals = await extractor.extractFromQuestionnaire(
        jurorId,
        questionnaireData
      );

      return {
        success: true,
        extractedSignals,
        count: extractedSignals.length,
      };
    },
  });

  // Extract signals from research artifact
  server.post('/jurors/:jurorId/extract/research/:artifactId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId, artifactId } = request.params as any;

      // Verify juror and artifact belong to organization
      const artifact = await server.prisma.researchArtifact.findFirst({
        where: {
          id: artifactId,
          juror: {
            id: jurorId,
            panel: {
              case: { organizationId },
            },
          },
        },
      });

      if (!artifact) {
        reply.code(404);
        return { error: 'Research artifact not found' };
      }

      if (!artifact.rawContent) {
        reply.code(400);
        return { error: 'Research artifact has no content' };
      }

      const extractor = new SignalExtractorService(server.prisma);
      const extractedSignals = await extractor.extractFromResearchArtifact(
        jurorId,
        artifactId,
        artifact.rawContent
      );

      return {
        success: true,
        extractedSignals,
        count: extractedSignals.length,
      };
    },
  });

  // Extract signals from voir dire response
  server.post('/jurors/:jurorId/extract/voir-dire/:responseId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId, responseId } = request.params as any;

      // Verify voir dire response belongs to organization
      const response = await server.prisma.voirDireResponse.findFirst({
        where: {
          id: responseId,
          juror: {
            id: jurorId,
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

      const extractor = new SignalExtractorService(server.prisma);
      const extractedSignals = await extractor.extractFromVoirDireResponse(
        jurorId,
        responseId,
        response.responseSummary
      );

      return {
        success: true,
        extractedSignals,
        count: extractedSignals.length,
      };
    },
  });

  // Get signal categories
  server.get('/categories/list', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const categories = await server.prisma.signal.findMany({
        select: {
          category: true,
        },
        distinct: ['category'],
        orderBy: {
          category: 'asc',
        },
      });

      return {
        categories: categories.map((c) => c.category),
      };
    },
  });

  // Get extraction methods
  server.get('/extraction-methods/list', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const methods = await server.prisma.signal.findMany({
        select: {
          extractionMethod: true,
        },
        distinct: ['extractionMethod'],
        orderBy: {
          extractionMethod: 'asc',
        },
      });

      return {
        extractionMethods: methods.map((m) => m.extractionMethod),
      };
    },
  });
}
