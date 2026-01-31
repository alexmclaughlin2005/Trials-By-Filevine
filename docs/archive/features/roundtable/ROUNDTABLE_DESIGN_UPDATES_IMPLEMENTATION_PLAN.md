# Roundtable Conversation Design Updates: Implementation Plan

**Date:** January 24, 2026
**Status:** Planning
**Related Docs:**
- `focus_group_simulation_design.md` (archived)
- `ROUNDTABLE_CONVERSATIONS.md` (current production doc)

---

## Executive Summary

This document outlines the implementation plan for three major design updates to the roundtable conversation system:

1. **Update #1:** Improved stagnation detection, randomized leader/influencer ordering, unconstrained passive responses
2. **Update #2:** Relevance-based speaker selection using Leadership × Relevance scoring

These changes will make conversations more realistic by:
- Prioritizing personas with relevant expertise
- Allowing natural conversation flow within leadership tiers
- Detecting semantic repetition vs. just short statements
- Letting personas speak naturally without artificial length constraints

---

## Current Implementation Analysis

### Files Involved

| File | Lines | Purpose |
|------|-------|---------|
| `services/api-gateway/src/services/roundtable/turn-manager.ts` | 267 | Speaker selection, turn management, stagnation detection |
| `services/api-gateway/src/services/roundtable/conversation-orchestrator.ts` | 478 | Conversation flow, prompt generation, AI integration |
| `services/api-gateway/src/services/roundtable/persona-summarizer.ts` | ~200 | Per-persona summary generation |
| `services/api-gateway/src/services/roundtable/statement-analyzer.ts` | ~300 | Post-conversation statement analysis |

### Current Behavior

**Speaker Selection (turn-manager.ts:86-101):**
```typescript
determineNextSpeaker():
  1. Priority 1: Ensure everyone speaks once (selectByLeadership - Leaders first)
  2. Priority 2: Weighted random (40% Leader, 30% Influencer, 20% Follower, 10% Passive)
```

**Stagnation Detection (turn-manager.ts:210-246):**
```typescript
detectStagnation():
  - Requires 8+ statements
  - Checks if last 4 are all < 50 chars
  - Checks if average of last 4 < 60 chars
  - Checks if 3+ have same non-neutral sentiment
```

**Length Guidance (conversation-orchestrator.ts:64-69):**
```typescript
LEADER: "3-5 sentences"
INFLUENCER: "2-4 sentences"
FOLLOWER: "1-2 sentences"
PASSIVE: "1 sentence"  ← Need to remove constraint
```

**Leadership Guidance (conversation-orchestrator.ts:74-79):**
```typescript
// Already well-defined behavioral expectations
// No changes needed here
```

---

## Design Update #1: Implementation

### 1.1 Stagnation Detection Enhancement

**Current Issue:** Only checks statement length and sentiment, not semantic similarity.

**Required Changes:**

**File:** `turn-manager.ts`
**Method:** `detectStagnation()` (lines 210-246)

**Implementation Options:**

#### Option A: Embedding-Based Similarity (Recommended)
```typescript
// Add new dependency
import Anthropic from '@anthropic-ai/sdk';

private async detectStagnation(): Promise<boolean> {
  if (this.conversationHistory.length < 3) return false;

  const recent = this.conversationHistory.slice(-3);

  // Check semantic similarity using embeddings
  const embeddings = await this.getEmbeddings(recent.map(s => s.content));

  const sim_1_2 = cosineSimilarity(embeddings[0], embeddings[1]);
  const sim_2_3 = cosineSimilarity(embeddings[1], embeddings[2]);

  const SIMILARITY_THRESHOLD = 0.85;
  if (sim_1_2 > SIMILARITY_THRESHOLD && sim_2_3 > SIMILARITY_THRESHOLD) {
    return true; // Semantically stagnant
  }

  // Keep existing heuristics as fallback
  return this.detectLengthStagnation();
}
```

**Pros:** Catches semantic repetition accurately
**Cons:** Requires embedding API calls (adds latency and cost)

