# Phase 5: Focus Groups UX Enhancement Plan

**Created:** January 27, 2026
**Status:** Planning Phase
**Goal:** Make case-first workflow obvious and surface completed focus groups globally

---

## Executive Summary

This plan addresses key UX issues in the Focus Groups workflow:

1. **Make the case-first workflow obvious** - Focus Groups should feel like they belong to cases
2. **Surface completed focus groups** - Global Focus Groups page should show recent runs across all cases
3. **Strong case context everywhere** - Show case information prominently in focus group conversations
4. **Better navigation** - Clear paths back to cases from focus group views

---

## Current State Analysis

### What We Have Now

**Global Navigation Structure:**
- Dashboard | Cases | Personas | Focus Groups

**Case Navigation (Sidebar):**
- Overview | Facts | Arguments | Witnesses | Jurors | Voir Dire | Focus Groups | Documents

**Focus Group Pages:**
1. **Global Focus Groups** (`/focus-groups`) - Currently a placeholder "Coming Soon" page
2. **Case Focus Groups** (`/cases/[id]/focus-groups`) - Full-featured with setup wizard, session list
3. **Conversation View** (`/focus-groups/conversations/[id]`) - Shows conversation details

### Current Issues

1. ❌ **Global Focus Groups page is empty** - Just shows "Coming Soon" placeholder
2. ❌ **No case context in conversation views** - When viewing a conversation, you lose all case context
3. ❌ **No breadcrumbs** - Hard to navigate back to the case
4. ❌ **Case-first workflow isn't obvious** - Both global and case focus groups feel equal
5. ❌ **No "recent runs across cases" view** - Can't see all focus groups in one place

---

## Proposed Changes

### 1. Global Focus Groups Page Transformation

**Current:** Placeholder "Coming Soon" page
**New:** "Recent Focus Groups Across All Cases" reporting view

**Features:**
- List all completed focus groups across all cases (most recent first)
- Each item shows:
  - Case name (prominent, clickable)
  - Focus group session name
  - Date completed
  - Number of personas
  - Number of conversations
  - Status badge (completed, running, draft)
  - Quick action: "View Results" → navigates to conversation view
  - Quick action: "Go to Case" → navigates to case focus groups page
- Empty state: "No focus groups yet. Focus groups are created within cases."
- Call-to-action: "Go to Cases" button

**Why this works:**
- Makes it clear focus groups are case-centric (case name is primary)
- Provides useful "recent activity" view for attorneys
- Natural discovery: "Oh, I should go into a case to create one"

### 2. Case Context Everywhere in Focus Group Conversations

**Current:** Conversation view shows no case information
**New:** Prominent case context throughout

**Add to Conversation Views:**

**A. Breadcrumb Navigation (Top)**
```
Cases > [Case Name] > Focus Groups > [Session Name] > Conversation
```
- Each segment is clickable
- Uses semantic HTML (nav with ol/li)
- Styled with filevine-gray-600, active item in filevine-gray-900

**B. Case Context Header (Below breadcrumbs)**
```
┌─────────────────────────────────────────────────────────────┐
│ 📁 Smith v. Jones                            Status: Active │
│ Case #12345 • Personal Injury • Trial: Dec 15, 2026        │
│                                      [← Back to Case]        │
└─────────────────────────────────────────────────────────────┘
```
- Compact, single-line or two-line header
- Shows essential case metadata
- Prominent "Back to Case" button (navigates to `/cases/[id]/focus-groups`)
- Sticky positioning (stays visible when scrolling)

### 3. Enhanced Navigation in Case Focus Groups Page

**Current:** Case layout already shows case header
**Enhancement:** Add visual hierarchy to make workflow obvious

**Changes:**
- Keep existing case header (already good)
- Add helper text: "Focus groups test your arguments with AI-powered jury simulations. Results appear here."
- Ensure session cards show clear navigation to conversations
- Add "View All Focus Groups" link to global page (for cross-case browsing)

### 4. Navigation Flow Diagram

