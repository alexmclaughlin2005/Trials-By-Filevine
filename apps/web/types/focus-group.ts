// Focus Group Configuration Types

export type PanelSelectionMode = 'random' | 'configured' | 'case_matched';

export type ConfigurationStep = 'setup' | 'panel' | 'arguments' | 'questions' | 'review' | 'confirm' | 'ready';

export interface SelectedArgument {
  argumentId: string;
  order: number;
  title: string;
  content: string;
  argumentType: string;
}

export interface CustomQuestion {
  id: string;
  question: string;
  order: number;
  targetPersonas?: string[]; // Empty or null = all personas
  metadata?: {
    source?: 'ai' | 'custom' | 'ai-auto';
    argumentTitle?: string;
    purpose?: string;
    argumentId?: string;
  };
}

export interface SuggestedQuestion {
  id: string;
  question: string;
  purpose: string;
  targetArchetypes: string[];
  argumentId: string;
  argumentTitle: string;
  isAISuggested: true;
}

export interface SelectedPersona {
  id: string;
  name: string;
  nickname?: string;
  description?: string;
  tagline?: string;
  archetype: string;
  archetypeStrength?: number;
  demographics?: any;
  plaintiffDangerLevel?: number;
  defenseDangerLevel?: number;
  source?: 'system' | 'case_juror' | 'organization';
  jurorId?: string;
  jurorName?: string;
  confidence?: number;
}

export interface FocusGroupSession {
  id: string;
  caseId: string;
  name: string;
  description: string | null;
  panelType: string;
  argumentId: string | null;
  simulationMode: 'quick' | 'detailed' | 'deliberation';

  // Configuration
  panelSelectionMode: PanelSelectionMode;
  selectedPersonas: SelectedPersona[] | null;
  panelSize: number;
  selectedArguments: SelectedArgument[] | null;
  customQuestions: CustomQuestion[] | null;
  configurationStep: ConfigurationStep;

  // Status
  status: 'draft' | 'running' | 'completed';
  startedAt: string | null;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaOption {
  id: string;
  name: string;
  nickname?: string;
  description: string;
  tagline?: string;
  archetype: string;
  archetypeStrength?: number;
  demographics?: any;
  plaintiffDangerLevel?: number;
  defenseDangerLevel?: number;
  sourceType?: string;
  source?: 'system' | 'case_juror' | 'organization';
  jurorName?: string;
  confidence?: number;
}

export interface FocusGroupConfigUpdate {
  name?: string;
  description?: string;
  panelSelectionMode?: PanelSelectionMode;
  selectedPersonas?: SelectedPersona[];
  panelSize?: number;
  selectedArguments?: SelectedArgument[];
  customQuestions?: CustomQuestion[];
  configurationStep?: ConfigurationStep;
}

// Roundtable Conversation Types

export interface ConversationStatement {
  id: string;
  personaId: string;
  personaName: string;
  sequenceNumber: number;
  content: string;
  questionId?: string | null;
  sentiment?: string | null;
  emotionalIntensity?: number | null;
  keyPoints?: any;
  addressedTo?: string[];
  agreementSignals?: string[];
  disagreementSignals?: string[];
  speakCount: number;
  createdAt: string;
}

export type PersonaPosition = 'favorable' | 'neutral' | 'unfavorable' | 'mixed';
export type InfluenceLevel = 'high' | 'medium' | 'low';

export interface PersonaDetails {
  description: string;
  tagline?: string | null;
  archetype?: string | null;
  archetypeStrength?: number | null;
  secondaryArchetype?: string | null;
  variant?: string | null;
  demographics?: any;
  attributes?: any;
  leadershipLevel?: string | null;
  communicationStyle?: string | null;
}

export interface PersonaSummary {
  personaId: string;
  personaName: string;
  totalStatements: number;
  firstStatement: string;
  lastStatement: string;
  initialPosition: PersonaPosition;
  finalPosition: PersonaPosition;
  positionShifted: boolean;
  shiftDescription?: string;
  mainPoints: string[];
  concernsRaised: string[];
  questionsAsked: string[];
  influenceLevel: InfluenceLevel;
  agreedWithMost: string[];
  disagreedWithMost: string[];
  influencedBy: string[];
  averageSentiment: string;
  averageEmotionalIntensity: number;
  mostEmotionalStatement?: string;
  summary: string;
  statements: ConversationStatement[];
  persona?: PersonaDetails | null;
}

export interface InfluentialPersona {
  personaId: string;
  personaName: string;
  influenceType: string;
  influenceReason: string;
}

export interface OverallAnalysis {
  consensusAreas: string[];
  fracturePoints: string[];
  keyDebatePoints: string[];
  influentialPersonas: InfluentialPersona[];
}

export interface ConversationDetail {
  id: string;
  argumentId: string;
  argumentTitle: string;
  startedAt: string;
  completedAt: string | null;
  converged: boolean;
  convergenceReason?: string | null;
  personaSummaries: PersonaSummary[];
  overallAnalysis: OverallAnalysis;
  allStatements: ConversationStatement[];
  customQuestions?: CustomQuestion[];
}
