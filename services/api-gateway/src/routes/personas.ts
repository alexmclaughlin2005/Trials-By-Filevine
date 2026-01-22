import { FastifyInstance } from 'fastify';
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
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;

      const personas = await server.prisma.persona.findMany({
        where: {
          OR: [{ organizationId }, { type: 'system' }],
        },
        include: {
          _count: {
            select: {
              jurorMappings: true,
              focusGroupResults: true,
            },
          },
        },
        orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
      });

      return { personas };
    },
  });

  // Get a single persona
  server.get('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { id } = request.params;

      const persona = await server.prisma.persona.findFirst({
        where: {
          id,
          OR: [{ organizationId }, { type: 'system' }],
        },
        include: {
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
              focusGroupResults: true,
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
    handler: async (request: any, reply) => {
      const { organizationId, userId } = request.user;
      const body = createPersonaSchema.parse(request.body);

      const persona = await server.prisma.persona.create({
        data: {
          ...body,
          type: 'custom',
          organizationId,
          createdBy: userId,
        },
      });

      reply.code(201);
      return { persona };
    },
  });

  // Update a persona
  server.patch('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { id } = request.params;
      const body = updatePersonaSchema.parse(request.body);

      // Verify persona belongs to organization (can't update system personas)
      const existingPersona = await server.prisma.persona.findFirst({
        where: {
          id,
          organizationId,
          type: 'custom',
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
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { id } = request.params;

      // Verify persona belongs to organization (can't delete system personas)
      const existingPersona = await server.prisma.persona.findFirst({
        where: {
          id,
          organizationId,
          type: 'custom',
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
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { jurorId, caseId } = request.body as any;

      // Verify juror belongs to organization
      const juror = await server.prisma.juror.findFirst({
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

      // Get available personas (system personas and org-specific)
      const personas = await server.prisma.persona.findMany({
        where: {
          OR: [
            { organizationId },
            { organizationId: null }, // System personas have NULL organizationId
          ],
          isActive: true,
        },
      });

      // Initialize AI service
      const { PersonaSuggesterService } = await import('../services/persona-suggester');
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        // Fallback to mock response if no API key
        server.log.warn('ANTHROPIC_API_KEY not set, using mock suggestions');
        const mockSuggestions = personas.slice(0, 3).map((persona) => ({
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
          availablePersonas: personas,
          caseContext: {
            caseType: juror.panel.case.caseType,
            keyIssues: [], // Could be expanded
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
}
