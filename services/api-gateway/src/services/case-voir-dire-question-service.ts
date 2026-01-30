/**
 * Case Voir Dire Question Service
 * 
 * Handles business logic for case-level voir dire questions including:
 * - Creating and managing questions
 * - AI question generation
 * - Question organization and prioritization
 */

import { PrismaClient } from '@juries/database';

export interface CreateCaseVoirDireQuestionInput {
  questionText: string;
  questionType: 'AI_GENERATED' | 'USER_CREATED';
  questionCategory?: string;
  source?: string;
  sortOrder?: number;
}

export interface UpdateCaseVoirDireQuestionInput {
  questionText?: string;
  questionCategory?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export class CaseVoirDireQuestionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new case-level voir dire question
   */
  async createQuestion(
    caseId: string,
    data: CreateCaseVoirDireQuestionInput,
    userId: string
  ) {
    // Get current max sortOrder for this case
    const maxSortOrder = await this.prisma.caseVoirDireQuestion.findFirst({
      where: { caseId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return await this.prisma.caseVoirDireQuestion.create({
      data: {
        caseId,
        questionText: data.questionText,
        questionType: data.questionType,
        questionCategory: data.questionCategory || null,
        source: data.source || null,
        sortOrder: data.sortOrder ?? (maxSortOrder?.sortOrder ?? 0) + 1,
        createdBy: userId,
      },
    });
  }

  /**
   * List case-level voir dire questions
   */
  async listQuestions(caseId: string, options?: { includeInactive?: boolean }) {
    return await this.prisma.caseVoirDireQuestion.findMany({
      where: {
        caseId,
        ...(options?.includeInactive ? {} : { isActive: true }),
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Get a single question
   */
  async getQuestion(questionId: string) {
    return await this.prisma.caseVoirDireQuestion.findUnique({
      where: { id: questionId },
    });
  }

  /**
   * Update a question
   */
  async updateQuestion(questionId: string, data: UpdateCaseVoirDireQuestionInput) {
    const updateData: any = {};
    if (data.questionText !== undefined) updateData.questionText = data.questionText;
    if (data.questionCategory !== undefined) updateData.questionCategory = data.questionCategory;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await this.prisma.caseVoirDireQuestion.update({
      where: { id: questionId },
      data: updateData,
    });
  }

  /**
   * Delete a question
   */
  async deleteQuestion(questionId: string) {
    return await this.prisma.caseVoirDireQuestion.delete({
      where: { id: questionId },
    });
  }

  /**
   * Reorder questions
   */
  async reorderQuestions(caseId: string, questionIds: string[]) {
    const updates = questionIds.map((id, index) =>
      this.prisma.caseVoirDireQuestion.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await Promise.all(updates);
    return this.listQuestions(caseId);
  }

  /**
   * Get questions with answer counts for a specific juror
   */
  async getQuestionsWithAnswerStatus(caseId: string, jurorId: string) {
    const questions = await this.listQuestions(caseId);
    const responseQuestionIds = await this.prisma.voirDireResponse.findMany({
      where: {
        jurorId,
        questionType: 'CASE_LEVEL',
        questionId: { in: questions.map((q) => q.id) },
      },
      select: { questionId: true },
    });

    const answeredQuestionIds = new Set(
      responseQuestionIds.map((r) => r.questionId).filter((id): id is string => id !== null)
    );

    return questions.map((question) => ({
      ...question,
      hasAnswer: answeredQuestionIds.has(question.id),
      answerCount: responseQuestionIds.filter((r) => r.questionId === question.id).length,
    }));
  }
}
