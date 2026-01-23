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
