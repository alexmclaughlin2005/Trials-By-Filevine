# Phase 5B Implementation Plan - Fast Track

**Created:** January 27, 2026
**Status:** In Progress
**Approach:** Option 1 - Fast Track (Hard-Gate First)

---

## Executive Summary

Implementing colleague's top 2 suggestions:
1. **Hard-gate stimulus selection** (Prevents bad UX)
2. **"So what?" results tab** (Critical value feature)

**Total Timeline:** 3-4 days
**Total Effort:** 19-26 hours

---

## Day 1: Hard-Gate Arguments Validation (CURRENT)

**Goal:** Prevent users from running focus groups without selecting arguments

**Status:** 🔄 IN PROGRESS

### Tasks

#### Phase 1: Core Validation (2 hours)
- [ ] Read current `ArgumentCheckboxList` component to understand structure
- [ ] Add validation logic to `handleNext()` function in wizard
- [ ] Modify "Next" button disabled state based on selection
- [ ] Add inline validation message component
- [ ] Test validation with 0, 1, and 2+ arguments

**Files to Modify:**
- `apps/web/components/focus-group-setup-wizard.tsx`
- `apps/web/components/focus-group-setup-wizard/ArgumentCheckboxList.tsx` (or create if needed)

#### Phase 2: Empty State (2-3 hours)
- [ ] Create `EmptyArgumentsState` component
- [ ] Add routing to arguments page with `action=create` param
- [ ] Update arguments page to handle `action=create` (open modal/form)
- [ ] Add informational box with best practices

**New Components:**
- `apps/web/components/focus-groups/EmptyArgumentsState.tsx`

#### Phase 3: Polish & Testing (1-2 hours)
- [ ] Add tooltip to disabled "Next" button
- [ ] Test empty state flow (navigate to arguments, create, return)
- [ ] Test validation message appears/disappears
- [ ] Test edge cases:
  - Deselect all arguments
  - Browser refresh during wizard
  - Arguments deleted during session
- [ ] Add success message when arguments selected

#### Phase 4: Documentation (1 hour)
- [ ] Update `CURRENT_STATE.md` with hard-gate feature
- [ ] Create session summary document
- [ ] Mark Phase 5B Day 1 as complete

**Success Criteria:**
- ✅ Cannot proceed past Arguments step without selecting ≥1 argument
- ✅ Empty state shows clear path to create arguments
- ✅ Validation message is clear and helpful
- ✅ All edge cases handled gracefully

**Estimated Time:** 6-8 hours (Day 1)

---

## Days 2-4: "So What?" Results Tab

**Goal:** Provide actionable insights and recommendations from focus group results

**Status:** ⏳ PENDING (starts after Day 1)

### Day 2: Backend Infrastructure (4-5 hours)

#### Phase 1: Database Schema (1 hour)
- [ ] Add Prisma model: `FocusGroupTakeaways`
- [ ] Generate migration
- [ ] Run migration on dev database
- [ ] Test model with Prisma Studio

**Migration:**
```prisma
model FocusGroupTakeaways {
  id                String   @id @default(cuid())
  conversationId    String   @unique
  conversation      FocusGroupConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  whatLanded        Json
  whatConfused      Json
  whatBackfired     Json
  topQuestions      Json
  recommendedEdits  Json

  promptVersion     String
  generatedAt       DateTime @default(now())

  @@map("focus_group_takeaways")
}
```

#### Phase 2: Prompt Template (1-2 hours)
- [ ] Create `roundtable-takeaways-synthesis` prompt in prompt service
- [ ] Define system prompt for strategic analysis
- [ ] Define user prompt template with variables
- [ ] Test prompt with sample conversation data
- [ ] Iterate on prompt to improve output quality

**Prompt Variables:**
- `argumentTitle`, `argumentContent`, `conversationTranscript`
- `personaSummaries`, `consensusAreas`, `fracturePoints`

#### Phase 3: Backend Service (2 hours)
- [ ] Create `TakeawaysGenerator` service class
- [ ] Implement `generateTakeaways()` method
- [ ] Add formatting helpers for transcript, summaries
- [ ] Add validation for AI response structure
- [ ] Add error handling and fallbacks

