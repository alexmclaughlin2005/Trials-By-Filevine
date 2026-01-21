// Case-related types

export interface CreateCaseInput {
  name: string;
  caseNumber?: string;
  jurisdiction?: string;
  venue?: string;
  trialDate?: Date | string;
  caseType?: CaseType;
  plaintiffName?: string;
  defendantName?: string;
  ourSide?: 'plaintiff' | 'defendant';
}

export interface UpdateCaseInput {
  name?: string;
  caseNumber?: string;
  jurisdiction?: string;
  venue?: string;
  trialDate?: Date | string;
  caseType?: CaseType;
  plaintiffName?: string;
  defendantName?: string;
  ourSide?: 'plaintiff' | 'defendant';
  status?: CaseStatus;
}

export type CaseType = 'civil' | 'criminal' | 'family';
export type CaseStatus = 'active' | 'archived' | 'closed';

export interface CaseFact {
  id: string;
  caseId: string;
  content: string;
  factType: 'background' | 'disputed' | 'undisputed';
  source?: string;
  sortOrder: number;
}

export interface CreateCaseFactInput {
  content: string;
  factType: 'background' | 'disputed' | 'undisputed';
  source?: string;
  sortOrder?: number;
}

export interface CaseArgument {
  id: string;
  caseId: string;
  argumentType: 'opening' | 'closing' | 'theme' | 'rebuttal';
  title: string;
  content: string;
  version: number;
  isCurrent: boolean;
  parentId?: string;
  changeNotes?: string;
}

export interface CreateArgumentInput {
  argumentType: 'opening' | 'closing' | 'theme' | 'rebuttal';
  title: string;
  content: string;
}

export interface CreateArgumentVersionInput {
  content: string;
  changeNotes?: string;
}

export interface CaseWitness {
  id: string;
  caseId: string;
  name: string;
  role: 'fact' | 'expert' | 'character';
  affiliation: 'plaintiff' | 'defendant' | 'neutral';
  summary?: string;
  directOutline?: string;
  crossOutline?: string;
  sortOrder: number;
}

export interface CreateWitnessInput {
  name: string;
  role: 'fact' | 'expert' | 'character';
  affiliation: 'plaintiff' | 'defendant' | 'neutral';
  summary?: string;
  directOutline?: string;
  crossOutline?: string;
  sortOrder?: number;
}
