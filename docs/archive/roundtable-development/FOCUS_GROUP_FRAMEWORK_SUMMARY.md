# Focus Group Framework - Implementation Summary

**Date:** January 23, 2026
**Status:** Phase 1 Complete ✅
**Next:** Prompt service integration & deliberation logic design

---

## What We Built

### ✅ Phase 1: Configuration Framework (Complete)

We've successfully built the complete focus group configuration framework with a multi-step wizard interface. Users can now:

1. **Create Focus Group Sessions** with full configuration workflow
2. **Select Archetype Panels** with 3 modes:
   - 🎲 Random Panel - System selects diverse archetypes
   - ⚙️ Configure Panel - Manual archetype selection
   - 👥 Case-Matched - Use archetypes from classified jurors
3. **Choose Arguments** to test with ordering
4. **Add Custom Questions** for focus group members
5. **Review Configuration** before launching

---

## Technical Implementation

### 1. Database Schema Updates ✅

**File:** `packages/database/prisma/schema.prisma`

Added new fields to `FocusGroupSession` model:

```prisma
archetypeSelectionMode String  @default("random") // "random" | "configured" | "case_matched"
selectedArchetypes     Json?   // Array of archetype names/IDs
archetypeCount         Int     @default(6) // Panel size
selectedArguments      Json?   // Array of {argumentId, order, title, content}
customQuestions        Json?   // Array of {id, question, order, targetArchetypes}
configurationStep      String  @default("setup") // Wizard progress tracking
```

**Migration:** `20260123125601_add_focus_group_configuration_fields`

---

### 2. Backend API Routes ✅

**File:** `services/api-gateway/src/routes/focus-groups.ts`

**New Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/focus-groups/sessions` | Create new session |
| `PATCH` | `/api/focus-groups/sessions/:sessionId/config` | Update configuration |
| `POST` | `/api/focus-groups/sessions/:sessionId/start` | Start simulation |
| `GET` | `/api/focus-groups/archetypes` | Get available archetypes |
| `DELETE` | `/api/focus-groups/sessions/:sessionId` | Delete draft session |

**Existing Endpoints:**
- `GET /api/focus-groups/case/:caseId` - List sessions
- `GET /api/focus-groups/:sessionId` - Get session details
- `POST /api/focus-groups/simulate` - Legacy quick simulation

---

### 3. TypeScript Types ✅

**File:** `apps/web/types/focus-group.ts`

Comprehensive type definitions for:
- `FocusGroupSession` - Full session model
- `ArchetypeOption` - Available archetypes
- `SelectedArchetype` - Chosen archetypes with metadata
- `SelectedArgument` - Arguments with ordering
- `CustomQuestion` - User-defined questions
- `FocusGroupConfigUpdate` - Configuration updates

---

### 4. Frontend Components ✅

#### **FocusGroupManager** (`focus-group-manager.tsx`)

Main orchestration component with 4 views:
- **List View** - Shows all sessions for a case
- **Setup View** - Multi-step wizard for configuration
- **Running View** - Simulation in progress (placeholder)
- **Results View** - Completed session results (placeholder)

Features:
- Session history with status badges
- "New Focus Group" creation flow
- Continue draft sessions
- View completed results

#### **FocusGroupSetupWizard** (`focus-group-setup-wizard.tsx`)

4-step configuration wizard:

**Step 1: Panel Configuration**
- Selection mode picker (Random/Configured/Case-Matched)
- Panel size selector for random mode
- Archetype grid with checkboxes for configured mode
- Visual archetype cards with descriptions

**Step 2: Arguments Selection**
- Checkbox list of available arguments
- Order indicators (1, 2, 3...)
- Argument preview with metadata
- Add/Remove buttons

**Step 3: Custom Questions (Optional)**
- Add question form with Enter key support
- Questions list with ordering
- Remove questions functionality
- Optional skip message

**Step 4: Review & Launch**
- Configuration summary cards
- Panel composition preview
- Arguments list with order
- Questions summary
- "Ready to Launch" status indicator

**Features:**
- Progress indicator with icons
- Back/Next navigation
- Auto-save on step changes
- Validation before start
- Loading states

---

## User Workflow

### Creating a Focus Group

1. Navigate to case → Focus Groups tab
2. Click "New Focus Group"
3. **Configure Panel:**
   - Choose selection mode
   - Select archetypes (if configured/case-matched)
   - Set panel size (if random)
4. **Select Arguments:**
   - Check arguments to test
   - Review order (1, 2, 3...)
5. **Add Questions (Optional):**
   - Type custom questions
   - Press Enter to add
   - Remove if needed
6. **Review:**
   - Verify configuration
   - Click "Start Focus Group"
7. Session starts → Simulation begins

### Managing Sessions

- **View History:** See all past sessions
- **Continue Draft:** Resume incomplete setup
- **View Results:** See completed simulations
- **Quick Simulation:** Legacy one-click mode (kept for now)

---

## Data Flow

```
User Creates Session
    ↓
