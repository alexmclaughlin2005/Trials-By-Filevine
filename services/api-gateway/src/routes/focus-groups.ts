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
            personaReactions: personas.map((p: Record<string, unknown>) => ({
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
                affectedPersonas: personas.map((p: Record<string, unknown>) => p.name as string),
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
          facts: caseData.facts.map((f: Record<string, unknown>) => ({
            content: f.content as string,
            factType: f.factType as string,
          })),
        },
        argument: {
          id: argument.id,
          title: argument.title,
          content: argument.content,
          argumentType: argument.argumentType,
        },
        personas: personas.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
          description: p.description as string,
          attributes: p.attributes as Record<string, unknown>,
          persuasionLevers: p.persuasionLevers as Record<string, unknown>,
          pitfalls: p.pitfalls as Record<string, unknown>,
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
          createdBy: (request.user as any).userId,
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

  // ============================================
  // NEW: Focus Group Configuration Routes
  // ============================================

  // Create a new focus group session (initial setup)
  server.post('/sessions', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId, userId } = request.user as any;
      const { caseId, name, description } = request.body as any;

      if (!caseId) {
        reply.code(400);
        return { error: 'caseId is required' };
      }

      // Verify case belongs to organization
      const caseData = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!caseData) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Create new session in draft state
      const session = await server.prisma.focusGroupSession.create({
        data: {
          caseId,
          name: name || `Focus Group - ${new Date().toLocaleDateString()}`,
          description: description || null,
          panelType: 'custom',
          status: 'draft',
          configurationStep: 'setup',
          archetypeSelectionMode: 'random',
          archetypeCount: 6,
          createdBy: userId,
        },
      });

      return { session };
    },
  });

  // Update focus group configuration
  server.patch('/sessions/:sessionId/config', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { sessionId } = request.params as any;
      const {
        name,
        description,
        archetypeSelectionMode,
        selectedArchetypes,
        archetypeCount,
        selectedArguments,
        customQuestions,
        configurationStep,
      } = request.body as any;

      // Verify session exists and belongs to organization
      const existingSession = await server.prisma.focusGroupSession.findFirst({
        where: {
          id: sessionId,
          case: { organizationId },
        },
      });

      if (!existingSession) {
        reply.code(404);
        return { error: 'Focus group session not found' };
      }

      // Can only update configuration if session is in draft
      if (existingSession.status !== 'draft') {
        reply.code(400);
        return { error: 'Cannot update configuration of non-draft session' };
      }

      // Update session
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (archetypeSelectionMode !== undefined)
        updateData.archetypeSelectionMode = archetypeSelectionMode;
      if (selectedArchetypes !== undefined) updateData.selectedArchetypes = selectedArchetypes;
      if (archetypeCount !== undefined) updateData.archetypeCount = archetypeCount;
      if (selectedArguments !== undefined) updateData.selectedArguments = selectedArguments;
      if (customQuestions !== undefined) updateData.customQuestions = customQuestions;
      if (configurationStep !== undefined) updateData.configurationStep = configurationStep;

      const session = await server.prisma.focusGroupSession.update({
        where: { id: sessionId },
        data: updateData,
      });

      return { session };
    },
  });

  // Start focus group simulation
  server.post('/sessions/:sessionId/start', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { sessionId } = request.params as any;

      // Get session with full details
      const session = await server.prisma.focusGroupSession.findFirst({
        where: {
          id: sessionId,
          case: { organizationId },
        },
        include: {
          case: {
            include: {
              facts: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      });

      if (!session) {
        reply.code(404);
        return { error: 'Focus group session not found' };
      }

      if (session.status !== 'draft') {
        reply.code(400);
        return { error: 'Session has already been started' };
      }

      // Validate configuration
      if (!session.selectedArguments || (session.selectedArguments as any[]).length === 0) {
        reply.code(400);
        return { error: 'No arguments selected for focus group' };
      }

      // Update session status
      await server.prisma.focusGroupSession.update({
        where: { id: sessionId },
        data: {
          status: 'running',
          startedAt: new Date(),
          configurationStep: 'ready',
        },
      });

      return {
        message: 'Focus group simulation started',
        sessionId: session.id,
      };
    },
  });

  // Get available archetypes for panel configuration
  server.get('/archetypes', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId } = request.query as any;

      // If caseId provided, get archetypes from case jurors
      if (caseId) {
        const caseData = await server.prisma.case.findFirst({
          where: { id: caseId, organizationId },
        });

        if (!caseData) {
          reply.code(404);
          return { error: 'Case not found' };
        }

        // Get classified jurors from case
        const jurors = await server.prisma.juror.findMany({
          where: {
            panel: {
              caseId,
            },
            classifiedArchetype: {
              not: null,
            },
          },
          select: {
            classifiedArchetype: true,
            archetypeConfidence: true,
            firstName: true,
            lastName: true,
          },
        });

        // Extract unique archetypes with juror info
        const archetypes = jurors.map((juror) => ({
          name: juror.classifiedArchetype!,
          confidence: juror.archetypeConfidence
            ? parseFloat(juror.archetypeConfidence.toString())
            : 0,
          jurorName: `${juror.firstName} ${juror.lastName}`,
        }));

        return { archetypes, source: 'case_jurors' };
      }

      // Otherwise return system archetypes (from archetype config)
      const archetypeConfigs = await server.prisma.archetypeConfig.findMany({
        where: {
          isActive: true,
          configType: 'system',
        },
      });

      const archetypes = archetypeConfigs.map((config) => ({
        name: config.archetypeName,
        description: config.description,
        category: config.category,
      }));

      return { archetypes, source: 'system' };
    },
  });

  // Delete focus group session
  server.delete('/sessions/:sessionId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { sessionId } = request.params as any;

      const session = await server.prisma.focusGroupSession.findFirst({
        where: {
          id: sessionId,
          case: { organizationId },
        },
      });

      if (!session) {
        reply.code(404);
        return { error: 'Focus group session not found' };
      }

      // Can only delete draft sessions
      if (session.status !== 'draft') {
        reply.code(400);
        return { error: 'Cannot delete non-draft session' };
      }

      await server.prisma.focusGroupSession.delete({
        where: { id: sessionId },
      });

      return { message: 'Focus group session deleted' };
    },
  });
}
