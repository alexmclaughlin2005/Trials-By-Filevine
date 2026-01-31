# Phase 5: Dissent Engagement

**Date:** January 26, 2026
**Status:** ✅ Complete
**Priority:** #5 (after stagnation detection)

---

## Overview

Implemented sophisticated dissent detection and forced engagement to ensure contrarian views are directly addressed rather than ignored. When someone takes a position opposing the emerging consensus, the next 1-2 speakers are required to engage with their points directly.

This prevents echo chambers and ensures all perspectives receive proper consideration in the deliberation.

---

## Problem Statement

### Before Phase 5
Personas could express contrarian views that were then ignored by subsequent speakers, leading to:
- Echo chamber effect where consensus builds without addressing dissent
- Valuable perspectives being overlooked
- Unrealistic deliberations (real juries engage with dissent)
- Less dynamic and interesting conversations

### Design Document Goals
From `focus_group_simulation_update_3.md` Section 3:

```
Dissent Engagement:
1. Detect when a statement opposes the emerging consensus
2. Force next 1-2 speakers to directly engage with dissent
3. Add dissent context to their prompts with specific engagement requirements
4. Encourage use of names and direct address
```

---

## Implementation

### 1. Dissent Tracking Types

**File:** `services/api-gateway/src/services/roundtable/turn-manager.ts`
**Lines:** 25-49

Added new types and enums:

```typescript
export enum ConversationPosition {
  PLAINTIFF = 'PLAINTIFF',
  DEFENSE = 'DEFENSE',
  NEUTRAL = 'NEUTRAL'
}

export interface Statement {
  personaId: string;
  personaName: string;
  content: string;
  sequenceNumber: number;
  sentiment?: string;
  keyPoints?: string[];
  position?: ConversationPosition; // ← Added
}

export interface DissentInfo {
  isPresent: boolean;
  dissenterPersonaId?: string;
  dissenterPersonaName?: string;
  dissentStatement?: string;
  dissentKeyPoints?: string[];
  speakersRequiredToEngage: number; // How many speakers left must engage
}
```

### 2. Consensus Position Assessment

**Method:** `assessConsensusPosition()`
**Lines:** 307-335

**Logic:**
1. Require at least 3 statements to determine consensus
2. Look at last 5 statements (or all if fewer)
3. Count PLAINTIFF vs DEFENSE positions (ignoring NEUTRAL)
4. Require 2/3 majority (66%) for consensus
5. Return NEUTRAL if no clear consensus

```typescript
private assessConsensusPosition(): ConversationPosition {
  if (this.conversationHistory.length < 3) {
    return ConversationPosition.NEUTRAL;
  }

  const recentStatements = this.conversationHistory.slice(-5);
  const positions = recentStatements
    .map(s => s.position)
    .filter(p => p && p !== ConversationPosition.NEUTRAL);

  if (positions.length === 0) {
    return ConversationPosition.NEUTRAL;
  }

  const plaintiffCount = positions.filter(p => p === ConversationPosition.PLAINTIFF).length;
  const defenseCount = positions.filter(p => p === ConversationPosition.DEFENSE).length;

  const threshold = positions.length * 0.66;

  if (plaintiffCount >= threshold) {
    return ConversationPosition.PLAINTIFF;
  } else if (defenseCount >= threshold) {
    return ConversationPosition.DEFENSE;
  }

  return ConversationPosition.NEUTRAL;
}
```

### 3. Statement Position Assessment

**Method:** `assessStatementPosition()`
**Lines:** 337-356

**Logic:**
1. Use statement's position if already set
2. Otherwise infer from sentiment:
   - `positive`/`supportive` → PLAINTIFF
   - `negative`/`critical` → DEFENSE
   - Otherwise → NEUTRAL

**Note:** In future, this could be enhanced with more sophisticated AI-based position detection.

```typescript
private assessStatementPosition(statement: Statement): ConversationPosition {
  if (statement.position) {
    return statement.position;
  }

  const sentiment = statement.sentiment?.toLowerCase();

  if (sentiment === 'positive' || sentiment === 'supportive') {
    return ConversationPosition.PLAINTIFF;
  } else if (sentiment === 'negative' || sentiment === 'critical') {
    return ConversationPosition.DEFENSE;
  }

  return ConversationPosition.NEUTRAL;
}
```

### 4. Dissent Detection

**Method:** `detectDissent()`
**Lines:** 358-390

**Logic:**
1. Assess current consensus position
2. Can't have dissent if no consensus (NEUTRAL)
3. Assess position of new statement
4. Dissent = statement opposes consensus (different non-NEUTRAL position)
5. If dissent detected, log it and return DissentInfo with requirement for 2 speakers to engage

