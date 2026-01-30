/**
 * Rationale Generator
 * 
 * Generates human-readable explanations for persona matches
 * using LLM with signal citations.
 * 
 * Phase 2: Matching Algorithms
 */

import { ClaudeClient } from '@juries/ai-client';
import { SignalBasedScore } from './signal-based-scorer';
import { EmbeddingScore } from './embedding-scorer';

export class RationaleGenerator {
  constructor(private claudeClient: ClaudeClient) {}

  /**
   * Generate rationale for a persona match
   */
  async generateRationale(
    jurorId: string,
    personaId: string,
    scores: {
      signalBased: SignalBasedScore | number;
      embedding: EmbeddingScore | number;
      bayesian: number;
    },
    combinedScore: number
  ): Promise<string> {
    // Build prompt with signal evidence
    const prompt = this.buildRationalePrompt(
      jurorId,
      personaId,
      scores,
      combinedScore
    );

    try {
      const response = await this.claudeClient.complete({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 500,
        temperature: 0.3, // Lower temperature for more consistent explanations
      });

      return response.content.trim();
    } catch (error) {
      console.error('Error generating rationale:', error);
      // Fallback to simple rationale
      return this.generateFallbackRationale(scores, combinedScore);
    }
  }

  /**
   * Build prompt for rationale generation
   */
  private buildRationalePrompt(
    jurorId: string,
    personaId: string,
    scores: {
      signalBased: SignalBasedScore | number;
      embedding: EmbeddingScore | number;
      bayesian: number;
    },
    combinedScore: number
  ): string {
    const parts: string[] = [];

    parts.push(
      `Generate a 2-3 sentence explanation for why Juror ${jurorId} matches Persona ${personaId} with ${(combinedScore * 100).toFixed(0)}% confidence.`
    );

    // Add signal-based evidence
    if (typeof scores.signalBased === 'object') {
      const signalScore = scores.signalBased as SignalBasedScore;
      if (signalScore.supportingSignals.length > 0) {
        parts.push('\nSupporting Evidence:');
        for (const signal of signalScore.supportingSignals.slice(0, 5)) {
          parts.push(`- ${signal.signalName} (weight: ${signal.weight.toFixed(2)})`);
        }
      }
      if (signalScore.contradictingSignals.length > 0) {
        parts.push('\nContradicting Evidence:');
        for (const signal of signalScore.contradictingSignals.slice(0, 3)) {
          parts.push(`- ${signal.signalName} (weight: ${signal.weight.toFixed(2)})`);
        }
      }
    }

    // Add method scores
    parts.push('\nMethod Scores:');
    if (typeof scores.signalBased === 'object') {
      parts.push(
        `- Signal-based: ${((scores.signalBased as SignalBasedScore).score * 100).toFixed(0)}%`
      );
    } else {
      parts.push(`- Signal-based: ${(scores.signalBased * 100).toFixed(0)}%`);
    }
    if (typeof scores.embedding === 'object') {
      parts.push(
        `- Embedding similarity: ${((scores.embedding as EmbeddingScore).score * 100).toFixed(0)}%`
      );
    } else {
      parts.push(`- Embedding similarity: ${(scores.embedding * 100).toFixed(0)}%`);
    }
    parts.push(`- Bayesian probability: ${(scores.bayesian * 100).toFixed(0)}%`);

    parts.push(
      '\nBe specific about which evidence is most compelling. Focus on concrete signals and behavioral indicators.'
    );

    return parts.join('\n');
  }

  /**
   * Generate fallback rationale if LLM fails
   */
  private generateFallbackRationale(
    scores: {
      signalBased: SignalBasedScore | number;
      embedding: EmbeddingScore | number;
      bayesian: number;
    },
    combinedScore: number
  ): string {
    const signalScore =
      typeof scores.signalBased === 'object'
        ? scores.signalBased.score
        : scores.signalBased;
    const embeddingScore =
      typeof scores.embedding === 'object'
        ? scores.embedding.score
        : scores.embedding;

    const parts: string[] = [];
    parts.push(
      `This juror matches with ${(combinedScore * 100).toFixed(0)}% confidence based on multiple matching algorithms.`
    );

    if (signalScore > 0.6) {
      parts.push('Strong signal-based evidence supports this match.');
    }
    if (embeddingScore > 0.6) {
      parts.push('Semantic similarity analysis indicates alignment.');
    }
    if (scores.bayesian > 0.6) {
      parts.push('Probabilistic analysis confirms high likelihood.');
    }

    return parts.join(' ');
  }
}