**Files to Create:**
- `services/api-gateway/src/services/roundtable/takeaways-generator.ts`

#### Phase 4: API Route (1 hour)
- [ ] Add POST route: `/focus-groups/conversations/:conversationId/generate-takeaways`
- [ ] Wire up `TakeawaysGenerator` service
- [ ] Add caching logic (check if takeaways exist, return cached)
- [ ] Add "force regenerate" query param
- [ ] Test endpoint with Postman/curl

**Files to Modify:**
- `services/api-gateway/src/routes/focus-groups.ts`

**Day 2 Success Criteria:**
- ✅ API endpoint returns structured takeaways JSON
- ✅ Response time: <10 seconds
- ✅ Cost per call: <$0.60
- ✅ Takeaways cached in database

---

### Day 3: Frontend Components (4-5 hours)

#### Phase 1: Tab Navigation (1 hour)
- [ ] Add tab navigation to `RoundtableConversationViewer`
- [ ] Create tabs: "Key Takeaways" (default), "Full Transcript", "By Persona"
- [ ] Wire up tab state management
- [ ] Test tab switching

**Files to Modify:**
- `apps/web/components/roundtable-conversation-viewer.tsx`

#### Phase 2: Core Components (3 hours)
- [ ] Create `TakeawaysTab` component (main container)
- [ ] Create `StrategicSummaryCards` component (3-column layout)
- [ ] Create `TopQuestionsSection` component
- [ ] Create `RecommendedEditsSection` component
- [ ] Create `ApplyRecommendationsCTA` component
- [ ] Add loading states (skeleton loaders)
- [ ] Add error states

**Files to Create:**
- `apps/web/components/focus-groups/TakeawaysTab.tsx`
- `apps/web/components/focus-groups/StrategicSummaryCards.tsx`
- `apps/web/components/focus-groups/TopQuestionsSection.tsx`
- `apps/web/components/focus-groups/RecommendedEditsSection.tsx`
- `apps/web/components/focus-groups/ApplyRecommendationsCTA.tsx`

#### Phase 3: Data Fetching (1 hour)
- [ ] Add React Query hook for fetching takeaways
- [ ] Add automatic generation on first view
- [ ] Add "Regenerate Takeaways" button
- [ ] Test loading/error/success states

**Day 3 Success Criteria:**
- ✅ Takeaways tab displays all sections correctly
- ✅ Loading state shows for 5-10 seconds
- ✅ Error handling works gracefully
- ✅ UI matches design specs

---

### Day 4: "Apply Recommendations" Workflow (3-4 hours)

#### Phase 1: Argument Editor Updates (2 hours)
- [ ] Update argument editor to accept `applyRecommendations` query param
- [ ] Fetch recommended edits when param present
- [ ] Pre-populate editor with edits applied
- [ ] Add diff highlighting (green for additions, red for removals)
- [ ] Add accept/reject UI for each edit

**Files to Modify:**
- `apps/web/app/(auth)/cases/[id]/arguments/[argumentId]/edit/page.tsx` (or similar)
- `apps/web/components/argument-editor.tsx`

#### Phase 2: Edit Application Logic (1 hour)
- [ ] Implement text replacement logic for recommendations
- [ ] Add highlight markers to show changes
- [ ] Allow users to accept/reject/modify individual edits
- [ ] Save tracking data (which edits were accepted)

#### Phase 3: Testing & Polish (1-2 hours)
- [ ] Test full workflow: View results → Apply recommendations → Edit → Save
- [ ] Verify edits are applied correctly
- [ ] Test with multiple recommendations
- [ ] Test reject/modify flows
- [ ] Add success toast: "Recommendations applied"

**Day 4 Success Criteria:**
- ✅ "Apply Recommendations" button navigates to editor
- ✅ Edits are pre-applied with highlighting
- ✅ Users can accept/reject/modify edits
- ✅ Tracking data is logged to database
- ✅ Full workflow completes successfully

---

## Post-Implementation: Quick Wins (Day 5 - Optional)

**Goal:** Add high-value, low-effort enhancements

**Status:** ⏳ PENDING (after Days 1-4 complete)

### Quick Win 1: Inline Argument Preview (2-3 hours)
- [ ] Add expand/collapse to argument checkboxes
- [ ] Show full argument content on expand
- [ ] Add character count and metadata
- [ ] Test preview rendering

