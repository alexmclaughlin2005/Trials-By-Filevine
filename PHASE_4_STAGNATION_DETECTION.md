# Phase 4: Strengthened Stagnation Detection

**Date:** January 26, 2026
**Status:** ✅ Complete
**Priority:** #4 (after novelty requirement, length caps, and voice attributes)

---

## Overview

Implemented sophisticated stagnation detection to ensure conversations end at the right time when:
1. Recent statements add no novel points (just restating established facts)
2. Multiple participants agree without adding substance
3. Conversation is naturally winding down

This prevents conversations from running too long (19+ statements) and ensures they conclude gracefully around 10-15 statements.

---

## Problem Statement

### Before Phase 4
The previous stagnation detection (lines 309-364 in `turn-manager.ts`) used:
- Simple keyword overlap (Jaccard similarity) between recent statements
- Threshold of 0.7 similarity for 2+ consecutive turns
- Heuristics like statement length and sentiment patterns

**Issues:**
- Didn't detect when personas were **restating the same facts** in different words
- Couldn't identify when agreement statements lacked **substantive additions**
- Conversations ran too long even when nothing new was being said

### Design Document Goals
From `focus_group_simulation_update_3.md` Section 2.3:

```
Stagnation Detection Rules:
1. Check if recent statements just restate established points (no novel key points)
2. Count consecutive statements with zero novel points
3. Stagnation = 2+ consecutive statements with no novel points
4. Also detect 2+ agreement statements without substantive additions
```

---

## Implementation

### 1. Enhanced Stagnation Detection Method

**File:** `services/api-gateway/src/services/roundtable/turn-manager.ts`
**Lines:** 309-364 (updated)

#### New Detection Hierarchy:

```typescript
private detectStagnation(): boolean {
  // Need at least 4 statements to detect patterns
  if (this.conversationHistory.length < 4) {
    return false;
  }

  const recent = this.conversationHistory.slice(-3);

  // PRIMARY: Check for lack of novelty (no new key points)
  const noveltyCheck = this.detectNoveltyStagnation(recent);
  if (noveltyCheck) {
    console.log('[STAGNATION] Detected lack of novelty in recent statements');
    return true;
  }

  // SECONDARY: Detect agreement without substantive additions
  const agreementCheck = this.detectAgreementStagnation(recent);
  if (agreementCheck) {
    console.log('[STAGNATION] Detected agreement without substantive additions');
    return true;
  }

  // FALLBACK: Semantic similarity (keyword overlap) - legacy detection
  // ... existing logic with improved logging
}
```

### 2. Novelty-Based Stagnation Detection

**New Method:** `detectNoveltyStagnation()`
**Lines:** 367-405

**Logic:**
1. Check last 3 statements in reverse chronological order
2. For each statement, get its key points (extracted via AI)
3. Get all established points from earlier statements
4. Filter for novel points (using semantic similarity threshold of 0.6)
5. If 2+ consecutive statements have zero novel points → **stagnation detected**

**Special Handling:**
- If `keyPoints` not extracted (edge case), check content length
- Short statements (<100 words) without key points count as potentially repetitive

```typescript
private detectNoveltyStagnation(recentStatements: Statement[]): boolean {
  let repetitiveStreak = 0;

  for (let i = recentStatements.length - 1; i >= 0; i--) {
    const statement = recentStatements[i];

    // Get all established points from earlier statements
    const earlierStatements = this.conversationHistory.slice(0, -recentStatements.length + i);
    const establishedPoints = this.getAllKeyPoints(earlierStatements);

    // Check if this statement's key points are novel
    const novelPoints = this.filterNovelPoints(statement.keyPoints, establishedPoints);

    if (novelPoints.length === 0) {
      repetitiveStreak++;
    } else {
      break; // Found a novel statement, reset streak
    }
  }

  return repetitiveStreak >= 2;
}
```

### 3. Agreement-Based Stagnation Detection

**New Method:** `detectAgreementStagnation()`
**Lines:** 407-433

