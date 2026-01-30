/**
 * Ensemble Matcher
 * 
 * Combines signal-based scoring, embedding similarity, and Bayesian updating
 * into a unified matching system with weighted averaging.
 * 
 * Phase 2: Matching Algorithms
 */

import { PrismaClient } from '@juries/database';
import { ClaudeClient } from '@juries/ai-client';
import { SignalBasedScorer, SignalBasedScore } from './signal-based-scorer';
import { EmbeddingScorer, EmbeddingScore } from './embedding-scorer';
import { BayesianUpdater, BayesianPosterior } from './bayesian-updater';
import { RationaleGenerator } from './rationale-generator';
import { CounterfactualGenerator } from './counterfactual-generator';

export interface EnsembleMatch {
  personaId: string;
  probability: number; // 0-1 combined probability
  confidence: number; // 0-1 overall confidence
  methodScores: {
    signalBased: number;
    embedding: number;
    bayesian: number;
  };
  methodConfidences: {
    signalBased: number;
    embedding: number;
    bayesian: number;
  };
  rationale: string;
  counterfactual: string;
  supportingSignals: SignalBasedScore['supportingSignals'];
  contradictingSignals: SignalBasedScore['contradictingSignals'];
}

export interface EnsembleWeights {
  signalBased: number;
  embedding: number;
  bayesian: number;
}

export class EnsembleMatcher {
  private signalScorer: SignalBasedScorer;
  private embeddingScorer: EmbeddingScorer;
  private bayesianUpdater: BayesianUpdater;
  private rationaleGenerator: RationaleGenerator;
  private counterfactualGenerator: CounterfactualGenerator;

  constructor(
    private prisma: PrismaClient,
    private claudeClient: ClaudeClient
  ) {
    this.signalScorer = new SignalBasedScorer(prisma);
    this.embeddingScorer = new EmbeddingScorer(prisma, claudeClient);
    this.bayesianUpdater = new BayesianUpdater(prisma);
    this.rationaleGenerator = new RationaleGenerator(claudeClient);
    this.counterfactualGenerator = new CounterfactualGenerator(prisma);
  }

  /**
   * Match a juror against multiple personas using ensemble approach
   */
  async matchJuror(
    jurorId: string,
    personaIds: string[]
  ): Promise<EnsembleMatch[]> {
    // Determine weights based on data availability
    const weights = await this.determineWeights(jurorId);

    // Run all three algorithms in parallel
    const [signalScores, embeddingScores, bayesianPosterior] =
      await Promise.all([
        this.signalScorer.scoreJurorAgainstPersonas(jurorId, personaIds),
        this.embeddingScorer.scoreJurorAgainstPersonas(jurorId, personaIds),
        this.bayesianUpdater.updateProbabilities(jurorId, personaIds),
      ]);

    // Combine scores for each persona (without rationales first for speed)
    const matchesWithoutRationales: Array<{
      personaId: string;
      probability: number;
      confidence: number;
      methodScores: { signalBased: number; embedding: number; bayesian: number };
      methodConfidences: { signalBased: number; embedding: number; bayesian: number };
      signalScore: SignalBasedScore;
      embeddingScore: EmbeddingScore;
      bayesianProb: number;
      supportingSignals: SignalBasedScore['supportingSignals'];
      contradictingSignals: SignalBasedScore['contradictingSignals'];
    }> = [];

    for (const personaId of personaIds) {
      const signalScore = signalScores.get(personaId);
      const embeddingScore = embeddingScores.get(personaId);
      const bayesianProb = bayesianPosterior.posteriors.get(personaId) || 0;

      if (!signalScore || !embeddingScore) {
        continue; // Skip if any method failed
      }

      // Weighted average of scores
      const combinedScore =
        weights.signalBased * signalScore.score +
        weights.embedding * embeddingScore.score +
        weights.bayesian * bayesianProb;

      // Weighted average of confidences
      const combinedConfidence =
        weights.signalBased * signalScore.confidence +
        weights.embedding * embeddingScore.confidence +
        weights.bayesian * bayesianPosterior.confidence;

      matchesWithoutRationales.push({
        personaId,
        probability: Math.max(0, Math.min(1, combinedScore)),
        confidence: Math.max(0, Math.min(1, combinedConfidence)),
        methodScores: {
          signalBased: signalScore.score,
          embedding: embeddingScore.score,
          bayesian: bayesianProb,
        },
        methodConfidences: {
          signalBased: signalScore.confidence,
          embedding: embeddingScore.confidence,
          bayesian: bayesianPosterior.confidence,
        },
        signalScore,
        embeddingScore,
        bayesianProb,
        supportingSignals: signalScore.supportingSignals,
        contradictingSignals: signalScore.contradictingSignals,
      });
    }

    // Sort by probability (highest first)
    matchesWithoutRationales.sort((a, b) => b.probability - a.probability);

    // Only generate rationales and counterfactuals for top matches (top 5 or all if < 5)
    const topNForRationales = Math.min(5, matchesWithoutRationales.length);
    const topMatches = matchesWithoutRationales.slice(0, topNForRationales);
    const remainingMatches = matchesWithoutRationales.slice(topNForRationales);

    // Generate rationales and counterfactuals for top matches in parallel
    const matchesWithRationales = await Promise.all(
      topMatches.map(async (match) => {
        const [rationale, counterfactual] = await Promise.all([
          this.rationaleGenerator.generateRationale(
            jurorId,
            match.personaId,
            {
              signalBased: match.signalScore,
              embedding: match.embeddingScore,
              bayesian: match.bayesianProb,
            },
            match.probability
          ),
          this.counterfactualGenerator.generateCounterfactual(
            jurorId,
            match.personaId,
            match.signalScore,
            personaIds
          ),
        ]);

        return {
          personaId: match.personaId,
          probability: match.probability,
          confidence: match.confidence,
          methodScores: match.methodScores,
          methodConfidences: match.methodConfidences,
          rationale,
          counterfactual,
          supportingSignals: match.supportingSignals,
          contradictingSignals: match.contradictingSignals,
        };
      })
    );

    // Add remaining matches without rationales (they'll be generated on-demand if needed)
    const remainingMatchesWithoutRationales = remainingMatches.map((match) => ({
      personaId: match.personaId,
      probability: match.probability,
      confidence: match.confidence,
      methodScores: match.methodScores,
      methodConfidences: match.methodConfidences,
      rationale: `Score: ${(match.probability * 100).toFixed(0)}% - Rationale available on request`,
      counterfactual: 'Available on request',
      supportingSignals: match.supportingSignals,
      contradictingSignals: match.contradictingSignals,
    }));

    return [...matchesWithRationales, ...remainingMatchesWithoutRationales];
  }