#### Option B: Keyword Overlap (Faster Alternative)
```typescript
private detectStagnation(): boolean {
  if (this.conversationHistory.length < 3) return false;

  const recent = this.conversationHistory.slice(-3);

  // Extract significant keywords (nouns, verbs, adjectives)
  const keywords = recent.map(s => this.extractKeywords(s.content));

  // Calculate Jaccard similarity
  const sim_1_2 = jaccardSimilarity(keywords[0], keywords[1]);
  const sim_2_3 = jaccardSimilarity(keywords[1], keywords[2]);

  const OVERLAP_THRESHOLD = 0.7;
  if (sim_1_2 > OVERLAP_THRESHOLD && sim_2_3 > OVERLAP_THRESHOLD) {
    return true; // Keyword repetition detected
  }

  // Explicit agreement phrase detection
  const agreementPhrases = /^(I agree|Same here|Nothing to add|Exactly|That's right)/i;
  const recentAgreements = recent.filter(s => agreementPhrases.test(s.content));
  if (recentAgreements.length >= 2) {
    return true; // Multiple explicit agreements
  }

  return this.detectLengthStagnation();
}

private extractKeywords(text: string): Set<string> {
  // Simple approach: split, lowercase, remove stopwords
  const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);
  const words = text.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w));
  return new Set(words);
}

private jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}
```

**Pros:** Fast, no external API calls, deterministic
**Cons:** Less accurate than embeddings, may miss paraphrased repetition

**Recommendation:** Start with **Option B** (keyword overlap) for speed, consider Option A later if needed.

---

### 1.2 Leader/Influencer Randomization

**Current Issue:** Leaders always speak first in initial reactions, creating predictable order.

**Required Changes:**

**File:** `turn-manager.ts`
**Method:** `determineNextSpeaker()` (lines 86-101)

**Implementation:**

```typescript
determineNextSpeaker(): PersonaTurnInfo | null {
  const unspoken = this.getUnspokenPersonas();

  if (unspoken.length > 0) {
    // CHANGE: Randomize within Leader/Influencer pool
    return this.weightedSelectWithinTiers(unspoken);
  }

  const eligible = this.getEligiblePersonas();
  if (eligible.length === 0) return null;

  return this.weightedSelect(eligible);
}

/**
 * NEW METHOD: Weight selection but treat Leaders and Influencers equally
 */
private weightedSelectWithinTiers(personas: PersonaTurnInfo[]): PersonaTurnInfo {
  // Separate into tiers
  const activeVoices = personas.filter(p =>
    p.leadershipLevel === LeadershipLevel.LEADER ||
    p.leadershipLevel === LeadershipLevel.INFLUENCER
  );
  const quietVoices = personas.filter(p =>
    p.leadershipLevel === LeadershipLevel.FOLLOWER ||
    p.leadershipLevel === LeadershipLevel.PASSIVE
  );

  // Prefer active voices but randomize within tier
  if (activeVoices.length > 0) {
    // Equal probability within Leader/Influencer pool
    return activeVoices[Math.floor(Math.random() * activeVoices.length)];
  }

  // If only quiet voices remain, use standard weighted selection
  return this.weightedSelect(quietVoices);
}
```

**Impact:**
- Initial reactions: Leaders and Influencers go early, but order randomized within that tier
- Dynamic deliberation: Already uses `weightedSelect()`, no change needed
- More natural conversation flow, less predictable

---

### 1.3 Remove Passive Length Constraints

**Current Issue:** Passive personas told to give "1 sentence" responses, artificially constraining them.

**Required Changes:**

**File:** `conversation-orchestrator.ts`
**Constant:** `LENGTH_GUIDANCE` (lines 64-69)

**Before:**
```typescript
const LENGTH_GUIDANCE: Record<LeadershipLevel, string> = {
  [LeadershipLevel.LEADER]: "Share your view fully in 3-5 sentences. You often ask others what they think.",
  [LeadershipLevel.INFLUENCER]: "State your position clearly in 2-4 sentences. You're not shy about disagreeing.",
  [LeadershipLevel.FOLLOWER]: "Keep it brief, 1-2 sentences. You might reference what someone else said.",
  [LeadershipLevel.PASSIVE]: "A short response of 1 sentence. You don't say much unless it really matters."
};
```

