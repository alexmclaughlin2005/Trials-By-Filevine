import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface EnsembleMatch {
  personaId: string;
  personaName?: string;
  personaDescription?: string;
  probability: number; // 0-1 combined probability
  confidence: number; // 0-1 overall confidence
  rationale: string;
  counterfactual: string;
  methodScores: {
    signalBased: number;
    embedding: number;
    bayesian: number;
  };
  methodConfidences: {
    signalBased: number;
    embedding: number;
    bayesian: number;
  };
  supportingSignals?: Array<{ signalId: string; signalName: string; value: any }>;
  contradictingSignals?: Array<{ signalId: string; signalName: string; value: any }>;
}

export interface MatchJurorInput {
  jurorId: string;
  personaIds?: string[];
}

export interface MatchJurorResponse {
  matches: EnsembleMatch[];
}

export interface JurorPersonaMapping {
  id: string;
  jurorId: string;
  personaId: string;
  personaName: string;
  confidence: number;
  isConfirmed: boolean;
  isOverridden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MatchBreakdown {
  jurorId: string;
  personaId: string;
  personaName: string;
  overallScore: number;
  overallConfidence: number;
  methodScores: EnsembleMatch['methodScores'];
  methodConfidences?: {
    signalBased: number;
    embedding: number;
    bayesian: number;
  };
  rationale: string;
  counterfactual: string;
  supportingSignals?: Array<{ signalId: string; signalName: string; value: any }>;
  contradictingSignals?: Array<{ signalId: string; signalName: string; value: any }>;
}

export function useJurorMatches(jurorId: string | null) {
  return useQuery({
    queryKey: ['juror-matches', jurorId],
    queryFn: async () => {
      if (!jurorId) return null;
      // Call POST endpoint to get fresh matches
      // Persona data is now included in the matching response to avoid rate limiting
      const data = await apiClient.post<{ success: boolean; matches: EnsembleMatch[]; count: number }>(
        `/matching/jurors/${jurorId}/match`,
        {}
      );
      
      return data.matches;
    },
    enabled: !!jurorId,
  });
}

export function useMatchJuror() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MatchJurorInput) => {
      const data = await apiClient.post<{ success: boolean; matches: EnsembleMatch[]; count: number }>(
        `/matching/jurors/${input.jurorId}/match`,
        { personaIds: input.personaIds }
      );
      
      // Persona data is now included in the matching response to avoid rate limiting
      return data.matches;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['juror-matches', variables.jurorId] });
    },
  });
}

export function useConfirmPersonaMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      jurorId,
      mappingId,
      personaId,
      confirmed,
    }: {
      jurorId: string;
      mappingId?: string;
      personaId: string;
      confirmed: boolean;
    }) => {
      if (mappingId) {
        return await apiClient.post(`/matching/jurors/${jurorId}/matches/${mappingId}/confirm`, {
          confirmed,
        });
      } else {
        // Create new mapping
        return await apiClient.post(`/matching/jurors/${jurorId}/match`, {
          personaIds: [personaId],
          confirmed,
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['juror-matches', variables.jurorId] });
    },
  });
}

export function useMatchBreakdown(jurorId: string | null, personaId: string | null) {
  return useQuery({
    queryKey: ['match-breakdown', jurorId, personaId],
    queryFn: async () => {
      if (!jurorId || !personaId) return null;
      const data = await apiClient.get<MatchBreakdown>(
        `/matching/jurors/${jurorId}/personas/${personaId}/breakdown`
      );
      return data;
    },
    enabled: !!jurorId && !!personaId,
  });
}
