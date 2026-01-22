import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface PersonaSignal {
  category: string;
  signal: string;
  confidence: number;
  evidence: string[];
  relevance: string;
}

interface ExtractedSnippet {
  text: string;
  context: string;
  relevance: 'high' | 'medium' | 'low';
}

interface SummarizedArtifact {
  artifactId: string;
  summary: string;
  personaSignals: PersonaSignal[];
  extractedSnippets: ExtractedSnippet[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  keyThemes: string[];
  warnings?: string[];
}

interface SummarizeInput {
  jurorId: string;
  artifactIds?: string[];
}

interface SummarizeResponse {
  summaries: SummarizedArtifact[];
  message?: string;
}

export function useResearchSummarizer() {
  return useMutation({
    mutationFn: async (input: SummarizeInput) => {
      const data = await apiClient.post<SummarizeResponse>('/research/summarize', input);
      return data;
    },
  });
}

interface BatchSummarizeInput {
  caseId: string;
}

interface BatchSummarizeResponse {
  processed: number;
  message: string;
}

export function useBatchResearchSummarizer() {
  return useMutation({
    mutationFn: async (input: BatchSummarizeInput) => {
      const data = await apiClient.post<BatchSummarizeResponse>('/research/batch-summarize', input);
      return data;
    },
  });
}