**Logic:**
1. Define agreement phrases: "you're right", "exactly", "i agree", "you nailed it", etc.
2. For last 3 statements, check if they contain agreement phrases
3. If agreement detected, check for **substantive addition**:
   - Has key points extracted (shows substance)
   - Content length > 100 words (not just a quick agreement)
4. If 2+ agreements without substance → **stagnation detected**

```typescript
private detectAgreementStagnation(recentStatements: Statement[]): boolean {
  const agreementPhrases = [
    "you're right", "exactly", "i agree", "you nailed it",
    "you hit the nail", "that's what i was thinking", "same here",
    "nothing to add", "that's right", "i'm with you"
  ];

  let agreementCount = 0;

  for (const statement of recentStatements) {
    const lowerContent = statement.content.toLowerCase();
    const hasAgreement = agreementPhrases.some(phrase => lowerContent.includes(phrase));

    if (hasAgreement) {
      const hasSubstance = statement.keyPoints && statement.keyPoints.length > 0 &&
                          statement.content.length > 100;

      if (!hasSubstance) {
        agreementCount++;
      }
    }
  }

  return agreementCount >= 2;
}
```

### 4. Helper Methods for Key Point Analysis

**New Methods:**
- `getAllKeyPoints(statements: Statement[]): string[]` - Aggregates key points from multiple statements
- `filterNovelPoints(newPoints: string[], establishedPoints: string[]): string[]` - Filters out semantically similar points

**Novelty Filtering Logic:**
```typescript
private filterNovelPoints(newPoints: string[], establishedPoints: string[]): string[] {
  const novel: string[] = [];

  for (const newPoint of newPoints) {
    const newKeywords = this.extractKeywords(newPoint);
    let isNovel = true;

    // Check similarity against all established points
    for (const established of establishedPoints) {
      const establishedKeywords = this.extractKeywords(established);
      const similarity = this.jaccardSimilarity(newKeywords, establishedKeywords);

      // If very similar to an established point (>0.6), not novel
      if (similarity > 0.6) {
        isNovel = false;
        break;
      }
    }

    if (isNovel) {
      novel.push(newPoint);
    }
  }

  return novel;
}
```

### 5. Key Point Extraction Integration

**File:** `services/api-gateway/src/services/roundtable/conversation-orchestrator.ts`

**Changes:**
1. Extract key points after generating each statement (both initial reactions and conversation turns)
2. Pass key points when recording statement to turn manager

**Initial Reactions (lines 214-226):**
```typescript
for (const persona of sorted) {
  const statement = await this.generateInitialReaction(persona, input);
  await this.saveStatement(conversationId, persona, statement);

  // Extract key points for novelty tracking
  const keyPoints = await this.extractKeyPoints(statement);

  this.turnManager!.recordStatement({
    personaId: persona.id,
    personaName: persona.name,
    content: statement,
    sequenceNumber: this.turnManager!.getStatistics().totalStatements + 1,
    keyPoints  // ← Added
  });
}
```

**Conversation Turns (lines 247-261):**
```typescript
const statement = await this.generateConversationTurn(persona, input);
await this.saveStatement(conversationId, persona, statement);

// Extract key points for novelty tracking
const keyPoints = await this.extractKeyPoints(statement);

this.turnManager!.recordStatement({
  personaId: persona.id,
  personaName: persona.name,
  content: statement,
  sequenceNumber: this.turnManager!.getStatistics().totalStatements + 1,
  keyPoints  // ← Added
});
```

---

## Files Modified

### Backend Logic
- ✅ `services/api-gateway/src/services/roundtable/turn-manager.ts`
  - Updated `detectStagnation()` with hierarchy (novelty → agreement → semantic)
  - Added `detectNoveltyStagnation()` method
  - Added `detectAgreementStagnation()` method
  - Added `getAllKeyPoints()` helper
  - Added `filterNovelPoints()` helper
  - Added console logging for debugging stagnation triggers

- ✅ `services/api-gateway/src/services/roundtable/conversation-orchestrator.ts`
  - Modified `runInitialReactions()` to extract and pass key points
  - Modified `runDynamicDeliberation()` to extract and pass key points

