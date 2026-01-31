# Outstanding Work - Trials by Filevine

**Last Updated:** January 31, 2026
**Status:** Active development reference

> This document tracks all remaining work items for the Trials by Filevine platform.
> For project structure, see [AI_instructions.md](./AI_instructions.md).
> For current status, see [CURRENT_STATE.md](./CURRENT_STATE.md).

---

## Completed Milestones (Recently)

- [x] Production Deployment to Railway *(January 2026)*
- [x] Real-World Testing with actual case data *(January 2026)*
- [x] Image Storage Migration to Vercel Blob *(January 2026)*
  - Persona headshots: `put()` to `personas/{id}.png`
  - Juror headshots: `put()` to `jurors/{id}.png`
  - Extracted text: `put()` to `{documentId}-extracted.txt`

---

## Priority 1: Features Needing Improvement

### 1.1 Embedded Juror Research 🔄
**Status:** Functional but needs UX/feature enhancements
**Impact:** Core user workflow

**Known Issues:**
- [ ] TBD - Document specific issues as discovered

**Improvements Needed:**
- [ ] TBD - Document specific improvements needed

**Related Files:**
- `apps/web/components/case/jurors-tab.tsx`
- `apps/web/components/juror-research-panel.tsx`
- `apps/web/components/deep-research.tsx`

---

### 1.2 Deep Research / Juror Web Search 🔄
**Status:** Functional but needs quality/accuracy enhancements
**Impact:** Core AI feature

**Known Issues:**
- [ ] TBD - Document specific issues as discovered

**Improvements Needed:**
- [ ] TBD - Document specific improvements needed

**Related Files:**
- `services/api-gateway/src/services/juror-synthesis-service.ts`
- `services/api-gateway/src/routes/synthesis.ts`
- `apps/web/components/deep-research.tsx`

---

## Priority 2: Phase 5B - Focus Group Enhancements

### 2.1 Hard-Gate Arguments Validation
**Status:** 🔄 In Progress (started Jan 27)
**Effort:** 6-8 hours
**Documentation:** [docs/features/phase-5b/PHASE_5B_IMPLEMENTATION_PLAN.md](./docs/features/phase-5b/PHASE_5B_IMPLEMENTATION_PLAN.md)

**Tasks:**
- [ ] Add validation logic to wizard `handleNext()` function
- [ ] Modify "Next" button disabled state based on selection
- [ ] Add inline validation message component
- [ ] Create `EmptyArgumentsState` component
- [ ] Add routing to arguments page with `action=create` param
- [ ] Add tooltip to disabled "Next" button
- [ ] Test edge cases (deselect all, browser refresh, deleted arguments)

**Success Criteria:**
- Cannot proceed past Arguments step without selecting ≥1 argument
- Empty state shows clear path to create arguments
- All edge cases handled gracefully

---

### 2.2 "So What?" Results Tab
**Status:** ⏳ Pending (after Hard-Gate)
**Effort:** 13-17 hours (Days 2-4 of Phase 5B)
**Documentation:** [docs/features/phase-5b/PHASE_5B_SO_WHAT_RESULTS_DESIGN.md](./docs/features/phase-5b/PHASE_5B_SO_WHAT_RESULTS_DESIGN.md)

**Day 2: Backend Infrastructure (4-5 hours)**
- [ ] Add Prisma model: `FocusGroupTakeaways`
- [ ] Create `roundtable-takeaways-synthesis` prompt
- [ ] Create `TakeawaysGenerator` service class
- [ ] Add POST route: `/focus-groups/conversations/:id/generate-takeaways`

**Day 3: Frontend Components (4-5 hours)**
- [ ] Add tab navigation to `RoundtableConversationViewer`
- [ ] Create `TakeawaysTab` component
- [ ] Create `StrategicSummaryCards` component
- [ ] Create `TopQuestionsSection` component
- [ ] Create `RecommendedEditsSection` component
- [ ] Add React Query hook for fetching takeaways

**Day 4: Apply Recommendations Workflow (3-4 hours)**
- [ ] Update argument editor for `applyRecommendations` query param
- [ ] Add diff highlighting for suggested edits
- [ ] Add accept/reject UI for each edit
- [ ] Save tracking data (which edits were accepted)

---

### 2.3 Phase 5B Quick Wins (Optional)
**Status:** ⏳ Pending (after Days 1-4)
**Effort:** 6-9 hours total

| Quick Win | Effort | Status |
|-----------|--------|--------|
| Inline Argument Preview | 2-3h | ⏳ |
| Recommendation Tracking | 1-2h | ⏳ |
| Panel Selection Redesign | 1-2h | ⏳ |

---

## Priority 3: Medium-Term Features

### 3.1 Enhanced Data Sources (Phase 6)
**Status:** ⏳ Not started
**Impact:** Major time saver for users

