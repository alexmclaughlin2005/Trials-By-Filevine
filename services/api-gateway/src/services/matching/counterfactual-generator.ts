/**
 * Counterfactual Generator
 * 
 * Identifies what signals would most change the persona match assessment.
 * Guides attorneys toward the most valuable voir dire questions.
 * 
 * Phase 2: Matching Algorithms
 */

import { PrismaClient } from '@juries/database';
import { SignalBasedScore } from './signal-based-scorer';

export class CounterfactualGenerator {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate counterfactual reasoning for a persona match
   */
  async generateCounterfactual(
    jurorId: string,
    personaId: string,
    signalScore: SignalBasedScore,
    allPersonaIds: string[]
  ): Promise<string> {
    // Find the second-highest scoring persona (for discrimination)
    const otherPersonaIds = allPersonaIds.filter((id) => id !== personaId);

    if (otherPersonaIds.length === 0) {
      return 'No alternative personas available for comparison.';
    }

    // Identify decision boundary signals
    const decisionSignals = await this.identifyDecisionBoundarySignals(
      jurorId,
      personaId,
      otherPersonaIds[0] // Compare with first alternative
    );

    if (decisionSignals.length === 0) {
      return 'Current evidence strongly supports this match. Additional signals would provide minimal information gain.';
    }

    // Generate natural language counterfactual
    return this.formatCounterfactual(decisionSignals, personaId);
  }

  /**
   * Identify signals that would most change the assessment
   */
  private async identifyDecisionBoundarySignals(
    jurorId: string,
    personaId: string,
    alternativePersonaId: string
  ): Promise<
    Array<{
      signalId: string;
      signalName: string;
      weight: number;
      direction: 'POSITIVE' | 'NEGATIVE';
      informationGain: number;
    }>
  > {
    // Get signal weights for both personas
    const [personaWeights, alternativeWeights] = await Promise.all([
      this.prisma.signalPersonaWeight.findMany({
        where: { personaId },
        include: { signal: true },
      }),
      this.prisma.signalPersonaWeight.findMany({
        where: { personaId: alternativePersonaId },
        include: { signal: true },
      }),
    ]);

    // Get juror's current signals
    const jurorSignals = await this.prisma.jurorSignal.findMany({
      where: { jurorId },
      include: { signal: true },
    });

    const jurorSignalDbIds = new Set(jurorSignals.map((js) => js.signalId));

    // Find signals that discriminate between personas
    const decisionSignals: Array<{
      signalId: string;
      signalName: string;
      weight: number;
      direction: 'POSITIVE' | 'NEGATIVE';
      informationGain: number;
    }> = [];

    // Create maps for quick lookup (using signal DB ID)
    const personaWeightMap = new Map(
      personaWeights.map((pw) => [pw.signal.id, pw])
    );
    const alternativeWeightMap = new Map(
      alternativeWeights.map((pw) => [pw.signal.id, pw])
    );

    // Check each signal that's relevant to at least one persona
    const allSignalDbIds = new Set([
      ...personaWeights.map((pw) => pw.signal.id),
      ...alternativeWeights.map((pw) => pw.signal.id),
    ]);

    for (const signalDbId of allSignalDbIds) {
      const personaWeight = personaWeightMap.get(signalDbId);
      const alternativeWeight = alternativeWeightMap.get(signalDbId);

      // Skip if signal is already observed
      if (jurorSignalDbIds.has(signalDbId)) {
        continue;
      }

      // Calculate discrimination power
      let discriminationPower = 0;
      let direction: 'POSITIVE' | 'NEGATIVE' = 'POSITIVE';
      let weight = 0;

      if (personaWeight && alternativeWeight) {
        // Signal has different weights for different personas
        const weightDiff = Math.abs(
          Number(personaWeight.weight) - Number(alternativeWeight.weight)
        );
        discriminationPower = weightDiff;
        weight = Number(personaWeight.weight);
        direction = personaWeight.direction as 'POSITIVE' | 'NEGATIVE';
      } else if (personaWeight) {
        // Signal only relevant to primary persona
        discriminationPower = Number(personaWeight.weight);
        weight = Number(personaWeight.weight);
        direction = personaWeight.direction as 'POSITIVE' | 'NEGATIVE';
      } else if (alternativeWeight) {
        // Signal only relevant to alternative persona (negative for primary)
        discriminationPower = Number(alternativeWeight.weight);
        weight = Number(alternativeWeight.weight);
        direction =
          alternativeWeight.direction === 'POSITIVE' ? 'NEGATIVE' : 'POSITIVE';
      }

      if (discriminationPower > 0.3) {
        // High discrimination power
        const signal = personaWeight?.signal || alternativeWeight?.signal;
        if (signal) {
          decisionSignals.push({
            signalId: signal.signalId, // Use signalId field (e.g., "OCCUPATION_HEALTHCARE")
            signalName: signal.name,
            weight,
            direction,
            informationGain: discriminationPower,
          });
        }
      }
    }

    // Sort by information gain (highest first)
    decisionSignals.sort((a, b) => b.informationGain - a.informationGain);

    // Return top 3 most discriminating signals
    return decisionSignals.slice(0, 3);
  }

  /**
   * Format counterfactual as natural language
   */
  private formatCounterfactual(
    decisionSignals: Array<{
      signalId: string;
      signalName: string;
      weight: number;
      direction: 'POSITIVE' | 'NEGATIVE';
      informationGain: number;
    }>,
    personaId: string
  ): string {
    if (decisionSignals.length === 0) {
      return 'No additional signals would significantly change this assessment.';
    }

    const parts: string[] = [];
    parts.push(
      `The confidence in this persona match would change significantly if the juror exhibited:`
    );

    for (const signal of decisionSignals) {
      if (signal.direction === 'POSITIVE') {
        parts.push(
          `- ${signal.signalName} (would increase confidence if present)`
        );
      } else {
        parts.push(
          `- ${signal.signalName} (would decrease confidence if present)`
        );
      }
    }

    parts.push(
      '\nThese signals would help distinguish this persona from alternative matches.'
    );

    return parts.join('\n');
  }
}
