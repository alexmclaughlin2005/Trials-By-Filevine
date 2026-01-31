# Roundtable Conversation Repetition Analysis

**Date:** 2026-01-29  
**Issue:** Conversations spiral into repetitive loops, with personas restating similar themes without adding new perspectives.

## Problem Summary

The roundtable conversation system has multiple gaps in its repetition detection and prevention mechanisms, allowing conversations to continue for 15+ statements before detecting stagnation, even when personas are clearly repeating the same themes.

## Root Causes Identified

### 1. Stagnation Detection Triggers Too Late

**Location:** `services/api-gateway/src/services/roundtable/turn-manager.ts:270-333`

**Issue:** Stagnation is only checked after `personaCount * 2 * 1.5` statements have been made.

**Impact:** 
- With 5 personas, stagnation isn't checked until after 15 statements
- Conversations can spiral for 15+ statements before detection kicks in
- By the time stagnation is detected, the conversation has already become repetitive

**Code Reference:**
```typescript
// Check for stagnation (but only after minimum rounds)
if (totalStatements >= minTotalStatements * 1.5 && this.detectStagnation()) {
  return false;
}
```

### 2. Novelty Detection Only Analyzes Last 3 Statements

**Location:** `services/api-gateway/src/services/roundtable/turn-manager.ts:483-497`

**Issue:** `detectStagnation()` only checks the last 3 statements for repetition patterns.

**Impact:**
- Earlier repetition (e.g., statements 5-10) isn't caught
- A pattern of repetition starting at statement 5 won't be detected until statements 12-14
- The system has a narrow "window" for detecting repetition

**Code Reference:**
```typescript
const recent = this.conversationHistory.slice(-3);
const noveltyCheck = this.detectNoveltyStagnation(recent);
```

### 3. Key Points Extraction Failures Bypass Novelty Checks

**Location:** `services/api-gateway/src/services/roundtable/conversation-orchestrator.ts:839-874`

**Issue:** If `extractKeyPoints()` fails or returns empty, statements have no `keyPoints` array. `detectNoveltyStagnation()` only flags empty keyPoints as repetitive if content is < 100 chars.

**Impact:**
- Long statements without extracted keyPoints bypass novelty detection entirely
- Failed extractions mean the system can't detect repetition for those statements
- Silent failures in key point extraction break the repetition detection system

**Code Reference:**
```typescript
// If no keyPoints extracted, we can't determine novelty
if (!statement.keyPoints || statement.keyPoints.length === 0) {
  // Consider empty keyPoints as potentially repetitive if content is short
  if (statement.content.length < 100) {
    repetitiveStreak++;
  }
  continue; // Skips novelty check for long statements without keyPoints
}
```

### 4. Established Points Only Cover Last 10 Statements

**Location:** `services/api-gateway/src/services/roundtable/conversation-orchestrator.ts:879-905`

**Issue:** `getEstablishedPoints()` only extracts key points from the last 10 statements in the conversation history.

**Impact:**
- Earlier repetitions aren't included in the "don't repeat" list sent to the AI
- The AI doesn't know that "17 children" was already discussed extensively in statements 1-5
- Only recent context is provided, allowing earlier themes to be repeated

**Code Reference:**
```typescript
// Extract points from recent statements (last 10 to keep it manageable)
const recentStatements = history.slice(-10);
```

### 5. Deduplication Logic Too Simple

**Location:** `services/api-gateway/src/services/roundtable/conversation-orchestrator.ts:890-902`

**Issue:** Uses simple string `includes()` checks for deduplication, which misses semantic duplicates.

**Impact:**
- "17 children" vs "seventeen kids" vs "17 kids" aren't recognized as duplicates
- "surgeon's injuries" vs "his injuries" vs "the man's physical condition" aren't deduplicated
- The established points list grows with semantically identical points

**Code Reference:**
```typescript
const isDuplicate = uniquePoints.some(existing =>
  existing.toLowerCase().includes(pointLower) ||
  pointLower.includes(existing.toLowerCase())
);
```

### 6. Prompt May Not Enforce Anti-Repetition Strongly Enough

**Location:** Prompt templates (various versions in `scripts/update-roundtable-prompts-*.ts`)

**Issue:** The prompt includes established points but may not prevent semantic repetition effectively.

**Impact:**
- AI interprets "DO NOT REPEAT THESE" as "don't use exact same words"
- AI rephrases the same point and considers it novel
- The instruction may need to be more explicit about avoiding semantic repetition

**Example Prompt Section:**
```
{{#if establishedPoints}}
KEY POINTS ALREADY MADE (DO NOT REPEAT THESE):
{{establishedPoints}}

CRITICAL: The points above have already been established in the discussion. You must NOT simply restate them.
{{/if}}
```

### 7. Novelty Similarity Threshold May Be Too High

**Location:** `services/api-gateway/src/services/roundtable/turn-manager.ts:645-670`

**Issue:** Uses 0.6 Jaccard similarity threshold to determine if a point is novel.

**Impact:**
- Similar but not identical phrasings can slip through as "novel"
- "17 children" vs "seventeen kids" might have < 0.6 similarity due to different keywords
- The threshold may need to be lower (e.g., 0.4-0.5) to catch semantic duplicates

**Code Reference:**
```typescript
if (similarity > 0.6) {
  isNovel = false;
  break;
}
```

## Example Repetition Pattern

From the user's example conversation (statements 5-26), personas repeatedly discussed:
- "17 children" / "seventeen kids" / "17 kids"
- "Surgeon's injuries" / "his physical condition" / "ability to work"
- "Physical connection with kids" / "hugging children" / "picking them up"
- "Dignity destroyed" / "sense of purpose lost" / "man's soul destroyed"
- "Wife's burden" / "caregiver role" / "struggling alone"

These themes were repeated across 20+ statements without the system detecting stagnation.

## Recommended Fixes

1. **Lower Stagnation Threshold:** Check for stagnation earlier (e.g., after `personaCount * 1.5` instead of `personaCount * 2 * 1.5`)

2. **Expand Novelty Window:** Check last 5-7 statements instead of just 3

3. **Improve Key Points Extraction:** Add fallback extraction logic if prompt service fails, or use simpler keyword extraction as backup

4. **Expand Established Points Window:** Include all statements, or at least last 20-30 statements

5. **Improve Deduplication:** Use semantic similarity (embeddings) or better keyword matching instead of simple string contains

6. **Strengthen Prompt:** Add explicit instruction about semantic repetition, not just exact word repetition

7. **Lower Similarity Threshold:** Reduce from 0.6 to 0.4-0.5 to catch more semantic duplicates

8. **Add Real-time Repetition Detection:** Check for repetition after each statement, not just when checking stagnation

## Testing Recommendations

- Test with conversations that have 5+ personas
- Monitor key point extraction success rate
- Track when stagnation is detected vs. when repetition actually starts
- Measure similarity scores between repeated themes
- Test with various conversation lengths (10, 20, 30+ statements)