  /**
   * Determine optimal weights based on data availability
   */
  private async determineWeights(jurorId: string): Promise<EnsembleWeights> {
    // Get juror data to assess richness
    const juror = await this.prisma.juror.findUnique({
      where: { id: jurorId },
      include: {
        extractedSignals: true,
        researchArtifacts: {
          where: {
            userAction: { in: ['confirmed', 'pending'] },
          },
        },
        voirDireResponses: true,
      },
    });

    if (!juror) {
      // Default weights if juror not found
      return {
        signalBased: 0.35,
        embedding: 0.30,
        bayesian: 0.35,
      };
    }

    const signalCount = juror.extractedSignals.length;
    const researchCount = juror.researchArtifacts.length;
    const voirDireCount = juror.voirDireResponses.length;
    const hasRichNarrative = researchCount > 0 || voirDireCount > 0;

    // Adjust weights based on data availability
    let weights: EnsembleWeights = {
      signalBased: 0.35,
      embedding: 0.30,
      bayesian: 0.35,
    };

    // Rich narrative data -> favor embedding
    if (hasRichNarrative && signalCount > 5) {
      weights.embedding += 0.10;
      weights.signalBased -= 0.05;
      weights.bayesian -= 0.05;
    }

    // Sparse data -> favor Bayesian (handles uncertainty better)
    if (signalCount < 3 && !hasRichNarrative) {
      weights.bayesian += 0.10;
      weights.embedding -= 0.10;
    }

    // Many signals -> favor signal-based
    if (signalCount > 10) {
      weights.signalBased += 0.05;
      weights.bayesian -= 0.05;
    }

    // Normalize to ensure sum = 1
    const total = weights.signalBased + weights.embedding + weights.bayesian;
    weights.signalBased /= total;
    weights.embedding /= total;
    weights.bayesian /= total;

    return weights;
  }

  /**
   * Get top N matches for a juror
   */
  async getTopMatches(
    jurorId: string,
    personaIds: string[],
    topN: number = 3
  ): Promise<EnsembleMatch[]> {
    const matches = await this.matchJuror(jurorId, personaIds);
    return matches.slice(0, topN);
  }
}
