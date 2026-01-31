# Claude AI Assistant Instructions

**Last Updated:** January 31, 2026

## Quick Start for AI Agents

**Read these two documents first:**
1. **[AI_instructions.md](./AI_instructions.md)** - Project structure, directory map, service reference
2. **[CURRENT_STATE.md](./CURRENT_STATE.md)** - Current status, what's done, what's next

**Documentation hub:** [docs/README.md](./docs/README.md)

---

## Documentation Structure

### Primary Documents (Root Level)

| Document | Purpose | When to Update |
|----------|---------|----------------|
| `AI_instructions.md` | Project structure, directory map, tech stack | When structure changes |
| `CURRENT_STATE.md` | Status, roadmap, what's done/next | After major features, deployments |
| `README.md` | Project entry point, quick start | Rarely (stable) |
| `DEVELOPER_GUIDE.md` | Developer quick reference | When dev workflows change |
| `DEPLOYMENT_GUIDE.md` | Primary deployment guide | When deploy process changes |
| `RAILWAY_DEPLOYMENT.md` | Railway-specific guide | When Railway config changes |

### Documentation Directories

```
docs/
├── README.md               # Documentation index & navigation
├── api/                    # API specs, OpenAPI, quick reference
├── architecture/           # PRDs, system design, SYSTEM_OVERVIEW.md
├── features/               # Feature-specific documentation
│   ├── archetypes/        # Archetype classification system
│   ├── chat/              # API chat assistant
│   ├── deep-research/     # Claude web search synthesis
│   ├── focus-groups/      # Jury deliberation simulations
│   ├── juror-research/    # Juror research specifications
│   ├── ocr/               # Document capture
│   ├── personas/          # Persona system & matching
│   ├── phase-5b/          # Active planning docs
│   └── voir-dire/         # Question generation
├── guides/                 # Demo scripts, presentations
└── archive/                # Historical documentation
    ├── sessions/          # Development session logs
    ├── phases/            # Phase completion docs
    ├── deployments/       # Deployment milestones
    └── features/          # Feature planning archives
```

### Data Directories

```
personas/                   # V2 persona data (authoritative)
├── data/                  # Persona JSON files (10 archetypes)
├── docs/                  # Persona documentation
└── README.md              # Includes V1 deprecation checklist
```

### Service Documentation

Each service has its own `README.md`:
- `services/api-gateway/README.md` - API Gateway documentation
- `services/prompt-service/README.md` - Prompt service
- `packages/database/README.md` - Database schema
- `apps/web/README.md` - Web application

---

## My Responsibilities

### Before Making Changes

1. Read `AI_instructions.md` to understand project structure
2. Read `CURRENT_STATE.md` to understand current status and priorities
3. Check `docs/features/` for feature-specific documentation
4. Read relevant service `README.md` files

### After Making Changes

1. **Structure changes** → Update `AI_instructions.md`
2. **Feature completion** → Update `CURRENT_STATE.md`
3. **New service/directory** → Create `README.md` in that directory
4. **API changes** → Update `docs/api/` documentation
5. **Major work session** → Consider creating session summary (see Maintenance Policy)

### When Creating New Services

1. Create `README.md` in the new directory immediately
2. Add entry to `AI_instructions.md` repository structure
3. Update `CURRENT_STATE.md` if it's a major feature
4. Document purpose, API contracts, and dependencies

---

## Maintenance Policy

### Session Summaries

**Purpose:** Track development progress, decisions, and bug fixes.

**Lifecycle:**
- **Create:** For major work sessions with multiple changes
- **Location:** `docs/archive/sessions/` (archived immediately)
- **Naming:** `SESSION_SUMMARY_YYYY-MM-DD_description.md`
- **Retention:** Keep indefinitely for historical reference

**When to create:**
- Multiple related bug fixes in one session
- Major feature implementation
- Important architectural decisions
- Production deployments with issues

### Phase/Milestone Documents