```typescript
private detectDissent(statement: Statement): DissentInfo {
  const consensus = this.assessConsensusPosition();

  if (consensus === ConversationPosition.NEUTRAL) {
    return { isPresent: false, speakersRequiredToEngage: 0 };
  }

  const statementPosition = this.assessStatementPosition(statement);

  const isDissent = statementPosition !== ConversationPosition.NEUTRAL &&
                    statementPosition !== consensus;

  if (isDissent) {
    console.log(`[DISSENT] ${statement.personaName} took contrarian position: ${statementPosition} vs consensus ${consensus}`);

    return {
      isPresent: true,
      dissenterPersonaId: statement.personaId,
      dissenterPersonaName: statement.personaName,
      dissentStatement: statement.content,
      dissentKeyPoints: statement.keyPoints || [],
      speakersRequiredToEngage: 2
    };
  }

  return { isPresent: false, speakersRequiredToEngage: 0 };
}
```

### 5. Dissent Context Management

**Methods:**
- `getDissentContext()` (lines 392-404) - Returns current dissent for next speaker
- `markDissentEngagement()` (lines 406-417) - Decrements engagement counter

**Logic:**
- Track current dissent in `TurnManager` state
- Return dissent context only if engagement still required (`speakersRequiredToEngage > 0`)
- Each speaker that responds decrements the counter
- Clear dissent after required engagements complete

```typescript
getDissentContext(): DissentInfo | null {
  if (!this.currentDissent || !this.currentDissent.isPresent) {
    return null;
  }

  if (this.currentDissent.speakersRequiredToEngage <= 0) {
    return null;
  }

  return this.currentDissent;
}

markDissentEngagement(): void {
  if (this.currentDissent && this.currentDissent.isPresent) {
    this.currentDissent.speakersRequiredToEngage--;

    if (this.currentDissent.speakersRequiredToEngage <= 0) {
      console.log('[DISSENT] All required speakers have engaged with dissent');
      this.currentDissent = null;
    }
  }
}
```

### 6. Updated recordStatement

**File:** `services/api-gateway/src/services/roundtable/turn-manager.ts`
**Lines:** 247-263

**Changes:**
1. Mark that speaker engaged with active dissent (if any)
2. Detect new dissent in the recorded statement
3. Store new dissent if detected

```typescript
recordStatement(statement: Statement): void {
  const currentCount = this.speakCounts.get(statement.personaId) || 0;
  this.speakCounts.set(statement.personaId, currentCount + 1);
  this.conversationHistory.push(statement);

  // If there's active dissent, mark that this speaker engaged with it
  if (this.currentDissent && this.currentDissent.isPresent) {
    this.markDissentEngagement();
  }

  // Detect new dissent in this statement
  const dissentInfo = this.detectDissent(statement);
  if (dissentInfo.isPresent) {
    this.currentDissent = dissentInfo;
  }
}
```

### 7. Conversation Orchestrator Integration

**File:** `services/api-gateway/src/services/roundtable/conversation-orchestrator.ts`
**Lines:** 339-351

**Changes:**
1. Get dissent context from turn manager
2. Format it for prompt variables
3. Pass to prompt as `dissentInfo` variable

```typescript
// Get dissent context if present
const dissentContext = this.turnManager!.getDissentContext();
const dissentInfo = dissentContext && dissentContext.isPresent ? {
  dissenterName: dissentContext.dissenterPersonaName,
  dissentStatement: dissentContext.dissentStatement,
  dissentKeyPoints: (dissentContext.dissentKeyPoints || []).join('\n- ')
} : null;

const { result } = await this.promptClient.execute('roundtable-conversation-turn', {
  variables: {
    // ... existing variables ...
    dissentInfo, // ← Added
    // ... rest of variables ...
  }
});
```

### 8. Updated Conversation Turn Prompt

**File:** `scripts/update-roundtable-prompts-dissent.ts`
**Version:** v4.0.0

**Key Addition:**
Added conditional dissent engagement section that appears when `dissentInfo` is present:

```handlebars
{{#if dissentInfo}}
⚠️ IMPORTANT - CONTRARIAN VIEW DETECTED:
{{dissentInfo.dissenterName}} just raised a contrarian position that goes against the emerging consensus. Their key points were:
- {{dissentInfo.dissentKeyPoints}}

You MUST directly engage with what {{dissentInfo.dissenterName}} said. Either:
- Explain specifically why you disagree with their reasoning
- Acknowledge a valid point they made before explaining your view
- Ask them a clarifying question about their position

DO NOT ignore their argument and just restate your own position. Address {{dissentInfo.dissenterName}} by name and engage with their specific points.
{{/if}}
```

**Updated Task Instructions:**
When dissent is present, the persona's task becomes focused on engaging with it:

