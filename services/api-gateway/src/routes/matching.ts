/**
 * Matching API Routes
 * 
 * Endpoints for juror-persona matching using ensemble algorithms.
 * 
 * Phase 2: Matching Algorithms
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { EnsembleMatcher } from '../services/matching/ensemble-matcher';
import { ClaudeClient } from '@juries/ai-client';

export async function matchingRoutes(server: FastifyInstance) {
  // Match juror against all available personas
  server.post('/jurors/:jurorId/match', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId } = request.params as any;
      const { personaIds, topN } = request.query as any;

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

      // Get available personas (system + org-specific)
      let availablePersonaIds: string[];
      if (personaIds && Array.isArray(personaIds)) {
        // Use provided persona IDs
        availablePersonaIds = personaIds;
      } else {
        // Get all active personas for organization
        const personas = await server.prisma.persona.findMany({
          where: {
            OR: [
              { organizationId },
              { organizationId: null }, // System personas
            ],
            isActive: true,
          },
          select: { id: true },
        });
        availablePersonaIds = personas.map((p) => p.id);
      }

      if (availablePersonaIds.length === 0) {
        reply.code(400);
        return { error: 'No personas available for matching' };
      }

      // Initialize ensemble matcher
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        reply.code(500);
        return { error: 'AI service not configured' };
      }

      const claudeClient = new ClaudeClient({ apiKey });
      const matcher = new EnsembleMatcher(server.prisma, claudeClient);

      try {
        // Run matching
        const matches = topN
          ? await matcher.getTopMatches(jurorId, availablePersonaIds, parseInt(topN))
          : await matcher.matchJuror(jurorId, availablePersonaIds);

        // Store top match as primary persona mapping (if not exists)
        if (matches.length > 0 && matches[0].probability > 0.3) {
          const topMatch = matches[0];
          // Check if mapping already exists
          const existingMapping = await server.prisma.jurorPersonaMapping.findFirst({
            where: {
              jurorId,
              personaId: topMatch.personaId,
              mappingType: 'primary',
            },
          });

          if (existingMapping) {
            // Update existing mapping
            await server.prisma.jurorPersonaMapping.update({
              where: { id: existingMapping.id },
              data: {
                confidence: topMatch.probability,
                rationale: topMatch.rationale,
                counterfactual: topMatch.counterfactual,
              },
            });
          } else {
            // Create new mapping
            await server.prisma.jurorPersonaMapping.create({
              data: {
                jurorId,
                personaId: topMatch.personaId,
                mappingType: 'primary',
                source: 'ai_suggested',
                confidence: topMatch.probability,
                rationale: topMatch.rationale,
                counterfactual: topMatch.counterfactual,
              },
            });
          }
        }

        // Enrich matches with persona details to avoid frontend rate limiting
        const enrichedMatches = await Promise.all(
          matches.map(async (match) => {
            try {
              const persona = await server.prisma.persona.findUnique({
                where: { id: match.personaId },
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              });
              return {
                ...match,
                personaName: persona?.name,
                personaDescription: persona?.description || undefined,
              };
            } catch {
              return match;
            }
          })
        );

        return {
          success: true,
          matches: enrichedMatches,
          count: enrichedMatches.length,
        };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to match juror to personas' };
      }
    },
  });

  // Get current persona matches for a juror
  server.get('/jurors/:jurorId/matches', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId } = request.params as any;
      const { includeUpdates } = request.query as any;

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

      // Get persona mappings
      const mappings = await server.prisma.jurorPersonaMapping.findMany({
        where: { jurorId },
        include: {
          persona: {
            select: {
              id: true,
              name: true,
              description: true,
              instantRead: true,
            },
          },
        },
        orderBy: [
          { mappingType: 'asc' }, // primary first
          { confidence: 'desc' },
        ],
      });

      // Get match updates if requested
      let updates: any[] = [];
      if (includeUpdates === 'true') {
        updates = await server.prisma.personaMatchUpdate.findMany({
          where: { jurorId },
          include: {
            persona: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 10, // Most recent 10 updates
        });
      }

      return {
        mappings: mappings.map((m) => ({
          id: m.id,
          personaId: m.personaId,
          personaName: m.persona.name,
          mappingType: m.mappingType,
          source: m.source,
          confidence: Number(m.confidence),
          rationale: m.rationale,
          counterfactual: m.counterfactual,
          isConfirmed: m.isConfirmed,
          confirmedBy: m.confirmedBy,
          confirmedAt: m.confirmedAt,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        })),
        updates: updates.map((u) => ({
          id: u.id,
          personaId: u.personaId,
          personaName: u.persona.name,
          probabilityDelta: Number(u.probabilityDelta),
          previousProbability: u.previousProbability
            ? Number(u.previousProbability)
            : null,
          newProbability: Number(u.newProbability),
          updatedAt: u.updatedAt,
        })),
      };
    },
  });

  // Confirm or override persona assignment
  server.post('/jurors/:jurorId/matches/:mappingId/confirm', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId, userId } = request.user as any;
      const { jurorId, mappingId } = request.params as any;
      const { action, overridePersonaId, rationale } = request.body as any;

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

      if (action === 'confirm') {
        // Confirm existing mapping
        const mapping = await server.prisma.jurorPersonaMapping.update({
          where: {
            id: mappingId,
            jurorId, // Ensure it belongs to this juror
          },
          data: {
            isConfirmed: true,
            confirmedBy: userId,
            confirmedAt: new Date(),
          },
        });

        return {
          success: true,
          mapping: {
            id: mapping.id,
            isConfirmed: mapping.isConfirmed,
            confirmedBy: mapping.confirmedBy,
            confirmedAt: mapping.confirmedAt,
          },
        };
      } else if (action === 'override' && overridePersonaId) {
        // Override with different persona
        // First, unconfirm or delete existing mapping
        await server.prisma.jurorPersonaMapping.updateMany({
          where: {
            jurorId,
            mappingType: 'primary',
            isConfirmed: true,
          },
          data: {
            isConfirmed: false,
            confirmedBy: null,
            confirmedAt: null,
          },
        });

        // Create or update override mapping
        const existingOverride = await server.prisma.jurorPersonaMapping.findFirst({
          where: {
            jurorId,
            personaId: overridePersonaId,
            mappingType: 'primary',
          },
        });

        const mapping = existingOverride
          ? await server.prisma.jurorPersonaMapping.update({
              where: { id: existingOverride.id },
              data: {
                source: 'user_assigned',
                confidence: 1.0,
                rationale: rationale || 'User override',
                isConfirmed: true,
                confirmedBy: userId,
                confirmedAt: new Date(),
              },
            })
          : await server.prisma.jurorPersonaMapping.create({
              data: {
                jurorId,
                personaId: overridePersonaId,
                mappingType: 'primary',
                source: 'user_assigned',
                confidence: 1.0,
                rationale: rationale || 'User override',
                isConfirmed: true,
                confirmedBy: userId,
                confirmedAt: new Date(),
              },
            });

        return {
          success: true,
          mapping: {
            id: mapping.id,
            personaId: mapping.personaId,
            isConfirmed: mapping.isConfirmed,
            confirmedBy: mapping.confirmedBy,
            confirmedAt: mapping.confirmedAt,
          },
        };
      } else {
        reply.code(400);
        return { error: 'Invalid action or missing overridePersonaId' };
      }
    },
  });

  // Get matching method breakdown for a juror-persona pair
  server.get('/jurors/:jurorId/personas/:personaId/breakdown', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId, personaId } = request.params as any;

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

      // Verify persona exists
      const persona = await server.prisma.persona.findFirst({
        where: {
          id: personaId,
          OR: [
            { organizationId },
            { organizationId: null },
          ],
        },
      });

      if (!persona) {
        reply.code(404);
        return { error: 'Persona not found' };
      }

      // Initialize matcher
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        reply.code(500);
        return { error: 'AI service not configured' };
      }

      const claudeClient = new ClaudeClient({ apiKey });
      const matcher = new EnsembleMatcher(server.prisma, claudeClient);

      try {
        // Run matching for this specific persona
        const matches = await matcher.matchJuror(jurorId, [personaId]);
        const match = matches.find((m) => m.personaId === personaId);

        if (!match) {
          reply.code(404);
          return { error: 'No match found for this juror-persona pair' };
        }

        return {
          jurorId,
          personaId,
          personaName: persona.name,
          overallScore: match.probability,
          overallConfidence: match.confidence,
          methodScores: match.methodScores,
          methodConfidences: match.methodConfidences,
          rationale: match.rationale,
          counterfactual: match.counterfactual,
          supportingSignals: match.supportingSignals,
          contradictingSignals: match.contradictingSignals,
        };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to generate match breakdown' };
      }
    },
  });
}