**After:**
```typescript
const LENGTH_GUIDANCE: Record<LeadershipLevel, string> = {
  [LeadershipLevel.LEADER]: "Share your view fully. You often ask others what they think.",
  [LeadershipLevel.INFLUENCER]: "State your position clearly. You're not shy about disagreeing.",
  [LeadershipLevel.FOLLOWER]: "You might reference what someone else said.",
  [LeadershipLevel.PASSIVE]: "You speak when something truly matters to you."
};
```

**Rationale:**
- Remove all explicit length constraints (sentences)
- Let persona's natural communication style (from `LEADERSHIP_GUIDANCE`) drive length
- Passive personas will still be brief organically, but not artificially cut off

---

## Design Update #2: Relevance-Based Speaker Selection

### 2.1 Architecture Overview

**New Component:** `RelevanceScorer`
**Location:** `services/api-gateway/src/services/roundtable/relevance-scorer.ts` (new file)

**Integration Point:** `TurnManager.determineNextSpeaker()`

**Data Flow:**
```
1. ConversationOrchestrator starts conversation
2. RelevanceScorer computes relevance for each persona × argument
3. TurnManager uses composite (leadership × relevance) for speaker selection
4. Database stores relevance scores for analysis
```

---

### 2.2 Relevance Scoring Implementation

**New File:** `services/api-gateway/src/services/roundtable/relevance-scorer.ts`

