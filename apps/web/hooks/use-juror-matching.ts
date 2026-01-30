import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface EnsembleMatch {
  personaId: string;
  personaName?: string;
  personaDescription?: string;
  personaArchetype?: string;
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
  mappingId?: string; // ID of the JurorPersonaMapping record
  isConfirmed?: boolean; // Whether this match has been confirmed by the user
  matchRank?: number; // Rank/position in match results (1-5)
}

export interface MatchJurorInput {
  jurorId: string;
  personaIds?: string[];
  regenerate?: boolean; // If true, forces regeneration of all matches
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
      // Call GET endpoint to retrieve stored matches
      // This returns persistent matches from the database
      const data = await apiClient.get<{ success: boolean; matches: EnsembleMatch[]; count: number }>(
        `/matching/jurors/${jurorId}/matches`
      );
      
      return data.matches || [];
    },
    enabled: !!jurorId,
  });
}

export function useMatchJuror() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MatchJurorInput & { regenerate?: boolean }) => {
      // Use POST endpoint to run matching and store results
      // Set regenerate=true to force recalculation
      const regenerate = input.regenerate !== false; // Default to true for regeneration
      const queryParams = new URLSearchParams();
      if (input.personaIds && input.personaIds.length > 0) {
        input.personaIds.forEach(id => queryParams.append('personaIds', id));
      }
      if (regenerate) {
        queryParams.append('regenerate', 'true');
      }
      
      const url = `/matching/jurors/${input.jurorId}/match${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const data = await apiClient.post<{ success: boolean; matches: EnsembleMatch[]; count: number }>(
        url,
        {}
      );
      
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
          action: 'confirm',
        });
      } else {
        // If no mappingId provided, find the mapping for this persona
        // Get current matches to find the mappingId
        const matchesData = await apiClient.get(`/matching/jurors/${jurorId}/matches`);
        const match = matchesData.matches?.find((m: any) => m.personaId === personaId);
        if (match?.mappingId) {
          return await apiClient.post(`/matching/jurors/${jurorId}/matches/${match.mappingId}/confirm`, {
            action: 'confirm',
          });
        }
        // If still no mappingId, create a new match and then confirm it
        const matchData = await apiClient.post(`/matching/jurors/${jurorId}/match`, {
          personaIds: [personaId],
        });
        const newMatch = matchData.matches?.find((m: any) => m.personaId === personaId);
        if (newMatch?.mappingId) {
          return await apiClient.post(`/matching/jurors/${jurorId}/matches/${newMatch.mappingId}/confirm`, {
            action: 'confirm',
          });
        }
        throw new Error('Failed to find or create mapping to confirm');
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
