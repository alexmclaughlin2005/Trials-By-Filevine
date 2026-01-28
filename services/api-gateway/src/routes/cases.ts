import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { QuestionGeneratorService } from '../services/question-generator';

const createCaseSchema = z.object({
  name: z.string().min(1),
  caseNumber: z.string().min(1),
  caseType: z.string(),
  plaintiffName: z.string().optional(),
  defendantName: z.string().optional(),
  ourSide: z.string().optional(),
  jurisdiction: z.string().optional(),
  trialDate: z.string().optional(),
  venue: z.string().optional(),
});

const updateCaseSchema = createCaseSchema.partial();

export async function casesRoutes(server: FastifyInstance) {
  // Get all cases for the user's organization
  server.get('/', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;

      const cases = await server.prisma.case.findMany({
        where: { organizationId },
        include: {
          _count: {
            select: {
              juryPanels: true,
              facts: true,
              arguments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { cases };
    },
  });

  // Get a single case by ID
  server.get('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;

      const caseData = await server.prisma.case.findFirst({
        where: {
          id,
          organizationId,
        },
        include: {
          facts: true,
          arguments: true,
          witnesses: true,
          juryPanels: {
            include: {
              jurors: {
                include: {
                  researchArtifacts: true,
                  personaMappings: {
                    include: {
                      persona: true,
                    },
                  },
                },
              },
            },
          },
          focusGroupSessions: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!caseData) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      return { case: caseData };
    },
  });

  // Create a new case
  server.post('/', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId, userId } = request.user as any;
      const body = createCaseSchema.parse(request.body as any);

      const caseData = await server.prisma.case.create({
        data: {
          ...body,
          trialDate: body.trialDate ? new Date(body.trialDate) : undefined,
          organizationId,
          createdBy: userId,
          status: 'active',
        },
      });

      // Auto-create a default jury panel for the case
      await server.prisma.juryPanel.create({
        data: {
          caseId: caseData.id,
          panelDate: caseData.trialDate || new Date(),
          source: 'manual',
          version: 1,
          totalJurors: 0,
        },
      });

      reply.code(201);
      return { case: caseData };
    },
  });

  // Update a case
  server.patch('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;
      const body = updateCaseSchema.parse(request.body as any);

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      const caseData = await server.prisma.case.update({
        where: { id },
        data: {
          ...body,
          trialDate: body.trialDate ? new Date(body.trialDate) : undefined,
        },
      });

      return { case: caseData };
    },
  });

  // Delete a case
  server.delete('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      await server.prisma.case.delete({
        where: { id },
      });

      reply.code(204);
      return;
    },
  });

  // Note: Facts, arguments, and witnesses routes are now in dedicated route files
  // (case-facts.ts, case-arguments.ts, case-witnesses.ts)

  // ============================================
  // JURY PANEL ROUTES
  // ============================================

  // Get all jury panels for a case
  server.get('/:id/panels', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;

      // Verify case belongs to organization
      const caseData = await server.prisma.case.findFirst({
        where: { id, organizationId },
      });

      if (!caseData) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      const panels = await server.prisma.juryPanel.findMany({
        where: { caseId: id },
        include: {
          case: {
            select: {
              id: true,
              name: true,
              caseNumber: true,
              caseType: true,
              jurisdiction: true,
              ourSide: true,
            },
          },
          jurors: {
            include: {
              researchArtifacts: true,
              personaMappings: {
                include: {
                  persona: true,
                },
              },
              candidates: {
                where: { isRejected: false },
                orderBy: { confidenceScore: 'desc' },
              },
            },
          },
        },
        orderBy: { panelDate: 'desc' },
      });

      return { panels };
    },
  });

  // Create a new jury panel
  server.post('/:id/panels', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;
      const { panelDate, source, version } = request.body as any;

      // Verify case belongs to organization
      const caseData = await server.prisma.case.findFirst({
        where: { id, organizationId },
      });

      if (!caseData) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      const panel = await server.prisma.juryPanel.create({
        data: {
          caseId: id,
          panelDate: panelDate ? new Date(panelDate) : new Date(),
          source: source || 'manual',
          version: version || 1,
          totalJurors: 0,
        },
      });

      reply.code(201);
      return { panel };
    },
  });

  // Generate voir dire questions for a case
  server.post('/:id/generate-questions', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;
      const { targetPersonaIds, focusAreas, questionLimit } = request.body as any as any;

      // Verify case belongs to organization and fetch with related data
      const caseData = await server.prisma.case.findFirst({
        where: { id, organizationId },
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

      // Get target personas
      const personas = targetPersonaIds
        ? await server.prisma.persona.findMany({
            where: {
              id: { in: targetPersonaIds },
              OR: [{ organizationId }, { organizationId: null }],
            },
          })
        : await server.prisma.persona.findMany({
            where: {
              OR: [{ organizationId }, { sourceType: 'system' }],
              isActive: true,
            },
            take: 5, // Use top 5 personas if none specified
          });

      if (personas.length === 0) {
        reply.code(400);
        return { error: 'No personas available for question generation' };
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        // Mock response if no API key
        return {
          questions: {
            openingQuestions: [
              {
                question: 'Can you tell us a bit about your professional background?',
                purpose: 'Identify occupation and expertise areas',
                targetPersonas: personas.map((p: Record<string, unknown>) => p.name as string),
                category: 'background',
                listenFor: ['Technical expertise', 'Business experience', 'Community work'],
                redFlags: ['Bias against our side', 'Extreme views'],
                idealAnswers: ['Balanced perspective', 'Open-minded approach'],
                followUps: [],
                priority: 8,
              },
            ],
            personaIdentificationQuestions: [],
            caseSpecificQuestions: [],
            challengeForCauseQuestions: [],
            generalStrategy: 'Mock question set - configure ANTHROPIC_API_KEY for AI generation',
            timingNotes: ['Start with rapport building', 'Move to case-specific questions'],
          },
        };
      }

      const generator = new QuestionGeneratorService(apiKey);

      const questions = await generator.generateQuestions({
        caseContext: {
          caseType: caseData.caseType || 'unknown',
          caseName: caseData.name,
          ourSide: caseData.ourSide || 'unknown',
          keyFacts: caseData.facts.map((f: Record<string, unknown>) => ({
            content: f.content as string,
            factType: f.factType as string,
          })),
          jurisdiction: caseData.jurisdiction || undefined,
        },
        targetPersonas: personas.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
          description: p.description as string,
          attributes: p.attributes as Record<string, unknown>,
          signals: p.signals as Record<string, unknown>,
          persuasionLevers: p.persuasionLevers as Record<string, unknown>,
          pitfalls: p.pitfalls as Record<string, unknown>,
        })),
        focusAreas: focusAreas || undefined,
        questionLimit: questionLimit || undefined,
      });

      return { questions };
    },
  });

  // NEW: Generate V2 voir dire questions using enhanced persona data
  server.post('/:id/generate-questions-v2', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;
      const {
        targetPersonaIds,
        attorneySide,
        plaintiffTheory,
        defenseTheory,
        questionCategories
      } = request.body as any;

      // Verify case belongs to organization and fetch with related data
      const caseData = await server.prisma.case.findFirst({
        where: { id, organizationId },
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

      // Get V2 personas with enhanced fields
      const personas = targetPersonaIds && targetPersonaIds.length > 0
        ? await server.prisma.persona.findMany({
            where: {
              id: { in: targetPersonaIds },
              OR: [{ organizationId }, { organizationId: null }],
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              archetype: true,
              instantRead: true,
              archetypeVerdictLean: true,
              phrasesYoullHear: true,
              strikeOrKeep: true,
              verdictPrediction: true,
            },
          })
        : await server.prisma.persona.findMany({
            where: {
              OR: [{ organizationId }, { sourceType: 'system' }],
              isActive: true,
              version: 2, // Only V2 personas
            },
            select: {
              id: true,
              name: true,
              archetype: true,
              instantRead: true,
              archetypeVerdictLean: true,
              phrasesYoullHear: true,
              strikeOrKeep: true,
              verdictPrediction: true,
            },
            take: 10, // Use top 10 V2 personas if none specified
          });

      if (personas.length === 0) {
        reply.code(400);
        return { error: 'No V2 personas available for question generation' };
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        reply.code(500);
        return { error: 'ANTHROPIC_API_KEY not configured' };
      }

      try {
        const { VoirDireGeneratorV2Service } = await import('../services/voir-dire-generator-v2');
        const generator = new VoirDireGeneratorV2Service(apiKey);

        // Extract key issues from facts
        const keyIssues = caseData.facts
          .filter((f: any) => f.factType === 'key_issue' || f.factType === 'dispute')
          .map((f: any) => f.content)
          .slice(0, 5);

        const questionSet = await generator.generateQuestions({
          personas: personas as any,
          caseContext: {
            caseType: caseData.caseType || 'civil',
            keyIssues: keyIssues.length > 0 ? keyIssues : ['General civil dispute'],
            plaintiffTheory: plaintiffTheory || undefined,
            defenseTheory: defenseTheory || undefined,
            attorneySide: attorneySide || caseData.ourSide || 'plaintiff',
          },
          questionCategories: questionCategories || ['opening', 'identification', 'case-specific', 'strike-justification'],
        });

        return { questionSet };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to generate voir dire questions' };
      }
    },
  });

  // NEW: Generate V2 case strategy recommendations using strikeOrKeep guidance
  server.post('/:id/strategy-v2', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;
      const {
        panelId,
        attorneySide,
        plaintiffTheory,
        defenseTheory,
        availableStrikes
      } = request.body as any;

      // Verify case belongs to organization
      const caseData = await server.prisma.case.findFirst({
        where: { id, organizationId },
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

      // Get jury panel with jurors and their persona mappings
      const panel = await server.prisma.juryPanel.findFirst({
        where: {
          id: panelId,
          caseId: id,
        },
        include: {
          jurors: {
            include: {
              personaMappings: {
                include: {
                  persona: {
                    select: {
                      id: true,
                      name: true,
                      archetype: true,
                      instantRead: true,
                      archetypeVerdictLean: true,
                      plaintiffDangerLevel: true,
                      defenseDangerLevel: true,
                      strikeOrKeep: true,
                      verdictPrediction: true,
                    },
                  },
                },
                orderBy: {
                  confidence: 'desc',
                },
                take: 1, // Get highest confidence mapping
              },
            },
          },
        },
      });

      if (!panel) {
        reply.code(404);
        return { error: 'Jury panel not found' };
      }

      if (panel.jurors.length === 0) {
        reply.code(400);
        return { error: 'Jury panel has no jurors' };
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        reply.code(500);
        return { error: 'ANTHROPIC_API_KEY not configured' };
      }

      try {
        const { CaseStrategyV2Service } = await import('../services/case-strategy-v2');
        const strategyService = new CaseStrategyV2Service(apiKey);

        // Format jurors with persona data
        const jurors = panel.jurors.map(juror => ({
          juror: {
            id: juror.id,
            jurorNumber: juror.jurorNumber,
            firstName: juror.firstName,
            lastName: juror.lastName,
            age: juror.age || undefined,
            occupation: juror.occupation || undefined,
            notes: juror.notes || undefined,
          },
          mappedPersona: juror.personaMappings[0]?.persona ? {
            id: juror.personaMappings[0].persona.id,
            name: juror.personaMappings[0].persona.name,
            archetype: juror.personaMappings[0].persona.archetype!,
            instantRead: juror.personaMappings[0].persona.instantRead!,
            archetypeVerdictLean: juror.personaMappings[0].persona.archetypeVerdictLean!,
            plaintiffDangerLevel: juror.personaMappings[0].persona.plaintiffDangerLevel || 0,
            defenseDangerLevel: juror.personaMappings[0].persona.defenseDangerLevel || 0,
            strikeOrKeep: juror.personaMappings[0].persona.strikeOrKeep as any,
            verdictPrediction: juror.personaMappings[0].persona.verdictPrediction as any,
          } : undefined,
        }));

        // Extract key issues from facts
        const keyIssues = caseData.facts
          .filter((f: any) => f.factType === 'key_issue' || f.factType === 'dispute')
          .map((f: any) => f.content)
          .slice(0, 5);

        const strategy = await strategyService.generateStrategy({
          jurors,
          caseContext: {
            caseType: caseData.caseType || 'civil',
            keyIssues: keyIssues.length > 0 ? keyIssues : ['General civil dispute'],
            attorneySide: attorneySide || caseData.ourSide || 'plaintiff',
            plaintiffTheory: plaintiffTheory || undefined,
            defenseTheory: defenseTheory || undefined,
            availableStrikes: availableStrikes || 10, // Default to 10 strikes
          },
        });

        return { strategy };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to generate case strategy' };
      }
    },
  });
}
