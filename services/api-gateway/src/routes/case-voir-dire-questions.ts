/**
 * Case-Level Voir Dire Questions API Routes
 * 
 * Endpoints for managing case-level voir dire questions that can be asked to all jurors.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { CaseVoirDireQuestionService } from '../services/case-voir-dire-question-service';
import { VoirDireGeneratorV2Service } from '../services/voir-dire-generator-v2';

const createCaseVoirDireQuestionSchema = z.object({
  questionText: z.string().min(1),
  questionType: z.enum(['AI_GENERATED', 'USER_CREATED']),
  questionCategory: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

const updateCaseVoirDireQuestionSchema = z.object({
  questionText: z.string().min(1).optional(),
  questionCategory: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const reorderQuestionsSchema = z.object({
  questionIds: z.array(z.string().uuid()),
});

export async function caseVoirDireQuestionsRoutes(server: FastifyInstance) {
  const questionService = new CaseVoirDireQuestionService(server.prisma);

  // Create case-level voir dire question
  server.post('/cases/:caseId/voir-dire-questions', {
    onRequest: [server.authenticate],
    schema: {
      description: 'Create a new case-level voir dire question',
      tags: ['case-voir-dire-questions'],
      params: {
        type: 'object',
        properties: {
          caseId: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['questionText', 'questionType'],
        properties: {
          questionText: { type: 'string' },
          questionType: { type: 'string', enum: ['AI_GENERATED', 'USER_CREATED'] },
          questionCategory: { type: 'string', nullable: true },
          source: { type: 'string', nullable: true },
          sortOrder: { type: 'number' },
        },
      },
    },
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId, userId } = request.user as any;
      const { caseId } = request.params as any;
      const body = request.body as any;

      // Verify case belongs to organization
      const caseRecord = await server.prisma.case.findFirst({
        where: {
          id: caseId,
          organizationId,
        },
      });

      if (!caseRecord) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Validate request body
      const validationResult = createCaseVoirDireQuestionSchema.safeParse(body);
      if (!validationResult.success) {
        reply.code(400);
        return { error: 'Invalid request body', details: validationResult.error.errors };
      }

      try {
        const question = await questionService.createQuestion(
          caseId,
          validationResult.data,
          userId
        );

        return {
          success: true,
          question: {
            id: question.id,
            caseId: question.caseId,
            questionText: question.questionText,
            questionType: question.questionType,
            questionCategory: question.questionCategory,
            source: question.source,
            sortOrder: question.sortOrder,
            isActive: question.isActive,
            createdBy: question.createdBy,
            createdAt: question.createdAt.toISOString(),
            updatedAt: question.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to create case-level voir dire question' };
      }
    },
  });

  // List case-level voir dire questions
  server.get('/cases/:caseId/voir-dire-questions', {
    onRequest: [server.authenticate],
    schema: {
      description: 'Get all case-level voir dire questions for a case',
      tags: ['case-voir-dire-questions'],
      params: {
        type: 'object',
        properties: {
          caseId: { type: 'string', format: 'uuid' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          includeInactive: { type: 'boolean' },
          jurorId: { type: 'string', format: 'uuid' }, // Optional: include answer status for specific juror
        },
      },
    },
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId } = request.params as any;
      const { includeInactive, jurorId } = request.query as any;

      // Verify case belongs to organization
      const caseRecord = await server.prisma.case.findFirst({
        where: {
          id: caseId,
          organizationId,
        },
      });

      if (!caseRecord) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      try {
        let questions;
        if (jurorId) {
          // Include answer status for specific juror
          questions = await questionService.getQuestionsWithAnswerStatus(caseId, jurorId);
        } else {
          questions = await questionService.listQuestions(caseId, {
            includeInactive: includeInactive === 'true',
          });
        }

        return {
          success: true,
          questions: questions.map((q) => ({
            id: q.id,
            caseId: q.caseId,
            questionText: q.questionText,
            questionType: q.questionType,
            questionCategory: q.questionCategory,
            source: q.source,
            sortOrder: q.sortOrder,
            isActive: q.isActive,
            createdBy: q.createdBy,
            createdAt: q.createdAt.toISOString(),
            updatedAt: q.updatedAt.toISOString(),
            ...(('hasAnswer' in q && 'answerCount' in q) ? { 
              hasAnswer: (q as any).hasAnswer, 
              answerCount: (q as any).answerCount 
            } : {}),
          })),
          count: questions.length,
        };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to fetch case-level voir dire questions' };
      }
    },
  });

  // Update case-level voir dire question
  server.patch('/cases/:caseId/voir-dire-questions/:questionId', {
    onRequest: [server.authenticate],
    schema: {
      description: 'Update a case-level voir dire question',
      tags: ['case-voir-dire-questions'],
      params: {
        type: 'object',
        properties: {
          caseId: { type: 'string', format: 'uuid' },
          questionId: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          questionText: { type: 'string' },
          questionCategory: { type: 'string', nullable: true },
          sortOrder: { type: 'number' },
          isActive: { type: 'boolean' },
        },
      },
    },
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId, questionId } = request.params as any;
      const body = request.body as any;

      // Verify question belongs to case and organization
      const question = await server.prisma.caseVoirDireQuestion.findFirst({
        where: {
          id: questionId,
          caseId,
          case: { organizationId },
        },
      });

      if (!question) {
        reply.code(404);
        return { error: 'Case-level voir dire question not found' };
      }

      // Validate request body
      const validationResult = updateCaseVoirDireQuestionSchema.safeParse(body);
      if (!validationResult.success) {
        reply.code(400);
        return { error: 'Invalid request body', details: validationResult.error.errors };
      }

      try {
        const updated = await questionService.updateQuestion(questionId, validationResult.data);

        return {
          success: true,
          question: {
            id: updated.id,
            caseId: updated.caseId,
            questionText: updated.questionText,
            questionType: updated.questionType,
            questionCategory: updated.questionCategory,
            source: updated.source,
            sortOrder: updated.sortOrder,
            isActive: updated.isActive,
            createdBy: updated.createdBy,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to update case-level voir dire question' };
      }
    },
  });

  // Delete case-level voir dire question
  server.delete('/cases/:caseId/voir-dire-questions/:questionId', {
    onRequest: [server.authenticate],
    schema: {
      description: 'Delete a case-level voir dire question',
      tags: ['case-voir-dire-questions'],
      params: {
        type: 'object',
        properties: {
          caseId: { type: 'string', format: 'uuid' },
          questionId: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId, questionId } = request.params as any;

      // Verify question belongs to case and organization
      const question = await server.prisma.caseVoirDireQuestion.findFirst({
        where: {
          id: questionId,
          caseId,
          case: { organizationId },
        },
      });

      if (!question) {
        reply.code(404);
        return { error: 'Case-level voir dire question not found' };
      }

      try {
        await questionService.deleteQuestion(questionId);
        return { success: true };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to delete case-level voir dire question' };
      }
    },
  });

  // Generate AI voir dire questions for case
  server.post('/cases/:caseId/voir-dire-questions/generate-ai', {
    onRequest: [server.authenticate],
    schema: {
      description: 'Generate AI voir dire questions for a case',
      tags: ['case-voir-dire-questions'],
      params: {
        type: 'object',
        properties: {
          caseId: { type: 'string', format: 'uuid' },
        },
      },
    },
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId, userId } = request.user as any;
      const { caseId } = request.params as any;

      // Verify case belongs to organization
      const caseRecord = await server.prisma.case.findFirst({
        where: {
          id: caseId,
          organizationId,
        },
        include: {
          facts: true,
          arguments: true,
        },
      });

      if (!caseRecord) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Get AI API key
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        reply.code(500);
        return { error: 'AI service not configured' };
      }

      try {
        // Get personas for the organization to generate targeted questions
        const personas = await server.prisma.persona.findMany({
          where: {
            organizationId,
          },
          select: {
            id: true,
            name: true,
            archetype: true,
            instantRead: true,
            phrasesYoullHear: true,
            archetypeVerdictLean: true,
            strikeOrKeep: true,
            verdictPrediction: true,
          },
          take: 20, // Limit to reasonable number
        });

        if (personas.length === 0) {
          reply.code(400);
          return { error: 'No personas found. Please create personas first.' };
        }

        const generator = new VoirDireGeneratorV2Service(apiKey);
        
        // Extract key issues from facts
        const keyIssues = caseRecord.facts
          .filter((f) => f.factType === 'key_issue' || f.factType === 'dispute')
          .map((f) => f.content)
          .slice(0, 5);

        const questionSet = await generator.generateQuestions({
          personas: personas as any,
          caseContext: {
            caseType: caseRecord.caseType || 'civil',
            keyIssues: keyIssues.length > 0 ? keyIssues : ['General civil dispute'],
            plaintiffTheory: caseRecord.ourSide === 'plaintiff' 
              ? caseRecord.arguments.find((a) => a.argumentType === 'theory')?.content 
              : undefined,
            defenseTheory: caseRecord.ourSide === 'defense'
              ? caseRecord.arguments.find((a) => a.argumentType === 'theory')?.content
              : undefined,
            attorneySide: (caseRecord.ourSide as 'plaintiff' | 'defense') || 'plaintiff',
          },
          questionCategories: ['opening', 'identification', 'case-specific', 'strike-justification'],
        });

        // Flatten all questions from all categories
        const allQuestions = [
          ...(questionSet.openingQuestions || []),
          ...(questionSet.archetypeIdentification || []),
          ...(questionSet.caseSpecific || []),
          ...(questionSet.strikeJustification || []),
        ];

        // Store questions in database
        const createdQuestions = await Promise.all(
          allQuestions.map(async (q, index) => {
            return questionService.createQuestion(
              caseId,
              {
                questionText: q.question,
                questionType: 'AI_GENERATED',
                questionCategory: undefined, // VoirDireQuestion doesn't have category field
                source: 'voir_dire_generator_v2',
                sortOrder: index,
              },
              userId
            );
          })
        );

        return {
          success: true,
          questions: createdQuestions.map((q) => ({
            id: q.id,
            caseId: q.caseId,
            questionText: q.questionText,
            questionType: q.questionType,
            questionCategory: q.questionCategory,
            source: q.source,
            sortOrder: q.sortOrder,
            isActive: q.isActive,
            createdBy: q.createdBy,
            createdAt: q.createdAt.toISOString(),
            updatedAt: q.updatedAt.toISOString(),
          })),
          count: createdQuestions.length,
        };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to generate AI voir dire questions' };
      }
    },
  });

  // Reorder questions
  server.post('/cases/:caseId/voir-dire-questions/reorder', {
    onRequest: [server.authenticate],
    schema: {
      description: 'Reorder case-level voir dire questions',
      tags: ['case-voir-dire-questions'],
      params: {
        type: 'object',
        properties: {
          caseId: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['questionIds'],
        properties: {
          questionIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
        },
      },
    },
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId } = request.params as any;
      const body = request.body as any;

      // Verify case belongs to organization
      const caseRecord = await server.prisma.case.findFirst({
        where: {
          id: caseId,
          organizationId,
        },
      });

      if (!caseRecord) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Validate request body
      const validationResult = reorderQuestionsSchema.safeParse(body);
      if (!validationResult.success) {
        reply.code(400);
        return { error: 'Invalid request body', details: validationResult.error.errors };
      }

      try {
        const questions = await questionService.reorderQuestions(
          caseId,
          validationResult.data.questionIds
        );

        return {
          success: true,
          questions: questions.map((q) => ({
            id: q.id,
            caseId: q.caseId,
            questionText: q.questionText,
            questionType: q.questionType,
            questionCategory: q.questionCategory,
            source: q.source,
            sortOrder: q.sortOrder,
            isActive: q.isActive,
            createdBy: q.createdBy,
            createdAt: q.createdAt.toISOString(),
            updatedAt: q.updatedAt.toISOString(),
          })),
        };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to reorder questions' };
      }
    },
  });
}