```
┌──────────────┐
│   Dashboard  │
└──────┬───────┘
       │
       ├─────────────────────────────────────────┐
       │                                         │
       v                                         v
┌──────────────┐                        ┌──────────────────┐
│    Cases     │                        │ Focus Groups     │
│   (List)     │                        │  (Global View)   │
└──────┬───────┘                        └────────┬─────────┘
       │                                          │
       v                                          │
┌──────────────────┐                             │
│  Case Detail     │                             │
│  (with sidebar)  │◄────────────────────────────┘
└────────┬─────────┘                   (Quick link to case)
         │
         v
┌──────────────────────┐
│  Case Focus Groups   │
│  (Sessions List)     │
└────────┬─────────────┘
         │
         v
┌──────────────────────┐
│  Setup Wizard        │
└────────┬─────────────┘
         │
         v
┌──────────────────────┐
│  Conversation View   │ ←─ Shows case context
│  (with breadcrumbs)  │    + breadcrumbs
└──────────────────────┘    + "Back to Case"
```

---

## Implementation Plan

### Phase 5A: Global Focus Groups Page (2-3 hours)

**Files to Modify:**
- `apps/web/app/(auth)/focus-groups/page.tsx` - Transform from placeholder to real page

**New Components to Create:**
- `apps/web/components/focus-groups/GlobalSessionsList.tsx` - List of all sessions
- `apps/web/components/focus-groups/SessionCard.tsx` - Individual session card (reusable)

**API Changes:**
- Verify `/focus-groups` endpoint returns sessions across all cases
- May need to add: `GET /focus-groups/recent?limit=50` endpoint

**Tasks:**
1. Create `GlobalSessionsList` component
   - Fetch all sessions across cases
   - Group by case (optional: show case headers)
   - Sort by `completedAt` or `updatedAt` descending
   - Show empty state with CTA to Cases page
2. Create `SessionCard` component
   - Reusable card for both global and case views
   - Props: session, caseId, caseName, showCaseInfo (boolean)
   - Actions: "View Results", "Go to Case"
3. Update `/focus-groups/page.tsx`
   - Replace placeholder with `GlobalSessionsList`
   - Add page header: "Recent Focus Groups Across All Cases"
   - Add subtitle: "View focus group results from all your cases"

**Success Criteria:**
- ✅ Global Focus Groups page shows actual sessions
- ✅ Case name is prominent and clickable
- ✅ Can navigate to case or view results directly
- ✅ Empty state encourages going to Cases

### Phase 5B: Breadcrumbs & Case Context (2-3 hours)

**Files to Modify:**
- `apps/web/components/roundtable-conversation-viewer.tsx` - Add case context
- `apps/web/app/(auth)/focus-groups/conversations/[conversationId]/page.tsx` - Fetch case data

**New Components to Create:**
- `apps/web/components/case/CaseBreadcrumbs.tsx` - Reusable breadcrumb component
- `apps/web/components/case/CaseContextHeader.tsx` - Compact case info header

**Tasks:**
1. Create `CaseBreadcrumbs` component
   - Props: items (array of { label, href })
   - Semantic HTML: `<nav><ol><li>`
   - Styling: Filevine gray with separator chevrons
   - Active item: bold, non-clickable
2. Create `CaseContextHeader` component
   - Props: case (id, name, caseNumber, caseType, status, trialDate, etc.)
   - Compact display (1-2 lines max)
   - Prominent "Back to Case" button
   - Sticky positioning (optional)
3. Update conversation page
   - Fetch case data via conversationId → sessionId → caseId
   - May need new API: `GET /focus-groups/conversations/:id/case`
   - Pass case data to viewer component
4. Update `RoundtableConversationViewer`
   - Accept `caseId` and `caseName` props
   - Render breadcrumbs at top
   - Render case context header below breadcrumbs
   - Ensure existing conversation UI still works

**API Changes Needed:**
- `GET /focus-groups/conversations/:id/case` - Return case info for a conversation

**Success Criteria:**
- ✅ Breadcrumbs show full path: Cases > [Case] > Focus Groups > [Session] > Conversation
- ✅ Case context header shows case name, number, type, status
- ✅ "Back to Case" button navigates to `/cases/[id]/focus-groups`
- ✅ All links work correctly

### Phase 5C: Navigation Enhancements (1-2 hours)