```handlebars
As {{personaName}}, respond to the discussion. {{#if dissentInfo}}Focus on engaging with {{dissentInfo.dissenterName}}'s contrarian view.{{else}}You MUST either:
1. Add a NEW point, observation, or argument not yet raised
2. Directly challenge or question something a specific person said
3. Share a personal reaction or experience that adds new perspective
4. Ask a clarifying question that moves the discussion forward{{/if}}
```

---

## Files Modified

### Backend Logic
- ✅ `services/api-gateway/src/services/roundtable/turn-manager.ts`
  - Added `ConversationPosition` enum
  - Updated `Statement` interface with position field
  - Added `DissentInfo` interface
  - Added `currentDissent` tracking to TurnManager
  - Implemented `assessConsensusPosition()` method
  - Implemented `assessStatementPosition()` method
  - Implemented `detectDissent()` method
  - Implemented `getDissentContext()` method
  - Implemented `markDissentEngagement()` method
  - Updated `recordStatement()` to detect and track dissent

- ✅ `services/api-gateway/src/services/roundtable/conversation-orchestrator.ts`
  - Modified `generateConversationTurn()` to get dissent context
  - Pass `dissentInfo` to prompt variables

### Prompt Management
- ✅ `scripts/update-roundtable-prompts-dissent.ts`
  - New script to update conversation turn prompt with dissent engagement (v4.0.0)
  - Added `dissentInfo` variable to prompt
  - Added conditional dissent engagement instructions
  - Modified task instructions when dissent present

### Documentation
- ✅ `PHASE_5_DISSENT_ENGAGEMENT.md` - This file

---

## Expected Impact

### Conversation Dynamics
- **Before:** Contrarian views could be ignored, leading to echo chambers
- **After:** Dissent triggers 1-2 forced engagements with specific points

### Engagement Quality
- **Direct Address:** Speakers use dissenter's name and reference their points
- **Substantive Response:** Must explain disagreement, acknowledge validity, or ask clarifying questions
- **No Evasion:** Cannot just restate own position without engaging

### Logging
New console logs track dissent lifecycle:
```
[DISSENT] {Name} took contrarian position: {POSITION} vs consensus {CONSENSUS}
[DISSENT] All required speakers have engaged with dissent
```

---

## Testing Scenarios

### Test Case 1: Emerging Consensus + Dissent
**Setup:**
- First 3 personas favor plaintiff (positive sentiment)
- 4th persona expresses critical view (defense position)

**Expected Behavior:**
1. Consensus detected as PLAINTIFF (3/3 = 100% > 66%)
2. 4th statement detected as dissent (DEFENSE ≠ PLAINTIFF)
3. Dissent logged with `[DISSENT]` message
4. Next 2 speakers receive dissent context in prompts
5. Their responses must engage with dissenter's points
6. After 2 engagements, dissent cleared

### Test Case 2: No Clear Consensus
**Setup:** Mixed views (2 plaintiff, 2 defense, 1 neutral)

**Expected Behavior:**
- No consensus detected (neither side has 66%)
- No dissent can be detected
- Normal conversation continues

### Test Case 3: Multiple Sequential Dissents
**Setup:**
- Consensus forms for plaintiff
- Persona A dissents (defense)
- 1 speaker engages
- Persona B dissents again (defense)

**Expected Behavior:**
1. First dissent from Persona A triggers 2-speaker requirement
2. After 1 engagement, counter = 1
3. Second dissent from Persona B resets counter to 2
4. Next 2 speakers must engage with Persona B's dissent
5. Persona A's original dissent is replaced

### Test Case 4: Dissent Changes Consensus
**Setup:**
- Initial consensus for plaintiff
- Strong dissent with compelling points
- Subsequent speakers shift to defense

**Expected Behavior:**
1. Dissent detected initially (defense vs plaintiff consensus)
2. Next 2 speakers engage with dissent
3. If they shift positions, consensus may flip to defense or neutral
4. New dissent would only be detected if someone opposes new consensus

---

## Configuration Parameters

### Dissent Detection
```typescript
const CONSENSUS_THRESHOLD = 0.66;           // 2/3 majority required for consensus
const DISSENT_ENGAGEMENT_REQUIRED = 2;      // Number of speakers who must engage
const CONSENSUS_LOOKBACK_WINDOW = 5;        // How many recent statements to analyze
```

### Position Assessment
```typescript
// Sentiment to position mapping (simple heuristic)
const POSITION_MAP = {
  'positive': ConversationPosition.PLAINTIFF,
  'supportive': ConversationPosition.PLAINTIFF,
  'negative': ConversationPosition.DEFENSE,
  'critical': ConversationPosition.DEFENSE
};
```

