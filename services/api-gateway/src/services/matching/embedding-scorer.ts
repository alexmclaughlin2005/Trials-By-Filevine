/**
 * Embedding Similarity Scorer
 * 
 * Calculates similarity between juror narratives and persona descriptions
 * using Voyage AI voyage-law-2 embeddings and cosine similarity.
 * 
 * Phase 2: Matching Algorithms
 */

import { PrismaClient } from '@juries/database';
import { ClaudeClient } from '@juries/ai-client';
import { VoyageAIClient } from 'voyageai';
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
  private voyageClient: VoyageAIClient | null = null;
  private readonly MODEL = 'voyage-law-2';

  constructor(
    private prisma: PrismaClient,
    private claudeClient: ClaudeClient
  ) {
    this.narrativeGenerator = new JurorNarrativeGenerator(prisma);
    
    // Initialize Voyage AI client if API key is available
    const voyageApiKey = process.env.VOYAGE_API_KEY;
    if (voyageApiKey) {
      this.voyageClient = new VoyageAIClient({ apiKey: voyageApiKey });
    } else {
      console.warn('⚠️  VOYAGE_API_KEY not set - embedding scorer will use fallback');
    }
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
    const personaCacheHit = this.embeddingCache.has(personaId);

    // Generate embedding for juror narrative
    const jurorEmbedding = await this.generateEmbedding(jurorNarrative);
    const jurorCacheHit = this.narrativeCache.has(jurorId);

    // Calculate cosine similarity
    const similarity = this.cosineSimilarity(
      jurorEmbedding,
      personaEmbedding
    );

    // Normalize to 0-1 range (cosine similarity is -1 to 1)
    const normalizedScore = (similarity + 1) / 2;

    // Calculate confidence based on narrative richness
    const confidence = this.calculateConfidence(jurorNarrative);

    // Log embedding usage for debugging
    console.log(`[EMBEDDING] Juror ${jurorId} vs Persona ${personaId}: score=${normalizedScore.toFixed(3)}, cache=${personaCacheHit ? 'HIT' : 'MISS'}/${jurorCacheHit ? 'HIT' : 'MISS'}, narrative=${jurorNarrative.length}chars`);

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
    const jurorCacheHit = this.narrativeCache.has(jurorId);

    // Get all persona embeddings
    const personaEmbeddings = await Promise.all(
      personaIds.map(async (personaId) => {
        const embedding = await this.getPersonaEmbedding(personaId);
        const cacheHit = this.embeddingCache.has(personaId);
        return { personaId, embedding, cacheHit };
      })
    );

    // Calculate similarities
    const scores = new Map<string, EmbeddingScore>();
    const confidence = this.calculateConfidence(jurorNarrative);

    const cacheStats = { hits: 0, misses: 0 };
    for (const { personaId, embedding, cacheHit } of personaEmbeddings) {
      if (cacheHit) cacheStats.hits++;
      else cacheStats.misses++;

      const similarity = this.cosineSimilarity(jurorEmbedding, embedding);
      const normalizedScore = (similarity + 1) / 2;

      scores.set(personaId, {
        score: normalizedScore,
        confidence,
        narrativeLength: jurorNarrative.length,
      });
    }

    // Log batch matching stats
    console.log(`[EMBEDDING] Batch match: Juror ${jurorId} vs ${personaIds.length} personas, cache=${cacheStats.hits}HIT/${cacheStats.misses}MISS (personas), juror=${jurorCacheHit ? 'HIT' : 'MISS'}`);

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
        archetype: true,
      },
    });

    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    // Build persona description text
    const personaText = this.buildPersonaDescription(persona);

    // Log cache miss
    console.log(`[EMBEDDING] Generating embedding for persona ${personaId} (${persona.name}, ${persona.archetype || 'unknown'}) - CACHE MISS`);

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
   * Generate embedding using Voyage AI voyage-law-2 model
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.voyageClient) {
      // Fallback to hash-based embedding if Voyage client not available
      console.warn('[EMBEDDING] Voyage AI client not available, using fallback embedding');
      return this.fallbackEmbedding(text);
    }

    try {
      const startTime = Date.now();
      const response = await this.voyageClient.embed({
        input: [text],
        model: this.MODEL,
      });
      const duration = Date.now() - startTime;

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding data returned from Voyage AI');
      }

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('No embedding in response data');
      }

      console.log(`[EMBEDDING] Generated embedding via Voyage AI (${duration}ms, ${text.length}chars)`);
      return embedding;
    } catch (error) {
      console.error('[EMBEDDING] Error generating Voyage AI embedding:', error);
      // Fallback to hash-based embedding on error
      return this.fallbackEmbedding(text);
    }
  }

  /**
   * Fallback embedding method (hash-based) for when Voyage AI is unavailable
   */
  private fallbackEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(1024).fill(0); // voyage-law-2 dimension is 1024
    
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
   * Simple hash function for fallback embedding
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
   * Preload all persona embeddings into cache at startup
   * This warms the cache and improves matching performance
   * 
   * Runs in background and continues even after rate limit errors.
   * Will complete gradually as rate limits allow.
   */
  async preloadPersonaEmbeddings(): Promise<void> {
    if (!this.voyageClient) {
      console.warn('⚠️  Voyage AI client not available - skipping persona embedding preload');
      return;
    }

    try {
      console.log('🔄 Preloading persona embeddings...');
      
      // Get all personas
      const personas = await this.prisma.persona.findMany({
        where: {
          isActive: true,
          version: 2, // Only V2 personas
        },
        select: {
          id: true,
          name: true,
          description: true,
          instantRead: true,
          phrasesYoullHear: true,
          attributes: true,
        },
      });

      // Filter to only personas not yet cached
      const uncachedPersonas = personas.filter(
        (p) => !this.embeddingCache.has(p.id)
      );

      const cachedCount = personas.length - uncachedPersonas.length;
      console.log(`📦 Found ${personas.length} personas (${cachedCount} already cached, ${uncachedPersonas.length} need preloading)`);

      if (uncachedPersonas.length === 0) {
        console.log('✅ All personas already cached - skipping preload');
        return;
      }

      // Build persona texts for uncached personas only
      const personaTexts = uncachedPersonas.map((persona) => ({
        id: persona.id,
        text: this.buildPersonaDescription(persona),
      }));

      // Generate embeddings in batches (Voyage AI supports batch requests)
      // Use smaller batches and add delays to respect rate limits
      const batchSize = 3; // Smaller batches to avoid rate limits (3 RPM = 1 batch per 20 seconds)
      const delayBetweenBatches = 21000; // 21 seconds between batches (slightly more than 20s for safety)
      let loaded = 0;
      let failedBatches = 0;
      const maxRetries = 3;

      for (let i = 0; i < personaTexts.length; i += batchSize) {
        const batch = personaTexts.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        let retryCount = 0;
        let success = false;

        // Retry logic for rate limit errors
        while (retryCount < maxRetries && !success) {
          try {
            const response = await this.voyageClient!.embed({
              input: batch.map((p) => p.text),
              model: this.MODEL,
            });

            if (response.data && response.data.length === batch.length) {
              // Cache each embedding
              batch.forEach((persona, index) => {
                const embedding = response.data![index]?.embedding;
                if (embedding) {
                  this.embeddingCache.set(persona.id, embedding);
                  loaded++;
                }
              });
              success = true;
              
              if (retryCount > 0) {
                console.log(`✅ Batch ${batchNumber} succeeded on retry ${retryCount + 1}`);
              } else {
                // Log progress every 5 batches
                if (batchNumber % 5 === 0 || batchNumber === 1) {
                  const progress = ((loaded / personas.length) * 100).toFixed(1);
                  console.log(`📦 Preload progress: ${loaded}/${personas.length} (${progress}%) - Batch ${batchNumber}`);
                }
              }
            }
          } catch (error: any) {
            retryCount++;
            
            // Check if it's a rate limit error
            if (error.statusCode === 429 || error.message?.includes('rate limit')) {
              if (retryCount < maxRetries) {
                // Wait longer before retry (exponential backoff)
                const waitTime = delayBetweenBatches * Math.pow(2, retryCount - 1);
                console.log(`⏳ Rate limit hit for batch ${batchNumber}, waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${maxRetries}...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              } else {
                console.error(`❌ Batch ${batchNumber} failed after ${maxRetries} retries (rate limit)`);
                failedBatches++;
                // Continue to next batch even after failure - will be loaded on-demand
              }
            } else {
              // Non-rate-limit error - log and move on
              console.error(`Error loading batch ${batchNumber}:`, error.message || error);
              failedBatches++;
              break; // Don't retry non-rate-limit errors
            }
          }
        }

        // Always add delay between batches to respect rate limits
        // Even if batch failed, we still need to wait before next attempt
        if (i + batchSize < personaTexts.length) {
          // If batch failed, wait longer before trying next batch
          const waitTime = success ? delayBetweenBatches : delayBetweenBatches * 2;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      const successRate = ((loaded / uncachedPersonas.length) * 100).toFixed(1);
      const remaining = uncachedPersonas.length - loaded;
      const totalCached = cachedCount + loaded;
      
      console.log(`✅ Preloaded ${loaded}/${uncachedPersonas.length} new persona embeddings (${successRate}%)`);
      console.log(`📊 Total cached: ${totalCached}/${personas.length} (${((totalCached / personas.length) * 100).toFixed(1)}%)`);
      
      if (failedBatches > 0) {
        console.log(`⚠️  ${failedBatches} batches failed due to rate limits.`);
      }
      
      if (remaining > 0) {
        console.log(`ℹ️  ${remaining} personas will be loaded on-demand when needed.`);
        console.log(`💡 Tip: Run 'npx tsx scripts/resume-embedding-preload.ts' to continue preloading.`);
      } else {
        console.log(`🎉 All personas preloaded successfully!`);
      }
    } catch (error) {
      console.error('Error preloading persona embeddings:', error);
      // Don't throw - allow app to continue even if preload fails
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    personaEmbeddingsCached: number;
    jurorNarrativesCached: number;
  } {
    return {
      personaEmbeddingsCached: this.embeddingCache.size,
      jurorNarrativesCached: this.narrativeCache.size,
    };
  }

  /**
   * Resume preloading for personas not yet cached
   * Useful for completing preload after rate limits are resolved
   */
  async resumePreload(): Promise<void> {
    if (!this.voyageClient) {
      console.warn('⚠️  Voyage AI client not available - cannot resume preload');
      return;
    }

    try {
      // Get all personas
      const personas = await this.prisma.persona.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          instantRead: true,
          phrasesYoullHear: true,
          attributes: true,
        },
      });

      // Filter to only personas not yet cached
      const uncachedPersonas = personas.filter(
        (p) => !this.embeddingCache.has(p.id)
      );

      if (uncachedPersonas.length === 0) {
        console.log('✅ All personas already cached - no resume needed');
        return;
      }

      console.log(`🔄 Resuming preload for ${uncachedPersonas.length} uncached personas...`);

      // Build persona texts
      const personaTexts = uncachedPersonas.map((persona) => ({
        id: persona.id,
        text: this.buildPersonaDescription(persona),
      }));

      // Use same batch processing logic as preload
      const batchSize = 3;
      const delayBetweenBatches = 21000;
      let loaded = 0;
      let failedBatches = 0;
      const maxRetries = 3;

      for (let i = 0; i < personaTexts.length; i += batchSize) {
        const batch = personaTexts.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        let retryCount = 0;
        let success = false;

        while (retryCount < maxRetries && !success) {
          try {
            const response = await this.voyageClient!.embed({
              input: batch.map((p) => p.text),
              model: this.MODEL,
            });

            if (response.data && response.data.length === batch.length) {
              batch.forEach((persona, index) => {
                const embedding = response.data![index]?.embedding;
                if (embedding) {
                  this.embeddingCache.set(persona.id, embedding);
                  loaded++;
                }
              });
              success = true;
            }
          } catch (error: any) {
            retryCount++;
            
            if (error.statusCode === 429 || error.message?.includes('rate limit')) {
              if (retryCount < maxRetries) {
                const waitTime = delayBetweenBatches * Math.pow(2, retryCount - 1);
                console.log(`⏳ Rate limit hit for batch ${batchNumber}, waiting ${waitTime / 1000}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              } else {
                console.error(`❌ Batch ${batchNumber} failed after ${maxRetries} retries`);
                failedBatches++;
              }
            } else {
              console.error(`Error loading batch ${batchNumber}:`, error.message || error);
              failedBatches++;
              break;
            }
          }
        }

        if (i + batchSize < personaTexts.length && success) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }

      const successRate = ((loaded / uncachedPersonas.length) * 100).toFixed(1);
      console.log(`✅ Resumed preload: ${loaded}/${uncachedPersonas.length} personas loaded (${successRate}%)`);
      
      if (failedBatches > 0) {
        console.log(`⚠️  ${failedBatches} batches failed. Will retry on next resume.`);
      }
    } catch (error) {
      console.error('Error resuming preload:', error);
    }
  }

  /**
   * Clear caches (useful for testing or when data changes)
   */
  clearCaches(): void {
    this.embeddingCache.clear();
    this.narrativeCache.clear();
  }
}
