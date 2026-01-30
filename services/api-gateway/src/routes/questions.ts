/**
 * Discriminative Question Generation API Routes
 * 
 * Endpoints for generating voir dire questions that maximize information gain.
 * 
 * Phase 3: Discriminative Question Generation
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DiscriminativeQuestionGenerator } from '../services/matching/discriminative-question-generator';
import { EnsembleMatcher } from '../services/matching/ensemble-matcher';
import { ClaudeClient } from '@juries/ai-client';

export async function questionsRoutes(server: FastifyInstance) {
  // Generate discriminative questions for a specific juror
  server.get('/jurors/:jurorId/suggested-questions', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId } = request.params as any;
      const { personaIds } = request.query as any;

      // Verify juror belongs to organization
      const juror = await server.prisma.juror.findFirst({
        where: {
          id: jurorId,
          panel: {
            case: { organizationId },
          },
        },
        include: {
          panel: {
            select: {
              caseId: true,
            },
          },
        },
      });

      if (!juror) {
        reply.code(404);
        return { error: 'Juror not found' };
      }

      // Initialize services
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        reply.code(500);
        return { error: 'AI service not configured' };
      }

      const claudeClient = new ClaudeClient({ apiKey });
      const ensembleMatcher = new EnsembleMatcher(server.prisma, claudeClient);
      const questionGenerator = new DiscriminativeQuestionGenerator(
        server.prisma,
        claudeClient,
        ensembleMatcher
      );

      try {
        const parsedPersonaIds = personaIds
          ? (Array.isArray(personaIds) ? personaIds : [personaIds])
          : undefined;

        const questions = await questionGenerator.generateQuestionsForJuror(
          jurorId,
          organizationId,
          parsedPersonaIds
        );

        // Store questions in database (optional)
        const storedQuestions = await Promise.all(
          questions.map(async (q) => {
            return server.prisma.suggestedQuestion.create({
              data: {
                caseId: juror.panel.caseId,
                targetType: 'SPECIFIC_JUROR',
                targetJurorId: jurorId,
                questionText: q.questionText,
                questionCategory: q.questionCategory,
                discriminatesBetween: q.discriminatesBetween as any,
                responseInterpretations: q.responseInterpretations as any,
                followUpQuestions: q.followUpQuestions as any,
                priorityScore: q.priorityScore,
                priorityRationale: q.priorityRationale || '',
              },
            });
          })
        );

        return {
          success: true,
          questions: storedQuestions.map((sq) => ({
            id: sq.id,
            questionText: sq.questionText,
            questionCategory: sq.questionCategory,
            discriminatesBetween: sq.discriminatesBetween,
            responseInterpretations: sq.responseInterpretations,
            followUpQuestions: sq.followUpQuestions,
            priorityScore: Number(sq.priorityScore),
            priorityRationale: sq.priorityRationale,
          })),
          count: storedQuestions.length,
        };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to generate questions' };
      }
    },
  });

  // Generate panel-wide questions
  server.get('/cases/:caseId/panel-questions', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId } = request.params as any;
      const { limit } = request.query as any;

      // Verify case belongs to organization
      const caseData = await server.prisma.case.findFirst({
        where: {
          id: caseId,
          organizationId,
        },
        include: {
          juryPanels: {
            include: {
              jurors: {
                where: {
                  status: { in: ['available', 'questioned'] },
                },
              },
            },
            take: 1, // Get most recent panel
          },
        },
      });

      if (!caseData) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      const panel = caseData.juryPanels[0];
      if (!panel || panel.jurors.length === 0) {
        reply.code(400);
        return { error: 'No jurors found in panel' };
      }

      const jurorIds = panel.jurors.map((j) => j.id);

      // Initialize services
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        reply.code(500);
        return { error: 'AI service not configured' };
      }

      const claudeClient = new ClaudeClient({ apiKey });
      const ensembleMatcher = new EnsembleMatcher(server.prisma, claudeClient);
      const questionGenerator = new DiscriminativeQuestionGenerator(
        server.prisma,
        claudeClient,
        ensembleMatcher
      );

      try {
        const questions = await questionGenerator.generatePanelWideQuestions(
          caseId,
          jurorIds,
          organizationId
        );

        // Limit results if requested
        const limitedQuestions = limit
          ? questions.slice(0, parseInt(limit))
          : questions.slice(0, 20); // Default to top 20

        // Store questions in database
        const storedQuestions = await Promise.all(
          limitedQuestions.map(async (q) => {
            return server.prisma.suggestedQuestion.create({
              data: {
                caseId,
                targetType: 'PANEL_WIDE',
                targetJurorId: null,
                questionText: q.questionText,
                questionCategory: q.questionCategory,
                discriminatesBetween: q.discriminatesBetween as any,
                responseInterpretations: q.responseInterpretations as any,
                followUpQuestions: q.followUpQuestions as any,
                priorityScore: q.priorityScore,
                priorityRationale: q.priorityRationale || '',
              },
            });
          })
        );

        return {
          success: true,
          questions: storedQuestions.map((sq) => ({
            id: sq.id,
            questionText: sq.questionText,
            questionCategory: sq.questionCategory,
            discriminatesBetween: sq.discriminatesBetween,
            responseInterpretations: sq.responseInterpretations,
            followUpQuestions: sq.followUpQuestions,
            priorityScore: Number(sq.priorityScore),
            priorityRationale: sq.priorityRationale,
          })),
          count: storedQuestions.length,
        };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to generate panel questions' };
      }
    },
  });

  // Get suggested questions for a case
  server.get('/cases/:caseId/suggested-questions', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId } = request.params as any;
      const { targetJurorId, category } = request.query as any;

      // Verify case belongs to organization
      const caseData = await server.prisma.case.findFirst({
        where: {
          id: caseId,
          organizationId,
        },
      });

      if (!caseData) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      const where: any = { caseId };
      if (targetJurorId) {
        where.targetJurorId = targetJurorId;
      }
      if (category) {
        where.questionCategory = category;
      }

      const questions = await server.prisma.suggestedQuestion.findMany({
        where,
        orderBy: {
          priorityScore: 'desc',
        },
      });

      return {
        questions: questions.map((q) => ({
          id: q.id,
          targetType: q.targetType,
          targetJurorId: q.targetJurorId,
          questionText: q.questionText,
          questionCategory: q.questionCategory,
          discriminatesBetween: q.discriminatesBetween,
          responseInterpretations: q.responseInterpretations,
          followUpQuestions: q.followUpQuestions,
          priorityScore: Number(q.priorityScore),
          priorityRationale: q.priorityRationale,
          timesAsked: q.timesAsked,
          averageInformationGain: q.averageInformationGain
            ? Number(q.averageInformationGain)
            : null,
          createdAt: q.createdAt,
        })),
        count: questions.length,
      };
    },
  });

  // Record question usage (when question is asked)
  server.post('/questions/:questionId/record-usage', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { questionId } = request.params as any;
      const { informationGain } = request.body as any;

      const question = await server.prisma.suggestedQuestion.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        reply.code(404);
        return { error: 'Question not found' };
      }

      // Update usage stats
      const newTimesAsked = question.timesAsked + 1;
      const currentAvgGain = question.averageInformationGain
        ? Number(question.averageInformationGain)
        : 0;
      const newAvgGain =
        informationGain !== undefined
          ? (currentAvgGain * question.timesAsked + informationGain) /
            newTimesAsked
          : currentAvgGain;

      await server.prisma.suggestedQuestion.update({
        where: { id: questionId },
        data: {
          timesAsked: newTimesAsked,
          averageInformationGain: newAvgGain,
        },
      });

      return {
        success: true,
        question: {
          id: question.id,
          timesAsked: newTimesAsked,
          averageInformationGain: newAvgGain,
        },
      };
    },
  });
}