**Files to Modify:**
- `apps/web/components/focus-group-setup-wizard/ArgumentCheckboxList.tsx`

### Quick Win 2: Recommendation Tracking (1-2 hours)
- [ ] Add database model: `RecommendationFeedback`
- [ ] Log acceptance/rejection when applying recommendations
- [ ] Add optional rejection reason field
- [ ] Test tracking data is saved

**Files to Create:**
- Database migration for `RecommendationFeedback`

### Quick Win 3: Panel Selection Redesign (1-2 hours)
- [ ] Rename modes: "Default Panel (Recommended)", etc.
- [ ] Reorder modes (default first)
- [ ] Add "recommended" badge to default mode
- [ ] Test mode selection

**Files to Modify:**
- `apps/web/components/focus-group-setup-wizard.tsx` (panel step)

**Day 5 Success Criteria:**
- ✅ All 3 quick wins implemented
- ✅ No bugs introduced
- ✅ Total time: <6 hours

---

## Testing Checklist (After Each Day)

### Day 1: Hard-Gate Testing
- [ ] Cannot proceed without selecting arguments
- [ ] Empty state shows when no arguments exist
- [ ] Validation message appears/disappears correctly
- [ ] "Create Argument" flow works end-to-end
- [ ] Browser refresh doesn't break validation
- [ ] Tooltip appears on disabled button

### Day 2: Backend Testing
- [ ] API endpoint returns valid JSON
- [ ] Takeaways structure matches expected format
- [ ] Prompt generates high-quality recommendations
- [ ] Response time <10 seconds
- [ ] Caching works (second request instant)
- [ ] Error handling graceful

### Day 3: Frontend Testing
- [ ] Tabs switch correctly
- [ ] Loading state appears for 5-10 seconds
- [ ] All sections render with data
- [ ] Empty states handled
- [ ] Responsive design works
- [ ] No console errors

### Day 4: Workflow Testing
- [ ] "Apply Recommendations" button works
- [ ] Navigation to editor correct
- [ ] Edits pre-applied with highlighting
- [ ] Accept/reject functionality works
- [ ] Tracking data logged
- [ ] Full cycle completes successfully

---

## Success Metrics

### User Metrics
- **Day 1:** 0% focus groups run without arguments (down from current unknown %)
- **Days 2-4:** >90% of users view "Key Takeaways" first
- **Days 2-4:** >70% recommendation acceptance rate
- **Days 2-4:** <2 minutes from viewing results to editing argument

### Technical Metrics
- **Day 1:** 100% validation accuracy (no false positives/negatives)
- **Days 2-4:** <10 seconds takeaways generation time
- **Days 2-4:** <$0.60 cost per takeaways generation
- **Days 2-4:** >80% cache hit rate

### Business Metrics
- **Overall:** User feedback: 4.5+ stars on "usefulness"
- **Overall:** >60% of users complete full improvement cycle
- **Overall:** Support tickets for "empty results" reduced to 0

---

## Cost Estimates

### Development Time
- **Day 1:** 6-8 hours (hard-gate)
- **Days 2-4:** 13-17 hours (results tab)
- **Day 5 (optional):** 6-9 hours (quick wins)
- **Total:** 25-34 hours (3-5 days)

### AI API Costs (Production)
- **Hard-gate:** $0 (no AI calls)
- **Takeaways generation:** ~$0.40-0.60 per conversation
- **Typical case (2 focus groups):** ~$1.20 additional cost per case
- **Monthly (100 focus groups):** ~$50-60 additional AI costs

### Infrastructure Costs
- **Database:** Minimal (<1MB per takeaway)
- **API Gateway:** No additional compute
- **Total:** <$5/month additional

---

## Risk Mitigation

### Risk 1: AI recommendations are low quality
**Mitigation:**
- Test prompt with 10+ real conversations
- Iterate on prompt based on quality
- Add "Regenerate" button for users
- Track recommendation acceptance rate

### Risk 2: Response time >10 seconds
**Mitigation:**
- Optimize prompt length
- Use streaming if possible
- Add progress indicator
- Cache aggressively

