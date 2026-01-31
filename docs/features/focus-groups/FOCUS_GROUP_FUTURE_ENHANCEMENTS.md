# Focus Group Future Enhancements

**Created:** January 27, 2026
**Status:** Backlog
**Source:** Colleague suggestions + design phase analysis

---

## Overview

This document tracks high-value enhancements for the Focus Group system that are not part of the current Phase 5B implementation but should be prioritized for future work.

These features emerged from:
1. Colleague suggestions for wizard improvements
2. Design phase analysis of "So What?" results and hard-gating
3. User feedback and anticipated needs

---

## High-Priority Enhancements

### 1. Inline Argument Preview (Quick Win)

**Status:** 🟢 Designed, ready to implement
**Effort:** 2-3 hours
**User Value:** High - helps users verify what the panel will react to

**What it does:**
- Adds collapsible preview to each argument in wizard Step 2
- Shows full argument text inline (no navigation)
- Displays metadata: character count, type, attached facts

**Implementation:**
- See [PHASE_5B_HARD_GATE_ARGUMENTS_DESIGN.md](./PHASE_5B_HARD_GATE_ARGUMENTS_DESIGN.md) Section 4
- Modify `ArgumentCheckbox` component
- Add expand/collapse state
- Render argument content in collapsible card

**Success Metrics:**
- >70% of users expand at least one argument preview
- Reduced "I tested the wrong argument" incidents

**Dependencies:** None (standalone feature)

---

### 2. "Generate Personas from Case" (Panel Selection)

**Status:** 🟡 Concept phase
**Effort:** 8-10 hours
**User Value:** Very High - creates case-specific personas automatically

**What it does:**
- New panel selection mode in wizard Step 1
- Uses case facts + arguments to generate relevant personas
- One-click persona generation (no manual selection)

**Example:**
- Case: Medical malpractice, doctor failed to diagnose cancer
- AI generates: "Skeptical of Doctors" persona, "Trust Medical Experts" persona, "Personal Experience with Misdiagnosis" persona

**Implementation:**
```tsx
// Add 4th mode to panel selection
<button
  onClick={() => handleModeChange('generate_from_case')}
  className={/* styling */}
>
  <Sparkles className="h-6 w-6 text-filevine-blue" />
  <p className="mt-2 font-medium">Generate from Case</p>
  <p className="mt-1 text-xs">
    AI creates personas based on your case facts and arguments
  </p>
</button>
```

**Backend:**
- New prompt: `generate-case-specific-personas`
- Input: Case facts, arguments, case type, jurisdiction
- Output: 6-12 persona definitions with archetypes

**Success Metrics:**
- >50% of users try "Generate from Case" mode
- Generated personas rated 4+ stars for relevance

**Dependencies:**
- Prompt service (already exists)
- Case facts + arguments available

**Priority Justification:**
- Colleague identified this as valuable
- Reduces manual persona selection time from 5 minutes to 30 seconds
- Makes focus groups more case-specific (better results)

---

### 3. Bulk Question Editing Tools

**Status:** 🟡 Concept phase
**Effort:** 6-8 hours
**User Value:** Medium-High - saves time for power users

**What it does:**
- Adds bulk editing tools to wizard Step 3 (Questions)
- Allows adjusting tone, aggressiveness, or style for all questions at once
- "Regenerate all with different tone" button

**Example:**
```tsx
<div className="flex gap-2 mb-4">
  <Select
    label="Tone"
    options={['Neutral', 'Sympathetic', 'Aggressive', 'Skeptical']}
    onChange={handleToneChange}
  />
  <Select
    label="Aggressiveness"
    options={['Soft', 'Moderate', 'Hard']}
    onChange={handleAggressivenessChange}
  />
  <Button onClick={handleRegenerateAll}>
    Regenerate All Questions
  </Button>
</div>
```

**Backend:**
- Modify `focus-group-questions` prompt to accept tone/aggressiveness parameters
- Add bulk regeneration endpoint: `POST /focus-groups/sessions/:id/regenerate-questions`

**Success Metrics:**
- >30% of users adjust tone at least once
- 4+ stars on "usefulness of bulk editing"

