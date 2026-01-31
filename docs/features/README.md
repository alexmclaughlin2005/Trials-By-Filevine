# Feature Documentation

**Purpose:** Active documentation for major features of Trials by Filevine.

---

## Structure

```
features/
├── archetypes/       # 10-archetype behavioral classification system
├── chat/             # API chat assistant
├── deep-research/    # Claude web search synthesis
├── focus-groups/     # Jury deliberation simulations & roundtable
├── juror-research/   # Juror research specifications
├── ocr/              # Document capture with Claude Vision
├── personas/         # Persona system (V2) and matching
├── phase-5b/         # Active Phase 5B planning
└── voir-dire/        # Voir dire question generation
```

## Feature Directories

### [archetypes/](./archetypes/)
10 behavioral archetypes with psychological dimension scoring.
- `ARCHETYPE_SYSTEM_SUMMARY.md` - Complete archetype guide

### [deep-research/](./deep-research/)
Deep research synthesis using Claude 4 Sonnet with web search.
- `DEEP_RESEARCH_GUIDE.md` - User guide
- `DEEP_RESEARCH_TECHNICAL.md` - Technical implementation (500+ lines)

### [focus-groups/](./focus-groups/)
AI-powered jury deliberation simulations and roundtable conversations.
- `ROUNDTABLE_CONVERSATIONS.md` - Main guide
- `ROUNDTABLE_REPETITION_ANALYSIS.md` - Recent analysis
- `FOCUS_GROUP_FUTURE_ENHANCEMENTS.md` - Roadmap
- `FOCUS_GROUP_TESTING_GUIDE.md` - Testing procedures

### [juror-research/](./juror-research/)
Juror research feature specifications and implementation guides.
- `README.md` - Quick start for developers & AI assistants
- `OVERVIEW.md` - Product context, user stories, architecture
- `DATA_MODELS.md` - Domain entities, TypeScript interfaces
- `API_SPEC.md` - REST endpoints, WebSocket events
- `DATA_SOURCES.md` - External APIs, integration patterns
- `UI_FLOWS.md` - Screens, interactions, wireframes
- `IMPLEMENTATION_GUIDE.md` - Build order, algorithms, edge cases

### [ocr/](./ocr/)
Document capture with OCR using Claude Vision API.
- `PHASE_4_COMPLETE.md` - Implementation details

### [personas/](./personas/)
Persona library and juror-to-persona matching.
- `PERSONA_V2_QUICKSTART.md` - Quick start guide
- `PERSONA_HEADSHOT_DISPLAY_PLAN.md` - Image display
- `PERSONA_STORAGE_AND_EXPORT.md` - Data storage
- `JUROR_PERSONA_MATCHING_METHOD.md` - Matching algorithms

### [voir-dire/](./voir-dire/)
Strategic voir dire question generation.
- `VOIR_DIRE_PERSONA_MATCHING_VISIBILITY.md` - Matching visibility

---

## See Also

- [AI_instructions.md](../../AI_instructions.md) - Project structure & implementation status
- [CURRENT_STATE.md](../../CURRENT_STATE.md) - Current state & roadmap
- [docs/archive/features/](../archive/features/) - Historical feature planning docs