- [ ] **FEC API Integration** - Political donations (free API)
- [ ] **Voter File Pre-loading** - County-specific voter registration
- [ ] **People Search API Evaluation** - Assess paid options
- [ ] **Social Media Aggregation** - Research strategy

---

### 3.2 Advanced AI Features
**Status:** ⏳ Not started

- [ ] **Bulk Archetype Classification** - Classify entire panels at once
- [ ] **Panel Composition Analysis** - Visual insights for panel balance
- [ ] **WebSocket Real-Time Updates** - Replace polling for deep research

---

### 3.3 Production Monitoring
**Status:** ⏳ Not started
**Impact:** Production reliability

- [ ] **Sentry Integration** - Error tracking
- [ ] **Uptime Monitoring** - Service availability alerts
- [ ] **Cost Alerts** - Anthropic API usage monitoring
- [ ] **Performance Dashboard** - Key metrics visualization

---

## Priority 4: Long-Term / Backlog

### 4.1 Trial Mode PWA (Phase 7)
**Status:** ⏳ Future phase
**Effort:** 2-3 weeks

- [ ] Offline-first architecture
- [ ] Service worker implementation
- [ ] IndexedDB storage
- [ ] Background sync for courtroom use

---

### 4.2 Real-Time Collaboration
**Status:** ⏳ Future phase

- [ ] WebSocket infrastructure (foundation exists)
- [ ] User presence tracking
- [ ] Live updates across team members

---

### 4.3 Audit & Compliance
**Status:** ⏳ Future phase

- [ ] Comprehensive audit logging
- [ ] Compliance documentation
- [ ] SOC 2 readiness assessment

---

### 4.4 Focus Group Backlog Features
**Documentation:** [docs/features/focus-groups/FOCUS_GROUP_FUTURE_ENHANCEMENTS.md](./docs/features/focus-groups/FOCUS_GROUP_FUTURE_ENHANCEMENTS.md)

| Feature | Effort | Priority |
|---------|--------|----------|
| Generate Personas from Case | 8-10h | 🟢 High value |
| Comparative Analysis (v1 vs v2) | 10-12h | 🟡 Medium |
| Export Takeaways to PDF | 6-8h | 🟡 Medium |
| Attorney Reviewer Mode | 2-3 days | 📋 Backlog |
| Bulk Question Editing | 6-8h | 🟡 Later |

---

### 4.5 Attorney Reviewer Mode
**Status:** 📋 Backlog - Future Enhancement
**Documentation:** [docs/features/FEATURE_ATTORNEY_REVIEWER_MODE.md](./docs/features/FEATURE_ATTORNEY_REVIEWER_MODE.md)

Adds an "attorney reviewer" observer that analyzes roundtable conversations from a legal strategy perspective, providing:
- Legal Analysis Summary
- Strategic Recommendations
- Evidence Gaps Identified
- Witness Preparation Notes
- Voir Dire Implications

---

## Known Technical Debt

| Issue | Impact | Priority | Notes |
|-------|--------|----------|-------|
| Turbopack disabled | Slower dev builds | Low | ESM module resolution with react-markdown |
| Single document OCR | Multi-page questionnaires slow | Medium | Batch processing not implemented |
| No OCR retry UI | Poor UX on failure | Low | Must re-upload if fails |
| Polling for deep research | Unnecessary API calls | Medium | WebSocket would be better |

---

## Cost Estimates

### AI API Costs (Anthropic)
| Feature | Model | Avg. Cost/Call |
|---------|-------|----------------|
| Identity Matching | Claude 4 Sonnet | $0.05 |
| Deep Research | Claude 4 Sonnet + web search | $0.50-2.00 |
| Archetype Classification | Claude 4.5 Sonnet | $0.10-0.30 |
| Question Generation | Claude 4.5 Sonnet | $0.20-0.50 |
| Focus Group | Claude 4.5 Sonnet | $0.50-1.50 |
| OCR | Claude 3.5 Sonnet Vision | $0.10-0.30 |
| Takeaways Generation (Phase 5B) | Claude 4.5 Sonnet | ~$0.40-0.60 |

### Typical Case (40 jurors): ~$22-25

---

## How to Use This Document

1. **Before starting work:** Check this document for current priorities
2. **After completing work:** Update status, check off tasks, add notes
3. **When discovering issues:** Add to appropriate "Known Issues" section
4. **When planning sprints:** Reference Priority sections for ordering

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [AI_instructions.md](./AI_instructions.md) | Project structure, directory map |
| [CURRENT_STATE.md](./CURRENT_STATE.md) | Feature status, what's working |
| [claude.md](./claude.md) | AI assistant maintenance protocol |
| [docs/features/phase-5b/](./docs/features/phase-5b/) | Phase 5B implementation plans |
| [docs/features/focus-groups/](./docs/features/focus-groups/) | Focus group feature docs |

---

**Last Updated By:** AI Assistant
**Next Review:** After Phase 5B completion
