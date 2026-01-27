import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FocusGroupEngineService } from '../services/focus-group-engine';
import { FocusGroupQuestionGeneratorService } from '../services/focus-group-question-generator';
import { ConversationOrchestrator, StatementAnalyzer } from '../services/roundtable';
import { TakeawaysGenerator } from '../services/roundtable/takeaways-generator';
import { PromptClient } from '@juries/prompt-client';

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

      // Map database fields to new API field names
      const mappedSessions = sessions.map((session) => ({
        ...session,
        panelSelectionMode: session.archetypeSelectionMode,
        selectedPersonas: session.selectedArchetypes,
        panelSize: session.archetypeCount,
      }));

      return { sessions: mappedSessions };
    },
  });

  // Get recent focus group sessions across all cases
  server.get('/recent', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { limit = '50', caseId, status } = request.query as any;

      // Build where clause with optional filters
      const where: any = {
        case: { organizationId },
      };

      if (caseId) {
        where.caseId = caseId;
      }

      if (status) {
        where.status = status;
      }

      const sessions = await server.prisma.focusGroupSession.findMany({
        where,
        include: {
          case: {
            select: {
              id: true,
              name: true,
              caseNumber: true,
              caseType: true,
              status: true,
            },
          },
          _count: {
            select: {
              personas: true,
              results: true,
              recommendations: true,
            },
          },
        },
        orderBy: [
          { completedAt: 'desc' },
          { updatedAt: 'desc' },
        ],
        take: parseInt(limit, 10),
      });

      // Map database fields to new API field names
      const mappedSessions = sessions.map((session) => ({
        ...session,
        panelSelectionMode: session.archetypeSelectionMode,
        selectedPersonas: session.selectedArchetypes,
        panelSize: session.archetypeCount,
      }));

      return { sessions: mappedSessions };
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

      // Map database fields to new API field names
      const mappedSession = {
        ...session,
        panelSelectionMode: session.archetypeSelectionMode,
        selectedPersonas: session.selectedArchetypes,
        panelSize: session.archetypeCount,
      };

      return { session: mappedSession };
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

      // Return with new field names for frontend
      return {
        session: {
          ...session,
          panelSelectionMode: session.archetypeSelectionMode,
          selectedPersonas: session.selectedArchetypes,
          panelSize: session.archetypeCount,
        },
      };
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
        // Support both old and new field names for backward compatibility
        archetypeSelectionMode,
        panelSelectionMode,
        selectedArchetypes,
        selectedPersonas,
        archetypeCount,
        panelSize,
        selectedArguments,
        customQuestions,
        configurationStep,
      } = request.body as any;

      // Use new field names if provided, otherwise fall back to old names
      const selectionMode = panelSelectionMode || archetypeSelectionMode;
      const personas = selectedPersonas || selectedArchetypes;
      const size = panelSize || archetypeCount;

      console.log('[PATCH /sessions/:sessionId/config] Received:', {
        sessionId,
        selectionMode,
        personas,
        personasLength: personas?.length,
        size,
      });

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

      // Update session (map new field names to database column names)
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (selectionMode !== undefined)
        updateData.archetypeSelectionMode = selectionMode;
      if (personas !== undefined) updateData.selectedArchetypes = personas;
      if (size !== undefined) updateData.archetypeCount = size;
      if (selectedArguments !== undefined) updateData.selectedArguments = selectedArguments;
      if (customQuestions !== undefined) updateData.customQuestions = customQuestions;
      if (configurationStep !== undefined) updateData.configurationStep = configurationStep;

      const session = await server.prisma.focusGroupSession.update({
        where: { id: sessionId },
        data: updateData,
      });

      console.log('[PATCH /sessions/:sessionId/config] Updated session:', {
        sessionId: session.id,
        selectionMode: session.archetypeSelectionMode,
        personas: session.selectedArchetypes,
        personasLength: session.selectedArchetypes ? (session.selectedArchetypes as any[]).length : 0,
      });

      // Return with new field names for frontend
      return {
        session: {
          ...session,
          panelSelectionMode: session.archetypeSelectionMode,
          selectedPersonas: session.selectedArchetypes,
          panelSize: session.archetypeCount,
        },
      };
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

      // Validate personas are selected (stored in selectedArchetypes column)
      if (!session.selectedArchetypes || (session.selectedArchetypes as any[]).length === 0) {
        reply.code(400);
        return { error: 'No personas selected for focus group panel' };
      }

      // Create focus_group_personas records from selectedArchetypes
      const selectedPersonas = session.selectedArchetypes as any[];
      const personaRecords = selectedPersonas.map((persona: any, index: number) => ({
        sessionId: sessionId,
        personaId: persona.id,
        seatNumber: index + 1,
      }));

      // Create all persona records in a transaction
      await server.prisma.$transaction([
        // Delete any existing persona assignments (in case of re-start)
        server.prisma.focusGroupPersona.deleteMany({
          where: { sessionId }
        }),
        // Create new persona assignments
        server.prisma.focusGroupPersona.createMany({
          data: personaRecords
        }),
        // Update session status
        server.prisma.focusGroupSession.update({
          where: { id: sessionId },
          data: {
            status: 'running',
            startedAt: new Date(),
            configurationStep: 'ready',
          },
        })
      ]);

      return {
        message: 'Focus group simulation started',
        sessionId: session.id,
        personasAssigned: personaRecords.length,
      };
    },
  });

  // Get available personas for panel configuration
  server.get('/personas', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId } = request.query as any;

      // Always return all active system personas + org-specific personas
      // (case-matched personas will be a separate feature in the wizard)
      const personas = await server.prisma.persona.findMany({
        where: {
          isActive: true,
          OR: [
            { organizationId: null },           // System personas
            { organizationId: organizationId }, // Org-specific personas
          ],
        },
        orderBy: [
          { archetype: 'asc' },
          { name: 'asc' },
        ],
      });

      const personaList = personas.map((persona) => ({
        id: persona.id,
        name: persona.name,
        nickname: persona.nickname,
        description: persona.description,
        tagline: persona.tagline,
        archetype: persona.archetype,
        archetypeStrength: persona.archetypeStrength
          ? parseFloat(persona.archetypeStrength.toString())
          : 0,
        demographics: persona.demographics,
        plaintiffDangerLevel: persona.plaintiffDangerLevel,
        defenseDangerLevel: persona.defenseDangerLevel,
        sourceType: persona.sourceType,
        source: persona.organizationId ? 'organization' : 'system',
      }));

      return { personas: personaList, source: 'system' };
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

      // Can delete draft or running sessions (running sessions may be stuck/failed)
      // Only protect completed sessions from accidental deletion
      if (session.status === 'completed') {
        reply.code(400);
        return { error: 'Cannot delete completed session. Completed sessions contain valuable results.' };
      }

      await server.prisma.focusGroupSession.delete({
        where: { id: sessionId },
      });

      return { message: 'Focus group session deleted' };
    },
  });

  // Generate AI-suggested questions for arguments
  server.post('/sessions/:sessionId/generate-questions', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { sessionId } = request.params as any;

      // Get session with case and arguments
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

      // Get selected arguments
      const selectedArguments = (session.selectedArguments as any[]) || [];
      if (selectedArguments.length === 0) {
        reply.code(400);
        return { error: 'No arguments selected. Please select arguments first.' };
      }

      // Fetch full argument details from database
      const argumentIds = selectedArguments.map((arg) => arg.argumentId);
      const caseArguments = await server.prisma.caseArgument.findMany({
        where: {
          id: { in: argumentIds },
          caseId: session.caseId,
        },
      });

      if (caseArguments.length === 0) {
        reply.code(404);
        return { error: 'No arguments found for this session' };
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        // Mock response for development without API key
        return {
          suggestedQuestions: caseArguments.map((arg) => [
            {
              id: `mock-${arg.id}-1`,
              question: `What is your initial reaction to this ${arg.argumentType} argument?`,
              purpose: 'Gauge overall impression',
              targetArchetypes: ['all'],
              argumentId: arg.id,
              argumentTitle: arg.title,
              isAISuggested: true,
            },
            {
              id: `mock-${arg.id}-2`,
              question: 'What concerns or doubts does this raise for you?',
              purpose: 'Identify potential objections',
              targetArchetypes: ['Scarred', 'Trojan Horse'],
              argumentId: arg.id,
              argumentTitle: arg.title,
              isAISuggested: true,
            },
          ]).flat(),
        };
      }

      // Generate questions using AI
      console.log('========================================');
      console.log('[API Route] Starting question generation');
      console.log('[API Route] Case:', session.case.name);
      console.log('[API Route] Arguments:', caseArguments.length);
      console.log('[API Route] API Key present:', !!apiKey);
      console.log('========================================');

      const questionGenerator = new FocusGroupQuestionGeneratorService(apiKey);

      const suggestedQuestions = await questionGenerator.generateQuestions({
        caseContext: {
          caseName: session.case.name,
          caseType: session.case.caseType || 'unknown',
          ourSide: session.case.ourSide || 'unknown',
          facts: session.case.facts.map((f: any) => ({
            content: f.content,
            factType: f.factType,
          })),
        },
        arguments: caseArguments.map((arg) => ({
          id: arg.id,
          title: arg.title,
          content: arg.content,
          argumentType: arg.argumentType,
        })),
      });

      console.log('========================================');
      console.log('[API Route] Question generation complete');
      console.log('[API Route] Questions returned:', suggestedQuestions.length);
      console.log('========================================');

      return { suggestedQuestions };
    },
  });

  // Run roundtable conversation for a specific argument
  server.post('/sessions/:sessionId/roundtable', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<{
      Params: { sessionId: string };
      Body: { argumentId: string };
    }>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { sessionId } = request.params;
      const { argumentId } = request.body;

      if (!argumentId) {
        reply.code(400);
        return { error: 'argumentId is required' };
      }

      // Verify session and get data
      const session = await server.prisma.focusGroupSession.findFirst({
        where: {
          id: sessionId,
          case: { organizationId }
        },
        include: {
          case: {
            include: {
              facts: {
                orderBy: { sortOrder: 'asc' }
              },
              arguments: true
            }
          },
          personas: {
            include: {
              persona: true
            }
          }
        }
      });

      if (!session) {
        reply.code(404);
        return { error: 'Session not found' };
      }

      // Find the argument
      const argument = session.case.arguments.find(a => a.id === argumentId);
      if (!argument) {
        reply.code(404);
        return { error: 'Argument not found' };
      }

      // Check if conversation already exists for this argument
      const existingConversation = await server.prisma.focusGroupConversation.findFirst({
        where: {
          sessionId,
          argumentId
        }
      });

      if (existingConversation) {
        reply.code(409);
        return { error: 'Conversation already exists for this argument' };
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        // Mock response for development
        return {
          conversationId: 'mock-conversation-id',
          message: 'Mock mode: Roundtable conversation would run here',
          statements: [],
          consensusAreas: ['Mock consensus area'],
          fracturePoints: [],
          keyDebatePoints: ['Mock debate point']
        };
      }

      // Create conversation record immediately
      const conversation = await server.prisma.focusGroupConversation.create({
        data: {
          sessionId,
          argumentId: argument.id
        }
      });

      console.log(`📝 Created conversation record: ${conversation.id}`);

      // Prepare input for background processing
      const conversationInput = {
        sessionId,
        existingConversationId: conversation.id,
        argument: {
          id: argument.id,
          title: argument.title,
          content: argument.content
        },
        caseContext: {
          caseName: session.case.name,
          caseType: session.case.caseType || 'unknown',
          ourSide: session.case.ourSide || 'unknown',
          facts: session.case.facts.map(f => f.content)
        },
        personas: session.personas.map(fp => ({
          id: fp.persona.id,
          name: fp.persona.name,
          description: fp.persona.description,
          archetype: fp.persona.archetype || undefined,
          demographics: fp.persona.demographics,
          worldview: fp.persona.description, // Use description as fallback
          leadershipLevel: fp.persona.leadershipLevel || undefined,
          communicationStyle: fp.persona.communicationStyle || undefined,
          persuasionSusceptibility: fp.persona.persuasionSusceptibility || undefined,
          lifeExperiences: fp.persona.lifeExperiences,
          dimensions: fp.persona.dimensions
        })),
        customQuestions: session.customQuestions as any[] | undefined
      };

      console.log('🎭 Starting roundtable conversation (async)...');
      console.log(`Session: ${session.name}`);
      console.log(`Argument: ${argument.title}`);
      console.log(`Personas: ${conversationInput.personas.length}`);

      // Return immediately with conversationId
      // Run the conversation in the background
      const promptServiceUrl = process.env.PROMPT_SERVICE_URL || 'http://localhost:3002';
      const promptClient = new PromptClient({
        serviceUrl: promptServiceUrl,
        anthropicApiKey: apiKey,
        cacheEnabled: true,
        cacheTTL: 300000
      });

      const orchestrator = new ConversationOrchestrator(server.prisma, promptClient);
      const analyzer = new StatementAnalyzer(server.prisma, promptClient);

      // Run conversation asynchronously (don't await)
      (async () => {
        try {
          await orchestrator.runConversation(conversationInput);
          await analyzer.analyzeConversation(conversation.id);
          await analyzer.getConversationStatistics(conversation.id);
          console.log(`✅ Roundtable conversation complete: ${conversation.id}`);
        } catch (error) {
          console.error(`❌ Error in background conversation ${conversation.id}:`, error);
          console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

          // Mark conversation as failed with proper completion status
          try {
            await server.prisma.focusGroupConversation.update({
              where: { id: conversation.id },
              data: {
                completedAt: new Date(),
                converged: false,
                convergenceReason: `Conversation ended due to error: ${error instanceof Error ? error.message : 'Unknown error'}`
              }
            });
          } catch (updateError) {
            // Conversation might have been deleted - ignore error
            console.log(`Conversation ${conversation.id} no longer exists (may have been deleted)`);
          }
        }
      })();

      return {
        conversationId: conversation.id,
        status: 'started',
        message: 'Conversation started. Use GET /conversations/:conversationId to check progress.'
      };
    }
  });

  // Get conversation details
  server.get('/conversations/:conversationId', {
    onRequest: [server.authenticate],
    config: {
      rateLimit: false // Exempt from rate limiting (used for polling)
    },
    handler: async (request: FastifyRequest<{
      Params: { conversationId: string };
    }>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { conversationId } = request.params;

      const conversation = await server.prisma.focusGroupConversation.findFirst({
        where: {
          id: conversationId,
          session: {
            case: { organizationId }
          }
        },
        include: {
          statements: {
            orderBy: { sequenceNumber: 'asc' }
          },
          personaSummaries: {
            orderBy: { totalStatements: 'desc' }
          },
          session: {
            include: {
              case: {
                include: {
                  arguments: true
                }
              },
              personas: {
                include: {
                  persona: true
                }
              }
            }
          }
        }
      });

      if (!conversation) {
        reply.code(404);
        return { error: 'Conversation not found' };
      }

      // Find the argument
      const argument = conversation.session.case.arguments.find(
        a => a.id === conversation.argumentId
      );

      // Create persona lookup map
      const personaLookup = new Map();
      for (const fp of conversation.session.personas) {
        personaLookup.set(fp.persona.id, fp.persona);
      }

      // Group statements by persona for easy lookup
      const statementsByPersona = new Map<string, any[]>();
      for (const statement of conversation.statements) {
        if (!statementsByPersona.has(statement.personaId)) {
          statementsByPersona.set(statement.personaId, []);
        }
        statementsByPersona.get(statement.personaId)!.push({
          id: statement.id,
          personaId: statement.personaId,
          personaName: statement.personaName,
          sequenceNumber: statement.sequenceNumber,
          content: statement.content,
          questionId: statement.questionId,
          sentiment: statement.sentiment,
          emotionalIntensity: statement.emotionalIntensity,
          keyPoints: statement.keyPoints,
          addressedTo: statement.addressedTo,
          agreementSignals: statement.agreementSignals,
          disagreementSignals: statement.disagreementSignals,
          speakCount: statement.speakCount,
          createdAt: statement.createdAt
        });
      }

      return {
        id: conversation.id,
        argumentId: conversation.argumentId,
        argumentTitle: argument?.title || 'Unknown',
        startedAt: conversation.startedAt,
        completedAt: conversation.completedAt,
        converged: conversation.converged,
        convergenceReason: conversation.convergenceReason,

        // Persona summaries with their statements
        personaSummaries: conversation.personaSummaries.map(ps => {
          const persona = personaLookup.get(ps.personaId);
          return {
            personaId: ps.personaId,
            personaName: ps.personaName,
            totalStatements: ps.totalStatements,
            firstStatement: ps.firstStatement,
            lastStatement: ps.lastStatement,
            initialPosition: ps.initialPosition,
            finalPosition: ps.finalPosition,
            positionShifted: ps.positionShifted,
            shiftDescription: ps.shiftDescription,
            mainPoints: ps.mainPoints,
            concernsRaised: ps.concernsRaised,
            questionsAsked: ps.questionsAsked,
            influenceLevel: ps.influenceLevel,
            agreedWithMost: ps.agreedWithMost,
            disagreedWithMost: ps.disagreedWithMost,
            influencedBy: ps.influencedBy,
            averageSentiment: ps.averageSentiment,
            averageEmotionalIntensity: ps.averageEmotionalIntensity,
            mostEmotionalStatement: ps.mostEmotionalStatement,
            summary: ps.summary,
            statements: statementsByPersona.get(ps.personaId) || [],
            // Full persona details
            persona: persona ? {
              description: persona.description,
              tagline: persona.tagline,
              archetype: persona.archetype,
              archetypeStrength: persona.archetypeStrength ? parseFloat(persona.archetypeStrength.toString()) : null,
              secondaryArchetype: persona.secondaryArchetype,
              variant: persona.variant,
              demographics: persona.demographics,
              attributes: persona.attributes,
              leadershipLevel: persona.leadershipLevel,
              communicationStyle: persona.communicationStyle
            } : null
          };
        }),

        // Overall analysis
        overallAnalysis: {
          consensusAreas: conversation.consensusAreas,
          fracturePoints: conversation.fracturePoints,
          keyDebatePoints: conversation.keyDebatePoints,
          influentialPersonas: conversation.influentialPersonas
        },

        // All statements chronologically (for timeline view)
        allStatements: conversation.statements.map(s => ({
          id: s.id,
          personaId: s.personaId,
          personaName: s.personaName,
          sequenceNumber: s.sequenceNumber,
          content: s.content,
          questionId: s.questionId,
          sentiment: s.sentiment,
          emotionalIntensity: s.emotionalIntensity,
          keyPoints: s.keyPoints,
          addressedTo: s.addressedTo,
          agreementSignals: s.agreementSignals,
          disagreementSignals: s.disagreementSignals,
          speakCount: s.speakCount,
          createdAt: s.createdAt
        })),

        // Custom questions for this session
        customQuestions: conversation.session.customQuestions as any[] || []
      };
    }
  });

  // Get case information for a conversation (for breadcrumbs and context)
  server.get('/conversations/:conversationId/case', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<{
      Params: { conversationId: string };
    }>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { conversationId } = request.params;

      const conversation = await server.prisma.focusGroupConversation.findFirst({
        where: {
          id: conversationId,
          session: {
            case: { organizationId }
          }
        },
        include: {
          session: {
            select: {
              id: true,
              name: true,
              caseId: true,
              case: {
                select: {
                  id: true,
                  name: true,
                  caseNumber: true,
                  caseType: true,
                  status: true,
                  trialDate: true,
                  venue: true,
                  jurisdiction: true,
                }
              }
            }
          }
        }
      });

      if (!conversation) {
        reply.code(404);
        return { error: 'Conversation not found' };
      }

      return {
        case: conversation.session.case,
        session: {
          id: conversation.session.id,
          name: conversation.session.name,
        }
      };
    }
  });

  // List conversations for a session
  server.get('/sessions/:sessionId/conversations', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<{
      Params: { sessionId: string };
    }>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { sessionId } = request.params;

      // Verify session belongs to org
      const session = await server.prisma.focusGroupSession.findFirst({
        where: {
          id: sessionId,
          case: { organizationId }
        }
      });

      if (!session) {
        reply.code(404);
        return { error: 'Session not found' };
      }

      const conversations = await server.prisma.focusGroupConversation.findMany({
        where: { sessionId },
        include: {
          statements: {
            select: { id: true }
          },
          session: {
            include: {
              case: {
                include: {
                  arguments: true
                }
              }
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      });

      return {
        conversations: conversations.map(c => {
          const argument = c.session.case.arguments.find(a => a.id === c.argumentId);
          return {
            id: c.id,
            argumentId: c.argumentId,
            argumentTitle: argument?.title || 'Unknown',
            startedAt: c.startedAt,
            completedAt: c.completedAt,
            converged: c.converged,
            statementCount: c.statements.length
          };
        })
      };
    }
  });

  // Get takeaways for a conversation (if they exist)
  server.get<{
    Params: { conversationId: string };
  }>('/conversations/:conversationId/takeaways', {
    onRequest: [server.authenticate],
    handler: async (request, reply) => {
      const { organizationId } = request.user as any;
      const { conversationId } = request.params;

      try {
        // Verify conversation belongs to organization
        const conversation = await server.prisma.focusGroupConversation.findFirst({
          where: {
            id: conversationId,
            session: {
              case: { organizationId }
            }
          }
        });

        if (!conversation) {
          reply.code(404);
          return { error: 'Conversation not found' };
        }

        // Check if takeaways exist
        const takeawaysRecord = await server.prisma.focusGroupTakeaways.findUnique({
          where: { conversationId }
        });

        if (!takeawaysRecord) {
          reply.code(404);
          return { error: 'Takeaways not found for this conversation' };
        }

        return {
          conversationId,
          takeaways: {
            whatLanded: takeawaysRecord.whatLanded,
            whatConfused: takeawaysRecord.whatConfused,
            whatBackfired: takeawaysRecord.whatBackfired,
            topQuestions: takeawaysRecord.topQuestions,
            recommendedEdits: takeawaysRecord.recommendedEdits,
          },
          generatedAt: takeawaysRecord.createdAt.toISOString(),
          promptVersion: takeawaysRecord.promptVersion,
        };
      } catch (error) {
        server.log.error({ error, conversationId }, 'Error fetching takeaways');
        reply.code(500);
        return {
          error: 'Failed to fetch takeaways',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  });

  // Generate strategic takeaways for a conversation
  server.post<{
    Params: { conversationId: string };
    Querystring: { forceRegenerate?: boolean };
  }>('/conversations/:conversationId/generate-takeaways', {
    onRequest: [server.authenticate],
    handler: async (request, reply) => {
      const { organizationId } = request.user as any;
      const { conversationId } = request.params;
      const forceRegenerate = request.query.forceRegenerate === true;

      server.log.info({ conversationId, forceRegenerate }, '📊 Generate takeaways request');

      try {
        // Verify conversation exists and belongs to user's organization
        server.log.info('Verifying conversation ownership...');
        const conversation = await server.prisma.focusGroupConversation.findFirst({
          where: {
            id: conversationId,
            session: {
              case: {
                organizationId,
              },
            },
          },
          include: {
            session: {
              include: {
                case: true,
              },
            },
          },
        });

        if (!conversation) {
          server.log.warn({ conversationId }, 'Conversation not found');
          reply.code(404);
          return { error: 'Conversation not found' };
        }

        if (!conversation.completedAt) {
          server.log.warn({ conversationId }, 'Conversation not completed');
          reply.code(400);
          return { error: 'Cannot generate takeaways for incomplete conversation' };
        }

        // Initialize services
        const promptServiceUrl = process.env.PROMPT_SERVICE_URL || 'http://localhost:3002';
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

        server.log.info({ promptServiceUrl }, 'Initializing takeaways generator');

        if (!anthropicApiKey) {
          server.log.error('ANTHROPIC_API_KEY not configured');
          reply.code(500);
          return { error: 'ANTHROPIC_API_KEY not configured' };
        }

        const promptClient = new PromptClient({
          serviceUrl: promptServiceUrl,
          anthropicApiKey,
        });

        const takeawaysGenerator = new TakeawaysGenerator(server.prisma, promptClient);

        // Generate takeaways
        server.log.info('Starting takeaways generation...');
        const takeaways = await takeawaysGenerator.generateTakeaways(
          conversationId,
          forceRegenerate
        );
        server.log.info('Takeaways generation completed successfully');

        return {
          conversationId,
          takeaways,
          generatedAt: new Date().toISOString(),
          promptVersion: 'takeaways-v1.0.0',
        };
      } catch (error) {
        server.log.error({ error, conversationId }, 'Error generating takeaways');
        reply.code(500);
        return {
          error: 'Failed to generate takeaways',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
        };
      }
    },
  });
}