```typescript
export interface RelevanceScore {
  personaId: string;
  argumentId: string;
  topicMatch: number;          // 0.0 - 1.0
  emotionalTrigger: number;    // 0.0 - 1.0
  experienceMatch: number;     // 0.0 - 1.0
  valuesAlignment: number;     // 0.0 - 1.0
  compositeRelevance: number;  // Weighted average
}

export class RelevanceScorer {
  /**
   * Compute relevance score for persona against argument
   *
   * @param persona - Full persona definition
   * @param argument - Argument being tested
   * @returns RelevanceScore object
   */
  async scoreRelevance(
    persona: PersonaInfo,
    argument: ArgumentInfo
  ): Promise<RelevanceScore> {

    // Option C: Embedding-based topic matching
    const topicMatch = await this.computeTopicMatch(persona, argument);

    // Rule-based emotional trigger detection
    const emotionalTrigger = this.detectEmotionalTriggers(persona, argument);

    // Experience matching (check life experiences against argument domain)
    const experienceMatch = this.matchExperience(persona, argument);

    // Values alignment (positive or negative resonance)
    const valuesAlignment = this.assessValuesAlignment(persona, argument);

    // Weighted composite (can adjust weights)
    const compositeRelevance = (
      topicMatch * 0.35 +
      emotionalTrigger * 0.25 +
      experienceMatch * 0.25 +
      valuesAlignment * 0.15
    );

    return {
      personaId: persona.id,
      argumentId: argument.id,
      topicMatch,
      emotionalTrigger,
      experienceMatch,
      valuesAlignment,
      compositeRelevance
    };
  }

  /**
   * Compute semantic similarity between persona description and argument
   */
  private async computeTopicMatch(
    persona: PersonaInfo,
    argument: ArgumentInfo
  ): Promise<number> {
    // Create text representations
    const personaText = `${persona.description} ${persona.worldview || ''} ${JSON.stringify(persona.lifeExperiences || {})}`;
    const argumentText = argument.content;

    // Get embeddings (using Anthropic or OpenAI)
    const personaEmbedding = await this.getEmbedding(personaText);
    const argumentEmbedding = await this.getEmbedding(argumentText);

    // Compute cosine similarity
    return this.cosineSimilarity(personaEmbedding, argumentEmbedding);
  }

  /**
   * Detect if argument contains emotional trigger keywords for persona
   */
  private detectEmotionalTriggers(
    persona: PersonaInfo,
    argument: ArgumentInfo
  ): number {
    // Extract trigger keywords from persona (if defined in schema)
    // For now, use heuristic based on life experiences and worldview

    const argumentLower = argument.content.toLowerCase();

    // Example triggers (would be persona-specific in real implementation)
    const personalTriggers: Record<string, string[]> = {
      'healthcare': ['hospital', 'medical', 'doctor', 'nurse', 'patient', 'healthcare'],
      'corporate': ['company', 'profit', 'business', 'corporation', 'shareholders'],
      'safety': ['safety', 'danger', 'risk', 'harm', 'injury', 'death'],
      'fairness': ['unfair', 'unjust', 'discrimination', 'bias', 'inequality']
    };

    // Check persona's life experiences and worldview for trigger categories
    const personaCategories = this.identifyPersonaCategories(persona);

    let triggerScore = 0;
    let maxTriggers = 0;

    for (const category of personaCategories) {
      const triggers = personalTriggers[category] || [];
      maxTriggers += triggers.length;

      for (const trigger of triggers) {
        if (argumentLower.includes(trigger)) {
          triggerScore++;
        }
      }
    }

    return maxTriggers > 0 ? triggerScore / maxTriggers : 0.0;
  }

  /**
   * Match persona's life experiences to argument domain
   */
  private matchExperience(
    persona: PersonaInfo,
    argument: ArgumentInfo
  ): number {
    // Check if persona has relevant professional or personal experience
    const experiences = persona.lifeExperiences || {};

    // Extract domains from argument (simplified)
    const argumentDomains = this.extractDomains(argument.content);

    // Check overlap with persona experiences
    const personaExperienceText = JSON.stringify(experiences).toLowerCase();

    let matchCount = 0;
    for (const domain of argumentDomains) {
      if (personaExperienceText.includes(domain)) {
        matchCount++;
      }
    }

    return argumentDomains.length > 0 ? matchCount / argumentDomains.length : 0.3;
  }

  /**
   * Assess how argument aligns (or conflicts) with persona's core values
   */
  private assessValuesAlignment(
    persona: PersonaInfo,
    argument: ArgumentInfo
  ): number {
    // Both positive and negative alignment create relevance
    // A corporate executive hearing anti-corporate argument is HIGHLY relevant (negative alignment)

    const worldview = (persona.worldview || '').toLowerCase();
    const argumentLower = argument.content.toLowerCase();

    // Simplified value categories
    const valueMarkers = {
      'pro-business': ['profit', 'business', 'economic', 'market'],
      'pro-regulation': ['safety', 'regulation', 'oversight', 'accountability'],
      'individualist': ['personal', 'individual', 'freedom', 'choice'],
      'collectivist': ['community', 'society', 'public', 'common good']
    };

    // Identify persona's value orientation
    let alignmentScore = 0.5; // Neutral baseline

    // Check for value conflicts (increase relevance)
    for (const [value, markers] of Object.entries(valueMarkers)) {
      const personaHasValue = markers.some(m => worldview.includes(m));
      const argumentMentionsValue = markers.some(m => argumentLower.includes(m));

      if (personaHasValue && argumentMentionsValue) {
        alignmentScore += 0.2; // Relevance increased
      }
    }

    return Math.min(alignmentScore, 1.0);
  }

  /**
   * Helper: Identify persona categories from life experiences and worldview
   */
  private identifyPersonaCategories(persona: PersonaInfo): string[] {
    const categories: string[] = [];
    const text = `${persona.description} ${persona.worldview || ''} ${JSON.stringify(persona.lifeExperiences || {})}`.toLowerCase();

    if (text.includes('health') || text.includes('medical') || text.includes('nurse') || text.includes('doctor')) {
      categories.push('healthcare');
    }
    if (text.includes('business') || text.includes('corporate') || text.includes('company')) {
      categories.push('corporate');
    }
    if (text.includes('safety') || text.includes('military') || text.includes('police')) {
      categories.push('safety');
    }
    if (text.includes('fair') || text.includes('justice') || text.includes('rights')) {
      categories.push('fairness');
    }

    return categories;
  }

  /**
   * Helper: Extract domain keywords from argument text
   */
  private extractDomains(text: string): string[] {
    const domains: string[] = [];
    const textLower = text.toLowerCase();

    const domainKeywords = {
      'medical': ['hospital', 'medical', 'doctor', 'nurse', 'patient', 'healthcare', 'surgery'],
      'legal': ['law', 'attorney', 'court', 'judge', 'lawsuit', 'legal'],
      'business': ['company', 'business', 'profit', 'revenue', 'corporate', 'shareholders'],
      'technical': ['technology', 'software', 'engineering', 'technical', 'system'],
      'construction': ['construction', 'building', 'contractor', 'safety', 'worksite']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(k => textLower.includes(k))) {
        domains.push(domain);
      }
    }

    return domains;
  }

  /**
   * Helper: Get text embedding (using external service)
   */
  private async getEmbedding(text: string): Promise<number[]> {
    // TODO: Implement using Anthropic or OpenAI embeddings API
    // For now, return mock embedding
    return new Array(1536).fill(0).map(() => Math.random());
  }

  /**
   * Helper: Compute cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must be same length');
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

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

---

### 2.3 TurnManager Integration

**File:** `turn-manager.ts`
**Method:** `determineNextSpeaker()` - Modified to use relevance scores

```typescript
export interface PersonaTurnInfo {
  personaId: string;
  personaName: string;
  leadershipLevel: LeadershipLevel;
  speakCount: number;
  relevanceScore?: number; // NEW: Composite relevance from RelevanceScorer
}

