# Session Summary: Juror Framing Fix (v5.0.0)

**Date:** January 27, 2026
**Session Duration:** ~45 minutes
**Status:** ✅ Complete - Ready for Testing

---

## Problem Identified

Focus group AI personas were acting like **lawyers strategizing a case** instead of **jurors reacting to testimony**.

### Symptoms Observed:
- Personas discussing evidence collection and discovery strategies
- Using legal jargon ("dram shop liability," "punitive damages," "preservation letters")
- Talking about what "we should investigate" and "we need to subpoena"
- Analyzing insurance coverage and collectibility
- Identifying potential additional defendants
- Acting as attorneys working the case, not regular people hearing testimony

### Example Bad Output:
```
"We should immediately send preservation letters to any potential bars
and restaurants before evidence gets destroyed. We also need to subpoena
the defendant's phone records to prove she was texting at impact. The
insurance company will want to settle to avoid punitive damages."
```

### What We Wanted:
```
"This drunk driving story makes me really angry - texting while drunk?
That's so reckless. I feel bad for the surgeon's family. I'm curious
what his injuries were though - was he paralyzed or just hurt?"
```

---

## Root Cause Analysis

### 1. **Missing Juror Role Instructions**
The prompts never explicitly said:
- "You are a JUROR, not a lawyer"
- "React emotionally and personally, not strategically"
- "Focus on feelings and fairness, not legal tactics"

### 2. **Weak Framing**
Prompt context said "THE CASE BEFORE YOU" (lawyer perspective) instead of "YOU ARE A JUROR HEARING TESTIMONY" (juror perspective).

### 3. **No Explicit "Don't Do This" List**
No guardrails preventing legal strategy discussion.

### 4. **Temperature Too High**
Temperature at 0.7 allowed creative interpretation that strayed into legal analysis.

---

## Solution Implemented

### Created Script: `scripts/update-roundtable-prompts-juror-framing.ts`

Updated both prompts to **v5.0.0** with:

#### 1. Strong System Prompt
```
CRITICAL CONTEXT: You are a JUROR, not a lawyer.

You are a regular person serving on a jury. You are hearing testimony
and evidence about a case. Your job is to react emotionally and
personally to what you hear - NOT to strategize legal tactics or
discuss how to gather evidence.

DO NOT:
- Act like a lawyer or investigator
- Discuss evidence collection, discovery, or legal strategy
- Use legal jargon
- Talk about what "we should investigate"
- Analyze insurance coverage or assets
- Strategize about settlement

DO:
- React with your gut feelings (anger, sympathy, confusion, skepticism)
- Share how the story makes you FEEL
- Ask questions a regular person would ask
- Discuss what seems fair or unfair
- Talk about whether you believe people
- Share personal experiences that relate
- Express what you'd want to know more about

Speak from the heart as a regular person, not from a legal textbook.
```

#### 2. Reframed User Prompt
**Before:**
```
THE CASE BEFORE YOU:
{{caseContext}}
```

**After:**
```
YOU ARE A JUROR HEARING TESTIMONY IN THIS TRIAL:
{{caseContext}}

You are hearing testimony and evidence. You are NOT a lawyer.
React as a regular person would - share your gut feelings and concerns.
```

#### 3. Added Good vs Bad Examples
Included explicit examples in prompt of what jurors DO and DON'T say.

#### 4. Lowered Temperature
- **Before:** 0.7 (creative, variable)
- **After:** 0.5 (more consistent, follows instructions better)

#### 5. Emphasized Throughout
Multiple reminders in prompt:
- "REMEMBER: You are a JUROR in deliberations, NOT a lawyer"
- "Focus on FEELINGS and FAIRNESS, not legal tactics"
- "DO NOT discuss evidence collection or legal strategy"

---

## Changes Applied

### Prompts Updated:
1. ✅ `roundtable-initial-reaction`: v4.0.0 → **v5.0.0**
2. ✅ `roundtable-conversation-turn`: v4.0.0 → **v5.0.0**

### Database Verified:
```
Roundtable Initial Reaction:
  • Active Version: v5.0.0 ✅
  • Temperature: 0.5 ✅
  • System Prompt: 1,449 chars ✅

Roundtable Conversation Turn:
  • Active Version: v5.0.0 ✅
  • Temperature: 0.5 ✅
  • System Prompt: 1,449 chars ✅
```

---

## Files Modified

### New Files:
- ✅ `scripts/update-roundtable-prompts-juror-framing.ts` - Update script

### Database Changes:
- ✅ Created `PromptVersion` records for v5.0.0 (both prompts)
- ✅ Updated `Prompt.currentVersionId` to point to v5.0.0 versions
- ✅ Lowered temperature from 0.7 → 0.5

---

## Testing Checklist

### Before Testing:
- [x] Run update script
- [x] Verify v5.0.0 versions created in database
- [x] Verify currentVersionId points to v5.0.0
- [ ] Restart prompt service
- [ ] Restart API gateway

### Test Cases:
1. **Run Same Focus Group**
   - Use the surgeon/drunk driver case
   - Ask: "What is your initial reaction to this opening statement?"
   - **Expected:** Emotional reactions, no legal strategy talk

