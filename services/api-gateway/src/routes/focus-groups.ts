import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FocusGroupEngineService } from '../services/focus-group-engine';

export async function focusGroupsRoutes(server: FastifyInstance) {
  // Run a focus group simulation
  server.post('/simulate', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId, argumentId, personaIds, simulationMode } = request.body as any;

      if (!caseId || !argumentId) {
        reply.code(400);
        return { error: 'caseId and argumentId are required' };
      }

      // Verify case belongs to organization
      const caseData = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
        include: {
          facts: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!caseData) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Get the argument
      const argument = await server.prisma.caseArgument.findFirst({
        where: {
          id: argumentId,
          caseId,
        },
      });

      if (!argument) {
        reply.code(404);
        return { error: 'Argument not found' };
      }

      // Get personas (specified or all active ones)
      const personas = personaIds
        ? await server.prisma.persona.findMany({
            where: {
              id: { in: personaIds },
              OR: [{ organizationId }, { sourceType: 'system' }],
            },
          })
        : await server.prisma.persona.findMany({
            where: {
              OR: [{ organizationId }, { sourceType: 'system' }],
              isActive: true,
            },
            take: 6, // Default panel size
          });

      if (personas.length === 0) {
        reply.code(400);
        return { error: 'No personas available for simulation' };
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        // Mock response
        return {
          result: {
            overallReception: 'Mock simulation - configure ANTHROPIC_API_KEY for AI-powered focus groups',
            averageSentiment: 0.6,
            personaReactions: personas.map((p) => ({
              personaId: p.id,
              personaName: p.name,
              initialReaction: `${p.name} would likely respond based on their ${(p.attributes as any)?.decisionStyle || 'mixed'} decision style`,
              sentimentScore: 0.6,
              concerns: ['Sample concern about argument clarity'],
              questions: ['Sample question about evidence'],
              persuasiveElements: ['Sample strength identified'],
              weaknesses: ['Sample weakness to address'],
              verdictLean: 'neutral',
              confidence: 0.5,
            })),
            recommendations: [
              {
                priority: 8,
                category: 'strengthen',
                title: 'Add more concrete examples',
                description: 'The argument would benefit from specific case examples',
                affectedPersonas: personas.map((p) => p.name),
              },
            ],
            strengthsToEmphasize: ['Clear narrative', 'Strong facts'],
            weaknessesToAddress: ['Some technical jargon', 'Emotional appeal needed'],
          },
        };
      }

      const engine = new FocusGroupEngineService(apiKey);

      const result = await engine.simulateFocusGroup({
        caseContext: {
          caseName: caseData.name,
          caseType: caseData.caseType || 'unknown',
          ourSide: caseData.ourSide || 'unknown',
          facts: caseData.facts.map((f) => ({
            content: f.content,
            factType: f.factType,
          })),
        },
        argument: {
          id: argument.id,
          title: argument.title,
          content: argument.content,
          argumentType: argument.argumentType,
        },
        personas: personas.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          attributes: p.attributes,
          persuasionLevers: p.persuasionLevers,
          pitfalls: p.pitfalls,
        })),
        simulationMode: simulationMode || 'detailed',
      });

      // Optionally save the focus group session
      const session = await server.prisma.focusGroupSession.create({
        data: {
          caseId,
          name: `${argument.title} - Focus Group`,
          description: `AI simulation with ${personas.length} personas`,
          panelType: 'simulated',
          argumentId,
          status: 'completed',
          createdBy: (request.user as any).id,
          completedAt: new Date(),
        },
      });

      // Save persona assignments
      for (let i = 0; i < personas.length; i++) {
        await server.prisma.focusGroupPersona.create({
          data: {
            sessionId: session.id,
            personaId: personas[i].id,
            seatNumber: i + 1,
          },
        });
      }

      // Save results
      for (const reaction of result.personaReactions) {
        await server.prisma.focusGroupResult.create({
          data: {
            sessionId: session.id,
            personaId: reaction.personaId,
            reactionSummary: reaction.initialReaction,
            sentimentScore: reaction.sentimentScore,
            concerns: reaction.concerns,
            questions: reaction.questions,
            verdictLean: reaction.verdictLean || null,
            confidence: reaction.confidence,
          },
        });
      }

      // Save recommendations
      for (const rec of result.recommendations) {
        await server.prisma.focusGroupRecommendation.create({
          data: {
            sessionId: session.id,
            recommendationType: rec.category,
            priority: rec.priority,
            title: rec.title,
            description: rec.description,
            affectedPersonas: rec.affectedPersonas,
          },
        });
      }

      return {
        sessionId: session.id,
        result,
      };
    },
  });

  // Get focus group sessions for a case
  server.get('/case/:caseId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId } = request.params as any;

      // Verify case belongs to organization
      const caseData = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!caseData) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      const sessions = await server.prisma.focusGroupSession.findMany({
        where: { caseId },
        include: {
          _count: {
            select: {
              personas: true,
              results: true,
              recommendations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { sessions };
    },
  });

  // Get focus group session details
  server.get('/:sessionId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { sessionId } = request.params as any;

      const session = await server.prisma.focusGroupSession.findFirst({
        where: {
          id: sessionId,
          case: { organizationId },
        },
        include: {
          personas: {
            include: {
              persona: true,
            },
          },
          results: true,
          recommendations: {
            orderBy: { priority: 'desc' },
          },
          case: true,
        },
      });

      if (!session) {
        reply.code(404);
        return { error: 'Focus group session not found' };
      }

      return { session };
    },
  });
}