POST /api/focus-groups/sessions
    ↓
Session Created (status: draft)
    ↓
User Configures (4 steps)
    ↓
PATCH /api/focus-groups/sessions/:id/config (after each step)
    ↓
User Reviews & Starts
    ↓
POST /api/focus-groups/sessions/:id/start
    ↓
Session Status: running
    ↓
[Simulation Logic - To Be Implemented]
    ↓
Session Status: completed
    ↓
User Views Results
```

---

## What's NOT Built Yet

### 🔄 Phase 2: Prompt Service Integration (Next)

**Need to create 3 prompts:**

1. **`focus-group-initial-reactions`**
   - Input: archetypes, arguments, caseContext, customQuestions
   - Output: Per-archetype reactions, sentiment, concerns

2. **`focus-group-recommendations`**
   - Input: reactions, arguments
   - Output: Prioritized recommendations, strengths, weaknesses

3. **`focus-group-deliberation`** (Phase 3)
   - Input: archetypes, initialReactions, arguments
   - Output: Back-and-forth discussion exchanges

**Integration Steps:**
1. Create prompt service client in API gateway
2. Define prompt templates in prompt service
3. Implement `FocusGroupV2Service` using `@juries/prompt-client`
4. Update `/start` endpoint to call new service
5. Add polling for simulation status

---

### 🤔 Phase 3: Deliberation Logic (Needs Design)

**Challenge:** How to simulate realistic back-and-forth discussion?

**Questions to Answer:**
- How many exchanges? (8-12? Dynamic?)
- Who speaks when? (Random? Based on influence?)
- How do personas influence each other?
- When does consensus emerge?
- How to avoid repetitive responses?

**Potential Approaches:**
1. **Multi-turn with Claude** - Multiple API calls with conversation history
2. **Single structured prompt** - Request all exchanges at once
3. **Personas as agents** - Separate calls per persona (expensive)
4. **Hybrid** - Initial positions → Structured deliberation → Final positions

**Recommendation:** Let's discuss this separately after prompt integration is done.

---

## File Structure

```
packages/database/
├── prisma/
│   ├── schema.prisma                          # Updated with new fields
│   └── migrations/
│       └── 20260123125601_*/migration.sql     # New migration

services/api-gateway/src/
├── routes/
│   └── focus-groups.ts                        # Extended with new endpoints
└── services/
    └── focus-group-engine.ts                  # Existing (will keep for legacy)

apps/web/
├── types/
│   └── focus-group.ts                         # NEW: TypeScript types
├── components/
│   ├── focus-group-manager.tsx                # NEW: Main orchestrator
│   ├── focus-group-setup-wizard.tsx           # NEW: Multi-step wizard
│   └── focus-group-simulator.tsx              # Existing (kept for legacy)
└── app/(auth)/cases/[id]/
    └── page.tsx                               # Updated to use FocusGroupManager
