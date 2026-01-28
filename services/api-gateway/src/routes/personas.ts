import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const createPersonaSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  attributes: z.record(z.any()),
  voirDireApproach: z.string().optional(),
  challengeStrategy: z.string().optional(),
});

const updatePersonaSchema = createPersonaSchema.partial();

export async function personasRoutes(server: FastifyInstance) {
  // Get all personas (system + organization-specific)
  server.get('/', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { version, archetype } = request.query as any;

      const personas = await server.prisma.persona.findMany({
        where: {
          OR: [{ organizationId }, { sourceType: 'system' }],
          ...(version && { version: parseInt(version) }),
          ...(archetype && { archetype }),
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          description: true,
          tagline: true,
          archetype: true,
          secondaryArchetype: true,
          archetypeStrength: true,
          sourceType: true,

          // NEW V2 Fields - Archetype-level
          archetypeVerdictLean: true,
          archetypeWhatTheyBelieve: true,
          archetypeDeliberationBehavior: true,
          archetypeHowToSpot: true,

          // NEW V2 Fields - Persona-specific
          instantRead: true,
          phrasesYoullHear: true,
          verdictPrediction: true,
          strikeOrKeep: true,

          // Demographics and existing fields
          demographics: true,
          dimensions: true,
          plaintiffDangerLevel: true,
          defenseDangerLevel: true,

          // Metadata
          version: true,
          isActive: true,
          createdAt: true,

          _count: {
            select: {
              jurorMappings: true,
              focusGroupPersonas: true,
            },
          },
        },
        orderBy: [{ sourceType: 'asc' }, { archetype: 'asc' }, { createdAt: 'desc' }],
      });

      return { personas };
    },
  });

  // Get a single persona
  server.get('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;

      const persona = await server.prisma.persona.findFirst({
        where: {
          id,
          OR: [{ organizationId }, { sourceType: 'system' }],
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          description: true,
          tagline: true,
          archetype: true,
          secondaryArchetype: true,
          archetypeStrength: true,
          sourceType: true,
          variant: true,

          // NEW V2 Fields - Archetype-level
          archetypeVerdictLean: true,
          archetypeWhatTheyBelieve: true,
          archetypeDeliberationBehavior: true,
          archetypeHowToSpot: true,

          // NEW V2 Fields - Persona-specific
          instantRead: true,
          phrasesYoullHear: true,
          verdictPrediction: true,
          strikeOrKeep: true,

          // Demographics and attributes
          demographics: true,
          dimensions: true,
          lifeExperiences: true,
          characteristicPhrases: true,
          voirDireResponses: true,
          deliberationBehavior: true,

          // Strategic guidance
          plaintiffDangerLevel: true,
          defenseDangerLevel: true,
          causeChallenge: true,
          strategyGuidance: true,

          // Simulation parameters
          simulationParams: true,
          caseTypeModifiers: true,

          // Metadata
          version: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,

          jurorMappings: {
            include: {
              juror: {
                include: {
                  panel: {
                    include: {
                      case: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              focusGroupPersonas: true,
            },
          },
        },
      });

      if (!persona) {
        reply.code(404);
        return { error: 'Persona not found' };
      }

      return { persona };
    },
  });

  // Create a new custom persona
  server.post('/', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId, userId } = request.user as any;
      const body = createPersonaSchema.parse(request.body as any);

      const persona = await server.prisma.persona.create({
        data: {
          ...body,
          sourceType: 'user_created',
          organizationId,
        },
      });

      reply.code(201);
      return { persona };
    },
  });

  // Update a persona
  server.patch('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;
      const body = updatePersonaSchema.parse(request.body as any);

      // Verify persona belongs to organization (can't update system personas)
      const existingPersona = await server.prisma.persona.findFirst({
        where: {
          id,
          organizationId,
          sourceType: 'user_created',
        },
      });

      if (!existingPersona) {
        reply.code(404);
        return { error: 'Persona not found or cannot be modified' };
      }

      const persona = await server.prisma.persona.update({
        where: { id },
        data: body,
      });

      return { persona };
    },
  });

  // Delete a persona
  server.delete('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;

      // Verify persona belongs to organization (can't delete system personas)
      const existingPersona = await server.prisma.persona.findFirst({
        where: {
          id,
          organizationId,
          sourceType: 'user_created',
        },
      });

      if (!existingPersona) {
        reply.code(404);
        return { error: 'Persona not found or cannot be deleted' };
      }

      await server.prisma.persona.delete({
        where: { id },
      });

      reply.code(204);
      return;
    },
  });

  // Get persona suggestions for a juror (AI-powered)
  server.post('/suggest', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId, juror: jurorData, attorneySide } = request.body as any;

      let juror: any;

      // Support two modes: database juror lookup OR direct juror data for testing
      if (jurorId) {
        // Mode 1: Database lookup (production usage)
        juror = await server.prisma.juror.findFirst({
          where: {
            id: jurorId,
            panel: {
              case: { organizationId },
            },
          },
          include: {
            researchArtifacts: true,
            panel: {
              include: {
                case: true,
              },
            },
          },
        });

        if (!juror) {
          reply.code(404);
          return { error: 'Juror not found' };
        }
      } else if (jurorData) {
        // Mode 2: Direct juror data (testing mode)
        juror = jurorData;
      } else {
        reply.code(400);
        return { error: 'Either jurorId or juror data must be provided' };
      }

      // Get available personas (system personas and org-specific) with V2 fields
      const personas = await server.prisma.persona.findMany({
        where: {
          OR: [
            { organizationId },
            { organizationId: null }, // System personas have NULL organizationId
          ],
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          archetype: true,
          archetypeVerdictLean: true,
          instantRead: true,
          phrasesYoullHear: true,
          verdictPrediction: true,
          strikeOrKeep: true,
          plaintiffDangerLevel: true,
          defenseDangerLevel: true,
          attributes: true,
          persuasionLevers: true,
          pitfalls: true,
        },
      });

      // Initialize AI service
      const { PersonaSuggesterService } = await import('../services/persona-suggester');
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        // Fallback to mock response if no API key
        server.log.warn('ANTHROPIC_API_KEY not set, using mock suggestions');
        const mockSuggestions = personas.slice(0, 3).map((persona: Record<string, unknown>) => ({
          persona,
          confidence: Math.random() * 0.3 + 0.7,
          reasoning: `Mock analysis: Based on juror demographics and profile, this persona appears to match key characteristics.`,
          keyMatches: ['Demographic alignment', 'Professional background', 'Decision-making style'],
          potentialConcerns: ['Limited research data available'],
        }));

        return { suggestions: mockSuggestions };
      }

      try {
        const suggester = new PersonaSuggesterService(apiKey);

        const suggestions = await suggester.suggestPersonas({
          juror,
          availablePersonas: personas.map((p: any) => ({
            id: p.id as string,
            name: p.name as string,
            description: p.description as string,
            attributes: (p.attributes as Record<string, unknown>) || {},
            persuasionLevers: (p.persuasionLevers as Record<string, unknown>) || {},
            pitfalls: (p.pitfalls as Record<string, unknown>) || {},
            // V2 Fields
            instantRead: p.instantRead,
            archetype: p.archetype,
            archetypeVerdictLean: p.archetypeVerdictLean,
            plaintiffDangerLevel: p.plaintiffDangerLevel,
            defenseDangerLevel: p.defenseDangerLevel,
            phrasesYoullHear: p.phrasesYoullHear,
            verdictPrediction: p.verdictPrediction,
            strikeOrKeep: p.strikeOrKeep,
          })),
          caseContext: {
            caseType: juror.panel?.case?.caseType || 'civil',
            keyIssues: [], // Could be expanded
            attorneySide: attorneySide || 'plaintiff', // NEW: Allow attorney side to be specified
          },
        });

        return { suggestions };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to generate persona suggestions' };
      }
    },
  });

  // NEW: Get all archetypes with metadata
  server.get('/archetypes', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const { organizationId } = request.user as any;

      // Get one persona per archetype to extract archetype-level data
      const archetypePersonas = await server.prisma.persona.findMany({
        where: {
          version: 2,
          isActive: true,
          sourceType: 'system',
        },
        select: {
          archetype: true,
          archetypeVerdictLean: true,
          archetypeWhatTheyBelieve: true,
          archetypeDeliberationBehavior: true,
          archetypeHowToSpot: true,
        },
        distinct: ['archetype'],
        orderBy: {
          archetype: 'asc',
        },
      });

      // Count personas per archetype
      const archetypeCounts = await server.prisma.persona.groupBy({
        by: ['archetype'],
        where: {
          version: 2,
          isActive: true,
          sourceType: 'system',
        },
        _count: {
          archetype: true,
        },
      });

      const countMap = Object.fromEntries(
        archetypeCounts.map(c => [c.archetype, c._count.archetype])
      );

      // Combine data
      const archetypes = archetypePersonas
        .filter(p => p.archetype) // Filter out null archetypes
        .map(persona => ({
          id: persona.archetype,
          display_name: formatArchetypeName(persona.archetype!),
          verdict_lean: persona.archetypeVerdictLean,
          what_they_believe: persona.archetypeWhatTheyBelieve,
          how_they_behave_in_deliberation: persona.archetypeDeliberationBehavior,
          how_to_spot_them: persona.archetypeHowToSpot,
          persona_count: countMap[persona.archetype!] || 0,
        }));

      return { archetypes };
    },
  });

  // NEW: Get all personas for a specific archetype
  server.get('/archetypes/:archetype/personas', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { archetype } = request.params as any;

      // Get archetype metadata from one persona
      const archetypeData = await server.prisma.persona.findFirst({
        where: {
          archetype,
          version: 2,
          isActive: true,
          sourceType: 'system',
        },
        select: {
          archetype: true,
          archetypeVerdictLean: true,
          archetypeWhatTheyBelieve: true,
          archetypeDeliberationBehavior: true,
          archetypeHowToSpot: true,
        },
      });

      if (!archetypeData) {
        reply.code(404);
        return { error: 'Archetype not found' };
      }

      // Get all personas for this archetype
      const personas = await server.prisma.persona.findMany({
        where: {
          archetype,
          version: 2,
          isActive: true,
          sourceType: 'system',
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          tagline: true,
          instantRead: true,
          demographics: true,
          phrasesYoullHear: true,
          verdictPrediction: true,
          strikeOrKeep: true,
          plaintiffDangerLevel: true,
          defenseDangerLevel: true,
          secondaryArchetype: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        archetype: {
          id: archetypeData.archetype,
          display_name: formatArchetypeName(archetypeData.archetype!),
          verdict_lean: archetypeData.archetypeVerdictLean,
          what_they_believe: archetypeData.archetypeWhatTheyBelieve,
          how_they_behave_in_deliberation: archetypeData.archetypeDeliberationBehavior,
          how_to_spot_them: archetypeData.archetypeHowToSpot,
        },
        personas,
      };
    },
  });
}

// Helper function to format archetype names
function formatArchetypeName(archetype: string): string {
  const nameMap: Record<string, string> = {
    bootstrapper: 'The Bootstrapper',
    crusader: 'The Crusader',
    scale_balancer: 'The Scale-Balancer',
    captain: 'The Captain',
    chameleon: 'The Chameleon',
    heart: 'The Heart',
    calculator: 'The Calculator',
    scarred: 'The Scarred',
    trojan_horse: 'The Trojan Horse',
    maverick: 'The Maverick',
  };
  return nameMap[archetype] || archetype;
}
