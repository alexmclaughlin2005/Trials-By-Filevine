// Focus Group Configuration Types

export type ArchetypeSelectionMode = 'random' | 'configured' | 'case_matched';

export type ConfigurationStep = 'setup' | 'panel' | 'arguments' | 'questions' | 'review' | 'ready';

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
  targetArchetypes?: string[]; // Empty or null = all archetypes
}

export interface SelectedArchetype {
  name: string;
  description?: string;
  source?: 'system' | 'case_juror';
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
  archetypeSelectionMode: ArchetypeSelectionMode;
  selectedArchetypes: SelectedArchetype[] | null;
  archetypeCount: number;
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

export interface ArchetypeOption {
  name: string;
  description: string;
  category?: string;
  source?: 'system' | 'case_juror';
  jurorName?: string;
  confidence?: number;
}

export interface FocusGroupConfigUpdate {
  name?: string;
  description?: string;
  archetypeSelectionMode?: ArchetypeSelectionMode;
  selectedArchetypes?: SelectedArchetype[];
  archetypeCount?: number;
  selectedArguments?: SelectedArgument[];
  customQuestions?: CustomQuestion[];
  configurationStep?: ConfigurationStep;
}
