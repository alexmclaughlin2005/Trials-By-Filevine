# Phase 2 Implementation Summary: Relevance-Based Speaker Selection

**Date:** January 24, 2026
**Status:** ✅ Complete - Ready for Testing
**Related:** [ROUNDTABLE_DESIGN_UPDATES_IMPLEMENTATION_PLAN.md](ROUNDTABLE_DESIGN_UPDATES_IMPLEMENTATION_PLAN.md)

---

## Changes Implemented

### 1. Created RelevanceScorer Class ✅

**File:** `services/api-gateway/src/services/roundtable/relevance-scorer.ts` (new file, 304 lines)

**Purpose:** Computes how relevant each persona is to a specific argument using rule-based keyword matching.

**Scoring Components:**

1. **Topic Match** (35% weight)
   - Jaccard similarity between persona keywords and argument keywords
   - Measures semantic overlap in expertise/background

2. **Emotional Triggers** (25% weight)
   - Detects if argument contains keywords that trigger strong persona reactions
   - Categories: healthcare, corporate, safety, fairness

3. **Experience Match** (25% weight)
   - Matches persona's life experiences to argument domains
   - Domains: medical, legal, business, technical, construction, financial, safety, fairness

4. **Values Alignment** (15% weight)
   - Detects value resonance/conflict
   - Value markers: pro-business, pro-regulation, individualist, collectivist

**Output:** Composite relevance score (0.0-1.0)
- **High relevance (>0.6):** Strong expertise/experience match
- **Neutral (0.4-0.6):** General interest
- **Low relevance (<0.4):** Minimal connection to topic

---

### 2. Updated TurnManager for Relevance ✅

**File:** `services/api-gateway/src/services/roundtable/turn-manager.ts`

**Changes:**

#### Added Relevance Score to PersonaTurnInfo
```typescript
export interface PersonaTurnInfo {
  personaId: string;
  personaName: string;
  leadershipLevel: LeadershipLevel;
  speakCount: number;
  relevanceScore?: number; // NEW: 0.0-1.0
}
```

#### New Method: `weightedSelectWithRelevance()`
```typescript
// Formula: probability = (leadership_weight + relevance_score) / 2
// Blends leadership tendency with topic relevance (50/50)
```

**Example Probabilities:**

| Persona | Leadership | Relevance | Raw Prob | Effect |
|---------|-----------|-----------|----------|--------|
| Nurse (Follower) | 0.2 | 0.8 | 0.50 | **Boosted** |
| Military (Leader) | 0.4 | 0.3 | 0.35 | **Dampened** |
| Union Worker (Influencer) | 0.3 | 0.75 | 0.525 | **Boosted** |

#### Updated `determineNextSpeaker()`
- Prioritizes high-relevance (>0.6) unspoken personas first
- Uses Leadership × Relevance composite for all selections
- Removes rigid leader-first ordering from Phase 1

#### Updated `shouldContinue()`
- High-relevance personas (>0.6) **must** speak at least once
- Low-relevance personas (<0.4) **can** stay silent if conversation concluding
- Logs when low-relevance silence is allowed

---

### 3. Integrated into ConversationOrchestrator ✅

**File:** `services/api-gateway/src/services/roundtable/conversation-orchestrator.ts`

**Changes:**

#### Added RelevanceScorer Instance
```typescript
private relevanceScorer: RelevanceScorer;

constructor(prisma: PrismaClient, promptClient: PromptClient) {
  // ...
  this.relevanceScorer = new RelevanceScorer();
}
```

#### New Phase 0: Compute Relevance Scores
```typescript
console.log('🔍 Phase 0: Computing persona relevance scores...');
const relevanceScores = this.computeRelevanceScores(input);
```

Runs **before** initializing TurnManager, logs each persona's score:
```
🔍 Phase 0: Computing persona relevance scores...
  Nurse Betty: relevance=0.78 (topic=0.85, trigger=0.80, exp=0.75, values=0.65)
  Military Joe: relevance=0.32 (topic=0.25, trigger=0.30, exp=0.40, values=0.50)
  ...
```

#### Updated PersonaTurnInfo Creation
```typescript
const personaTurnInfos: PersonaTurnInfo[] = input.personas.map(p => ({
  personaId: p.id,
  personaName: p.name,
  leadershipLevel: this.normalizeLeadershipLevel(p.leadershipLevel),
  speakCount: 0,
  relevanceScore: relevanceScores.get(p.id) // NEW
}));
```

---

## How It Works: End-to-End

### Scenario: Medical Malpractice Argument

**Personas:**
1. **Betty Johnson** - Nurse, Follower
2. **Joe Martinez** - Retired Military, Leader
3. **Sam Chen** - Union Worker, Influencer
4. **Carol Davis** - Teacher, Passive

**Argument:** "The hospital failed to follow proper surgical protocol, resulting in patient harm."

### Phase 0: Relevance Scoring

```
🔍 Computing relevance scores...
  Betty Johnson: relevance=0.78 (healthcare experience, medical knowledge)
  Joe Martinez: relevance=0.28 (no medical background)
  Sam Chen: relevance=0.45 (safety concerns, institutional failure)
  Carol Davis: relevance=0.35 (general empathy, no specific expertise)
```

### Speaker Selection Logic

