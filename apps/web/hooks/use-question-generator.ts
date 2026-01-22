import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface FollowUpQuestion {
  question: string;
  trigger: string;
  listenFor: string[];
}

interface VoirDireQuestion {
  question: string;
  purpose: string;
  targetPersonas: string[];
  category: string;
  listenFor: string[];
  redFlags: string[];
  idealAnswers: string[];
  followUps: FollowUpQuestion[];
  legalNotes?: string;
  priority: number;
}

interface QuestionSet {
  openingQuestions: VoirDireQuestion[];
  personaIdentificationQuestions: VoirDireQuestion[];
  caseSpecificQuestions: VoirDireQuestion[];
  challengeForCauseQuestions: VoirDireQuestion[];
  generalStrategy: string;
  timingNotes: string[];
}

interface GenerateQuestionsInput {
  caseId: string;
  targetPersonaIds?: string[];
  focusAreas?: string[];
  questionLimit?: number;
}

interface GenerateQuestionsResponse {
  questions: QuestionSet;
}

export function useQuestionGenerator() {
  return useMutation({
    mutationFn: async ({ caseId, ...input }: GenerateQuestionsInput) => {
      const data = await apiClient.post<GenerateQuestionsResponse>(
        `/cases/${caseId}/generate-questions`,
        input
      );
      return data.questions;
    },
  });
}