**Files to Modify:**
- `apps/web/components/focus-group-manager.tsx` - Add helper text
- `apps/web/components/header.tsx` - Potentially update Focus Groups nav item styling
- `apps/web/components/case/case-sidebar.tsx` - Verify Focus Groups item is clear

**Tasks:**
1. Update `FocusGroupManager`
   - Add helper text below title
   - Add "View All Focus Groups" link to global page (subtle, secondary)
2. Update header navigation
   - Consider adding tooltip to Focus Groups: "View recent focus groups across cases"
3. Verify case sidebar
   - Ensure Focus Groups item is prominent
   - Consider adding icon or count indicator

**Success Criteria:**
- ✅ Helper text makes purpose clear
- ✅ Cross-navigation between global and case views works
- ✅ Navigation feels intuitive

### Phase 5D: Testing & Polish (1-2 hours)

**Testing Scenarios:**
1. **New User Journey:**
   - User clicks "Focus Groups" in global nav
   - Sees recent focus groups across cases
   - Clicks "Go to Case" → lands in case focus groups page
   - Creates new focus group
   - Completes setup, runs conversation
   - Views results → sees case context everywhere
   - Clicks "Back to Case" → returns to case focus groups
   - Clicks breadcrumb → can navigate anywhere

2. **Existing User Journey:**
   - User is working in a case
   - Clicks "Focus Groups" in case sidebar
   - Sees list of sessions for this case
   - Creates new session
   - Runs conversation
   - Views results with case context
   - Can navigate back easily

3. **Cross-Case Navigation:**
   - User is in Case A
   - Clicks global "Focus Groups" nav item
   - Sees sessions from Cases A, B, C
   - Clicks "Go to Case" for Case B
   - Lands in Case B's focus groups page
   - Case header updates to show Case B

**Polish Tasks:**
- Ensure all transitions are smooth
- Verify loading states
- Check mobile responsiveness
- Verify accessibility (ARIA labels, keyboard nav)
- Update empty states with helpful messaging

**Success Criteria:**
- ✅ All navigation paths work correctly
- ✅ No broken links or 404s
- ✅ Case context is always visible when in focus group views
- ✅ User never feels lost

---

## Database & API Requirements

### Existing Endpoints (Verify)
- `GET /focus-groups/case/:caseId` - Get sessions for a case ✅
- `GET /focus-groups/conversations/:conversationId` - Get conversation details ✅

### New Endpoints Needed
- `GET /focus-groups/recent` - Get recent sessions across all cases
  - Query params: `limit` (default 50), `status` (filter by status)
  - Response: Array of sessions with case info embedded
  - Order by: `completedAt DESC` or `updatedAt DESC`

- `GET /focus-groups/conversations/:conversationId/case` - Get case info for conversation
  - Response: Case object with essential fields
  - Used for breadcrumbs and case context header

### Database Schema (No changes needed)
- Existing `FocusGroup` table has `caseId` ✅
- Existing `Conversation` table has `sessionId` → can join to `caseId` ✅

---

## Visual Design Specifications

### Breadcrumbs
```tsx
<nav aria-label="Breadcrumb" className="mb-4">
  <ol className="flex items-center space-x-2 text-sm text-filevine-gray-600">
    <li><Link href="/cases">Cases</Link></li>
    <li><ChevronRight className="h-4 w-4" /></li>
    <li><Link href={`/cases/${caseId}`}>{caseName}</Link></li>
    <li><ChevronRight className="h-4 w-4" /></li>
    <li><Link href={`/cases/${caseId}/focus-groups`}>Focus Groups</Link></li>
    <li><ChevronRight className="h-4 w-4" /></li>
    <li><Link href={`/cases/${caseId}/focus-groups/${sessionId}`}>{sessionName}</Link></li>
    <li><ChevronRight className="h-4 w-4" /></li>
    <li className="font-semibold text-filevine-gray-900">Conversation</li>
  </ol>
</nav>
```

