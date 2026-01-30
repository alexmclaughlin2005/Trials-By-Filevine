/**
 * Bayesian Updating Algorithm
 * 
 * Rigorous probabilistic reasoning that updates with each new piece of evidence.
 * Uses Bayesian inference: P(P|S) = P(S|P) * P(P) / P(S)
 * 
 * Phase 2: Matching Algorithms
 */

import { PrismaClient } from '@juries/database';

export interface BayesianPosterior {
  posteriors: Map<string, number>; // personaId -> probability
  confidence: number; // 0-1 confidence (entropy-based)
  entropy: number; // Information entropy
}

export class BayesianUpdater {
  constructor(private prisma: PrismaClient) {}

  /**
   * Update persona probabilities using Bayesian inference
   */
  async updateProbabilities(
    jurorId: string,
    personaIds: string[],
    newSignals?: string[] // Optional: only consider these new signals
  ): Promise<BayesianPosterior> {
    // Get prior probabilities (from existing matches or uniform)
    const priors = await this.getPriorProbabilities(jurorId, personaIds);

    // Get all signals for this juror
    const jurorSignals = await this.prisma.jurorSignal.findMany({
      where: {
        jurorId,
        ...(newSignals && newSignals.length > 0
          ? { id: { in: newSignals } }
          : {}),
      },
      include: {
        signal: true,
      },
    });

    // Start with priors
    let posteriors = new Map(priors);

    // Update with each signal using Bayes' rule
    for (const jurorSignal of jurorSignals) {
      posteriors = await this.updateWithSignal(
        posteriors,
        jurorSignal.signalId,
        jurorSignal.value,
        personaIds
      );
    }

    // Normalize posteriors to sum to 1
    const normalizedPosteriors = this.normalize(posteriors);

    // Calculate confidence (entropy-based)
    const entropy = this.calculateEntropy(normalizedPosteriors);
    const maxEntropy = Math.log(personaIds.length); // Maximum entropy (uniform distribution)
    const confidence = 1 - entropy / maxEntropy; // Lower entropy = higher confidence

    return {
      posteriors: normalizedPosteriors,
      confidence: Math.max(0, Math.min(1, confidence)),
      entropy,
    };
  }

  /**
   * Get prior probabilities for personas
   * Uses existing JurorPersonaMapping if available, otherwise uniform
   */
  private async getPriorProbabilities(
    jurorId: string,
    personaIds: string[]
  ): Promise<Map<string, number>> {
    // Check for existing mappings
    const existingMappings = await this.prisma.jurorPersonaMapping.findMany({
      where: {
        jurorId,
        personaId: { in: personaIds },
        mappingType: 'primary',
      },
    });

    if (existingMappings.length > 0) {
      // Use existing confidence scores as priors
      const priors = new Map<string, number>();
      let totalConfidence = 0;

      for (const mapping of existingMappings) {
        const confidence = Number(mapping.confidence);
        priors.set(mapping.personaId, confidence);
        totalConfidence += confidence;
      }

      // Normalize
      if (totalConfidence > 0) {
        for (const [personaId, confidence] of priors) {
          priors.set(personaId, confidence / totalConfidence);
        }
      }

      // Fill in missing personas with small probability
      const remainingProb = (1 - totalConfidence) / (personaIds.length - existingMappings.length);
      for (const personaId of personaIds) {
        if (!priors.has(personaId)) {
          priors.set(personaId, Math.max(0.01, remainingProb));
        }
      }

      return this.normalize(priors);
    }

    // No existing mappings - use uniform prior
    const uniformPrior = 1 / personaIds.length;
    const priors = new Map<string, number>();
    for (const personaId of personaIds) {
      priors.set(personaId, uniformPrior);
    }

    return priors;
  }

  /**
   * Update posteriors with a single signal using Bayes' rule
   */
  private async updateWithSignal(
    currentPosteriors: Map<string, number>,
    signalId: string,
    signalValue: any,
    personaIds: string[]
  ): Promise<Map<string, number>> {
    // Get signal-persona weights
    const signal = await this.prisma.signal.findUnique({
      where: { signalId },
      include: {
        personaWeights: {
          where: {
            personaId: { in: personaIds },
          },
        },
      },
    });

    if (!signal) {
      return currentPosteriors; // Signal not found, no update
    }

    const newPosteriors = new Map<string, number>();
    const signalPresent = this.isSignalPresent(signalValue);

    // Calculate P(S) - marginal probability of signal
    let marginalProbability = 0;
    for (const personaId of personaIds) {
      const prior = currentPosteriors.get(personaId) || 0;
      const likelihood = this.getLikelihood(
        signal,
        personaId,
        signalPresent
      );
      marginalProbability += likelihood * prior;
    }

    if (marginalProbability === 0) {
      return currentPosteriors; // Signal provides no information
    }

    // Update each persona: P(P|S) = P(S|P) * P(P) / P(S)
    for (const personaId of personaIds) {
      const prior = currentPosteriors.get(personaId) || 0;
      const likelihood = this.getLikelihood(signal, personaId, signalPresent);
      const posterior = (likelihood * prior) / marginalProbability;
      newPosteriors.set(personaId, posterior);
    }

    return newPosteriors;
  }

  /**
   * Get likelihood P(S|P) - probability of signal given persona
   */
  private getLikelihood(
    signal: { id: string; personaWeights: Array<{ personaId: string; direction: string; weight: any }> },
    personaId: string,
    signalPresent: boolean
  ): number {
    // Find weight for this persona-signal pair
    const weight = signal.personaWeights.find(
      (pw) => pw.personaId === personaId
    );

    if (!weight) {
      return 0.5; // No weight defined - neutral likelihood
    }

    const weightValue = Number(weight.weight);

    if (weight.direction === 'POSITIVE') {
      // Positive signal: if present, likelihood = weight, if absent, likelihood = 1 - weight
      return signalPresent ? weightValue : 1 - weightValue;
    } else {
      // Negative signal: if present, likelihood = 1 - weight, if absent, likelihood = weight
      return signalPresent ? 1 - weightValue : weightValue;
    }
  }

  /**
   * Check if signal is present (boolean or truthy)
   */
  private isSignalPresent(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value > 0;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value.length > 0;
    }
    return Boolean(value);
  }

  /**
   * Normalize probabilities to sum to 1
   */
  private normalize(probabilities: Map<string, number>): Map<string, number> {
    const total = Array.from(probabilities.values()).reduce(
      (sum, p) => sum + p,
      0
    );

    if (total === 0) {
      // All zeros - return uniform distribution
      const uniform = 1 / probabilities.size;
      const normalized = new Map<string, number>();
      for (const personaId of probabilities.keys()) {
        normalized.set(personaId, uniform);
      }
      return normalized;
    }

    const normalized = new Map<string, number>();
    for (const [personaId, prob] of probabilities) {
      normalized.set(personaId, prob / total);
    }

    return normalized;
  }

  /**
   * Calculate information entropy: H = -Σ(p * log2(p))
   */
  private calculateEntropy(
    probabilities: Map<string, number>
  ): number {
    let entropy = 0;

    for (const prob of probabilities.values()) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }

    return entropy;
  }
}