2. **Monitor for Lawyer Language**
   Look for any of these phrases (should NOT appear):
   - "we should investigate"
   - "we need to subpoena"
   - "preservation letter"
   - "dram shop"
   - "punitive damages"
   - "insurance coverage"
   - "deep pocket"
   - "discovery"

3. **Check for Juror Language**
   Look for these (SHOULD appear):
   - "I feel..."
   - "This makes me angry/sad/confused"
   - "I'm curious about..."
   - "That seems unfair"
   - "I don't believe..."
   - "What I'd want to know is..."

### Success Criteria:
- ✅ No legal jargon in responses
- ✅ Personas express feelings/reactions
- ✅ Questions are personal, not strategic
- ✅ Responses stay under word limits
- ✅ Natural jury deliberation tone

---

## Deployment Steps

### 1. Restart Services (Required)

**Prompt Service:**
```bash
cd services/prompt-service
# Kill existing process (Ctrl+C if running)
npm run dev
```

**API Gateway:**
```bash
cd services/api-gateway
# Kill existing process (Ctrl+C if running)
npm run dev
```

**Frontend** (if needed):
```bash
cd apps/web
npm run dev
```

### 2. Clear Any Caches
If using Railway or production:
- Restart prompt-service deployment
- Restart api-gateway deployment
- Prompt service will load v5.0.0 on restart

### 3. Test Immediately
Run a focus group conversation with the same case that showed lawyer behavior and verify improvement.

---

## Future Enhancements (Backlog)

### "Lawyer Mode" Feature (Future)
User requested we could add a "look at this like a lawyer" mode later for:
- Case strategy sessions
- Evidence planning
- Legal analysis

**Implementation Ideas:**
- Add `mode: 'juror' | 'lawyer'` parameter to conversation API
- Create separate v6.0.0 prompts with lawyer framing
- Allow mode switching mid-conversation
- Store mode in `FocusGroupConversation.metadata` field

**Not implementing now** - juror mode is the priority.

---

## Key Learnings

### 1. **AI Needs Explicit Role Framing**
Personas will interpret context based on what makes sense. Without explicit "You are X, not Y" instructions, they default to what's most familiar (lawyer analysis for legal cases).

### 2. **System Prompts Are Critical**
The system prompt sets the role. Without it, user prompts alone aren't enough to constrain behavior.

### 3. **Examples Matter**
Showing "good vs bad" responses helps the AI understand the boundary between acceptable and unacceptable outputs.

### 4. **Temperature Matters for Consistency**
0.7 is great for creative writing but risky for rule-following. 0.5 balances natural variation with instruction adherence.

### 5. **Multiple Reinforcements Help**
Repeating "You are a juror" throughout the prompt (system + user + reminders) prevents drift.

---

## Related Documentation

- [ROUNDTABLE_CONVERSATIONS.md](./ROUNDTABLE_CONVERSATIONS.md) - Overall system design
- [SESSION_SUMMARY_2026-01-26_FOCUS_GROUP_IMPROVEMENTS.md](./SESSION_SUMMARY_2026-01-26_FOCUS_GROUP_IMPROVEMENTS.md) - Previous improvements (novelty, voice, dissent)
- [services/api-gateway/src/services/roundtable/README.md](./services/api-gateway/src/services/roundtable/README.md) - Service architecture

---

## Troubleshooting

### If Personas Still Act Like Lawyers:

1. **Verify Active Version:**
   ```sql
   SELECT p.serviceId, pv.version, pv.config->>'temperature'
   FROM "Prompt" p
   JOIN "PromptVersion" pv ON p."currentVersionId" = pv.id
   WHERE p."serviceId" LIKE 'roundtable%';
   ```
   Should show v5.0.0 and temperature 0.5.

2. **Check Service Logs:**
   ```bash
   # Prompt service logs
   tail -f services/prompt-service/logs/prompt-service.log

   # API gateway logs
   tail -f services/api-gateway/logs/api-gateway.log
   ```
   Look for "Using prompt version v5.0.0"

3. **Lower Temperature Further:**
   If still seeing lawyer language, try 0.3:
   ```sql
   UPDATE "PromptVersion"
   SET config = jsonb_set(config, '{temperature}', '0.3')
   WHERE version = 'v5.0.0'
   AND "promptId" IN (
     SELECT id FROM "Prompt"
     WHERE "serviceId" LIKE 'roundtable%'
   );
   ```

4. **Add Post-Processing Filter:**
   If needed, add validation in `conversation-orchestrator.ts` to detect and flag lawyer language.

---

## Next Steps

1. ✅ Update prompts to v5.0.0 (DONE)
2. ✅ Verify database changes (DONE)
3. ⏭️ Restart services
4. ⏭️ Test focus group with same case
5. ⏭️ Monitor for any remaining issues
6. ⏭️ Update documentation if successful
7. ⏭️ Deploy to production (Railway)

---

**Status:** ✅ Ready for testing
**Next Action:** Restart services and run test focus group
**Expected Outcome:** Personas act as jurors, not lawyers

---

*Built with ❤️ by Claude Sonnet 4.5*
