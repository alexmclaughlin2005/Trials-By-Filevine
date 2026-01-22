import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface PersonaReaction {
  personaId: string;
  personaName: string;
  initialReaction: string;
  sentimentScore: number;
  concerns: string[];
  questions: string[];
  persuasiveElements: string[];
  weaknesses: string[];
  verdictLean?: 'favorable' | 'neutral' | 'unfavorable';
  confidence: number;
}

interface DeliberationExchange {
  speakerPersona: string;
  statement: string;
  influence: string[];
  tension?: string;
}

interface DeliberationSummary {
  keyDebatePoints: string[];
  influentialPersonas: string[];
  exchanges: DeliberationExchange[];
  consensusAreas: string[];
  divisiveIssues: string[];
}

interface Recommendation {
  priority: number;
  category: string;
  title: string;
  description: string;
  affectedPersonas: string[];
}

interface FocusGroupResult {
  overallReception: string;
  averageSentiment: number;
  personaReactions: PersonaReaction[];
  deliberationSummary?: DeliberationSummary;
  recommendations: Recommendation[];
  strengthsToEmphasize: string[];
  weaknessesToAddress: string[];
}

interface SimulateFocusGroupInput {
  caseId: string;
  argumentId: string;
  personaIds?: string[];
  simulationMode?: 'quick' | 'detailed' | 'deliberation';
}

interface SimulateFocusGroupResponse {
  sessionId: string;
  result: FocusGroupResult;
}

export function useFocusGroupSimulation() {
  return useMutation({
    mutationFn: async (input: SimulateFocusGroupInput) => {
      const data = await apiClient.post<SimulateFocusGroupResponse>(
        '/focus-groups/simulate',
        input
      );
      return data;
    },
  });
}

interface FocusGroupSession {
  id: string;
  caseId: string;
  name: string;
  description: string;
  panelType: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  _count: {
    personas: number;
    results: number;
    recommendations: number;
  };
}

export function useFocusGroupSessions(caseId: string) {
  return useQuery({
    queryKey: ['focus-group-sessions', caseId],
    queryFn: async () => {
      const data = await apiClient.get<{ sessions: FocusGroupSession[] }>(
        `/focus-groups/case/${caseId}`
      );
      return data.sessions;
    },
    enabled: !!caseId,
  });
}

export function useFocusGroupSession(sessionId: string) {
  return useQuery({
    queryKey: ['focus-group-session', sessionId],
    queryFn: async () => {
      const data = await apiClient.get<{ session: any }>(`/focus-groups/${sessionId}`);
      return data.session;
    },
    enabled: !!sessionId,
  });
}