**Dependencies:**
- Existing question generation system

**Priority Justification:**
- Colleague suggested this feature
- Useful for power users who run many focus groups
- Low risk (doesn't change core workflow)

**Concerns:**
- May be over-engineering for MVP users
- Could add UI complexity
- **Recommendation:** Wait for user requests before building

---

### 4. Progress Indicator with Statement Count

**Status:** 🔴 Low priority (colleague suggestion rejected)
**Effort:** 2-3 hours
**User Value:** Low - current spinner is sufficient

**What it does:**
- Shows "18 of ~25 statements complete" during simulation
- Real-time progress updates

**Why deprioritized:**
- Simulations only take 60-90 seconds (fast enough)
- Detailed progress adds noise, not value
- "Stop early" feature is risky (partial deliberations miss dynamics)

**Alternative (lighter implementation):**
- Simple progress bar: 0% → 50% → 100%
- No statement-level detail

**If implemented:**
```tsx
<div className="text-center p-8">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-filevine-blue mx-auto"></div>
  <p className="mt-4 text-sm text-filevine-gray-600">
    Running simulation... {statementsCompleted} of ~{totalExpected} statements
  </p>
  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-filevine-blue h-2 rounded-full transition-all"
      style={{ width: `${(statementsCompleted / totalExpected) * 100}%` }}
    ></div>
  </div>
</div>
```

**Success Metrics:**
- User feedback: "progress indicator helpful" >60%

**Dependencies:** WebSocket or polling for real-time updates

**Priority Justification:**
- Nice-to-have, not critical
- Requires infrastructure changes (WebSocket)
- Only valuable for long simulations (>2 minutes)

---

### 5. Panel Selection Redesign (Rename + Reorder Modes)

**Status:** 🟡 Design refinement
**Effort:** 1-2 hours
**User Value:** Medium - clearer hierarchy

**What it does:**
- Renames and reorders existing 3 modes for better UX
- Makes "default" mode more obvious

**Current Modes:**
1. Random Panel
2. Configure Panel
3. Match Case Jurors

**Proposed Modes:**
1. **"Default Panel (Recommended)"** - Random selection (emphasizes this is the default)
2. **"Match Case Jurors"** - Use classified jurors (only if jurors exist)
3. **"Select Specific Personas"** - Manual selection (power user feature)

**Implementation:**
```tsx
const PANEL_MODES = [
  {
    key: 'random',
    label: 'Default Panel (Recommended)',
    description: 'System selects 6 diverse personas',
    icon: Shuffle,
    recommended: true
  },
  {
    key: 'case_matched',
    label: 'Match Case Jurors',
    description: 'Use personas from classified jurors',
    icon: Users,
    disabled: !hasClassifiedJurors
  },
  {
    key: 'configured',
    label: 'Select Specific Personas',
    description: 'Choose personas manually',
    icon: Settings
  }
];
```

**Success Metrics:**
- >80% of new users select "Default Panel (Recommended)"
- Reduced confusion about which mode to use

**Dependencies:** None

**Priority Justification:**
- Low effort, high clarity improvement
- Aligns with colleague's "make default obvious" suggestion

---

### 6. Comparative Analysis (v1 vs v2 Results)

**Status:** 🟡 Concept phase
**Effort:** 10-12 hours
**User Value:** Very High - demonstrates ROI

**What it does:**
- Side-by-side comparison of two focus group runs
- Shows improvement metrics after applying recommendations
- Visualizes: "Confusion decreased 40%", "Consensus improved 25%"

**UI Mockup:**
```
┌─────────────────────────────────────────────────────┐
│  Compare Focus Group Results                        │
├───────────────┬─────────────────────────────────────┤
│  v1 (Original)│  v2 (After Recommendations)         │
├───────────────┼─────────────────────────────────────┤
│  Confusion:   │  Confusion:                         │
│  5 points     │  3 points ↓ 40%                     │
│               │                                     │
│  Consensus:   │  Consensus:                         │
│  2 areas      │  4 areas ↑ 100%                     │
│               │                                     │
│  Overall:     │  Overall:                           │
│  Divided      │  Leaning Plaintiff ↑                │
└───────────────┴─────────────────────────────────────┘
```

**Implementation:**
- Add "Compare" button to conversation viewer
- Fetch both conversations
- Calculate deltas (confusion points, consensus areas, sentiment)
- Visualize improvements with color coding

**Success Metrics:**
- >60% of users who apply recommendations run v2 focus group
- >40% of those users view comparison view

**Dependencies:**
- "So What?" results tab (Phase 5B)
- Multiple focus group runs per argument

**Priority Justification:**
- Powerful ROI demonstration
- Encourages iterative improvement cycle
- Requires substantial UI work (not MVP)

---

### 7. Recommendation Acceptance Tracking

**Status:** 🟢 Simple to add
**Effort:** 3-4 hours
**User Value:** Medium (improves AI over time)

**What it does:**
- Tracks which recommendations users accept/reject/modify
- Logs data for future ML improvements
- No user-facing changes (pure tracking)

**Implementation:**
```typescript
// When user applies recommendations
const applyRecommendations = async (conversationId, editAcceptances) => {
  await apiClient.post(`/focus-groups/conversations/${conversationId}/track-recommendations`, {
    acceptances: [
      { editNumber: 1, status: 'ACCEPTED' },
      { editNumber: 2, status: 'MODIFIED', changes: '...' },
      { editNumber: 3, status: 'REJECTED', reason: '...' }
    ]
  });
};
```

**Database Schema:**
```prisma
model RecommendationFeedback {
  id             String   @id @default(cuid())
  conversationId String
  editNumber     Int
  status         String   // ACCEPTED, REJECTED, MODIFIED
  modifiedText   String?  // If user changed suggested text
  rejectionReason String? // Optional feedback
  createdAt      DateTime @default(now())
}
```

**Success Metrics:**
- Acceptance rate: >70% (indicates high recommendation quality)
- Track patterns: Which edit types are most accepted?

**Dependencies:** None

**Priority Justification:**
- Low effort, high long-term value
- Enables future ML improvements
- Should be added in Phase 5B or immediately after

---

### 8. Export Takeaways to PDF

**Status:** 🟡 Concept phase
**Effort:** 6-8 hours
**User Value:** Medium - useful for sharing with team

**What it does:**
- Generates polished PDF report with:
  - Strategic summary (what landed, confused, backfired)
  - Top questions
  - Recommended edits
  - Full transcript (optional)
- "Share with Team" button

**Implementation:**
- Use library: `@react-pdf/renderer` or server-side PDF generation
- Add route: `GET /focus-groups/conversations/:id/export-pdf`
- Template: Professional legal brief style

**Success Metrics:**
- >30% of users export at least one report
- 4+ stars on "PDF quality"

**Dependencies:**
- "So What?" results tab (Phase 5B)

**Priority Justification:**
- Nice-to-have for collaboration
- Not critical for MVP (users can screenshot/copy-paste)

---

## Medium-Priority Enhancements

### 9. Argument Quality Validation

**Effort:** 3-4 hours
**User Value:** Medium

**What it does:**
- Validates argument quality before allowing focus group run
- Checks: minimum length, no placeholder text, has key facts attached

**Validation Rules:**
- Minimum 100 characters
- No "TODO", "Edit me", "[INSERT TEXT]" placeholders
- Optional: AI quality score (0-100)

**Implementation:**
```typescript
const validateArgument = (argument: Argument): ValidationResult => {
  const errors = [];

  if (argument.content.length < 100) {
    errors.push('Argument is too short (minimum 100 characters)');
  }

  if (/TODO|Edit me|\[INSERT/i.test(argument.content)) {
    errors.push('Argument contains placeholder text');
  }

  return { valid: errors.length === 0, errors };
};
```

**Priority:** Wait for user feedback on whether this is needed

---

### 10. Inline Argument Creation in Wizard

**Effort:** 5-6 hours
**User Value:** Medium-High

**What it does:**
- Quick-create form inside wizard (no navigation)
- Saves 1-2 minutes per workflow

**Implementation:**
- Modal dialog in empty state
- Simple form: title, type, content
- On save: adds to database + wizard session

**Priority:** Good UX improvement, but not critical (redirect works fine)

---

### 11. Multi-Argument Parallel Testing

**Effort:** 12-15 hours
**User Value:** High (for power users)

**What it does:**
- Run focus groups for 3+ arguments simultaneously
- Compare results side-by-side
- "Test all opening variations" workflow

**Priority:** Advanced feature for later phases

---

## Low-Priority Enhancements

### 12. Custom Question Targeting by Persona Archetype

**Status:** ✅ Already implemented!
**Effort:** 0 (done)
**Note:** This feature is already in the system (see [conversation-orchestrator.ts:230-236](services/api-gateway/src/services/roundtable/conversation-orchestrator.ts#L230-L236))

---

### 13. Collaboration Features (Comments, Sharing)

**Effort:** 15-20 hours
**User Value:** Medium (team-based workflows)

**What it does:**
- Comment on specific takeaways or recommendations
- Share focus group results with team members
- Activity feed for team visibility

**Priority:** Phase 7+ (requires multi-user infrastructure)

---

### 14. A/B Testing Dashboard for Prompts

**Effort:** 20+ hours
**User Value:** Medium (internal tool)

**What it does:**
- Admin UI for prompt management
- A/B test different prompt versions
- Analytics: which prompts produce better recommendations

**Priority:** Phase 8+ (requires analytics infrastructure)

---

## Feature Prioritization Matrix

| Feature | Effort | User Value | Priority | Phase |
|---------|--------|------------|----------|-------|
| **Inline Argument Preview** | Low (2-3h) | High | 🔥 **NOW** | 5B |
| **Recommendation Tracking** | Low (3-4h) | High (long-term) | 🔥 **NOW** | 5B |
| **Panel Redesign (Rename)** | Low (1-2h) | Medium | 🟢 Next | 5C |
| **Generate Personas from Case** | Medium (8-10h) | Very High | 🟢 Next | 6A |
| **Bulk Question Editing** | Medium (6-8h) | Medium-High | 🟡 Later | 6B |
| **Comparative Analysis** | High (10-12h) | Very High | 🟡 Later | 6C |
| **Export to PDF** | Medium (6-8h) | Medium | 🟡 Later | 7A |
| **Progress Indicator** | Low (2-3h) | Low | 🔴 Skip | - |
| **Inline Argument Creation** | Medium (5-6h) | Medium-High | 🟡 Later | 7B |
| **Argument Quality Validation** | Low (3-4h) | Medium | 🟡 Later | 7C |
| **Multi-Argument Parallel** | High (12-15h) | High | 🟡 Later | 8A |
| **Collaboration Features** | Very High (15-20h) | Medium | 🔴 Skip | - |
| **A/B Testing Dashboard** | Very High (20+h) | Medium | 🔴 Skip | - |

---

## Quick Win Candidates (Implement Soon)

These features have **low effort** and **high value** - perfect for Phase 5C or quick iterations:

1. ✅ **Inline Argument Preview** (2-3 hours, already designed)
2. ✅ **Recommendation Tracking** (3-4 hours, simple logging)
3. ✅ **Panel Redesign** (1-2 hours, just rename/reorder)

Total time: **6-9 hours** for all three quick wins

---

## Next Steps

1. **Get user approval** on Phase 5B designs (So What? + Hard-Gating)
2. **Implement Phase 5B** (13-17 hours)
3. **Add quick wins** from this document (6-9 hours)
4. **Collect user feedback** on what to prioritize next
5. **Plan Phase 6** with highest-value features

---

## Related Documentation

- [PHASE_5B_SO_WHAT_RESULTS_DESIGN.md](./PHASE_5B_SO_WHAT_RESULTS_DESIGN.md) - "So What?" results tab
- [PHASE_5B_HARD_GATE_ARGUMENTS_DESIGN.md](./PHASE_5B_HARD_GATE_ARGUMENTS_DESIGN.md) - Hard-gating stimulus selection
- [CURRENT_STATE.md](./CURRENT_STATE.md) - Current system status
- [ROUNDTABLE_CONVERSATIONS.md](./ROUNDTABLE_CONVERSATIONS.md) - Focus group system

---

**Last Updated:** January 27, 2026
**Next Review:** After Phase 5B completion