### Case Context Header
```tsx
<div className="sticky top-0 z-10 border-b border-filevine-gray-200 bg-white px-6 py-3">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Folder className="h-5 w-5 text-filevine-gray-400" />
      <div>
        <h2 className="text-lg font-semibold text-filevine-gray-900">{caseName}</h2>
        <div className="flex items-center gap-3 text-xs text-filevine-gray-600">
          <span>Case #{caseNumber}</span>
          <span>•</span>
          <span className="capitalize">{caseType}</span>
          {trialDate && (
            <>
              <span>•</span>
              <span>Trial: {formatDate(trialDate)}</span>
            </>
          )}
        </div>
      </div>
      <Badge variant={status === 'active' ? 'success' : 'default'}>
        {status}
      </Badge>
    </div>
    <Button variant="outline" onClick={() => router.push(`/cases/${caseId}/focus-groups`)}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Case
    </Button>
  </div>
</div>
```

### Global Focus Groups Session Card
```tsx
<Card>
  <CardHeader>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        {/* Case name - prominent */}
        <Link href={`/cases/${session.caseId}`}>
          <h3 className="text-lg font-bold text-filevine-blue hover:underline">
            {session.case.name}
          </h3>
        </Link>
        {/* Session name - secondary */}
        <h4 className="mt-1 text-base font-medium text-filevine-gray-700">
          {session.name}
        </h4>
        {/* Metadata */}
        <div className="mt-2 flex items-center gap-3 text-sm text-filevine-gray-600">
          <span>{formatDate(session.completedAt)}</span>
          <span>•</span>
          <span>{session._count.personas} personas</span>
          <span>•</span>
          <span>{session._count.conversations} conversations</span>
        </div>
      </div>
      <Badge variant={statusVariant(session.status)}>
        {session.status}
      </Badge>
    </div>
  </CardHeader>
  <CardFooter>
    <div className="flex gap-2">
      <Button variant="primary" onClick={() => navigateToResults(session.id)}>
        View Results
      </Button>
      <Button variant="outline" onClick={() => navigateToCase(session.caseId)}>
        Go to Case
      </Button>
    </div>
  </CardFooter>
</Card>
```

---

## Edge Cases & Error Handling

### Edge Cases
1. **No focus groups exist yet**
   - Show empty state with clear CTA: "Focus groups are created within cases. Go to Cases to get started."

2. **User deletes a case**
   - Focus groups should cascade delete (verify DB schema)
   - Global view should handle missing cases gracefully

3. **User is viewing conversation but case is deleted**
   - Show error: "The case for this focus group no longer exists"
   - Offer link to global focus groups page

4. **User navigates directly to conversation URL**
   - Breadcrumbs and case context should still load
   - Verify API endpoint returns case info

5. **Mobile view**
   - Breadcrumbs should collapse to "< Back" button
   - Case context header should stack vertically
   - Session cards should be responsive

### Error Handling
- API errors: Show user-friendly message, offer retry
- Missing data: Show placeholder or "Not available"
- Navigation errors: Catch and redirect to safe page (e.g., Cases list)

---

## Accessibility Considerations

1. **Breadcrumbs:**
   - Use semantic `<nav>` and `<ol>` elements
   - Add `aria-label="Breadcrumb"`
   - Current page should be `aria-current="page"`
   - All links should be keyboard-navigable

2. **Case Context Header:**
   - Use proper heading hierarchy (`<h2>` for case name)
   - "Back to Case" button should have clear focus state
   - Status badge should have sufficient color contrast

3. **Session Cards:**
   - Card should be tabbable
   - Links should have clear focus indicators
   - Actions should be keyboard-accessible

4. **Screen Readers:**
   - Breadcrumb links should announce clearly
   - Case context should announce when navigating
   - Session cards should have descriptive labels

---

## Success Metrics

### User Experience Goals
1. **Discoverability:** Users understand focus groups are case-centric within 30 seconds
2. **Navigation:** Users can navigate from any focus group view back to case in <3 clicks
3. **Context:** Users always know which case they're working in when viewing focus groups
4. **Discovery:** Users can browse recent focus groups across cases without losing context

### Technical Metrics
1. **Performance:** All pages load in <2 seconds
2. **Error Rate:** <1% navigation errors
3. **Accessibility:** Pass WCAG 2.1 AA standards
4. **Mobile:** All views work on mobile screens (375px+)

---

## Rollout Plan

### Phase 1: Backend API (Day 1)
1. Add `GET /focus-groups/recent` endpoint
2. Add `GET /focus-groups/conversations/:id/case` endpoint
3. Test endpoints with Postman/curl

