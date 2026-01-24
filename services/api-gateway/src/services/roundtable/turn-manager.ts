/**
 * TurnManager - Manages speaking turns in roundtable conversations
 *
 * Implements the turn-taking logic from the focus group simulation design:
 * - Every persona speaks at least once
 * - No persona speaks more than 5 times
 * - Leadership-based speaking probability (LEADER > INFLUENCER > FOLLOWER > PASSIVE)
 * - Natural conversation flow with convergence detection
 */

export enum LeadershipLevel {
  LEADER = 'LEADER',
  INFLUENCER = 'INFLUENCER',
  FOLLOWER = 'FOLLOWER',
  PASSIVE = 'PASSIVE'
}

export interface PersonaTurnInfo {
  personaId: string;
  personaName: string;
  leadershipLevel: LeadershipLevel;
  speakCount: number;
  relevanceScore?: number; // 0.0-1.0, higher = more relevant to argument
}

export interface Statement {
  personaId: string;
  personaName: string;
  content: string;
  sequenceNumber: number;
  sentiment?: string;
  keyPoints?: string[];
}

/**
 * Leadership-based speaking weights
 * Higher weight = more likely to speak
 */
const LEADERSHIP_WEIGHTS: Record<LeadershipLevel, number> = {
  [LeadershipLevel.LEADER]: 0.40,
  [LeadershipLevel.INFLUENCER]: 0.30,
  [LeadershipLevel.FOLLOWER]: 0.20,
  [LeadershipLevel.PASSIVE]: 0.10
};

const MAX_STATEMENTS_PER_PERSONA = 5;
const MIN_STATEMENTS_PER_PERSONA = 1;

export class TurnManager {
  private personas: PersonaTurnInfo[];
  private speakCounts: Map<string, number>;
  private conversationHistory: Statement[];

  constructor(personas: PersonaTurnInfo[]) {
    this.personas = personas;
    this.speakCounts = new Map(personas.map(p => [p.personaId, 0]));
    this.conversationHistory = [];
  }

  /**
   * Set relevance scores for all personas (called once at conversation start)
   */
  setRelevanceScores(scores: Map<string, number>): void {
    for (const persona of this.personas) {
      persona.relevanceScore = scores.get(persona.personaId) || 0.5; // Default to neutral
    }
  }

  /**
   * Check if a persona can still speak (hasn't hit max)
   */
  canSpeak(personaId: string): boolean {
    const count = this.speakCounts.get(personaId) || 0;
    return count < MAX_STATEMENTS_PER_PERSONA;
  }

  /**
   * Get personas who haven't spoken yet (minimum participation)
   */
  getUnspokenPersonas(): PersonaTurnInfo[] {
    return this.personas.filter(p => (this.speakCounts.get(p.personaId) || 0) === 0);
  }

  /**
   * Get personas who can still speak (haven't maxed out)
   */
  getEligiblePersonas(): PersonaTurnInfo[] {
    return this.personas.filter(p => this.canSpeak(p.personaId));
  }

  /**
   * Determine the next speaker using Leadership × Relevance selection
   * Priority 1: Ensure high-relevance personas speak at least once
   * Priority 2: Weight by both leadership level and topic relevance
   */
  determineNextSpeaker(): PersonaTurnInfo | null {
    const unspoken = this.getUnspokenPersonas();

    // Priority 1: High-relevance personas must speak
    if (unspoken.length > 0) {
      const highRelevance = unspoken.filter(p => (p.relevanceScore || 0.5) > 0.6);

      if (highRelevance.length > 0) {
        // Prioritize high-relevance unspoken personas
        return this.weightedSelectWithRelevance(highRelevance);
      }

      // Otherwise use tier-based randomization with relevance
      return this.weightedSelectWithRelevance(unspoken);
    }

    // Priority 2: Natural conversation flow based on leadership × relevance
    const eligible = this.getEligiblePersonas();
    if (eligible.length === 0) {
      return null; // Everyone has maxed out
    }

    return this.weightedSelectWithRelevance(eligible);
  }

  /**
   * Select a persona from a list, preferring higher leadership levels
   */
  private selectByLeadership(personas: PersonaTurnInfo[]): PersonaTurnInfo {
    // Sort by leadership level (LEADER > INFLUENCER > FOLLOWER > PASSIVE)
    const sorted = [...personas].sort((a, b) => {
      const weightA = LEADERSHIP_WEIGHTS[a.leadershipLevel];
      const weightB = LEADERSHIP_WEIGHTS[b.leadershipLevel];
      return weightB - weightA;
    });
    return sorted[0];
  }

