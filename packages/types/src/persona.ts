// Persona types

export interface Persona {
  id: string;
  organizationId?: string;
  name: string;
  description: string;
  sourceType: 'system' | 'ai_generated' | 'user_created';
  attributes?: Record<string, unknown>;
  signals?: Record<string, unknown>;
  persuasionLevers?: Record<string, unknown>;
  pitfalls?: Record<string, unknown>;
  isActive: boolean;
  version: number;
}

export interface CreatePersonaInput {
  name: string;
  description: string;
  attributes?: Record<string, unknown>;
  signals?: Record<string, unknown>;
  persuasionLevers?: Record<string, unknown>;
  pitfalls?: Record<string, unknown>;
}

export interface UpdatePersonaInput {
  name?: string;
  description?: string;
  attributes?: Record<string, unknown>;
  signals?: Record<string, unknown>;
  persuasionLevers?: Record<string, unknown>;
  pitfalls?: Record<string, unknown>;
  isActive?: boolean;
}

export interface JurorPersonaMapping {
  id: string;
  jurorId: string;
  personaId: string;
  mappingType: 'primary' | 'secondary';
  source: 'ai_suggested' | 'user_assigned';
  confidence: number;
  rationale?: string;
  counterfactual?: string;
  isConfirmed: boolean;
  confirmedBy?: string;
  confirmedAt?: Date;
}

export interface CreatePersonaMappingInput {
  jurorId: string;
  personaId: string;
  mappingType: 'primary' | 'secondary';
  source: 'ai_suggested' | 'user_assigned';
  confidence: number;
  rationale?: string;
  counterfactual?: string;
}

export interface ConfirmPersonaMappingInput {
  mappingId: string;
}

// Focus Group types
export interface FocusGroupSession {
  id: string;
  caseId: string;
  name: string;
  description?: string;
  panelType: 'generic' | 'case_matched' | 'custom';
  argumentId?: string;
  status: 'draft' | 'running' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
}

export interface CreateFocusGroupInput {
  caseId: string;
  name: string;
  description?: string;
  panelType: 'generic' | 'case_matched' | 'custom';
  argumentId?: string;
  personaIds?: string[]; // For custom panels
}

export interface RunFocusGroupInput {
  sessionId: string;
  argument: string;
}

export interface FocusGroupResult {
  id: string;
  sessionId: string;
  personaId: string;
  reactionSummary: string;
  sentimentScore: number;
  concerns?: Record<string, unknown>;
  questions?: Record<string, unknown>;
  verdictLean?: 'plaintiff' | 'defendant' | 'undecided';
  confidence?: number;
}

export interface FocusGroupRecommendation {
  id: string;
  sessionId: string;
  recommendationType: 'weakness' | 'strength' | 'reframe' | 'add_evidence';
  priority: number;
  title: string;
  description: string;
  affectedPersonas: string[];
  isAddressed: boolean;
}