**Purpose:** Document phase completion and implementation details.

**Lifecycle:**
- **Active:** Keep in root or `docs/features/` while actively developing
- **Archive:** Move to `docs/archive/phases/` when phase is complete and stable
- **Consolidate:** Merge key information into `CURRENT_STATE.md` before archiving

### Deployment Documents

**Purpose:** Track deployment milestones and procedures.

**Lifecycle:**
- **Primary guides:** `DEPLOYMENT_GUIDE.md` and `RAILWAY_DEPLOYMENT.md` (always current)
- **Milestone markers:** Archive to `docs/archive/deployments/` after deployment succeeds
- **Feature deployments:** Archive after 2 weeks if no issues

### Feature Documentation

**Purpose:** Document feature implementation and usage.

**Lifecycle:**
- **Planning docs:** Keep in `docs/features/[feature]/` during development
- **Archive planning:** Move to `docs/archive/features/` after feature ships
- **Keep active:** Implementation guides, testing guides, user guides

### Keeping Documents in Sync

**Weekly check:**
- Ensure `CURRENT_STATE.md` reflects actual implementation status
- Verify `AI_instructions.md` matches actual directory structure
- Archive any documents older than 2 weeks that are no longer needed

**After major changes:**
- Update both primary documents if needed
- Cross-reference between them (they should point to each other)

---

## Project Context

### Hosting
- **Frontend:** Vercel (Next.js 14)
- **Backend:** Railway (Node.js/Python services)
- **Database:** PostgreSQL on Railway
- **AI Provider:** Anthropic Claude 4.5

### Key Directories
- `apps/web/` - Main Next.js web application
- `services/api-gateway/` - Main API gateway with integrated AI services
- `services/prompt-service/` - Centralized prompt management
- `packages/database/` - Prisma schema and migrations
- `personas/data/` - V2 persona JSON files

### Database Schema
Located at: `packages/database/prisma/schema.prisma`

Key models: Organization, User, Case, JuryPanel, Juror, Candidate, SynthesizedProfile, Persona, PersonaMapping, ArchetypeResult, Fact, Argument, Witness, Question, FocusGroup, DocumentCapture, ResearchArtifact

### Prompt Management
- Prompts stored in database via prompt-service
- Use `services/prompt-service/scripts/` for seeding prompts
- See `services/prompt-service/README.md` for full documentation

---

## Documentation Quick Reference

### For AI Assistants
| Need | Document |
|------|----------|
| Project structure | [AI_instructions.md](./AI_instructions.md) |
| Current status | [CURRENT_STATE.md](./CURRENT_STATE.md) |
| All documentation | [docs/README.md](./docs/README.md) |
| Feature docs | [docs/features/](./docs/features/) |
| API reference | [docs/api/](./docs/api/) |
| Architecture | [docs/architecture/](./docs/architecture/) |

### For Developers
| Need | Document |
|------|----------|
| Getting started | [GETTING_STARTED.md](./GETTING_STARTED.md) |
| Dev quick ref | [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) |
| Deployment | [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) |
| Demo script | [docs/guides/QUICK_DEMO.md](./docs/guides/QUICK_DEMO.md) |

### For System Reference
| Need | Document |
|------|----------|
| System overview | [docs/architecture/SYSTEM_OVERVIEW.md](./docs/architecture/SYSTEM_OVERVIEW.md) |
| PRD | [docs/architecture/TrialForge_AI_PRD.md](./docs/architecture/TrialForge_AI_PRD.md) |
| Technical design | [docs/architecture/TrialForge_AI_Technical_Design.md](./docs/architecture/TrialForge_AI_Technical_Design.md) |
| Database schema | [packages/database/prisma/schema.prisma](./packages/database/prisma/schema.prisma) |

---

## Prompt Seeding

When making changes that involve new prompts:
1. Create prompt in `services/prompt-service/scripts/`
2. Use seed endpoint to add to production database
3. See `services/prompt-service/README.md` for details