**Before Phase 2 (Pure Leadership):**
1. Joe (Leader) speaks first - **Always**
2. Sam (Influencer) speaks second
3. Betty (Follower) waits her turn
4. Carol (Passive) speaks last

**After Phase 2 (Leadership × Relevance):**

| Persona | Leadership | Relevance | Composite Prob | Order |
|---------|-----------|-----------|----------------|-------|
| Betty | 0.20 | 0.78 | 0.49 | **1st** (High relevance!) |
| Joe | 0.40 | 0.28 | 0.34 | 3rd (Dampened) |
| Sam | 0.30 | 0.45 | 0.375 | 2nd (Balanced) |
| Carol | 0.10 | 0.35 | 0.225 | 4th (Can stay silent) |

**Result:** Betty (the nurse) speaks early despite being a Follower, because her medical expertise is highly relevant.

---

## Key Behavioral Changes

### 1. Expert Voices Prioritized

**Medical malpractice case:**
- Nurses, doctors, healthcare workers speak more frequently
- Military leaders without medical knowledge speak less

**Corporate negligence case:**
- Union workers, business owners speak more frequently
- Teachers without business experience speak less

### 2. Natural Silence Allowed

**Low-relevance personas (<0.4) can remain silent if:**
- Conversation is approaching stagnation
- All high-relevance personas have spoken
- No strong opinion on the topic

**Console output:**
```
Allowing 2 low-relevance personas to remain silent
```

### 3. More Realistic Dynamics

- Subject matter experts dominate discussions naturally
- Leaders don't always speak first
- Followers with relevant expertise contribute meaningfully
- Passive personas speak when topic matters to them

---

## Testing Checklist

Test these scenarios to validate Phase 2:

### Test 1: Medical Argument
- [ ] Personas with healthcare background speak early and often
- [ ] Non-medical personas speak less frequently
- [ ] High speaking probability for nurses, doctors (even if Followers)

### Test 2: Business Argument
- [ ] Business owners, corporate workers speak frequently
- [ ] Teachers, retirees without business experience speak less
- [ ] Union workers engage on labor/safety aspects

### Test 3: Technical Argument
- [ ] Engineers, tech workers dominate conversation
- [ ] Non-technical personas may stay silent
- [ ] Relevance scores logged correctly in console

### Test 4: Low-Relevance Silence
- [ ] Personas with <0.4 relevance can skip speaking
- [ ] Console logs "Allowing N low-relevance personas to remain silent"
- [ ] Conversation ends gracefully without forcing irrelevant voices

### Test 5: Composite Scoring
- [ ] Check console logs for relevance scores
- [ ] Verify topic, trigger, experience, values components
- [ ] Ensure composite = weighted average

---

## Files Modified

| File | Lines Changed | Change Type |
|------|---------------|-------------|
| `relevance-scorer.ts` | 304 | New file |
| `turn-manager.ts` | +60 | Enhanced with relevance |
| `conversation-orchestrator.ts` | +35 | Integrated relevance scoring |

**Total Lines Added:** ~400

---

## Performance Impact

**Relevance Scoring Cost:**
- Runs once per conversation (Phase 0)
- 6 personas × ~10ms = ~60ms total
- Negligible compared to 60-90 second AI generation time

**No Additional API Calls:**
- Rule-based scoring (keyword matching)
- No embeddings or LLM calls
- Fast and deterministic

**Conversation Length:**
- May be slightly shorter (low-relevance silence)
- High-relevance personas may speak more (up to 5 times each)
- Overall similar to Phase 1 (18-25 statements)

---

## Rollback Plan

If Phase 2 causes issues:

```bash
# Revert turn-manager.ts changes
git checkout HEAD~1 -- services/api-gateway/src/services/roundtable/turn-manager.ts

# Revert conversation-orchestrator.ts changes
git checkout HEAD~1 -- services/api-gateway/src/services/roundtable/conversation-orchestrator.ts

# Delete relevance-scorer.ts
rm services/api-gateway/src/services/roundtable/relevance-scorer.ts

# Restart server
```

---

## Future Enhancements

### Short Term
- [ ] Store relevance scores in database for analysis
- [ ] Add relevance breakdown to persona summaries
- [ ] Create admin view showing relevance scores

### Medium Term
- [ ] Implement embedding-based topic matching (more accurate)
- [ ] Add domain expertise tagging to personas
- [ ] Track relevance-weighted influence (high-relevance opinions matter more)

### Long Term
- [ ] Cross-argument learning (remember persona expertise)
- [ ] Dynamic relevance (adjust as conversation evolves)
- [ ] Relevance heat maps in UI

---

## Success Metrics

**Quantitative:**
- [ ] High-relevance personas (>0.6) speak 60%+ of the time
- [ ] Low-relevance personas (<0.4) can stay silent (10-20% of conversations)
- [ ] Relevance scoring adds <100ms to conversation startup
- [ ] Conversation length remains 18-25 statements average

**Qualitative:**
- [ ] Attorneys report more realistic dynamics
- [ ] Expert personas visibly dominate relevant discussions
- [ ] Low-relevance silence feels natural, not forced
- [ ] Composite scores align with intuitive expertise match

---

**Status:** ✅ Complete - Ready for Testing
**Next Action:** Test Phase 2 via UI with diverse argument types

**Implementation Time:** ~90 minutes
**Estimated Testing Time:** 45-60 minutes
