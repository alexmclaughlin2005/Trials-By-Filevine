/**
 * Embedding Similarity Scorer
 * 
 * Calculates similarity between juror narratives and persona descriptions
 * using semantic embeddings and cosine similarity.
 * 
 * Phase 2: Matching Algorithms
 */

import { PrismaClient } from '@juries/database';
import { ClaudeClient } from '@juries/ai-client';
import { JurorNarrativeGenerator } from './juror-narrative-generator';

export interface EmbeddingScore {
  score: number; // 0-1 cosine similarity
  confidence: number; // 0-1 confidence based on narrative richness
  narrativeLength: number; // Character count of narrative
}

export class EmbeddingScorer {
  private narrativeGenerator: JurorNarrativeGenerator;
  private embeddingCache = new Map<string, number[]>(); // personaId -> embedding
  private narrativeCache = new Map<string, { narrative: string; timestamp: number }>(); // jurorId -> cached narrative

  constructor(
    private prisma: PrismaClient,
    private claudeClient: ClaudeClient
  ) {
    this.narrativeGenerator = new JurorNarrativeGenerator(prisma);
  }

  /**
   * Score a juror against a persona using embedding similarity
   */
  async scoreJuror(
    jurorId: string,
    personaId: string
  ): Promise<EmbeddingScore> {
    // Get or generate juror narrative
    const jurorNarrative = await this.getJurorNarrative(jurorId);

    // Get or generate persona embedding
    const personaEmbedding = await this.getPersonaEmbedding(personaId);

    // Generate embedding for juror narrative
    const jurorEmbedding = await this.generateEmbedding(jurorNarrative);

    // Calculate cosine similarity
    const similarity = this.cosineSimilarity(
      jurorEmbedding,
      personaEmbedding
    );

    // Normalize to 0-1 range (cosine similarity is -1 to 1)
    const normalizedScore = (similarity + 1) / 2;

    // Calculate confidence based on narrative richness
    const confidence = this.calculateConfidence(jurorNarrative);

    return {
      score: normalizedScore,
      confidence,
      narrativeLength: jurorNarrative.length,
    };
  }

  /**
   * Score a juror against multiple personas
   */
  async scoreJurorAgainstPersonas(
    jurorId: string,
    personaIds: string[]
  ): Promise<Map<string, EmbeddingScore>> {
    // Get juror narrative once
    const jurorNarrative = await this.getJurorNarrative(jurorId);
    const jurorEmbedding = await this.generateEmbedding(jurorNarrative);

    // Get all persona embeddings
    const personaEmbeddings = await Promise.all(
      personaIds.map(async (personaId) => {
        const embedding = await this.getPersonaEmbedding(personaId);
        return { personaId, embedding };
      })
    );

    // Calculate similarities
    const scores = new Map<string, EmbeddingScore>();
    const confidence = this.calculateConfidence(jurorNarrative);

    for (const { personaId, embedding } of personaEmbeddings) {
      const similarity = this.cosineSimilarity(jurorEmbedding, embedding);
      const normalizedScore = (similarity + 1) / 2;

      scores.set(personaId, {
        score: normalizedScore,
        confidence,
        narrativeLength: jurorNarrative.length,
      });
    }

    return scores;
  }

  /**
   * Get or generate juror narrative (with caching)
   */
  private async getJurorNarrative(jurorId: string): Promise<string> {
    const cached = this.narrativeCache.get(jurorId);
    const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;
    const cacheTimeout = 60 * 60 * 1000; // 1 hour

    if (cached && cacheAge < cacheTimeout) {
      return cached.narrative;
    }

    const narrative = await this.narrativeGenerator.generateNarrative(jurorId);
    this.narrativeCache.set(jurorId, {
      narrative,
      timestamp: Date.now(),
    });

    return narrative;
  }

  /**
   * Get or generate persona embedding (with caching)
   */
  private async getPersonaEmbedding(personaId: string): Promise<number[]> {
    // Check cache first
    if (this.embeddingCache.has(personaId)) {
      return this.embeddingCache.get(personaId)!;
    }

    // Get persona description
    const persona = await this.prisma.persona.findUnique({
      where: { id: personaId },
      select: {
        name: true,
        description: true,
        instantRead: true,
        phrasesYoullHear: true,
        attributes: true,
      },
    });

    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    // Build persona description text
    const personaText = this.buildPersonaDescription(persona);

    // Generate embedding
    const embedding = await this.generateEmbedding(personaText);

    // Cache it
    this.embeddingCache.set(personaId, embedding);

    return embedding;
  }

  /**
   * Build persona description text for embedding
   */
  private buildPersonaDescription(persona: {
    name: string;
    description: string | null;
    instantRead: string | null;
    phrasesYoullHear: any;
    attributes: any;
  }): string {
    const parts: string[] = [];

    parts.push(`Persona: ${persona.name}`);

    if (persona.instantRead) {
      parts.push(`Quick Summary: ${persona.instantRead}`);
    }

    if (persona.description) {
      parts.push(`Description: ${persona.description}`);
    }

    if (persona.phrasesYoullHear && Array.isArray(persona.phrasesYoullHear)) {
      parts.push(
        `Characteristic Phrases: ${persona.phrasesYoullHear.join(', ')}`
      );
    }

    if (persona.attributes) {
      const attrs = persona.attributes as Record<string, any>;
      if (Object.keys(attrs).length > 0) {
        parts.push(`Attributes: ${JSON.stringify(attrs)}`);
      }
    }

    return parts.join('\n\n');
  }

  /**
   * Generate embedding using Claude's embedding API
   * Note: Claude doesn't have a direct embedding API, so we'll use a workaround
   * For now, we'll use OpenAI's embedding API or a text similarity approach
   * 
   * TODO: Integrate with actual embedding service (OpenAI text-embedding-3-large)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // For Phase 2, we'll use a simple text-based similarity approach
    // In production, replace with actual embedding API call
    
    // Simple hash-based "embedding" for now (will be replaced with real embeddings)
    // This is a placeholder - actual implementation should call OpenAI/Anthropic embedding API
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(1536).fill(0); // OpenAI embedding dimension
    
    // Simple word frequency-based "embedding"
    for (let i = 0; i < words.length; i++) {
      const hash = this.simpleHash(words[i]);
      const index = hash % embedding.length;
      embedding[index] += 1 / words.length;
    }
    
    // Normalize
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    return embedding.map((val) => (magnitude > 0 ? val / magnitude : 0));
  }

  /**
   * Simple hash function for placeholder embedding
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calculate confidence based on narrative richness
   */
  private calculateConfidence(narrative: string): number {
    const length = narrative.length;
    const wordCount = narrative.split(/\s+/).length;

    // Higher confidence for longer, richer narratives
    // Minimum 200 chars or 30 words for decent confidence
    if (length < 200 || wordCount < 30) {
      return Math.min(0.5, (length / 400) * 0.5);
    }

    // Scale confidence from 0.5 to 1.0 based on richness
    const richnessScore = Math.min(1.0, length / 2000); // Max at 2000 chars
    return 0.5 + richnessScore * 0.5;
  }

  /**
   * Clear caches (useful for testing or when data changes)
   */
  clearCaches(): void {
    this.embeddingCache.clear();
    this.narrativeCache.clear();
  }
}
