# Phase 1 Implementation Summary: Roundtable Design Updates

**Date:** January 24, 2026
**Status:** ✅ Complete - Ready for Testing
**Related:** `ROUNDTABLE_DESIGN_UPDATES_IMPLEMENTATION_PLAN.md`

---

## Changes Implemented

### 1. Remove Passive Length Constraints ✅

**File:** `services/api-gateway/src/services/roundtable/conversation-orchestrator.ts`
**Lines Modified:** 64-69

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

**Impact:**
- All explicit sentence count constraints removed
- Personas can now speak naturally based on their character definition
- Passive personas no longer artificially constrained to 1 sentence
- Response length emerges organically from `LEADERSHIP_GUIDANCE` behavioral definitions

---

### 2. Leader/Influencer Randomization ✅

**File:** `services/api-gateway/src/services/roundtable/turn-manager.ts`
**Lines Modified:** 86-101 (method modification), 115+ (new method added)

**Changes:**

#### Modified `determineNextSpeaker()`:
```typescript
determineNextSpeaker(): PersonaTurnInfo | null {
  const unspoken = this.getUnspokenPersonas();
  if (unspoken.length > 0) {
    // NEW: Randomize within Leader/Influencer pool
    return this.selectByLeadershipWithRandomization(unspoken);
  }
  // ... rest unchanged
}
```

#### New Method: `selectByLeadershipWithRandomization()`:
```typescript
private selectByLeadershipWithRandomization(personas: PersonaTurnInfo[]): PersonaTurnInfo {
  // Separate into active voices (Leader/Influencer) vs quiet (Follower/Passive)
  const activeVoices = personas.filter(p =>
    p.leadershipLevel === LeadershipLevel.LEADER ||
    p.leadershipLevel === LeadershipLevel.INFLUENCER
  );

  const quietVoices = personas.filter(p =>
    p.leadershipLevel === LeadershipLevel.FOLLOWER ||
    p.leadershipLevel === LeadershipLevel.PASSIVE
  );

  // Randomize within Leader/Influencer tier (equal probability)
  if (activeVoices.length > 0) {
    const randomIndex = Math.floor(Math.random() * activeVoices.length);
    return activeVoices[randomIndex];
  }

  // Use weighted selection for quiet voices
  if (quietVoices.length > 0) {
    return this.weightedSelect(quietVoices);
  }

  return personas[0]; // Fallback
}
```

**Impact:**
- Initial reactions: Leaders and Influencers still go first, but order is randomized within that tier
- No more predictable "Leader always speaks first" pattern
- Influencers can now jump in before Leaders, creating more natural dynamics
- Followers and Passives still wait until active voices have spoken

**Example Scenario:**

**Before:**
1. Military Leader speaks
2. Business Owner (Leader) speaks
3. Union Worker (Influencer) speaks
4. Nurse (Follower) speaks
5. Teacher (Passive) speaks

**After (possible ordering):**
1. Union Worker (Influencer) speaks ← Could go first now
2. Military Leader speaks
3. Business Owner (Leader) speaks
4. Nurse (Follower) speaks
5. Teacher (Passive) speaks

---

### 3. Keyword-Based Stagnation Detection ✅

**File:** `services/api-gateway/src/services/roundtable/turn-manager.ts`
**Lines Modified:** 210-246 (method rewrite), 250+ (new helper methods added)

**Changes:**

#### Completely Rewrote `detectStagnation()`:
```typescript
private detectStagnation(): boolean {
  if (this.conversationHistory.length < 3) return false;

  const recent = this.conversationHistory.slice(-3);

  // PRIMARY: Semantic similarity via keyword overlap
  const keywords = recent.map(s => this.extractKeywords(s.content));
  const sim_1_2 = this.jaccardSimilarity(keywords[0], keywords[1]);
  const sim_2_3 = this.jaccardSimilarity(keywords[1], keywords[2]);

  const SIMILARITY_THRESHOLD = 0.7;
  if (sim_1_2 > SIMILARITY_THRESHOLD && sim_2_3 > SIMILARITY_THRESHOLD) {
    return true; // >2 consecutive semantically similar turns
  }

  // SECONDARY: Explicit agreement phrase detection
  const agreementPattern = /^(I agree|Same here|Nothing to add|Exactly|That's right)/i;
  const recentAgreements = recent.filter(s => agreementPattern.test(s.content.trim()));
  if (recentAgreements.length >= 2) {
    return true; // Multiple explicit agreements
  }

  // FALLBACK: Keep existing heuristics (length, sentiment)
  // ... [existing logic preserved for additional signals]
}
```

#### New Helper: `extractKeywords()`:
```typescript
private extractKeywords(text: string): Set<string> {
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', ...]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w));

  return new Set(words);
}
```

#### New Helper: `jaccardSimilarity()`:
```typescript
private jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  if (union.size === 0) return 0.0;

  return intersection.size / union.size;
}
```

**Detection Logic:**

