import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface CaseVoirDireQuestion {
  id: string;
  caseId: string;
  questionText: string;
  questionType: 'AI_GENERATED' | 'USER_CREATED';
  questionCategory: string | null;
  source: string | null;
  sortOrder: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  hasAnswer?: boolean;
  answerCount?: number;
}

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

export interface CaseVoirDireQuestionsResponse {
  success: boolean;
  questions: CaseVoirDireQuestion[];
  count: number;
}

export interface CaseVoirDireQuestionResponse {
  success: boolean;
  question: CaseVoirDireQuestion;
}

/**
 * Get all case-level voir dire questions for a case
 */
export function useCaseVoirDireQuestions(
  caseId: string | null,
  options?: {
    includeInactive?: boolean;
    jurorId?: string; // Include answer status for specific juror
  }
) {
  return useQuery({
    queryKey: ['case-voir-dire-questions', caseId, options],
    queryFn: async () => {
      if (!caseId) return null;

      const params = new URLSearchParams();
      if (options?.includeInactive) params.append('includeInactive', 'true');
      if (options?.jurorId) params.append('jurorId', options.jurorId);

      const queryString = params.toString();
      const data = await apiClient.get<CaseVoirDireQuestionsResponse>(
        `/cases/${caseId}/voir-dire-questions${queryString ? `?${queryString}` : ''}`
      );
      return data;
    },
    enabled: !!caseId,
  });
}

/**
 * Create a new case-level voir dire question
 */
export function useCreateCaseVoirDireQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      input,
    }: {
      caseId: string;
      input: CreateCaseVoirDireQuestionInput;
    }) => {
      const data = await apiClient.post<CaseVoirDireQuestionResponse>(
        `/cases/${caseId}/voir-dire-questions`,
        input
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['case-voir-dire-questions', variables.caseId],
      });
    },
  });
}

/**
 * Update a case-level voir dire question
 */
export function useUpdateCaseVoirDireQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      questionId,
      input,
    }: {
      caseId: string;
      questionId: string;
      input: UpdateCaseVoirDireQuestionInput;
    }) => {
      const data = await apiClient.patch<CaseVoirDireQuestionResponse>(
        `/cases/${caseId}/voir-dire-questions/${questionId}`,
        input
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['case-voir-dire-questions', variables.caseId],
      });
    },
  });
}

/**
 * Delete a case-level voir dire question
 */
export function useDeleteCaseVoirDireQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      questionId,
    }: {
      caseId: string;
      questionId: string;
    }) => {
      await apiClient.delete(`/cases/${caseId}/voir-dire-questions/${questionId}`);
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['case-voir-dire-questions', variables.caseId],
      });
    },
  });
}

/**
 * Generate AI voir dire questions for a case
 */
export function useGenerateAICaseVoirDireQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseId: string) => {
      const data = await apiClient.post<CaseVoirDireQuestionsResponse>(
        `/cases/${caseId}/voir-dire-questions/generate-ai`,
        {}
      );
      return data;
    },
    onSuccess: (_, caseId) => {
      queryClient.invalidateQueries({
        queryKey: ['case-voir-dire-questions', caseId],
      });
    },
  });
}

/**
 * Reorder case-level voir dire questions
 */
export function useReorderCaseVoirDireQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      questionIds,
    }: {
      caseId: string;
      questionIds: string[];
    }) => {
      await apiClient.post(`/cases/${caseId}/voir-dire-questions/reorder`, {
        questionIds,
      });
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['case-voir-dire-questions', variables.caseId],
      });
    },
  });
}
