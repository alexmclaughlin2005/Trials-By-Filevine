import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { QuestionGeneratorService } from '../services/question-generator';

const createCaseSchema = z.object({
  name: z.string().min(1),
  caseNumber: z.string().min(1),
  caseType: z.string(),
  description: z.string().optional(),
  plaintiffName: z.string().optional(),
  defendantName: z.string().optional(),
  trialDate: z.string().optional(),
  venue: z.string().optional(),
});

const updateCaseSchema = createCaseSchema.partial();

export async function casesRoutes(server: FastifyInstance) {
  // Get all cases for the user's organization
  server.get('/', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;

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
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { id } = request.params;

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
    handler: async (request: any, reply) => {
      const { organizationId, userId } = request.user;
      const body = createCaseSchema.parse(request.body);

      const caseData = await server.prisma.case.create({
        data: {
          ...body,
          trialDate: body.trialDate ? new Date(body.trialDate) : undefined,
          organizationId,
          createdBy: userId,
          status: 'active',
        },
      });

      reply.code(201);
      return { case: caseData };
    },
  });

  // Update a case
  server.patch('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { id } = request.params;
      const body = updateCaseSchema.parse(request.body);

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
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { id } = request.params;

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

  // Generate voir dire questions for a case
  server.post('/:id/generate-questions', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { id } = request.params;
      const { targetPersonaIds, focusAreas, questionLimit } = request.body as any;

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
              OR: [{ organizationId }, { type: 'system' }],
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
                targetPersonas: personas.map((p) => p.name),
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
          keyFacts: caseData.facts.map((f) => ({
            content: f.content,
            factType: f.factType,
          })),
          jurisdiction: caseData.jurisdiction || undefined,
        },
        targetPersonas: personas.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          attributes: p.attributes,
          signals: p.signals,
          persuasionLevers: p.persuasionLevers,
          pitfalls: p.pitfalls,
        })),
        focusAreas: focusAreas || undefined,
        questionLimit: questionLimit || undefined,
      });

      return { questions };
    },
  });
}
