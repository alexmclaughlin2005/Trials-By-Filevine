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
   * Determine the next speaker using leadership-based selection
   * Priority 1: Ensure everyone speaks at least once
   * Priority 2: Weight by leadership level
   */
  determineNextSpeaker(): PersonaTurnInfo | null {
    // Priority 1: Anyone who hasn't spoken yet
    const unspoken = this.getUnspokenPersonas();
    if (unspoken.length > 0) {
      // Among unspoken, leaders go first
      return this.selectByLeadership(unspoken);
    }

    // Priority 2: Natural conversation flow based on leadership
    const eligible = this.getEligiblePersonas();
    if (eligible.length === 0) {
      return null; // Everyone has maxed out
    }

    return this.weightedSelect(eligible);
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
   * Weighted random selection based on leadership level
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
   * Must continue if anyone hasn't spoken
   * Can continue if we have eligible speakers and haven't hit minimum rounds
   */
  shouldContinue(): boolean {
    const totalStatements = this.conversationHistory.length;
    const personaCount = this.personas.length;

    // Must continue if anyone hasn't spoken
    if (this.getUnspokenPersonas().length > 0) {
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
   * Uses heuristics: very short statements + repetitive patterns
   */
  private detectStagnation(): boolean {
    // Need more data to detect stagnation
    if (this.conversationHistory.length < 8) {
      return false;
    }

    const recentStatements = this.conversationHistory.slice(-4);

    // Check if recent statements are ALL very short (sign of conversation winding down)
    const allVeryShort = recentStatements.every(s => s.content.length < 50);
    if (allVeryShort) {
      return true;
    }

    // Check average length - if consistently short, conversation may be done
    const avgLength = recentStatements.reduce((sum, s) => sum + s.content.length, 0) / recentStatements.length;

    // Lower threshold to 60 chars average (more lenient)
    if (avgLength < 60) {
      return true;
    }

    // Check for repetitive sentiment only with more data
    const sentiments = recentStatements
      .map(s => s.sentiment)
      .filter(s => s && s !== 'neutral');

    // Only consider stagnation if we have 3+ non-neutral sentiments that are all the same
    if (sentiments.length >= 3) {
      const allSame = sentiments.every(s => s === sentiments[0]);
      if (allSame) {
        return true; // Strong consensus reached
      }
    }

    return false;
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