### Phase 2: Components (Day 1-2)
1. Build `CaseBreadcrumbs` component
2. Build `CaseContextHeader` component
3. Build `GlobalSessionsList` component
4. Build reusable `SessionCard` component

### Phase 3: Integration (Day 2)
1. Update global focus groups page
2. Update conversation viewer with case context
3. Update navigation between views

### Phase 4: Testing & Polish (Day 2-3)
1. Manual testing of all flows
2. Mobile testing
3. Accessibility audit
4. Performance check
5. Final polish

### Phase 5: Documentation (Day 3)
1. Update CURRENT_STATE.md
2. Update QUICK_DEMO.md
3. Create session summary document

---

## Open Questions

1. **Should global focus groups page have filtering?**
   - By case?
   - By status (completed, running, draft)?
   - By date range?
   - **Recommendation:** Start simple (just show recent), add filters later if needed

2. **Should we show "in progress" focus groups in global view?**
   - **Recommendation:** Yes, but clearly indicate status with badge

3. **How many focus groups to show on global page?**
   - **Recommendation:** 50 most recent, with "Load More" or pagination

4. **Should we update the case sidebar to show focus group count?**
   - Like we show Jurors (12), Facts (5), etc.
   - **Recommendation:** Yes, add count: "Focus Groups (3)"

5. **Should we add a "Recent Activity" section to Dashboard?**
   - Show most recent focus groups across cases
   - **Recommendation:** Future enhancement, not Phase 5

---

## Files to Create/Modify Summary

### New Files
- `apps/web/components/focus-groups/GlobalSessionsList.tsx`
- `apps/web/components/focus-groups/SessionCard.tsx`
- `apps/web/components/case/CaseBreadcrumbs.tsx`
- `apps/web/components/case/CaseContextHeader.tsx`
- `services/api-gateway/src/routes/focus-groups-global.ts` (if needed)

### Modified Files
- `apps/web/app/(auth)/focus-groups/page.tsx`
- `apps/web/components/roundtable-conversation-viewer.tsx`
- `apps/web/app/(auth)/focus-groups/conversations/[conversationId]/page.tsx`
- `apps/web/components/focus-group-manager.tsx`
- `apps/web/components/case/case-sidebar.tsx`
- `services/api-gateway/src/routes/focus-groups.ts` (add endpoints)
- `CURRENT_STATE.md`
- `QUICK_DEMO.md`

### Backend Routes to Add
- `GET /api/focus-groups/recent` - Get recent sessions across cases
- `GET /api/focus-groups/conversations/:conversationId/case` - Get case for conversation

---

## Timeline Estimate

| Phase | Tasks | Time | Dependencies |
|-------|-------|------|--------------|
| 5A | Global Focus Groups Page | 2-3 hours | Backend API |
| 5B | Breadcrumbs & Case Context | 2-3 hours | Components |
| 5C | Navigation Enhancements | 1-2 hours | Phases 5A, 5B |
| 5D | Testing & Polish | 1-2 hours | All phases |
| **Total** | | **6-10 hours** | |

**Recommended Schedule:**
- Day 1 (4-5 hours): Backend API + Phase 5A
- Day 2 (4-5 hours): Phase 5B + Phase 5C
- Day 3 (2 hours): Phase 5D + Documentation

---

## Related Documentation

- [CURRENT_STATE.md](./CURRENT_STATE.md) - Current system status
- [QUICK_DEMO.md](./QUICK_DEMO.md) - Demo script (will need updates)
- [ROUNDTABLE_CONVERSATIONS.md](./ROUNDTABLE_CONVERSATIONS.md) - Focus group system details
- [ai_instructions.md](./ai_instructions.md) - Project structure

---

## Approval & Sign-off

**Created By:** Claude Code Assistant
**Date:** January 27, 2026
**Status:** ⏳ Awaiting User Approval

**User Approval:** [ ] Approved  [ ] Needs Changes  [ ] Rejected

**Comments:**
_[User feedback goes here]_

---

## Next Steps After Approval

1. Review and approve this plan
2. Clarify any open questions
3. Begin implementation with Phase 5A
4. Regular check-ins after each phase
5. Final review and testing

---

**End of Plan**
