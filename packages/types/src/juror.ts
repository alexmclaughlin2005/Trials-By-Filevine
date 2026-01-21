// Juror and jury panel types

export interface JuryPanel {
  id: string;
  caseId: string;
  panelDate: Date;
  source?: string;
  version: number;
  totalJurors: number;
  status: 'draft' | 'active' | 'completed';
}

export interface CreateJuryPanelInput {
  caseId: string;
  panelDate: Date | string;
  source?: string;
}

export interface Juror {
  id: string;
  panelId: string;
  jurorNumber?: string;
  firstName: string;
  lastName: string;
  age?: number;
  occupation?: string;
  employer?: string;
  city?: string;
  zipCode?: string;
  questionnaireData?: Record<string, unknown>;
  status: JurorStatus;
  strikeReason?: string;
  keepPriority?: number;
  strikePriority?: number;
  notes?: string;
}

export type JurorStatus =
  | 'available'
  | 'questioned'
  | 'struck_for_cause'
  | 'peremptory_strike'
  | 'seated'
  | 'alternate'
  | 'dismissed';

export interface CreateJurorInput {
  panelId: string;
  jurorNumber?: string;
  firstName: string;
  lastName: string;
  age?: number;
  occupation?: string;
  employer?: string;
  city?: string;
  zipCode?: string;
  questionnaireData?: Record<string, unknown>;
}

export interface UpdateJurorInput {
  jurorNumber?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  occupation?: string;
  employer?: string;
  city?: string;
  zipCode?: string;
  questionnaireData?: Record<string, unknown>;
  status?: JurorStatus;
  strikeReason?: string;
  keepPriority?: number;
  strikePriority?: number;
  notes?: string;
}

export interface BulkImportJurorInput {
  jurors: Omit<CreateJurorInput, 'panelId'>[];
}

export interface ResearchArtifact {
  id: string;
  jurorId: string;
  sourceType: string;
  sourceUrl?: string;
  sourceName?: string;
  retrievedAt: Date;
  rawContent?: string;
  extractedSnippets?: Record<string, unknown>;
  signals?: Record<string, unknown>;
  matchConfidence?: number;
  matchRationale?: string;
  userAction: 'pending' | 'confirmed' | 'rejected' | 'uncertain';
  actionedBy?: string;
  actionedAt?: Date;
}

export interface InitiateResearchInput {
  jurorId: string;
  sources?: string[]; // Optional: specific sources to search
}