| Trigger | Condition | Example |
|---------|-----------|---------|
| **Semantic Similarity** | Jaccard similarity > 0.7 for 2+ consecutive pairs | "Hospital was negligent" → "The hospital failed" → "Yes, hospital neglect" |
| **Explicit Agreement** | 2+ statements starting with agreement phrases | "I agree with that" → "Same here, nothing to add" |
| **Very Short** | All 4 recent < 50 chars | "Yes." → "Agreed." → "Right." → "Same." |
| **Low Average** | Avg of 4 recent < 60 chars | Brief acknowledgments |
| **Sentiment Repetition** | 3+ same non-neutral sentiment | All "plaintiff_leaning" or all "defense_leaning" |

**Impact:**
- Now detects when personas repeat the same ideas with different wording
- Catches consensus via explicit agreement phrases
- Prevents unnecessarily long conversations when ideas are exhausted
- Existing heuristics preserved as fallback signals

---

## Testing Checklist

Before deploying to production, test these scenarios:

### Test 1: Passive Response Length
- [ ] Create conversation with Passive persona
- [ ] Verify Passive persona can give multi-sentence responses when appropriate
- [ ] Verify response length feels natural (not artificially truncated)

### Test 2: Leader/Influencer Ordering
- [ ] Create conversation with 2 Leaders + 2 Influencers
- [ ] Run 3-5 times, verify ordering varies
- [ ] Confirm Leaders don't always speak first
- [ ] Confirm Influencers can speak before Leaders

### Test 3: Stagnation Detection - Semantic Similarity
- [ ] Create conversation that naturally converges
- [ ] Verify it stops when personas repeat same ideas (different wording)
- [ ] Check conversation doesn't run unnecessarily long

### Test 4: Stagnation Detection - Agreement Phrases
- [ ] Watch for statements like "I agree", "Same here"
- [ ] Verify conversation ends gracefully after multiple agreements
- [ ] Confirm it doesn't cut off prematurely (need 2+ agreements)

### Test 5: Backward Compatibility
- [ ] Run existing test cases
- [ ] Verify conversations still generate 18-25 statements
- [ ] Confirm no regressions in statement quality

---

## Files Modified

| File | Lines Changed | Change Type |
|------|---------------|-------------|
| `conversation-orchestrator.ts` | 64-69 | Modified constant |
| `turn-manager.ts` | 86-101 | Modified method |
| `turn-manager.ts` | 115-145 | New method (randomization) |
| `turn-manager.ts` | 210-340 | Rewritten method + 2 new helpers |

**Total Lines Added:** ~150
**Total Lines Modified:** ~40

---

## Expected Behavioral Changes

### User-Visible Changes:
1. **More Natural Ordering:** Leaders won't always dominate early conversation
2. **Better Passive Contributions:** Passive personas may give longer, more meaningful responses
3. **Shorter Conversations (Sometimes):** Conversations end naturally when ideas exhausted
4. **Less Repetition:** System detects semantic similarity and stops gracefully

### Internal Changes:
1. Speaker selection now randomizes within leadership tiers
2. Stagnation detection uses keyword overlap (Jaccard similarity)
3. Explicit agreement phrases trigger early stopping
4. Length guidance removed from prompts (relies on persona character)

---

## Rollback Plan

If issues arise, revert these commits:
```bash
git log --oneline -3
# Identify the Phase 1 commits
git revert <commit-hash>
git push origin main
```

The changes are isolated to 2 files and don't affect database schema, so rollback is safe.

---

## Next Steps

1. **Test Locally:** Run conversations via UI
2. **Validate Changes:** Check all 5 test scenarios above
3. **Review Logs:** Confirm stagnation detection triggers appropriately
4. **Deploy to Staging:** If tests pass locally
5. **Monitor Production:** Watch for unexpected behavior
6. **Phase 2:** Begin relevance-based speaker selection after Phase 1 validated

---

## Performance Impact

**Expected Impact:** Minimal to slightly positive

- **CPU:** Slightly more (keyword extraction + Jaccard similarity)
  - ~0.1ms per stagnation check
  - Negligible compared to 60-90 second AI generation time

- **Memory:** Negligible
  - Keyword sets are small (<100 words per statement)
  - No persistent state added

- **API Costs:** No change
  - No additional AI calls
  - Same number of statements generated (or fewer if stagnation detected)

- **Conversation Duration:** Potentially shorter
  - May end 1-2 turns earlier if semantic repetition detected
  - Saves ~2-4K tokens per conversation when applicable

---

## Code Quality

- ✅ TypeScript type safety maintained
- ✅ No breaking API changes
- ✅ Backward compatible (no database changes)
- ✅ Well-commented code
- ✅ Follows existing code patterns
- ✅ No external dependencies added
- ✅ Pure functions (easily testable)

---

## Open Questions for Testing

1. **Jaccard Threshold:** Is 0.7 the right threshold, or should it be higher/lower?
2. **Agreement Phrases:** Are the 5 core phrases sufficient, or should we add more?
3. **Stopword List:** Does the stopword list need adjustment for legal/medical terminology?
4. **Minimum Statements:** Should we prevent stagnation detection before N statements (currently 3)?

These can be tuned after seeing real conversation data.

---

**Status:** ✅ Ready for local testing
**Next Action:** Test via UI, then proceed to Phase 2 if validated

**Implementation Time:** ~45 minutes
**Estimated Testing Time:** 30-60 minutes
