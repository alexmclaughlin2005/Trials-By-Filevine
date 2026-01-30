import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface DiscriminativeQuestion {
  id?: string;
  questionText: string;
  questionCategory: string;
  discriminatesBetween: {
    personaAId: string;
    personaAName: string;
    personaBId: string;
    personaBName: string;
  };
  responseInterpretations: Record<string, {
    interpretation: string;
    expectedSignals: string[];
  }>;
  followUpQuestions?: string[];
  priorityScore: number;
  priorityRationale?: string;
  informationGain?: number;
}

export interface SuggestedQuestion {
  id: string;
  caseId: string;
  targetType: 'JUROR' | 'PANEL';
  targetJurorId?: string;
  questionText: string;
  questionCategory: string;
  discriminatesBetween: any;
  responseInterpretations: any;
  followUpQuestions?: any;
  priorityScore: number;
  priorityRationale?: string;
  timesAsked: number;
  averageInformationGain?: number;
  createdAt: string;
}

export function useSuggestedQuestionsForJuror(jurorId: string | null) {
  return useQuery({
    queryKey: ['suggested-questions', 'juror', jurorId],
    queryFn: async () => {
      if (!jurorId) return [];
      const data = await apiClient.get<{ questions: SuggestedQuestion[] }>(
        `/questions/jurors/${jurorId}/suggested-questions`
      );
      return data.questions;
    },
    enabled: !!jurorId,
  });
}

export function useSuggestedQuestionsForCase(caseId: string | null) {
  return useQuery({
    queryKey: ['suggested-questions', 'case', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const data = await apiClient.get<{ questions: SuggestedQuestion[] }>(
        `/questions/cases/${caseId}/suggested-questions`
      );
      return data.questions;
    },
    enabled: !!caseId,
  });
}

export function useGenerateJurorQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jurorId, organizationId }: { jurorId: string; organizationId: string }) => {
      const data = await apiClient.get<{ questions: DiscriminativeQuestion[] }>(
        `/questions/jurors/${jurorId}/suggested-questions?organizationId=${organizationId}`
      );
      return data.questions;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suggested-questions', 'juror', variables.jurorId] });
    },
  });
}

export function useGeneratePanelQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, jurorIds, organizationId }: { caseId: string; jurorIds: string[]; organizationId: string }) => {
      const data = await apiClient.get<{ questions: DiscriminativeQuestion[] }>(
        `/questions/cases/${caseId}/panel-questions?jurorIds=${jurorIds.join(',')}&organizationId=${organizationId}`
      );
      return data.questions;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suggested-questions', 'case', variables.caseId] });
    },
  });
}

export function useRecordQuestionUsage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questionId: string) => {
      return await apiClient.post(`/questions/questions/${questionId}/record-usage`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-questions'] });
    },
  });
}
