import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Persona {
  id: string;
  name: string;
  description: string;
  type: string;
  attributes: Record<string, unknown>;
}

interface PersonaSuggestion {
  persona: Persona;
  confidence: number;
  reasoning: string;
  keyMatches: string[];
  potentialConcerns: string[];
}

interface SuggestPersonasInput {
  jurorId: string;
  caseId?: string;
}

interface SuggestPersonasResponse {
  suggestions: PersonaSuggestion[];
}

export function usePersonaSuggestions() {
  return useMutation({
    mutationFn: async (input: SuggestPersonasInput) => {
      const data = await apiClient.post<SuggestPersonasResponse>('/personas/suggest', input);
      return data.suggestions;
    },
  });
}
