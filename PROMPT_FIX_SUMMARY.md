# Prompt Format Fix: Conversational vs. Analytical Responses

**Date:** January 24, 2026
**Issue:** Personas generating analytical essays with markdown instead of brief conversational statements
**Status:** ✅ Fixed

---

## Problem

Roundtable conversations were generating responses like this:

```
## What Works Exceptionally Well

**Narrative Structure**: The opening reads like a compelling story...

**Evidence Preview**: This is remarkably thorough...

## Potential Concerns

**Length and Complexity**: This opening is extremely detailed...
```

**Expected format:**
```
I think the attorney makes a compelling point about the hospital's negligence. The timeline they laid out really shows how things went wrong. But I'm wondering if the damages are too high - that's a lot of money.
```

---

## Root Cause

The prompt templates had weak formatting instructions:
- ❌ "Keep responses conversational, not essay-like" (too vague)
- ❌ No explicit ban on markdown formatting
- ❌ No examples showing correct vs. incorrect format

---

## Solution

Updated `scripts/add-roundtable-prompts.ts` with **much stronger** formatting requirements:

### Changes to System Prompt (roundtable-persona-system)

**Added:**
```
CRITICAL FORMAT REQUIREMENTS:
- Give ONE brief conversational statement (2-5 sentences maximum)
- NO markdown formatting (no ##, **, bullets, or structure)
- NO analytical headers like "What Works" or "Concerns"
- NO essay-style organization or numbered points
- Speak as if you're talking out loud in a jury room
- Use plain text only - just your natural speaking voice
- Reference other jurors' comments when relevant
- Show appropriate emotional reactions based on your personality

BAD EXAMPLE (DO NOT DO THIS):
"## What I Think
**Positive aspects:** The argument is strong...
**Concerns:** However, I worry about..."

GOOD EXAMPLE (DO THIS):
"I think the attorney makes a compelling point about the hospital's negligence. The timeline they laid out really shows how things went wrong. But I'm wondering if the damages are too high - that's a lot of money."
```

### Changes to User Prompts

**Added to both initial-reaction and conversation-turn:**
```
IMPORTANT: Respond with ONLY your plain-text conversational statement (2-5 sentences). NO markdown, NO headers, NO formatting. Just talk naturally as if speaking out loud in a jury room.
```

---

## Files Modified

1. **`scripts/add-roundtable-prompts.ts`**
   - Lines ~25-90: Updated system prompt with explicit format requirements
   - Line ~108: Added format reminder to initial reaction prompt
   - Line ~169: Added format reminder to conversation turn prompt

---

## Re-seeding Process

```bash
# 1. Updated the script
# 2. Re-ran the seed script
npx tsx scripts/add-roundtable-prompts.ts

# Output:
✅ Created persona system prompt: roundtable-persona-system
✅ Created initial reaction prompt: roundtable-initial-reaction
✅ Created conversation turn prompt: roundtable-conversation-turn
✅ Created statement analysis prompt: roundtable-statement-analysis
✅ Created conversation synthesis prompt: roundtable-conversation-synthesis
✅ Created persona summary prompt: roundtable-persona-summary

# 3. Restarted API Gateway
# Server now using updated prompts
```

---

## Expected Behavior After Fix

### Before:
- Long analytical essays (200-500 words)
- Markdown formatting (##, **, bullets)
- Structured sections with headers
- Essay-like organization

### After:
- Brief conversational statements (2-5 sentences)
- Plain text only (no markdown)
- Natural speaking voice
- Direct responses to the argument/discussion

---

## Testing Checklist

Now test these scenarios:

- [ ] **Leader responses**: Should be fuller but still conversational (3-5 sentences)
- [ ] **Influencer responses**: Clear positions, no markdown (2-4 sentences)
- [ ] **Follower responses**: Brief, natural (2-3 sentences)
- [ ] **Passive responses**: Can now be longer when engaged (2-4 sentences, not forced to 1)

All personas should:
- ✅ Use plain text only
- ✅ Sound like they're talking out loud
- ✅ Reference other jurors naturally
- ✅ Show personality and emotion
- ❌ NO markdown formatting
- ❌ NO analytical structure

---

## Prompt Template Reference

The updated prompts are now in production database. To view:

```sql
SELECT service_id, name, version
FROM prompts p
JOIN prompt_versions pv ON p.current_version_id = pv.id
WHERE service_id LIKE 'roundtable%';
```

To update prompts in the future:
1. Modify `scripts/add-roundtable-prompts.ts`
2. Run `npx tsx scripts/add-roundtable-prompts.ts`
3. Restart API Gateway

---

## Related to Phase 1

This fix is **complementary** to Phase 1 updates:

**Phase 1 Changes:**
- ✅ Removed length constraints from LENGTH_GUIDANCE
- ✅ Added Leader/Influencer randomization
- ✅ Implemented keyword-based stagnation detection

**This Fix:**
- ✅ Ensures responses are conversational, not analytical
- ✅ Prevents markdown formatting in statements
- ✅ Provides clear examples of good vs. bad format

Together, these create more natural, varied, and realistic jury deliberations.

---

## Rollback

If the new prompts cause issues:

```bash
# Revert the script changes
git checkout HEAD -- scripts/add-roundtable-prompts.ts

# Re-seed with old prompts
npx tsx scripts/add-roundtable-prompts.ts

# Restart API Gateway
```

---

**Status:** ✅ Complete - Ready for testing
**Next:** Test roundtable conversations to verify conversational format