```

---

## Testing Checklist

### ✅ Completed
- [x] Database schema migration successful
- [x] API routes compilation successful
- [x] TypeScript types properly defined
- [x] Components created without syntax errors

### 🧪 To Test (Manual)
- [ ] Create new focus group session
- [ ] Configure random panel
- [ ] Configure custom panel
- [ ] Configure case-matched panel (with classified jurors)
- [ ] Select multiple arguments
- [ ] Reorder arguments
- [ ] Add custom questions
- [ ] Remove questions
- [ ] Review configuration display
- [ ] Start simulation
- [ ] View session in list
- [ ] Continue draft session
- [ ] Delete draft session

---

## Next Steps

### Immediate (This Session)
1. **Test the UI** - Make sure wizard works end-to-end
2. **Fix any bugs** - UI, validation, navigation
3. **Add loading states** - Better UX during saves

### Short-Term (Next Session)
1. **Integrate Prompt Service**
   - Create `focus-group-initial-reactions` prompt
   - Build `FocusGroupV2Service`
   - Update `/start` endpoint
   - Add status polling
   - Display results

2. **Results Display**
   - Show archetype reactions
   - Display sentiment scores
   - List recommendations
   - Export to PDF (future)

### Medium-Term
1. **Deliberation Simulation Design**
   - Design conversation flow
   - Prompt engineering strategy
   - Test with different approaches
   - Measure quality vs. cost

2. **Advanced Features**
   - A/B test different argument versions
   - Compare sessions side-by-side
   - Track recommendation implementation
   - Session templates

---

## Configuration Examples

### Random Panel
```json
{
  "archetypeSelectionMode": "random",
  "archetypeCount": 6,
  "selectedArchetypes": null
}
```

### Configured Panel
```json
{
  "archetypeSelectionMode": "configured",
  "selectedArchetypes": [
    { "name": "Bootstrapper", "description": "Self-made, personal responsibility" },
    { "name": "Crusader", "description": "Justice-driven, cause-oriented" },
    { "name": "Heart", "description": "Empathy-driven, emotional connection" },
    { "name": "Calculator", "description": "Analytical, fact-driven" },
    { "name": "Skeptic", "description": "Questions authority, needs proof" },
    { "name": "Harmonizer", "description": "Seeks consensus and balance" }
  ]
}
```

### Case-Matched Panel
```json
{
  "archetypeSelectionMode": "case_matched",
  "selectedArchetypes": [
    {
      "name": "Bootstrapper",
      "source": "case_juror",
      "jurorId": "uuid",
      "jurorName": "John Doe",
      "confidence": 0.87
    }
  ]
}
```

### Selected Arguments
```json
{
  "selectedArguments": [
    {
      "argumentId": "uuid-1",
      "order": 1,
      "title": "Opening Statement",
      "content": "Ladies and gentlemen...",
      "argumentType": "opening"
    },
    {
      "argumentId": "uuid-2",
      "order": 2,
      "title": "Liability Argument",
      "content": "The evidence shows...",
      "argumentType": "liability"
    }
  ]
}
```

### Custom Questions
```json
{
  "customQuestions": [
    {
      "id": "q-1",
      "question": "What concerns do you have about the evidence presented?",
      "order": 1,
      "targetArchetypes": []
    },
    {
      "id": "q-2",
      "question": "How credible did you find the expert witness?",
      "order": 2,
      "targetArchetypes": ["Calculator", "Skeptic"]
    }
  ]
}
```

---

## Documentation References

### Prompt Service Integration
- [API Contract](services/prompt-service/API_CONTRACT.md)
- [Integration Guide](services/prompt-service/INTEGRATION_GUIDE.md)
- [README](services/prompt-service/README.md)

### Project Context
- [CURRENT_STATE.md](CURRENT_STATE.md) - Overall project status
- [ai_instructions.md](ai_instructions.md) - Project structure
- [PRD](TrialForge_AI_PRD.md) - Product requirements (Section 5.4)

---

## Summary

**Phase 1 is complete!** 🎉

We've built a robust, user-friendly focus group configuration framework that allows attorneys to:
- Set up custom focus group panels
- Select and order arguments to test
- Add custom questions
- Manage multiple sessions per case

The foundation is solid and ready for Phase 2 (Prompt Service Integration) and Phase 3 (Deliberation Simulation).

**Next Action:** Test the UI in development environment and fix any bugs before integrating with the prompt service.

---

**Last Updated:** January 23, 2026
**Completed By:** Claude AI Assistant
**Reviewed By:** [Pending]
