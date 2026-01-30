import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Signal {
  id: string;
  signalId: string;
  name: string;
  category: string;
  extractionMethod: string;
  valueType: string;
  description?: string;
}

export interface JurorSignal {
  id: string;
  signalId: string;
  signal: Signal;
  value: any;
  source: string;
  sourceReference?: string;
  confidence: number;
  extractedAt: string;
}

export function useJurorSignals(jurorId: string | null) {
  return useQuery({
    queryKey: ['juror-signals', jurorId],
    queryFn: async () => {
      if (!jurorId) return [];
      const data = await apiClient.get<{ signals: JurorSignal[] }>(
        `/signals/jurors/${jurorId}`
      );
      return data.signals;
    },
    enabled: !!jurorId,
  });
}

export function useJurorSignalsByCategory(jurorId: string | null, category: string | null) {
  return useQuery({
    queryKey: ['juror-signals', jurorId, category],
    queryFn: async () => {
      if (!jurorId || !category) return [];
      const data = await apiClient.get<{ signals: JurorSignal[] }>(
        `/signals/jurors/${jurorId}?category=${category}`
      );
      return data.signals;
    },
    enabled: !!jurorId && !!category,
  });
}