### Risk 3: Users don't understand how to apply recommendations
**Mitigation:**
- Clear CTA button text
- Add tooltips/help text
- Video demo in docs
- Monitor user behavior analytics

### Risk 4: Hard-gate frustrates users with no arguments
**Mitigation:**
- Clear empty state messaging
- Direct path to create arguments
- Explain why arguments are required
- Test with real users before release

---

## Rollback Plan

### If Day 1 Has Critical Bug
- Revert wizard changes
- Remove validation logic
- Keep empty state (no harm)
- Fix bug before re-deploying

### If Days 2-4 Have Critical Bug
- Hide "Key Takeaways" tab
- Keep "Full Transcript" as default
- Fix backend issue
- Re-deploy when stable

### If API Costs Exceed Budget
- Disable automatic generation
- Make takeaways opt-in ("Generate Insights" button)
- Cache more aggressively
- Reduce prompt complexity

---

## Documentation Updates

### After Day 1
- [ ] Update `CURRENT_STATE.md` - Add hard-gate feature
- [ ] Update `QUICK_DEMO.md` - Mention argument requirement
- [ ] Create `SESSION_SUMMARY_2026-01-27_HARD_GATE.md`

### After Days 2-4
- [ ] Update `CURRENT_STATE.md` - Add "So What?" results tab
- [ ] Update `QUICK_DEMO.md` - Update demo script for new tab
- [ ] Update `ROUNDTABLE_CONVERSATIONS.md` - Document takeaways feature
- [ ] Create `SESSION_SUMMARY_2026-01-27_SO_WHAT_RESULTS.md`

### After Day 5 (Optional)
- [ ] Update `FOCUS_GROUP_FUTURE_ENHANCEMENTS.md` - Mark quick wins as complete
- [ ] Update `CURRENT_STATE.md` - Add quick win features

---

## Next Steps After Completion

1. **Deploy to Production**
   - Test on Railway/Vercel staging first
   - Monitor logs for errors
   - Check AI costs after 10-20 uses
   - Collect user feedback

2. **User Feedback Collection**
   - Add "Was this helpful?" buttons
   - Track feature usage analytics
   - Survey 5-10 users for qualitative feedback

3. **Iterate on Prompts**
   - Review recommendation acceptance rates
   - Identify patterns in rejected edits
   - Improve prompt based on data

4. **Plan Phase 5C**
   - Prioritize features from `FOCUS_GROUP_FUTURE_ENHANCEMENTS.md`
   - Focus on highest ROI items
   - Consider: Generate Personas from Case, Comparative Analysis

---

## Related Documentation

- [PHASE_5B_SO_WHAT_RESULTS_DESIGN.md](./PHASE_5B_SO_WHAT_RESULTS_DESIGN.md) - Detailed design
- [PHASE_5B_HARD_GATE_ARGUMENTS_DESIGN.md](./PHASE_5B_HARD_GATE_ARGUMENTS_DESIGN.md) - Detailed design
- [FOCUS_GROUP_FUTURE_ENHANCEMENTS.md](./FOCUS_GROUP_FUTURE_ENHANCEMENTS.md) - Backlog
- [CURRENT_STATE.md](./CURRENT_STATE.md) - System status

---

## Progress Tracking

### Day 1: Hard-Gate Arguments ✅
**Date:** January 27, 2026
**Status:** 🔄 In Progress
- [x] Planning complete
- [ ] Phase 1: Core validation (2h)
- [ ] Phase 2: Empty state (2-3h)
- [ ] Phase 3: Testing & polish (1-2h)
- [ ] Phase 4: Documentation (1h)

### Days 2-4: "So What?" Results ⏳
**Date:** TBD
**Status:** ⏳ Pending
- [ ] Day 2: Backend infrastructure
- [ ] Day 3: Frontend components
- [ ] Day 4: Apply recommendations workflow

### Day 5: Quick Wins (Optional) ⏳
**Date:** TBD
**Status:** ⏳ Pending
- [ ] Inline argument preview
- [ ] Recommendation tracking
- [ ] Panel selection redesign

---

**Created By:** Claude Code Assistant
**Last Updated:** January 27, 2026
**Next Review:** End of Day 1

---

**End of Implementation Plan**
