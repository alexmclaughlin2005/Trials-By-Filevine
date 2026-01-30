/**
 * Matching API Routes
 * 
 * Endpoints for juror-persona matching using ensemble algorithms.
 * 
 * Phase 2: Matching Algorithms
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { EnsembleMatcher } from '../services/matching/ensemble-matcher';
import { EmbeddingScorer } from '../services/matching/embedding-scorer';
import { ClaudeClient } from '@juries/ai-client';

export async function matchingRoutes(server: FastifyInstance) {
  // Match juror against all available personas
  server.post('/jurors/:jurorId/match', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId } = request.params as any;
      const { personaIds, topN, regenerate } = request.query as any;

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
      if (personaIds) {
        // Handle both array and single string from query params
        const ids = Array.isArray(personaIds) ? personaIds : [personaIds];
        const filteredIds = ids.filter((id): id is string => typeof id === 'string' && id.length > 0);
        if (filteredIds.length > 0) {
          availablePersonaIds = filteredIds;
        } else {
          // If provided but empty/invalid, fall back to all personas
          const personas = await server.prisma.persona.findMany({
            where: {
              OR: [
                { organizationId },
                { organizationId: null }, // System personas
              ],
              isActive: true,
              version: 2, // Only V2 personas
            },
            select: { id: true },
          });
          availablePersonaIds = personas.map((p) => p.id);
        }
      } else {
        // Get all active V2 personas for organization
        const personas = await server.prisma.persona.findMany({
          where: {
            OR: [
              { organizationId },
              { organizationId: null }, // System personas
            ],
            isActive: true,
            version: 2, // Only V2 personas
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
        // Log matching request
        server.log.info(`[MATCHING] Starting match for juror ${jurorId} against ${availablePersonaIds.length} personas`);

        // Run matching
        const matches = topN
          ? await matcher.getTopMatches(jurorId, availablePersonaIds, parseInt(topN))
          : await matcher.matchJuror(jurorId, availablePersonaIds);

        // Log top matches
        if (matches.length > 0) {
          const top3 = matches.slice(0, 3).map(m => ({
            personaId: m.personaId,
            score: m.probability.toFixed(3),
            embedding: m.methodScores?.embedding?.toFixed(3) || 'N/A',
            signal: m.methodScores?.signalBased?.toFixed(3) || 'N/A',
            bayesian: m.methodScores?.bayesian?.toFixed(3) || 'N/A',
          }));
          server.log.info(`[MATCHING] Top 3 matches for juror ${jurorId}: ${JSON.stringify(top3)}`);
        }

        // Limit matches to top 5
        const limitedMatches = matches.slice(0, 5);

        // Store all top 5 matches as persistent mappings
        // If regenerating, delete existing suggested mappings (but keep confirmed ones)
        if (regenerate === 'true' || regenerate === true) {
          await server.prisma.jurorPersonaMapping.deleteMany({
            where: {
              jurorId,
              mappingType: 'suggested',
              isConfirmed: false,
            },
          });
          // Also reset primary if not confirmed
          await server.prisma.jurorPersonaMapping.deleteMany({
            where: {
              jurorId,
              mappingType: 'primary',
              isConfirmed: false,
            },
          });
        }

        // Store each match as a mapping
        for (let i = 0; i < limitedMatches.length; i++) {
          const match = limitedMatches[i];
          
          // Check if this persona already has a confirmed mapping
          const existingConfirmed = await server.prisma.jurorPersonaMapping.findFirst({
            where: {
              jurorId,
              personaId: match.personaId,
              isConfirmed: true,
            },
          });

          // Only store if not already confirmed (don't overwrite user confirmations)
          if (!existingConfirmed) {
            const mappingType = i === 0 ? 'primary' : 'suggested';
            const existing = await server.prisma.jurorPersonaMapping.findFirst({
              where: {
                jurorId,
                personaId: match.personaId,
                mappingType,
                isConfirmed: false,
              },
            });

            const matchData = {
              confidence: match.probability,
              rationale: match.rationale,
              counterfactual: match.counterfactual,
              matchRank: i + 1,
              matchDetails: {
                methodScores: match.methodScores,
                methodConfidences: match.methodConfidences,
                supportingSignals: match.supportingSignals,
                contradictingSignals: match.contradictingSignals,
              },
            };

            if (existing) {
              await server.prisma.jurorPersonaMapping.update({
                where: { id: existing.id },
                data: matchData,
              });
            } else {
              await server.prisma.jurorPersonaMapping.create({
                data: {
                  jurorId,
                  personaId: match.personaId,
                  mappingType,
                  source: 'ai_suggested',
                  ...matchData,
                },
              });
            }
          }
        }

        // Enrich matches with persona details to avoid frontend rate limiting
        const enrichedMatches = await Promise.all(
          limitedMatches.map(async (match) => {
            try {
              const persona = await server.prisma.persona.findUnique({
                where: { id: match.personaId },
                select: {
                  id: true,
                  name: true,
                  description: true,
                  archetype: true,
                },
              });
              return {
                ...match,
                personaName: persona?.name,
                personaDescription: persona?.description || undefined,
                personaArchetype: persona?.archetype || undefined,
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

      // Get persona mappings - prioritize suggested matches with matchRank
      const mappings = await server.prisma.jurorPersonaMapping.findMany({
        where: { 
          jurorId,
          OR: [
            { mappingType: 'suggested' },
            { mappingType: 'primary' },
          ],
        },
        include: {
          persona: {
            select: {
              id: true,
              name: true,
              description: true,
              archetype: true,
              instantRead: true,
            },
          },
        },
        orderBy: [
          { matchRank: 'asc' }, // Order by match rank (1-5)
          { mappingType: 'asc' }, // primary first if no rank
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

      // Convert stored mappings to EnsembleMatch format
      const matches: any[] = mappings
        .filter(m => m.matchRank !== null || m.mappingType === 'primary') // Only return ranked matches
        .map((m) => {
          const matchDetails = (m.matchDetails as any) || {};
          return {
            personaId: m.personaId,
            personaName: m.persona.name,
            personaDescription: m.persona.description || undefined,
            personaArchetype: m.persona.archetype || undefined,
            probability: Number(m.confidence),
            confidence: Number(m.confidence), // Use confidence as overall confidence for now
            rationale: m.rationale || '',
            counterfactual: m.counterfactual || '',
            methodScores: matchDetails.methodScores || {
              signalBased: 0,
              embedding: 0,
              bayesian: 0,
            },
            methodConfidences: matchDetails.methodConfidences || {
              signalBased: 0,
              embedding: 0,
              bayesian: 0,
            },
            supportingSignals: matchDetails.supportingSignals,
            contradictingSignals: matchDetails.contradictingSignals,
            mappingId: m.id,
            isConfirmed: m.isConfirmed,
            matchRank: m.matchRank,
          };
        })
        .sort((a, b) => (a.matchRank || 999) - (b.matchRank || 999)); // Sort by rank

      return {
        success: true,
        matches,
        count: matches.length,
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

  // Get embedding cache status
  server.get('/cache-status', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      try {
        const embeddingScorer = (server as any).embeddingScorer as EmbeddingScorer | undefined;
        
        if (!embeddingScorer) {
          return {
            available: false,
            message: 'Embedding scorer not initialized',
          };
        }

        const stats = embeddingScorer.getCacheStats();
        const totalPersonas = await server.prisma.persona.count({
          where: { isActive: true, version: 2 },
        });

        return {
          available: true,
          cache: {
            personaEmbeddingsCached: stats.personaEmbeddingsCached,
            totalPersonas,
            completionPercentage: totalPersonas > 0 
              ? ((stats.personaEmbeddingsCached / totalPersonas) * 100).toFixed(1)
              : '0.0',
            jurorNarrativesCached: stats.jurorNarrativesCached,
          },
        };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to get cache status' };
      }
    },
  });
}