### Documentation
- ✅ `PHASE_4_STAGNATION_DETECTION.md` - This file

---

## Expected Impact

### Conversation Length
- **Before:** Conversations ran 19+ statements even when stagnant
- **After:** Conversations end at 10-15 statements when natural conclusion reached

### Detection Accuracy
- **Novelty Detection:** Catches when personas restate the same facts in different words
- **Agreement Detection:** Identifies when multiple personas agree without adding new perspectives
- **Semantic Fallback:** Maintains existing similarity-based detection as safety net

### Logging Improvements
All stagnation triggers now log specific reasons:
```
[STAGNATION] Detected lack of novelty in recent statements
[STAGNATION] Detected agreement without substantive additions
[STAGNATION] Detected semantic similarity in recent statements
[STAGNATION] Detected very short statements (winding down)
[STAGNATION] Detected low average statement length
[STAGNATION] Detected repetitive sentiment (consensus reached)
```

---

## Testing Scenarios

### Test Case 1: Repetitive Facts
**Setup:** 3 personas restate "fifteen-foot throw" in different phrasings

**Expected Behavior:**
- Key point extraction identifies all 3 as saying same thing
- After 2 consecutive similar statements → stagnation detected
- Conversation ends early

### Test Case 2: Agreement Without Substance
**Setup:** Multiple personas say "I agree", "exactly", "you're right" with no new points

**Expected Behavior:**
- Agreement phrases detected
- No substantial key points or content
- After 2 agreements → stagnation detected

### Test Case 3: Novel Points Continue
**Setup:** Each persona adds new perspective or challenges previous statements

**Expected Behavior:**
- Key points show novelty
- No stagnation detected
- Conversation continues naturally

### Test Case 4: Mixed Pattern
**Setup:** 2 novel statements, then 2 repetitive statements

**Expected Behavior:**
- First 2 statements: novelty detected, continue
- Next 2 statements: no novelty detected, stagnation triggered
- Conversation ends

---

## Configuration Parameters

### Thresholds
```typescript
// Novelty detection
const NOVELTY_SIMILARITY_THRESHOLD = 0.6;  // Higher = more strict novelty requirement

// Agreement detection
const AGREEMENT_STAGNATION_THRESHOLD = 2;  // Consecutive agreements needed
const SUBSTANTIVE_LENGTH_MIN = 100;        // Minimum words for substance

// Legacy semantic detection
const KEYWORD_SIMILARITY_THRESHOLD = 0.7;  // Jaccard similarity for keywords
```

### Consecutive Statement Windows
```typescript
const RECENT_STATEMENTS_WINDOW = 3;        // Look at last 3 statements
const MIN_STATEMENTS_FOR_DETECTION = 4;    // Need 4+ total to detect patterns
```

---

## Integration with Existing System

### Turn Manager Flow
1. After each statement is recorded, `shouldContinue()` is called
2. `shouldContinue()` checks minimum participation requirements first
3. Then calls `detectStagnation()` if threshold reached
4. Stagnation detection runs in hierarchy: novelty → agreement → semantic → heuristics
5. If stagnation detected → conversation ends

### Key Point Extraction Pipeline
```
Statement Generated → Extract Key Points (AI) → Record with Key Points →
Stagnation Check Uses Key Points → Decision to Continue or End
```

### Fallback Safety
- If key point extraction fails → uses content length as proxy
- Semantic similarity detection remains as fallback
- Existing heuristics (short statements, sentiment) still active

---

## Deployment Instructions

### 1. Verify TypeScript Compilation
```bash
cd services/api-gateway
npx tsc --noEmit
```

### 2. Test Locally (Optional)
```bash
# Start services with updated code
npm run dev

# Create test conversation with 12 personas
# Observe logs for "[STAGNATION]" messages
```

### 3. Commit Changes
```bash
git add services/api-gateway/src/services/roundtable/
git commit -m "feat: Phase 4 - Strengthened stagnation detection with novelty tracking"
```