  /**
   * Select a persona with randomization within leadership tiers
   * Leaders and Influencers are treated as equal "active voices" pool
   */
  private selectByLeadershipWithRandomization(personas: PersonaTurnInfo[]): PersonaTurnInfo {
    // Separate into tiers: active voices (Leader/Influencer) vs quiet voices (Follower/Passive)
    const activeVoices = personas.filter(p =>
      p.leadershipLevel === LeadershipLevel.LEADER ||
      p.leadershipLevel === LeadershipLevel.INFLUENCER
    );

    const quietVoices = personas.filter(p =>
      p.leadershipLevel === LeadershipLevel.FOLLOWER ||
      p.leadershipLevel === LeadershipLevel.PASSIVE
    );

    // Prefer active voices but randomize within the tier
    if (activeVoices.length > 0) {
      // Equal probability within Leader/Influencer pool
      const randomIndex = Math.floor(Math.random() * activeVoices.length);
      return activeVoices[randomIndex];
    }

    // If only quiet voices remain, use standard weighted selection
    if (quietVoices.length > 0) {
      return this.weightedSelect(quietVoices);
    }

    // Fallback (should never reach here)
    return personas[0];
  }

  /**
   * Weighted selection using both leadership and relevance
   * Formula: probability = (leadership_weight + relevance_score) / 2
   */
  private weightedSelectWithRelevance(personas: PersonaTurnInfo[]): PersonaTurnInfo {
    // Compute probability for each persona
    const probabilities = personas.map(p => {
      const leadershipWeight = LEADERSHIP_WEIGHTS[p.leadershipLevel];
      const relevance = p.relevanceScore || 0.5; // Default neutral if not set

      // Blend leadership and relevance (50/50)
      return (leadershipWeight + relevance) / 2;
    });

    // Normalize to sum to 1.0
    const total = probabilities.reduce((sum, p) => sum + p, 0);
    const normalized = probabilities.map(p => p / total);

    // Weighted random selection
    let random = Math.random();
    for (let i = 0; i < personas.length; i++) {
      random -= normalized[i];
      if (random <= 0) {
        return personas[i];
      }
    }

    return personas[0]; // Fallback
  }

  /**
   * Weighted random selection based on leadership level only (legacy)
   */
  private weightedSelect(personas: PersonaTurnInfo[]): PersonaTurnInfo {
    // Calculate total weight
    const totalWeight = personas.reduce(
      (sum, p) => sum + LEADERSHIP_WEIGHTS[p.leadershipLevel],
      0
    );

    // Random selection weighted by leadership
    let random = Math.random() * totalWeight;
    for (const persona of personas) {
      random -= LEADERSHIP_WEIGHTS[persona.leadershipLevel];
      if (random <= 0) {
        return persona;
      }
    }

    // Fallback (should never reach here)
    return personas[0];
  }

  /**
   * Record that a persona has spoken
   */
  recordStatement(statement: Statement): void {
    const currentCount = this.speakCounts.get(statement.personaId) || 0;
    this.speakCounts.set(statement.personaId, currentCount + 1);
    this.conversationHistory.push(statement);
  }

  /**
   * Get current speak count for a persona
   */
  getSpeakCount(personaId: string): number {
    return this.speakCounts.get(personaId) || 0;
  }

