/**
 * TypeScript Types for PDF Generation
 */

// Takeaways data structure (matches database schema)
export interface TakeawaysData {
  whatLanded: Array<{
    point: string;
    personaSupport: string[];
    evidence: string[];
  }>;
  whatConfused: Array<{
    point: string;
    personasConfused: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    evidence: string[];
  }>;
  whatBackfired: Array<{
    point: string;
    personasCritical: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    evidence: string[];
  }>;
  topQuestions: Array<{
    question: string;
    askedByCount: number;
    personaNames: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  recommendedEdits: Array<{
    editNumber: number;
    section: string;
    type: 'CLARIFY' | 'ADD' | 'REMOVE' | 'SOFTEN' | 'STRENGTHEN';
    originalText?: string;
    suggestedText: string;
    reason: string;
    affectedPersonas: string[];
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  promptVersion?: string;
  generatedAt?: Date | string;
}

// Conversation data structure
export interface ConversationData {
  id: string;
  argumentId: string;
  argumentTitle?: string;
  startedAt: Date | string;
  completedAt?: Date | string | null;
  converged: boolean;
  convergenceReason?: string | null;
  consensusAreas?: string[];
  fracturePoints?: string[];
  keyDebatePoints?: string[];
  influentialPersonas?: Array<{
    personaId: string;
    personaName: string;
    influenceType: string;
    influenceReason: string;
  }>;
}

// Persona summary data structure
export interface PersonaSummaryData {
  personaId: string;
  personaName: string;
  totalStatements: number;
  firstStatement?: string;
  lastStatement?: string;
  initialPosition: 'favorable' | 'neutral' | 'unfavorable' | 'mixed';
  finalPosition: 'favorable' | 'neutral' | 'unfavorable' | 'mixed';
  positionShifted: boolean;
  shiftDescription?: string;
  mainPoints: string[];
  concernsRaised: string[];
  questionsAsked: string[];
  influenceLevel: 'high' | 'medium' | 'low';
  agreedWithMost: string[];
  disagreedWithMost: string[];
  influencedBy: string[];
  averageSentiment: string;
  averageEmotionalIntensity: number;
  mostEmotionalStatement?: string;
  summary: string;
  persona?: {
    id: string;
    name: string;
    archetypeName?: string;
    description?: string;
  };
}

// Statement data structure
export interface StatementData {
  id: string;
  personaName: string;
  sequenceNumber: number;
  content: string;
  sentiment: 'plaintiff_leaning' | 'defense_leaning' | 'neutral' | 'conflicted';
  emotionalIntensity: number;
  keyPoints?: string[];
  addressedTo?: string[];
  agreementSignals?: string[];
  disagreementSignals?: string[];
  speakCount: number;
}

// Case info for PDF context
export interface CaseInfo {
  id: string;
  name: string;
  clientName?: string;
  caseNumber?: string;
  jurisdiction?: string;
}

// PDF export options
export interface PDFExportOptions {
  conversationId: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  format?: 'letter' | 'a4';
}

// Complete PDF data bundle
export interface TakeawaysPDFData {
  conversation: ConversationData;
  takeaways: TakeawaysData;
  caseInfo: CaseInfo;
  personaSummaries?: PersonaSummaryData[];
}

export interface PersonaSummaryPDFData {
  conversation: ConversationData;
  personaSummary: PersonaSummaryData;
  caseInfo: CaseInfo;
  statements?: StatementData[];
}

export interface TranscriptPDFData {
  conversation: ConversationData;
  statements: StatementData[];
  caseInfo: CaseInfo;
  personaSummaries?: PersonaSummaryData[];
}

// Persona insights data structure
export interface PersonaInsightData {
  personaId: string;
  personaName: string;
  caseInterpretation: string;
  keyBiases: string[];
  decisionDrivers: string[];
  persuasionStrategy: string;
  vulnerabilities: string[];
  strengths: string[];
}

export interface PersonaInsightsPDFData {
  conversation: ConversationData;
  personaSummary: PersonaSummaryData;
  personaInsight: PersonaInsightData;
  caseInfo: CaseInfo;
}
