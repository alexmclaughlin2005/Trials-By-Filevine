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

      const personas = await server.prisma.persona.findMany({
        where: {
          OR: [{ organizationId }, { sourceType: 'system' }],
        },
        include: {
          _count: {
            select: {
              jurorMappings: true,
              focusGroupPersonas: true,
            },
          },
        },
        orderBy: [{ sourceType: 'asc' }, { createdAt: 'desc' }],
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
      const { jurorId, caseId } = request.body as any as any;

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
            caseType: juror.panel.case.caseType || 'civil',
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