  /**
   * Check if conversation should continue
   * Must continue if high-relevance personas haven't spoken
   * Can end gracefully if only low-relevance personas remain silent
   */
  shouldContinue(): boolean {
    const totalStatements = this.conversationHistory.length;
    const personaCount = this.personas.length;

    const unspoken = this.getUnspokenPersonas();

    // Check if high-relevance personas have spoken
    const highRelevanceUnspoken = unspoken.filter(p => (p.relevanceScore || 0.5) > 0.6);

    // MUST continue if high-relevance personas haven't spoken
    if (highRelevanceUnspoken.length > 0) {
      return true;
    }

    // Low-relevance personas can stay silent if conversation is winding down
    const lowRelevanceUnspoken = unspoken.filter(p => (p.relevanceScore || 0.5) < 0.4);
    const approachingStagnation = totalStatements >= personaCount * 1.5 && this.detectStagnation();

    if (lowRelevanceUnspoken.length > 0 && lowRelevanceUnspoken.length === unspoken.length && approachingStagnation) {
      console.log(`  Allowing ${lowRelevanceUnspoken.length} low-relevance personas to remain silent`);
      return false; // End conversation gracefully
    }

    // Otherwise use standard continuation logic
    if (unspoken.length > 0) {
      return true;
    }

    // Ensure at least 2 rounds per persona (initial + at least 1 follow-up each)
    const minTotalStatements = personaCount * 2;
    if (totalStatements < minTotalStatements) {
      return this.getEligiblePersonas().length > 0;
    }

    // After minimum rounds, check if we should continue
    // Stop if no one can speak anymore
    if (this.getEligiblePersonas().length === 0) {
      return false;
    }

    // Check if leaders and influencers have maxed out (let them drive conversation)
    const activePersonas = this.personas.filter(
      p => p.leadershipLevel === LeadershipLevel.LEADER ||
           p.leadershipLevel === LeadershipLevel.INFLUENCER
    );

    // If we have active personas (leaders/influencers), continue if they can still speak
    if (activePersonas.length > 0) {
      const activeMaxed = activePersonas.every(
        p => this.getSpeakCount(p.personaId) >= MAX_STATEMENTS_PER_PERSONA
      );

      if (activeMaxed) {
        return false;
      }
    }

    // Check for stagnation (but only after minimum rounds)
    if (totalStatements >= minTotalStatements * 1.5 && this.detectStagnation()) {
      return false;
    }

    return true;
  }

  /**
   * Detect if conversation is going in circles or has naturally concluded
   * Uses semantic similarity (keyword overlap) and explicit agreement detection
   */
  private detectStagnation(): boolean {
    // Need at least 3 statements to detect semantic similarity
    if (this.conversationHistory.length < 3) {
      return false;
    }

    const recent = this.conversationHistory.slice(-3);

    // PRIMARY: Check for semantic similarity using keyword overlap (>2 consecutive similar turns)
    const keywords = recent.map(s => this.extractKeywords(s.content));
    const sim_1_2 = this.jaccardSimilarity(keywords[0], keywords[1]);
    const sim_2_3 = this.jaccardSimilarity(keywords[1], keywords[2]);

    const SIMILARITY_THRESHOLD = 0.7;
    if (sim_1_2 > SIMILARITY_THRESHOLD && sim_2_3 > SIMILARITY_THRESHOLD) {
      return true; // Semantically stagnant - people repeating same ideas
    }

    // SECONDARY: Detect explicit agreement phrases
    const agreementPattern = /^(I agree|Same here|Nothing to add|Exactly|That's right)/i;
    const recentAgreements = recent.filter(s => agreementPattern.test(s.content.trim()));
    if (recentAgreements.length >= 2) {
      return true; // Multiple explicit agreements indicate consensus
    }

    // FALLBACK: Keep existing heuristics for additional signals
    if (this.conversationHistory.length >= 8) {
      const recentFour = this.conversationHistory.slice(-4);

      // Very short statements (conversation winding down)
      const allVeryShort = recentFour.every(s => s.content.length < 50);
      if (allVeryShort) {
        return true;
      }

      // Low average length
      const avgLength = recentFour.reduce((sum, s) => sum + s.content.length, 0) / recentFour.length;
      if (avgLength < 60) {
        return true;
      }

      // Repetitive sentiment (strong consensus)
      const sentiments = recentFour
        .map(s => s.sentiment)
        .filter(s => s && s !== 'neutral');

      if (sentiments.length >= 3) {
        const allSame = sentiments.every(s => s === sentiments[0]);
        if (allSame) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Extract significant keywords from statement text
   * Filters out stopwords and short words
   */
  private extractKeywords(text: string): Set<string> {
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their',
      'my', 'your', 'his', 'her', 'its', 'our'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopwords.has(w)); // Keep words >3 chars, not stopwords

    return new Set(words);
  }

  /**
   * Calculate Jaccard similarity between two keyword sets
   * Returns 0.0 (no overlap) to 1.0 (identical)
   */
  private jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    if (union.size === 0) {
      return 0.0;
    }

    return intersection.size / union.size;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Statement[] {
    return this.conversationHistory;
  }

  /**
   * Get statistics about conversation
   */
  getStatistics() {
    return {
      totalStatements: this.conversationHistory.length,
      personaSpeakCounts: Object.fromEntries(this.speakCounts),
      unspokenCount: this.getUnspokenPersonas().length,
      eligibleCount: this.getEligiblePersonas().length
    };
  }
}