---

## Integration with Existing System

### Turn Manager Flow
1. Statement recorded via `recordStatement()`
2. If active dissent exists, mark engagement (decrement counter)
3. Detect if new statement is dissent
4. Store new dissent if detected (replaces previous)

### Conversation Orchestrator Flow
```
Generate Turn → Get Dissent Context → Format for Prompt →
Execute Prompt with Dissent Info → Record Statement →
Detect New Dissent → Update Dissent State
```

### Prompt Execution Flow
```
Standard Variables + Dissent Info (if present) →
Conditional Prompt Section (if dissent) →
Persona Responds with Engagement →
Statement Recorded
```

---

## Deployment Instructions

### 1. Verify TypeScript Compilation
```bash
cd services/api-gateway
npx tsc --noEmit
```

### 2. Update Prompt in Database
```bash
npx tsx scripts/update-roundtable-prompts-dissent.ts
```

### 3. Commit Changes
```bash
git add services/api-gateway/src/services/roundtable/ scripts/update-roundtable-prompts-dissent.ts PHASE_5_DISSENT_ENGAGEMENT.md
git commit -m "feat: Phase 5 - Dissent engagement with forced response requirements"
```

### 4. Test Locally (Recommended)
Create test conversation and look for:
- `[DISSENT]` logs in console
- Next speakers addressing dissenter by name
- Substantive engagement (not just restating position)

### 5. Push to Production (After User Approval)
```bash
git push origin main
```

---

## Monitoring and Validation

### Key Metrics to Track

1. **Dissent Frequency**
   - How often dissent is detected
   - Track via `[DISSENT]` log count

2. **Engagement Quality**
   - Manual review: Do responses actually engage with dissent?
   - Check if dissenter's name appears in next 2 statements

3. **Consensus Shifts**
   - Does dissent sometimes change consensus direction?
   - Track position distribution before/after dissent

### Validation Queries

```sql
-- Get conversations with logged dissent
-- (Would need to persist dissent events to database for this)

-- For now, rely on Railway logs:
-- Search for "[DISSENT]" in application logs
```

---

## Future Enhancements

### Advanced Position Detection
Current implementation uses simple sentiment mapping. Could enhance with:
- AI-powered position assessment (analyze content, not just sentiment)
- Explicit position tags from persona generation
- Multi-dimensional positions (not just plaintiff/defense binary)

### Dissent Intensity
Track not just presence of dissent, but strength:
- Strong dissent (clear opposition) → require 3 engagements
- Mild dissent (nuanced disagreement) → require 1 engagement

### Dissent Quality Metrics
- Measure if engagements are substantive (using key point analysis)
- Detect if someone is just paying lip service vs truly engaging

### Persistent Dissent Tracking
- Store dissent events in database
- Analyze patterns (which personas dissent most, when, why)
- Use for conversation quality metrics

---

## Known Issues & TODOs

### Current Limitations

1. **Position Assessment is Simplistic**
   - Uses sentiment as proxy for position
   - May not accurately detect nuanced positions
   - **Mitigation:** Future enhancement with AI-based analysis

2. **Binary Position Model**
   - Only PLAINTIFF / DEFENSE / NEUTRAL
   - Real deliberations may have more nuanced positions
   - **Mitigation:** Works for most case types (plaintiff vs defendant)

3. **No Cross-Conversation Learning**
   - Dissent tracking resets each conversation
   - Could learn which persona types tend to dissent
   - **Mitigation:** Future enhancement with persona analytics

### Optional Improvements
1. Add dissent events to database for analytics
2. Make engagement requirements configurable per conversation
3. Add "persistent dissenter" tracking (persona who consistently opposes consensus)
4. Implement dissent intensity levels

---

## Related Documentation

- [Session Summary (Jan 26, 2026)](SESSION_SUMMARY_2026-01-26_FOCUS_GROUP_IMPROVEMENTS.md) - Phases 1-4
- [Phase 4: Stagnation Detection](PHASE_4_STAGNATION_DETECTION.md) - Previous phase
- [Design Document](focus_group_simulation_update_3.md) - Part 3: Engagement with Dissent
- [Turn Manager README](services/api-gateway/src/services/roundtable/README.md) - Architecture docs

---

## Conclusion

Phase 5 implements sophisticated dissent detection and forced engagement as described in the design document. By tracking consensus direction and detecting contrarian positions, conversations now ensure that dissenting views receive proper engagement rather than being ignored.

**Key Achievement:** Shifted from passive observation of dissent to active requirement for engagement with specific, prompt-enforced instructions.

**Next Step:** Phase 6 (Brief Response Types) to allow 1-sentence agreements/disagreements alongside full arguments.