export class TurnManager {
  // ... existing fields ...

  /**
   * NEW: Set relevance scores for all personas (called once at conversation start)
   */
  setRelevanceScores(scores: Map<string, number>): void {
    for (const persona of this.personas) {
      persona.relevanceScore = scores.get(persona.personaId) || 0.5; // Default to neutral
    }
  }

  /**
   * MODIFIED: Determine next speaker using Leadership × Relevance
   */
  determineNextSpeaker(): PersonaTurnInfo | null {
    const unspoken = this.getUnspokenPersonas();

    if (unspoken.length > 0) {
      // Prioritize high-relevance personas first
      const highRelevance = unspoken.filter(p => (p.relevanceScore || 0) > 0.6);
      if (highRelevance.length > 0) {
        return this.weightedSelectWithRelevance(highRelevance);
      }

      // Otherwise use standard tier-based selection
      return this.weightedSelectWithRelevance(unspoken);
    }

    const eligible = this.getEligiblePersonas();
    if (eligible.length === 0) return null;

    return this.weightedSelectWithRelevance(eligible);
  }

  /**
   * NEW: Weighted selection using both leadership and relevance
   */
  private weightedSelectWithRelevance(personas: PersonaTurnInfo[]): PersonaTurnInfo {
    // Compute probability for each persona
    const probabilities = personas.map(p => {
      const leadershipWeight = LEADERSHIP_WEIGHTS[p.leadershipLevel];
      const relevance = p.relevanceScore || 0.5;

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
}
```

---

### 2.4 ConversationOrchestrator Integration

**File:** `conversation-orchestrator.ts`
**Method:** `runConversation()` - Add relevance scoring phase

```typescript
import { RelevanceScorer } from './relevance-scorer';

export class ConversationOrchestrator {
  // ... existing fields ...
  private relevanceScorer: RelevanceScorer;

  constructor(prisma: PrismaClient, promptClient: PromptClient) {
    this.prisma = prisma;
    this.promptClient = promptClient;
    this.personaSummarizer = new PersonaSummarizer(prisma, promptClient);
    this.relevanceScorer = new RelevanceScorer(); // NEW
  }

  async runConversation(input: ConversationInput): Promise<ConversationResult> {
    console.log(`🎭 Starting roundtable conversation for argument: ${input.argument.title}`);

    // ... existing conversation creation code ...

    // NEW: Phase 0 - Compute relevance scores
    console.log('🔍 Phase 0: Computing persona relevance scores...');
    const relevanceScores = await this.computeRelevanceScores(input);

    // Initialize turn manager WITH relevance scores
    const personaTurnInfos: PersonaTurnInfo[] = input.personas.map(p => ({
      personaId: p.id,
      personaName: p.name,
      leadershipLevel: this.normalizeLeadershipLevel(p.leadershipLevel),
      speakCount: 0,
      relevanceScore: relevanceScores.get(p.id)
    }));

    this.turnManager = new TurnManager(personaTurnInfos);

    // ... rest of conversation flow unchanged ...
  }

  /**
   * NEW: Compute relevance scores for all personas
   */
  private async computeRelevanceScores(
    input: ConversationInput
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>();

    for (const persona of input.personas) {
      const score = await this.relevanceScorer.scoreRelevance(persona, input.argument);
      scores.set(persona.id, score.compositeRelevance);

      // Optionally save to database for analysis
      await this.saveRelevanceScore(input.sessionId, score);
    }

    return scores;
  }

  /**
   * NEW: Save relevance score to database (for analysis/debugging)
   */
  private async saveRelevanceScore(
    sessionId: string,
    score: RelevanceScore
  ): Promise<void> {
    // TODO: Create database table for relevance scores if desired
    // For now, just log it
    console.log(`  ${score.personaId}: relevance=${score.compositeRelevance.toFixed(2)}`);
  }
}
```

---

### 2.5 Database Schema Changes (Optional)

**New Table:** `focus_group_persona_relevance`

```prisma
model FocusGroupPersonaRelevance {
  id                String   @id @default(cuid())
  sessionId         String
  personaId         String
  argumentId        String
  topicMatch        Float
  emotionalTrigger  Float
  experienceMatch   Float
  valuesAlignment   Float
  compositeRelevance Float
  createdAt         DateTime @default(now())

  @@unique([sessionId, personaId, argumentId])
  @@index([sessionId])
  @@index([argumentId])
}
```

**Purpose:** Store relevance scores for post-conversation analysis and debugging.

---

### 2.6 Soft Minimum Speaking Requirement

**File:** `turn-manager.ts`
**Method:** `shouldContinue()` - Modify to allow low-relevance silence

```typescript
shouldContinue(): boolean {
  const totalStatements = this.conversationHistory.length;
  const personaCount = this.personas.length;

  // NEW: Check if high-relevance personas have spoken
  const unspoken = this.getUnspokenPersonas();
  const highRelevanceUnspoken = unspoken.filter(p => (p.relevanceScore || 0) > 0.6);

  // MUST continue if high-relevance personas haven't spoken
  if (highRelevanceUnspoken.length > 0) {
    return true;
  }

  // Low-relevance personas can stay silent if conversation is winding down
  const lowRelevanceUnspoken = unspoken.filter(p => (p.relevanceScore || 0) < 0.4);
  const approaching_stagnation = this.detectStagnation();

  if (lowRelevanceUnspoken.length > 0 && approaching_stagnation) {
    console.log(`  Allowing ${lowRelevanceUnspoken.length} low-relevance personas to remain silent`);
    return false; // End conversation gracefully
  }

  // ... rest of existing logic ...
}
```

---

## Implementation Phases

### Phase 1: Update #1 (Quick Wins) - 2-3 hours
1. ✅ Remove passive length constraints (5 min)
2. ✅ Add Leader/Influencer randomization (30 min)
3. ✅ Implement keyword-based stagnation detection (1-2 hours)
4. ✅ Test with existing conversations (30 min)

### Phase 2: Update #2 (Relevance System) - 1-2 days
1. ✅ Create `RelevanceScorer` class with rule-based scoring (4 hours)
2. ✅ Integrate with `TurnManager` (2 hours)
3. ✅ Update `ConversationOrchestrator` to use relevance (2 hours)
4. ✅ Add database schema for relevance tracking (optional, 1 hour)
5. ✅ Test with diverse argument types (2 hours)

### Phase 3: Optimization (Future) - 1 week
1. ⏳ Implement embedding-based topic matching (2 days)
2. ⏳ Fine-tune relevance score weights (1 day)
3. ⏳ Add persona expertise tagging system (2 days)
4. ⏳ Performance optimization (1 day)

---

## Testing Strategy

### Test Cases

#### Test 1: Medical Malpractice Argument
**Setup:**
- Personas: Nurse (Follower), Retired Military (Leader), Union Worker (Influencer), Teacher (Passive)
- Argument: "Hospital failed to follow proper surgical protocol"

**Expected Behavior (Before Update #2):**
- Retired Military speaks first (Leader)
- Nurse waits her turn (Follower)

**Expected Behavior (After Update #2):**
- Nurse has high relevance score (0.75+)
- Nurse likely speaks first despite being Follower
- Retired Military may speak less frequently (low relevance)

#### Test 2: Corporate Negligence Argument
**Setup:**
- Personas: Small Business Owner (Leader), Union Worker (Influencer), Accountant (Follower), Stay-at-home Parent (Passive)
- Argument: "Company prioritized profits over employee safety"

**Expected Behavior (After Update #2):**
- Union Worker has highest relevance (0.78+)
- Union Worker likely speaks most frequently
- Business Owner still speaks but with balanced perspective

#### Test 3: Stagnation Detection
**Setup:**
- Run conversation until natural conclusion
- Monitor for semantic repetition

**Expected Behavior (After Update #1):**
- Detects when personas repeat similar points with different wording
- Stops conversation before hitting statement limits
- Allows high-relevance personas to contribute fully

---

## Rollout Plan

### Stage 1: Development (Local)
- Implement all changes in dev environment
- Run test conversations with mock data
- Verify database migrations work

### Stage 2: Staging (Railway)
- Deploy to staging environment
- Run production-like tests
- Monitor performance and costs

### Stage 3: Production (Gradual Rollout)
- Deploy Update #1 first (lower risk)
- Monitor for 1 week
- Deploy Update #2 after validation

---

## Cost Analysis

### Current Costs Per Conversation
- Initial reactions: 6 personas × ~2K tokens = 12K tokens
- Deliberation: 12-18 turns × ~800 tokens = ~10K tokens
- Analysis: ~3K tokens
- **Total:** ~25K tokens = $0.50

### Additional Costs With Update #2
- Relevance scoring (embeddings): 6 personas × 2 embeddings × $0.00002 = $0.0002
- **New Total:** ~$0.50 (negligible increase)

### If Using LLM for Relevance (Option A from Update #1)
- Stagnation checks: ~3 embedding calls per conversation × $0.00002 = $0.00006
- **Total Increase:** < $0.01 per conversation

---

## Risks & Mitigations

### Risk 1: Relevance Scoring Too Slow
**Mitigation:** Use rule-based scoring initially, cache embeddings if needed

### Risk 2: Low-Relevance Personas Never Speak
**Mitigation:** Soft minimum ensures high-relevance speak, but allow low-relevance silence

### Risk 3: Stagnation Detection Too Aggressive
**Mitigation:** Require both keyword overlap AND length/sentiment signals before stopping

### Risk 4: Breaking Existing Conversations
**Mitigation:** Implement feature flag to toggle new behavior, gradual rollout

---

## Success Metrics

### Quantitative
- Average relevance match improvement: > 30%
- Conversation natural length: 18-25 statements (same as before)
- Stagnation detection accuracy: > 80%
- Cost per conversation: < $0.60 (< 20% increase)

### Qualitative
- Personas with relevant expertise speak more frequently
- Conversations feel more natural and less predictable
- Attorneys report better insights from focus group reports
- Fewer "irrelevant" or "off-topic" statements

---

## Documentation Updates Required

- [x] `ROUNDTABLE_CONVERSATIONS.md` - Update speaker selection logic section
- [x] `CURRENT_STATE.md` - Add relevance-based selection to features
- [ ] Create migration guide for existing conversations
- [ ] Update API documentation for new relevance score fields

---

## Open Questions

1. **Embedding Service:** Should we use Anthropic, OpenAI, or local embeddings?
2. **Relevance Weights:** Start with 50/50 leadership/relevance blend or different ratio?
3. **Database Storage:** Store all relevance scores or just composite?
4. **Feature Flag:** Add toggle for gradual rollout or deploy directly?
5. **Minimum Statements:** Keep soft minimum at 1 per persona or allow complete silence?

---

## Next Steps

1. Review this implementation plan with team
2. Answer open questions above
3. Start with Phase 1 (Update #1) implementation
4. Test thoroughly before moving to Phase 2
5. Update documentation as we go

---

**Last Updated:** January 24, 2026
**Status:** Ready for implementation
**Estimated Total Effort:** 2-3 days for both updates
