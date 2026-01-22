/**
 * Archetype Classifier Hooks
 *
 * React Query hooks for archetype classification and panel analysis
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface DimensionScores {
  attribution_orientation: number;
  just_world_belief: number;
  authoritarianism: number;
  institutional_trust: {
    corporations: number;
    medical: number;
    legal_system: number;
    insurance: number;
  };
  litigation_attitude: number;
  leadership_tendency: number;
  cognitive_style: number;
  damages_orientation: number;
}

export interface ArchetypeMatch {
  archetype: string;
  archetypeName: string;
  confidence: number;
  strength: number;
  reasoning: string;
  keyIndicators: string[];
  concerns: string[];
  dimensionScores: DimensionScores;
}

export interface ClassificationResult {
  primary: ArchetypeMatch;
  secondary?: ArchetypeMatch;
  allMatches: ArchetypeMatch[];
  recommendations: {
    plaintiffDangerLevel: number;
    defenseDangerLevel: number;
    causeChallenge?: {
      vulnerability: number;
      suggestedQuestions: string[];
    };
    voirDireQuestions: string[];
  };
  classifiedAt: Date;
}

export interface ClassifyJurorInput {
  jurorId: string;
  includeResearch?: boolean;
  caseType?: string;
  jurisdiction?: string;
  ourSide?: 'plaintiff' | 'defense';
}

export interface ClassifyJurorResponse {
  jurorId: string;
  classification: ClassificationResult;
}

export interface PanelAnalysis {
  panelId: string;
  caseId: string;
  caseName: string;
  ourSide: string;
  totalJurors: number;
  classifiedJurors: number;
  composition: Array<{
    archetype: string;
    count: number;
    percentage: number;
  }>;
  favorability: {
    plaintiffDangerAverage: string;
    defenseDangerAverage: string;
    recommendation: string;
  };
  jurors: Array<{
    id: string;
    jurorNumber: string;
    firstName: string;
    lastName: string;
    classifiedArchetype: string;
    archetypeConfidence: number;
    status: string;
  }>;
}

export interface ArchetypeInfo {
  archetype: string;
  personas: Array<{
    id: string;
    name: string;
    nickname: string;
    description: string;
    tagline: string;
    archetypeStrength: number;
    variant: string;
    plaintiffDangerLevel: number;
    defenseDangerLevel: number;
  }>;
  influence: Record<string, number> | null;
}

// ============================================
// HOOKS
// ============================================

/**
 * Classify an existing juror
 */
export function useClassifyJuror() {
  return useMutation({
    mutationFn: async (input: ClassifyJurorInput) => {
      const data = await apiClient.post<ClassifyJurorResponse>(
        '/archetypes/classify/juror',
        input
      );
      return data;
    },
  });
}

/**
 * Get panel composition analysis
 */
export function usePanelAnalysis(panelId: string | undefined) {
  return useQuery({
    queryKey: ['panel-analysis', panelId],
    queryFn: async () => {
      if (!panelId) throw new Error('Panel ID required');
      const data = await apiClient.get<PanelAnalysis>(
        `/archetypes/panel-analysis/${panelId}`
      );
      return data;
    },
    enabled: !!panelId,
  });
}

/**
 * Get detailed archetype information
 */
export function useArchetypeInfo(archetype: string | undefined) {
  return useQuery({
    queryKey: ['archetype-info', archetype],
    queryFn: async () => {
      if (!archetype) throw new Error('Archetype required');
      const data = await apiClient.get<ArchetypeInfo>(
        `/archetypes/info/${archetype}`
      );
      return data;
    },
    enabled: !!archetype,
  });
}

/**
 * Get archetype configuration
 */
export function useArchetypeConfig(configType: string) {
  return useQuery({
    queryKey: ['archetype-config', configType],
    queryFn: async () => {
      const data = await apiClient.get<{
        id: string;
        configType: string;
        version: string;
        data: any;
        description: string;
      }>(`/archetypes/config/${configType}`);
      return data;
    },
  });
}
