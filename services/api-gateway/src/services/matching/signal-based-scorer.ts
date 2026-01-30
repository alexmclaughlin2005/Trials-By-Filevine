/**
 * Signal-Based Scoring Algorithm
 * 
 * Explainable, auditable matching based on discrete evidence.
 * Calculates weighted sum of signal matches per persona.
 * 
 * Phase 2: Matching Algorithms
 */

import { PrismaClient } from '@juries/database';

export interface SignalBasedScore {
  score: number; // 0-1 normalized score
  confidence: number; // 0-1 confidence in the score
  supportingSignals: Array<{
    signalId: string;
    signalName: string;
    weight: number;
    value: any;
  }>;
  contradictingSignals: Array<{
    signalId: string;
    signalName: string;
    weight: number;
    value: any;
  }>;
  missingSignals: Array<{
    signalId: string;
    signalName: string;
    weight: number;
  }>;
}

export class SignalBasedScorer {
  constructor(private prisma: PrismaClient) {}

  /**
   * Score a juror against a specific persona using signal-based matching
   */
  async scoreJuror(
    jurorId: string,
    personaId: string
  ): Promise<SignalBasedScore> {
    // Get all signals for this juror
    const jurorSignals = await this.prisma.jurorSignal.findMany({
      where: { jurorId },
      include: {
        signal: true,
      },
    });

    // Get persona's signal weights (positive and negative)
    const personaWeights = await this.prisma.signalPersonaWeight.findMany({
      where: { personaId },
      include: {
        signal: true,
      },
    });

    // Create maps for quick lookup (using signal DB ID)
    const jurorSignalMap = new Map(
      jurorSignals.map((js) => [js.signalId, js]) // signalId is the DB ID, not signalId field
    );
    const positiveWeightsMap = new Map(
      personaWeights
        .filter((pw) => pw.direction === 'POSITIVE')
        .map((pw) => [pw.signalId, pw])
    );
    const negativeWeightsMap = new Map(
      personaWeights
        .filter((pw) => pw.direction === 'NEGATIVE')
        .map((pw) => [pw.signalId, pw])
    );

    let score = 0;
    let maxPossibleScore = 0;
    const supportingSignals: SignalBasedScore['supportingSignals'] = [];
    const contradictingSignals: SignalBasedScore['contradictingSignals'] = [];
    const missingSignals: SignalBasedScore['missingSignals'] = [];

    // Calculate score from positive signals
    for (const [signalId, weight] of positiveWeightsMap) {
      const signalWeight = Number(weight.weight);
      maxPossibleScore += signalWeight;

      const jurorSignal = jurorSignalMap.get(signalId);
      if (jurorSignal) {
        // Signal is present - add to score
        const signalValue = this.getSignalValue(jurorSignal.value);
        if (signalValue) {
          score += signalWeight * Number(weight.weight);
          supportingSignals.push({
            signalId: weight.signal.signalId,
            signalName: weight.signal.name,
            weight: signalWeight,
            value: jurorSignal.value,
          });
        }
      } else {
        // Signal is missing - track for confidence calculation
        missingSignals.push({
          signalId: weight.signal.signalId,
          signalName: weight.signal.name,
          weight: signalWeight,
        });
      }
    }

    // Subtract score from negative signals
    for (const [signalId, weight] of negativeWeightsMap) {
      const signalWeight = Number(weight.weight);
      maxPossibleScore += signalWeight; // Negative signals also count toward max

      const jurorSignal = jurorSignalMap.get(signalId);
      if (jurorSignal) {
        const signalValue = this.getSignalValue(jurorSignal.value);
        if (signalValue) {
          // Negative signal is present - subtract from score
          score -= signalWeight * Number(weight.weight);
          contradictingSignals.push({
            signalId: weight.signal.signalId,
            signalName: weight.signal.name,
            weight: signalWeight,
            value: jurorSignal.value,
          });
        }
      }
    }

    // Normalize score to 0-1 range
    const normalizedScore =
      maxPossibleScore > 0
        ? Math.max(0, Math.min(1, score / maxPossibleScore))
        : 0;

    // Calculate confidence based on signal coverage
    const signalsObserved = supportingSignals.length + contradictingSignals.length;
    const signalsExpected = personaWeights.length;
    const baseConfidence =
      signalsExpected > 0 ? signalsObserved / signalsExpected : 0;

    // Reduce confidence if contradicting signals present
    const contradictionPenalty =
      contradictingSignals.length > 0
        ? Math.min(0.3, contradictingSignals.length * 0.1)
        : 0;

    // Reduce confidence if key signals are missing
    const missingPenalty = Math.min(
      0.2,
      missingSignals
        .filter((ms) => ms.weight > 0.5) // High-weight signals
        .length * 0.05
    );

    const confidence = Math.max(
      0,
      Math.min(1, baseConfidence - contradictionPenalty - missingPenalty)
    );

    return {
      score: normalizedScore,
      confidence,
      supportingSignals,
      contradictingSignals,
      missingSignals,
    };
  }

  /**
   * Score a juror against multiple personas
   */
  async scoreJurorAgainstPersonas(
    jurorId: string,
    personaIds: string[]
  ): Promise<Map<string, SignalBasedScore>> {
    const scores = new Map<string, SignalBasedScore>();

    await Promise.all(
      personaIds.map(async (personaId) => {
        const score = await this.scoreJuror(jurorId, personaId);
        scores.set(personaId, score);
      })
    );

    return scores;
  }

  /**
   * Extract boolean/numeric value from signal value JSON
   */
  private getSignalValue(value: any): boolean | number {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      // Try to parse as boolean or number
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      const num = parseFloat(value);
      if (!isNaN(num)) return num;
    }
    // Default: truthy values count as true
    return Boolean(value);
  }
}
