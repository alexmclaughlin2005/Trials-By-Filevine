import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface VoirDireResponse {
  id: string;
  jurorId: string;
  questionId: string | null;
  questionText: string;
  responseSummary: string;
  responseTimestamp: string;
  enteredBy: string;
  entryMethod: 'TYPED' | 'VOICE_TO_TEXT' | 'QUICK_SELECT';
  createdAt: string;
  extractedSignals: Array<{
    id: string;
    signalId: string;
    signalName: string;
    value: any;
    confidence: number;
  }>;
  personaImpacts: Array<{
    id: string;
    personaId: string;
    personaName: string;
    probabilityDelta: number;
    previousProbability: number | null;
    newProbability: number;
    updatedAt: string;
  }>;
}

export interface CreateVoirDireResponseInput {
  questionId?: string;
  questionText: string;
  responseSummary: string;
  entryMethod?: 'TYPED' | 'VOICE_TO_TEXT' | 'QUICK_SELECT';
  responseTimestamp?: string;
}

export interface UpdateVoirDireResponseInput {
  questionText?: string;
  responseSummary?: string;
  entryMethod?: 'TYPED' | 'VOICE_TO_TEXT' | 'QUICK_SELECT';
  responseTimestamp?: string;
}

export interface VoirDireResponsesResponse {
  success: boolean;
  responses: VoirDireResponse[];
  count: number;
}

export interface VoirDireResponseResponse {
  success: boolean;
  response: VoirDireResponse;
}

/**
 * Get all voir dire responses for a juror
 */
export function useVoirDireResponses(
  jurorId: string | null,
  options?: {
    limit?: number;
    offset?: number;
    orderBy?: 'timestamp' | 'created';
    order?: 'asc' | 'desc';
  }
) {
  return useQuery({
    queryKey: ['voir-dire-responses', jurorId, options],
    queryFn: async () => {
      if (!jurorId) return null;

      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.orderBy) params.append('orderBy', options.orderBy);
      if (options?.order) params.append('order', options.order);

      const queryString = params.toString();
      const data = await apiClient.get<VoirDireResponsesResponse>(
        `/jurors/${jurorId}/voir-dire-responses${queryString ? `?${queryString}` : ''}`
      );
      return data;
    },
    enabled: !!jurorId,
  });
}

/**
 * Create a new voir dire response
 */
export function useCreateVoirDireResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jurorId,
      input,
    }: {
      jurorId: string;
      input: CreateVoirDireResponseInput;
    }) => {
      const data = await apiClient.post<VoirDireResponseResponse>(
        `/jurors/${jurorId}/voir-dire-responses`,
        input
      );
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate voir dire responses query
      queryClient.invalidateQueries({
        queryKey: ['voir-dire-responses', variables.jurorId],
      });
      // Also invalidate juror matches since persona matches may have updated
      queryClient.invalidateQueries({
        queryKey: ['juror-matches', variables.jurorId],
      });
      // Invalidate signals since new signals may have been extracted
      queryClient.invalidateQueries({
        queryKey: ['juror-signals', variables.jurorId],
      });
    },
  });
}

/**
 * Update a voir dire response
 */
export function useUpdateVoirDireResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jurorId,
      responseId,
      input,
    }: {
      jurorId: string;
      responseId: string;
      input: UpdateVoirDireResponseInput;
    }) => {
      const data = await apiClient.patch<VoirDireResponseResponse>(
        `/jurors/${jurorId}/voir-dire-responses/${responseId}`,
        input
      );
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate voir dire responses query
      queryClient.invalidateQueries({
        queryKey: ['voir-dire-responses', variables.jurorId],
      });
      // Also invalidate juror matches since persona matches may have updated
      queryClient.invalidateQueries({
        queryKey: ['juror-matches', variables.jurorId],
      });
      // Invalidate signals since signals may have been re-extracted
      queryClient.invalidateQueries({
        queryKey: ['juror-signals', variables.jurorId],
      });
    },
  });
}

/**
 * Delete a voir dire response
 */
export function useDeleteVoirDireResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jurorId,
      responseId,
    }: {
      jurorId: string;
      responseId: string;
    }) => {
      await apiClient.delete(`/jurors/${jurorId}/voir-dire-responses/${responseId}`);
      return { success: true };
    },
    onSuccess: (_, variables) => {
      // Invalidate voir dire responses query
      queryClient.invalidateQueries({
        queryKey: ['voir-dire-responses', variables.jurorId],
      });
    },
  });
}
