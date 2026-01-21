// AI service types - Standard response format for all AI services

export interface AIResponse<T = unknown> {
  result: T;
  confidence: number; // 0.0 - 1.0
  rationale: string;
  sources: AISource[];
  counterfactual: string;
  modelVersion: string;
  latencyMs: number;
}

export interface AISource {
  sourceType: string;
  artifactId?: string;
  url?: string;
  snippet: string;
  relevance: string;
  timestamp?: string;
}

// Persona Suggestion AI Response
export interface PersonaSuggestion {
  primary: PersonaMatch;
  secondary?: PersonaMatch[];
}

export interface PersonaMatch {
  personaId: string;
  personaName: string;
  mappingType: 'primary' | 'secondary';
}

// Question Generation AI Response
export interface GeneratedQuestions {
  questions: VoirDireQuestion[];
  strategy: string;
}

export interface VoirDireQuestion {
  question: string;
  purpose: string; // What this question reveals
  targetPersonas: string[];
  followUps: FollowUpQuestion[];
  redFlags: string[]; // Answers that indicate concern
}

export interface FollowUpQuestion {
  condition: string; // When to ask this
  question: string;
}

// Focus Group Simulation AI Response
export interface FocusGroupSimulation {
  personaReactions: PersonaReaction[];
  overallVerdict: {
    plaintiffFavor: number; // 0.0 - 1.0
    defendantFavor: number;
    undecided: number;
  };
  criticalWeaknesses: string[];
  recommendations: string[];
}

export interface PersonaReaction {
  personaId: string;
  personaName: string;
  reaction: string;
  sentimentScore: number; // -1.0 to 1.0
  concerns: string[];
  questions: string[];
  verdictLean: 'plaintiff' | 'defendant' | 'undecided';
}

// Trial Insight AI Response
export interface TrialInsight {
  insights: Insight[];
  momentTags: MomentTag[];
  suggestedActions: string[];
}

export interface Insight {
  type: 'persona_signal' | 'credibility' | 'opportunity' | 'risk';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affectedPersonas: string[];
  timestamp: number; // milliseconds
}

export interface MomentTag {
  timestamp: number;
  tag: string;
  description: string;
}

// Research Summary AI Response
export interface ResearchSummary {
  signals: ResearchSignal[];
  summary: string;
  keyFindings: string[];
}

export interface ResearchSignal {
  signalType: string;
  value: string;
  confidence: number;
  sourceId: string;
}