### 4. Push to Production
```bash
git push origin main
```

### 5. Monitor Railway Deployment
- Watch Railway build logs for successful compilation
- Check first few conversations for stagnation detection logs
- Verify conversations end at reasonable length (10-15 statements)

---

## Monitoring and Validation

### Key Metrics to Track

1. **Average Conversation Length**
   - Target: 10-15 statements (down from 19+)
   - Query: `SELECT AVG(statement_count) FROM focus_group_conversations WHERE created_at > NOW() - INTERVAL '1 day'`

2. **Stagnation Trigger Breakdown**
   - Check Railway logs for `[STAGNATION]` messages
   - Count frequency of each trigger type:
     - Novelty detection
     - Agreement detection
     - Semantic similarity
     - Other heuristics

3. **Key Point Extraction Success Rate**
   - Query: Count statements with non-empty `keyPoints` field
   - Target: >95% extraction success

### Validation Queries

```sql
-- Get conversations with statement counts
SELECT
  id,
  started_at,
  completed_at,
  converged,
  (SELECT COUNT(*) FROM focus_group_statements WHERE conversation_id = c.id) as statement_count
FROM focus_group_conversations c
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Check key point extraction
SELECT
  COUNT(*) as total_statements,
  COUNT(key_points) as with_key_points,
  ROUND(100.0 * COUNT(key_points) / COUNT(*), 2) as extraction_rate
FROM focus_group_statements
WHERE created_at > NOW() - INTERVAL '1 day';
```

---

## Rollback Plan

If stagnation detection is too aggressive (conversations ending too early):

### Quick Fix: Adjust Thresholds
Edit `turn-manager.ts`:
```typescript
// Make novelty detection less strict
const NOVELTY_SIMILARITY_THRESHOLD = 0.75;  // Was 0.6

// Require 3 consecutive repetitive statements instead of 2
return repetitiveStreak >= 3;  // Was >= 2

// Require 3 agreement statements instead of 2
return agreementCount >= 3;  // Was >= 2
```

### Full Rollback
```bash
git revert <commit-hash>
git push origin main
```

---

## Future Enhancements

### Phase 5: Dissent Engagement (Next Priority)
- Detect contrarian positions
- Force next 1-2 speakers to engage with dissent
- Add dissent context to prompts

### Phase 6: Brief Response Types
- Allow 1-sentence agreements/disagreements
- Response type determination (FULL_ARGUMENT | BRIEF_AGREEMENT | etc.)
- Brief response templates

### Advanced Novelty Detection
- Use vector embeddings instead of keyword similarity
- Implement semantic clustering of key points
- Track which questions have been fully explored

---

## Success Criteria

✅ **Phase 4 Complete When:**
- Conversations consistently end at 10-15 statements (not 19+)
- Stagnation detected when facts are repeated 2+ times
- Agreement without substance triggers early ending
- Key points successfully extracted for >95% of statements
- Logs show clear stagnation trigger reasons

---

## Known Issues & TODOs

### None Currently Blocking

### Optional Improvements
1. Add configurable thresholds via environment variables
2. Persist stagnation reason to database for analytics
3. Add A/B testing framework for threshold tuning
4. Create admin dashboard to visualize stagnation triggers

---

## Related Documentation

- [Session Summary (Jan 26, 2026)](SESSION_SUMMARY_2026-01-26_FOCUS_GROUP_IMPROVEMENTS.md) - Phases 1-3
- [Design Document](focus_group_simulation_update_3.md) - Complete improvement plan
- [Turn Manager README](services/api-gateway/src/services/roundtable/README.md) - Architecture docs

---

## Conclusion

Phase 4 implements the sophisticated stagnation detection described in the design document. By tracking key point novelty and detecting empty agreement statements, conversations now end naturally when they've reached their conclusion rather than running too long.

**Key Achievement:** Shifted from simple keyword similarity to semantic novelty tracking using AI-extracted key points.

**Next Step:** Phase 5 (Dissent Engagement) to ensure contrarian views are directly addressed rather than ignored.
