import { PrismaClient } from '@juries/database';

/**
 * Signal Extraction Service
 * 
 * Extracts structured signals from various juror data sources:
 * - Questionnaire data (field mapping)
 * - Research artifacts (NLP classification)
 * - Voir dire responses (pattern matching + NLP)
 * 
 * Phase 1: Foundation - Signal System & Data Models
 */

export interface ExtractedSignal {
  signalId: string;
  value: any; // Based on signal's valueType
  confidence: number; // 0-1
  sourceReference?: string; // Field name, artifact ID, or response ID
}

export class SignalExtractorService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Extract signals from questionnaire data using field mapping
   */
  async extractFromQuestionnaire(
    jurorId: string,
    questionnaireData: Record<string, any>
  ): Promise<ExtractedSignal[]> {
    const extractedSignals: ExtractedSignal[] = [];

    // Get all signals that use FIELD_MAPPING extraction method
    const fieldMappingSignals = await this.prisma.signal.findMany({
      where: {
        extractionMethod: 'FIELD_MAPPING',
        sourceField: { not: null },
      },
    });

    for (const signal of fieldMappingSignals) {
      if (!signal.sourceField) continue;

      const fieldValue = questionnaireData[signal.sourceField];
      if (fieldValue === null || fieldValue === undefined) continue;

      // Match field value to signal
      const match = await this.matchFieldToSignal(signal, fieldValue);
      if (match) {
        extractedSignals.push({
          signalId: signal.signalId,
          value: this.normalizeValue(fieldValue, signal.valueType),
          confidence: match.confidence,
          sourceReference: signal.sourceField,
        });
      }
    }

    // Store extracted signals
    await this.storeSignals(jurorId, extractedSignals, 'QUESTIONNAIRE');

    return extractedSignals;
  }

  /**
   * Extract signals from research artifacts using NLP classification
   */
  async extractFromResearchArtifact(
    jurorId: string,
    artifactId: string,
    artifactContent: string
  ): Promise<ExtractedSignal[]> {
    const extractedSignals: ExtractedSignal[] = [];

    // Get all signals that use NLP_CLASSIFICATION
    const nlpSignals = await this.prisma.signal.findMany({
      where: {
        extractionMethod: 'NLP_CLASSIFICATION',
      },
    });

    // For Phase 1, we'll use pattern matching as a fallback
    // In Phase 2, we'll integrate with Claude AI for NLP classification
    for (const signal of nlpSignals) {
      if (signal.patterns && Array.isArray(signal.patterns)) {
        const matches = this.matchPatterns(artifactContent, signal.patterns as string[]);
        if (matches.length > 0) {
          extractedSignals.push({
            signalId: signal.signalId,
            value: true, // Boolean signal detected
            confidence: 0.7, // Medium confidence for pattern matching
            sourceReference: artifactId,
          });
        }
      }
    }

    // Store extracted signals
    await this.storeSignals(jurorId, extractedSignals, 'RESEARCH', artifactId);

    return extractedSignals;
  }

  /**
   * Extract signals from voir dire responses
   * Enhanced to use question-answer context for better signal extraction
   */
  async extractFromVoirDireResponse(
    jurorId: string,
    responseId: string,
    responseText: string,
    questionText?: string | null,
    yesNoAnswer?: boolean | null
  ): Promise<ExtractedSignal[]> {
    const extractedSignals: ExtractedSignal[] = [];

    // Get signals that can be extracted from voir dire (ATTITUDINAL, LINGUISTIC)
    const voirDireSignals = await this.prisma.signal.findMany({
      where: {
        category: { in: ['ATTITUDINAL', 'LINGUISTIC'] },
        extractionMethod: { in: ['PATTERN_MATCH', 'NLP_CLASSIFICATION'] },
      },
    });

    // Build enhanced text for matching (include question context)
    const enhancedText = questionText 
      ? `${questionText}\n${responseText}` 
      : responseText;

    for (const signal of voirDireSignals) {
      let matched = false;
      let confidence = 0.5;
      let signalValue: any = true;

      // For yes/no answers, check if the signal pattern matches the question
      // and use the yes/no value directly for boolean signals
      if (yesNoAnswer !== null && questionText) {
        // Check if question matches signal patterns (indicating this signal is relevant)
        const questionMatches = signal.patterns && Array.isArray(signal.patterns)
          ? this.matchPatterns(questionText, signal.patterns as string[])
          : [];
        
        if (questionMatches.length > 0) {
          // Question is relevant to this signal, use yes/no answer
          matched = true;
          // For boolean signals, use the yes/no value directly
          if (signal.valueType === 'BOOLEAN') {
            signalValue = yesNoAnswer;
            confidence = 0.9; // High confidence for direct yes/no answers
          } else {
            // For other signal types, still mark as matched but use response text
            confidence = 0.8;
          }
        }
      }

      // Try pattern matching on response text (if not already matched via yes/no)
      if (!matched && signal.patterns && Array.isArray(signal.patterns)) {
        const matches = this.matchPatterns(enhancedText, signal.patterns as string[]);
        if (matches.length > 0) {
          matched = true;
          confidence = Math.max(confidence, 0.7);
        }
      }

      // TODO: Phase 2 - Add NLP classification using Claude AI
      // For now, pattern matching is sufficient

      if (matched) {
        extractedSignals.push({
          signalId: signal.signalId,
          value: signalValue,
          confidence,
          sourceReference: responseId,
        });
      }
    }

    // Store extracted signals
    await this.storeSignals(jurorId, extractedSignals, 'VOIR_DIRE', responseId);

    return extractedSignals;
  }

  /**
   * Match a field value to a signal definition
   */
  private async matchFieldToSignal(
    signal: { signalId: string; valueType: string; possibleValues?: any },
    fieldValue: any
  ): Promise<{ confidence: number } | null> {
    // For CATEGORICAL signals, check if value is in possibleValues
    if (signal.valueType === 'CATEGORICAL' && signal.possibleValues) {
      const possibleValues = Array.isArray(signal.possibleValues)
        ? signal.possibleValues
        : Object.values(signal.possibleValues);
      
      const normalizedFieldValue = String(fieldValue).toLowerCase();
      const match = possibleValues.some((pv: any) => 
        String(pv).toLowerCase() === normalizedFieldValue
      );
      
      if (match) {
        return { confidence: 0.9 }; // High confidence for exact match
      }
    }

    // For BOOLEAN signals, check if value is truthy/falsy
    if (signal.valueType === 'BOOLEAN') {
      return { confidence: 0.9 };
    }

    // For NUMERIC signals, check if value is a number
    if (signal.valueType === 'NUMERIC' && typeof fieldValue === 'number') {
      return { confidence: 0.9 };
    }

    // For TEXT signals, any non-empty value matches
    if (signal.valueType === 'TEXT' && fieldValue) {
      return { confidence: 0.8 };
    }

    return null;
  }

  /**
   * Match text against regex patterns
   */
  private matchPatterns(text: string, patterns: string[]): RegExpMatchArray[] {
    const matches: RegExpMatchArray[] = [];
    const normalizedText = text.toLowerCase();

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'i'); // Case-insensitive
        const match = normalizedText.match(regex);
        if (match) {
          matches.push(match);
        }
      } catch (error) {
        console.warn(`Invalid regex pattern: ${pattern}`, error);
      }
    }

    return matches;
  }

  /**
   * Normalize value based on signal's valueType
   */
  private normalizeValue(value: any, valueType: string): any {
    switch (valueType) {
      case 'BOOLEAN':
        return Boolean(value);
      case 'NUMERIC':
        return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      case 'CATEGORICAL':
        return String(value);
      case 'TEXT':
        return String(value);
      default:
        return value;
    }
  }

  /**
   * Store extracted signals in the database
   */
  private async storeSignals(
    jurorId: string,
    signals: ExtractedSignal[],
    source: 'QUESTIONNAIRE' | 'RESEARCH' | 'VOIR_DIRE' | 'MANUAL',
    sourceReference?: string
  ): Promise<void> {
    // Get signal IDs
    const signalIds = signals.map((s) => s.signalId);
    const signalRecords = await this.prisma.signal.findMany({
      where: { signalId: { in: signalIds } },
    });

    const signalMap = new Map(signalRecords.map((s) => [s.signalId, s.id]));

    // Create JurorSignal records
    const createPromises = signals.map((signal) => {
      const signalDbId = signalMap.get(signal.signalId);
      if (!signalDbId) {
        console.warn(`Signal ${signal.signalId} not found in database`);
        return null;
      }

      const finalSourceReference = signal.sourceReference || sourceReference || null;
      
      return this.prisma.jurorSignal.upsert({
        where: {
          jurorId_signalId_source_sourceReference: {
            jurorId,
            signalId: signalDbId,
            source,
            sourceReference: (finalSourceReference || '') as string,
          },
        },
        create: {
          jurorId,
          signalId: signalDbId,
          value: signal.value,
          source,
          sourceReference: finalSourceReference,
          confidence: signal.confidence,
        },
        update: {
          value: signal.value,
          confidence: signal.confidence,
          extractedAt: new Date(),
        },
      });
    });

    await Promise.all(createPromises.filter((p) => p !== null));
  }

  /**
   * Get all signals for a juror
   */
  async getJurorSignals(jurorId: string): Promise<any[]> {
    return this.prisma.jurorSignal.findMany({
      where: { jurorId },
      include: {
        signal: true,
        voirDireResponse: {
          select: {
            id: true,
            questionText: true,
            responseSummary: true,
            responseTimestamp: true,
          },
        },
      },
      orderBy: {
        extractedAt: 'desc',
      },
    });
  }

  /**
   * Get signals by category for a juror
   */
  async getJurorSignalsByCategory(
    jurorId: string,
    category: string
  ): Promise<any[]> {
    return this.prisma.jurorSignal.findMany({
      where: {
        jurorId,
        signal: {
          category,
        },
      },
      include: {
        signal: true,
        voirDireResponse: {
          select: {
            id: true,
            questionText: true,
            responseSummary: true,
            responseTimestamp: true,
          },
        },
      },
      orderBy: {
        extractedAt: 'desc',
      },
    });
  }
}
