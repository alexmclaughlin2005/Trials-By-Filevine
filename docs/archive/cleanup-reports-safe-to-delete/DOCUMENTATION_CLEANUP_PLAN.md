# Documentation Cleanup Plan - Trials by Filevine

**Created:** January 31, 2026
**Status:** Proposed
**Purpose:** Consolidate, organize, and streamline project documentation

---

## Executive Summary

This project currently has **94 markdown files in the root directory** plus **27 files in the docs/ folder** (121 total documentation files). While the core hub documents (`CURRENT_STATE.md` and `ai_instructions.md`) are excellent, significant redundancy and fragmentation exists across deployment guides, feature documentation, and session summaries.

**Key Findings:**
- ✅ **Core docs are solid** - CURRENT_STATE.md and ai_instructions.md provide excellent starting points
- ⚠️ **34 documents mention deployment** - extreme fragmentation, unclear which is authoritative
- ⚠️ **14 session summaries in root** - should be archived/organized
- ⚠️ **11+ documents cover personas** - significant redundancy
- ⚠️ **10+ documents cover focus groups/roundtable** - overlapping content
- ❌ **Missing critical guides** - Troubleshooting, API reference, testing strategy

**Recommendation:** Execute a phased cleanup over 3-4 weeks to consolidate related documents, archive historical content, and create missing essential guides.

---

## Current State Analysis

### Documentation Inventory

**Root Directory:** 94 markdown files organized into:
- Status & State: 3 core files (CURRENT_STATE.md, PROJECT_STATUS.md, README.md)
- Getting Started: 4 files
- Architecture & Design: 4 files
- Deployment: 9+ primary files + 12+ feature-specific checklists
- Feature Guides: 20+ files
- Session Summaries: 14 files (all Jan 2026)
- Planning Documents: 8+ files
- Phase Documentation: 8+ files
- PRD Documents: 2 major files
- Operational: 8+ misc files

**Docs Directory:** 27 files including:
- Persona V2 migration: 12 files
- Prompt management: 3 files
- Deployment & operations: 4 files
- Testing & guides: 8 files

### What's Working Well

1. **CURRENT_STATE.md (32KB)** - Excellent comprehensive status document
   - Updated Jan 25, 2026
   - Contains feature breakdown, architecture, roadmap, cost estimates
   - Properly referenced as "START HERE" in README

2. **ai_instructions.md (33KB)** - Complete project structure guide
   - Directory map with responsibilities
   - Technology stack details
   - Implementation status tracking

3. **Core Getting Started Guides**
   - README.md - Good project overview
   - DEVELOPER_GUIDE.md - Helpful quick reference
   - GETTING_STARTED.md - Step-by-step setup

4. **Feature Deep Dives**
   - DEEP_RESEARCH_TECHNICAL.md (500+ lines)
   - ARCHETYPE_SYSTEM_SUMMARY.md
   - ROUNDTABLE_CONVERSATIONS.md
   - API_CHAT_SYSTEM.md

5. **Archive System Exists** - docs/archive/ with README explaining supersession

### Major Problems

#### 1. Deployment Documentation Fragmentation (34 documents!)

**Primary Guides:**
- DEPLOYMENT_GUIDE.md
- RAILWAY_DEPLOYMENT.md
- DEPLOYMENT_SUMMARY.md
- DEPLOYMENT_COMPLETE_SUMMARY.md

**Feature-Specific Checklists (12+):**
- DEPLOYMENT_CHECKLIST_PHYSICAL_DESCRIPTION.md
- DEPLOY_PERSONAS_CHECKLIST.md
- DEPLOYMENT_SUMMARY_2026-01-29_PERSONA_IMAGES.md
- DEPLOYMENT_SUMMARY_2026-01-29_JUROR_EDIT_SIDEBAR_SHIRT_COLOR.md
- PROMPT_SERVICE_DEPLOYMENT.md
- PROMPT_DEPLOYMENT_CHECKLIST.md
- JUROR_FRAMING_DEPLOYMENT.md
- DEPLOY_V5_JUROR_FRAMING_VIA_ADMIN.md
- PRODUCTION_DEPLOYMENT_V2_PERSONAS.md
- PRODUCTION_HOTFIX_ROUNDTABLE_PROMPTS.md
- PRODUCTION_MIGRATION_GUIDE.md

**Problem:** Unclear which is authoritative. New developers don't know where to start.

#### 2. Persona System Documentation (11+ documents)

- TrialForge_Juror_Persona_Matching_PRD.md (45KB)
- JUROR_PERSONA_MATCHING_IMPLEMENTATION_PLAN.md (34KB)
- JUROR_PERSONA_MATCHING_METHOD.md
- PERSONA_V2_QUICKSTART.md
- PERSONA_STORAGE_AND_EXPORT.md
- PERSONA_HEADSHOT_DISPLAY_PLAN.md
- ROUNDTABLE_PERSONA_SUMMARY_PLAN.md
- docs/PERSONA_V2_DEPLOYMENT.md
- docs/PERSONA_V2_IMPORT_GUIDE.md
- docs/PERSONA_IMPORT_FINAL_STATUS.md
- docs/ACCESSING_PERSONAS.md
- Multiple session summaries (Jan 23, Jan 29)

**Problem:** PRD, implementation plan, and method document cover overlapping content. V1/V2 split creates confusion.

#### 3. Focus Groups Documentation (10+ documents)

- ROUNDTABLE_CONVERSATIONS.md (main guide)
- FOCUS_GROUP_WIZARD_UX_ENHANCEMENTS.md (57KB!)
- FOCUS_GROUP_TESTING_GUIDE.md
- FOCUS_GROUP_IMPROVEMENTS_PHASE_1.md
- FOCUS_GROUP_FUTURE_ENHANCEMENTS.md
- ROUNDTABLE_DESIGN_UPDATES_IMPLEMENTATION_PLAN.md
- ROUNDTABLE_PERSONA_SUMMARY_PLAN.md
- ROUNDTABLE_REPETITION_ANALYSIS.md
- PHASE_5B_SO_WHAT_RESULTS_DESIGN.md
- Multiple session summaries

**Problem:** Main guide exists but overshadowed by massive UX enhancement doc (57KB) and multiple design/planning docs.

#### 4. Session Summaries (14 files in root)

All in root directory with format `SESSION_SUMMARY_YYYY-MM-DD_*.md`:
- SESSION_SUMMARY_2026-01-22.md
- SESSION_SUMMARY_2026-01-22_FILEVINE_DOCUMENTS.md
- SESSION_SUMMARY_2026-01-23_DOCUMENT_DOWNLOAD_WORKER.md
- SESSION_SUMMARY_2026-01-23_FOCUS_GROUP_QUESTIONS_DEPLOYMENT.md
- SESSION_SUMMARY_2026-01-23_PERSONA_MIGRATION.md
- SESSION_SUMMARY_2026-01-23_ROUNDTABLE_CONVERSATIONS.md
- SESSION_SUMMARY_2026-01-23_ROUNDTABLE_PRODUCTION_FIXES.md
- SESSION_SUMMARY_2026-01-26_BUILD_OPTIMIZATION.md
- SESSION_SUMMARY_2026-01-26_FOCUS_GROUP_IMPROVEMENTS.md
- SESSION_SUMMARY_2026-01-27_HARD_GATE_IMPLEMENTATION.md
- SESSION_SUMMARY_2026-01-27_JUROR_FRAMING_FIX.md
- SESSION_SUMMARY_2026-01-27_PHASE_2.md
- SESSION_SUMMARY_2026-01-27_TAKEAWAYS_UX.md
- SESSION_SUMMARY_PHASE_5_2026-01-27.md

**Problem:** Mix of implementation details and quick notes. Some overlap with main documentation. No clear relationship to core docs.

#### 5. Phase Documentation (8+ documents with mixed purposes)

**Implementation Summaries:**
- PHASE_1_IMPLEMENTATION_SUMMARY.md
- PHASE_2_IMPLEMENTATION_SUMMARY.md

**Completion Markers:**
- PHASE_1_SIGNAL_SYSTEM_COMPLETE.md
- PHASE_2_MATCHING_ALGORITHMS_COMPLETE.md
- PHASE_3_QUESTION_GENERATION_COMPLETE.md
- PHASE_3_UI_IMPLEMENTATION_COMPLETE.md
- PHASE_4_COMPLETE.md

**Planning Documents:**
- PHASE_5B_IMPLEMENTATION_PLAN.md
- docs/PHASE_4_AI_SERVICES_V2.md

**Problem:** Mix of markers and detailed docs. Unclear which supersedes which. Relationship to CURRENT_STATE.md unclear.

---

## Critical Gaps in Documentation

### 1. Consolidated Troubleshooting Guide
**Missing:** Single source for common issues and solutions
**Currently:** Scattered across multiple docs, `docs/CONSOLE_ERROR_FIXES.md` is very limited
**Needed:** Comprehensive guide covering:
- Common errors by feature area
- Database connection issues
- API Gateway errors
- Railway/Vercel deployment issues
- Claude API integration problems
- Frontend build errors

### 2. Comprehensive API Reference
**Missing:** Consolidated API endpoint documentation
**Currently:** Endpoints listed in `ai_instructions.md` but scattered
**Needed:** Single reference with:
- All endpoints by service
- Request/response schemas
- Authentication requirements
- Example requests/responses
- Error codes and handling

### 3. Testing Strategy & Guide
**Missing:** Comprehensive testing documentation
**Currently:**
- FOCUS_GROUP_TESTING_GUIDE.md (feature-specific)
- docs/AI_TESTING_GUIDE.md (limited)
- docs/TESTING_PHASE_2.md (phase-specific)
**Needed:** Complete guide covering:
- Unit testing strategy
- Integration testing
- E2E testing
- AI service testing
- Performance testing
- Load testing

### 4. Database Schema Documentation
**Missing:** Schema design and evolution guide
**Currently:** Prisma schema exists in code, no explanatory docs
**Needed:**
- Schema design decisions
- Relationship diagrams
- Migration history
- Indexing strategy
- Data model explanations

### 5. Monitoring & Operations Guide
**Missing:** Production monitoring setup
**Currently:** Mentioned briefly in deployment docs
**Needed:**
- Performance monitoring setup
- Cost tracking for Claude API
- Error tracking (Sentry)
- Uptime monitoring
- Log aggregation
- Alerting setup

### 6. Security & Compliance Guide
**Missing:** Dedicated security documentation
**Currently:** Mentioned in README.md and SYSTEM_OVERVIEW.md
**Needed:**
- Security best practices
- Authentication/authorization
- Audit logging
- Data encryption
- Compliance requirements
- SOC 2 preparation

### 7. Migration Guides
**Missing:** Clear upgrade paths between versions
**Currently:** Persona V2 migration scattered across multiple docs
**Needed:**
- V1 → V2 Persona migration
- Database migration procedures
- Breaking changes documentation
- Rollback procedures

### 8. Prompt Management Documentation
**Missing:** Comprehensive prompt system guide
**Currently:**
- PROMPT_SERVICE_DEPLOYMENT.md (limited)
- docs/PROMPT_MANAGEMENT_PROPOSAL.md (incomplete)
**Needed:**
- How prompt versioning works
- How to update prompts
- A/B testing setup
- Analytics interpretation

### 9. Changelog & Release Notes
**Missing:** Structured changelog
**Currently:** Session summaries used as informal changelog
**Needed:**
- Semantic versioning approach
- Release notes format
- Feature deprecation tracking
- Breaking changes log

### 10. Admin Tools Documentation
**Missing:** Comprehensive admin guide
**Currently:** ADMIN_UTILITIES.md (minimal), SEED_PROMPTS_MANUAL.md (limited)
**Needed:**
- Admin panel features
- Database seeding procedures
- Data migration tools
- Debugging utilities
- System health checks

---

## Proposed New Documentation Structure

```
Trials by Filevine/
│
├── README.md                          # Project overview (KEEP)
├── CURRENT_STATE.md                   # Primary status hub (KEEP)
├── ai_instructions.md                 # Project structure reference (KEEP)
├── CLAUDE.md                          # AI assistant instructions (KEEP)
│
├── docs/
│   │
│   ├── getting-started/
│   │   ├── README.md                  # Quick start (consolidated from GETTING_STARTED.md)
│   │   ├── developer-guide.md         # Dev reference (from DEVELOPER_GUIDE.md)
│   │   ├── demo-guide.md              # Demo walkthrough (from QUICK_DEMO.md)
│   │   └── troubleshooting.md         # Common issues (NEW)
│   │
│   ├── architecture/
│   │   ├── README.md                  # Architecture overview
│   │   ├── prd.md                     # Product requirements (from TrialForge_AI_PRD.md)
│   │   ├── system-design.md           # System architecture (from TrialForge_AI_Architecture.md)
│   │   ├── technical-design.md        # Technical specs (from TrialForge_AI_Technical_Design.md)
│   │   ├── database-schema.md         # Schema documentation (NEW)
│   │   └── api-design.md              # API design patterns (NEW)
│   │
│   ├── features/
│   │   ├── README.md                  # Feature index
│   │   ├── personas.md                # Consolidated persona system (CONSOLIDATE 11+ docs)
│   │   ├── focus-groups.md            # Consolidated focus groups (CONSOLIDATE 10+ docs)
│   │   ├── deep-research.md           # Deep research (from DEEP_RESEARCH_TECHNICAL.md)
│   │   ├── archetype-system.md        # Archetypes (from ARCHETYPE_SYSTEM_SUMMARY.md)
│   │   ├── ocr-capture.md             # Document capture (from PHASE_4_COMPLETE.md)
│   │   ├── api-chat.md                # API chat (from API_CHAT_SYSTEM.md)
│   │   ├── voir-dire-questions.md     # Voir dire generation
│   │   └── admin-utilities.md         # Admin tools (from ADMIN_UTILITIES.md)
│   │
│   ├── deployment/
│   │   ├── README.md                  # Deployment overview (from DEPLOYMENT_GUIDE.md)
│   │   ├── railway.md                 # Railway guide (from RAILWAY_DEPLOYMENT.md)
│   │   ├── vercel.md                  # Vercel guide
│   │   ├── environment-variables.md   # Env setup (from ENVIRONMENT_VARIABLES.md)
│   │   ├── pre-deployment-checklist.md # Pre-deploy steps (CONSOLIDATE checklists)
│   │   ├── post-deployment-checklist.md # Post-deploy verification
│   │   └── migration-guide.md         # Version migrations (NEW)
│   │
│   ├── operations/
│   │   ├── README.md                  # Operations overview
│   │   ├── monitoring.md              # Monitoring setup (NEW)
│   │   ├── cost-tracking.md           # API cost tracking (NEW)
│   │   ├── troubleshooting.md         # Troubleshooting guide (NEW)
│   │   ├── maintenance.md             # Maintenance procedures (NEW)
│   │   └── security.md                # Security & compliance (NEW)
│   │
│   ├── development/
│   │   ├── README.md                  # Development overview
│   │   ├── setup.md                   # Local setup (from GETTING_STARTED.md)
│   │   ├── testing.md                 # Testing strategy (NEW - CONSOLIDATE 3 docs)
│   │   ├── code-style.md              # Code standards
│   │   ├── debugging.md               # Debugging tips
│   │   └── contributing.md            # Contribution guidelines
│   │
│   ├── reference/
│   │   ├── README.md                  # Reference index
│   │   ├── api-endpoints.md           # API reference (NEW - from ai_instructions.md)
│   │   ├── database-models.md         # Database models (NEW)
│   │   ├── environment-variables.md   # Env var reference
│   │   ├── feature-matrix.md          # Feature comparison (from FEATURE_MATRIX.md)
│   │   └── glossary.md                # Terms & definitions (NEW)
│   │
│   ├── session-summaries/
│   │   ├── README.md                  # Index of session summaries
│   │   ├── 2026-01/
│   │   │   ├── 2026-01-22.md
│   │   │   ├── 2026-01-22_filevine-documents.md
│   │   │   ├── 2026-01-23_document-download-worker.md
│   │   │   ├── 2026-01-23_focus-group-questions-deployment.md
│   │   │   ├── 2026-01-23_persona-migration.md
│   │   │   ├── 2026-01-23_roundtable-conversations.md
│   │   │   ├── 2026-01-23_roundtable-production-fixes.md
│   │   │   ├── 2026-01-26_build-optimization.md
│   │   │   ├── 2026-01-26_focus-group-improvements.md
│   │   │   ├── 2026-01-27_hard-gate-implementation.md
│   │   │   ├── 2026-01-27_juror-framing-fix.md
│   │   │   ├── 2026-01-27_phase-2.md
│   │   │   ├── 2026-01-27_takeaways-ux.md
│   │   │   └── 2026-01-29_persona-image-generation-fix.md
│   │   └── README.md                  # Session summary guide
│   │
│   ├── archive/
│   │   ├── README.md                  # Archive index (KEEP current one)
│   │   ├── phase-completions/
│   │   │   ├── phase-1-implementation-summary.md
│   │   │   ├── phase-1-signal-system-complete.md
│   │   │   ├── phase-2-implementation-summary.md
│   │   │   ├── phase-2-matching-algorithms-complete.md
│   │   │   ├── phase-3-question-generation-complete.md
│   │   │   └── phase-3-ui-implementation-complete.md
│   │   ├── deployment-milestones/
│   │   │   ├── deployment-status.md
│   │   │   ├── deployment-success.md
│   │   │   └── ready-to-deploy.md
│   │   ├── setup-guides/
│   │   │   ├── quick-setup-guide.md
│   │   │   ├── start-services.md
│   │   │   └── seed-instructions.md
│   │   └── roundtable-development/
│   │       └── (existing archived docs)
│   │
│   └── CHANGELOG.md                   # Consolidated changelog (NEW)
│
└── [All other project directories remain unchanged]
```

---

## Phased Cleanup Plan

### Phase 1: Triage & Prioritize (Week 1)

**Goal:** Identify what to keep, consolidate, archive

**Tasks:**
1. ✅ Analyze all documentation (DONE - this document)
2. Create `DOCUMENTATION_INDEX.md` in root directory
3. Review and validate core documents are current:
   - CURRENT_STATE.md
   - ai_instructions.md
   - README.md
   - DEVELOPER_GUIDE.md
4. Create `/docs/session-summaries/2026-01/` directory
5. Move 14 session summaries to new directory
6. Update CURRENT_STATE.md to link to recent session summaries
7. Create `/docs/archive/phase-completions/` directory
8. Move phase completion markers to archive

**Deliverables:**
- Documentation index with all files categorized
- Session summaries organized by date
- Phase markers archived

**Time Estimate:** 4-6 hours

---

### Phase 2: Consolidate Major Topics (Week 2)

**Goal:** Reduce redundancy in highly fragmented areas

#### Task 2.1: Consolidate Deployment Documentation

**Current:** 34 documents mention deployment
**Target:** Single authoritative guide + supplements

**Actions:**
1. Review all deployment-related docs
2. Consolidate into:
   - `/docs/deployment/README.md` (primary guide)
   - `/docs/deployment/railway.md` (Railway specifics)
   - `/docs/deployment/vercel.md` (Vercel specifics)
   - `/docs/deployment/pre-deployment-checklist.md`
   - `/docs/deployment/post-deployment-checklist.md`
3. Archive feature-specific deployment docs:
   - Move to `/docs/archive/deployment-milestones/`
   - Create README explaining supersession
4. Update CURRENT_STATE.md deployment section to reference new structure

**Time Estimate:** 8-10 hours

#### Task 2.2: Consolidate Persona Documentation

**Current:** 11+ documents cover persona system
**Target:** Single comprehensive guide

**Actions:**
1. Create `/docs/features/personas.md`
2. Consolidate content from:
   - TrialForge_Juror_Persona_Matching_PRD.md (requirements section)
   - JUROR_PERSONA_MATCHING_IMPLEMENTATION_PLAN.md (implementation details)
   - JUROR_PERSONA_MATCHING_METHOD.md (algorithm explanation)
   - PERSONA_V2_QUICKSTART.md (quick reference)
   - PERSONA_STORAGE_AND_EXPORT.md (storage details)
   - PERSONA_HEADSHOT_DISPLAY_PLAN.md (display implementation)
   - All docs/PERSONA_* files (V2 migration details)
3. Structure new document:
   - Overview & Purpose
   - V1 vs V2 Architecture
   - Implementation Details
   - Storage & Export
   - Image Generation & Display
   - Migration Guide (V1 → V2)
   - API Reference
   - Troubleshooting
4. Archive original documents to `/docs/archive/persona-development/`
5. Update CURRENT_STATE.md and ai_instructions.md to reference new location

**Time Estimate:** 10-12 hours

#### Task 2.3: Consolidate Focus Groups Documentation

**Current:** 10+ documents cover focus groups/roundtable
**Target:** Single comprehensive guide

**Actions:**
1. Create `/docs/features/focus-groups.md`
2. Consolidate content from:
   - ROUNDTABLE_CONVERSATIONS.md (main guide)
   - FOCUS_GROUP_WIZARD_UX_ENHANCEMENTS.md (UI details)
   - FOCUS_GROUP_TESTING_GUIDE.md (testing)
   - FOCUS_GROUP_IMPROVEMENTS_PHASE_1.md (improvements)
   - FOCUS_GROUP_FUTURE_ENHANCEMENTS.md (roadmap)
   - ROUNDTABLE_DESIGN_UPDATES_IMPLEMENTATION_PLAN.md (design)
   - ROUNDTABLE_PERSONA_SUMMARY_PLAN.md (summary feature)
   - ROUNDTABLE_REPETITION_ANALYSIS.md (analysis)
3. Structure new document:
   - Overview & Purpose
   - User Workflow
   - Technical Architecture
   - UI Components
   - Testing Guide
   - Troubleshooting
   - Future Enhancements
4. Archive original documents to `/docs/archive/focus-group-development/`

**Time Estimate:** 8-10 hours

**Total Phase 2 Time:** 26-32 hours (1-1.5 weeks)

---

### Phase 3: Create Missing Essential Guides (Week 3)

**Goal:** Fill critical documentation gaps

#### Task 3.1: Create Troubleshooting Guide

**File:** `/docs/operations/troubleshooting.md`

**Sections:**
- Common Errors by Feature Area
- Database Connection Issues
- API Gateway Errors
- Railway Deployment Issues
- Vercel Deployment Issues
- Claude API Integration Problems
- Frontend Build Errors
- Performance Issues
- Authentication Problems

**Sources:**
- docs/CONSOLE_ERROR_FIXES.md
- Session summaries with bug fixes
- Known issues from CURRENT_STATE.md

**Time Estimate:** 6-8 hours

#### Task 3.2: Create API Reference

**File:** `/docs/reference/api-endpoints.md`

**Sections:**
- Authentication & Authorization
- Cases API
- Jurors API
- Personas API
- Focus Groups API
- Research & Synthesis API
- Document Capture API
- Chat API
- Prompt Management API

**Sources:**
- ai_instructions.md (endpoint listings)
- Service README files
- OpenAPI/Swagger definitions (if available)

**Time Estimate:** 8-10 hours

#### Task 3.3: Create Comprehensive Testing Guide

**File:** `/docs/development/testing.md`

**Sections:**
- Testing Philosophy
- Unit Testing
- Integration Testing
- E2E Testing
- AI Service Testing
- Performance Testing
- Load Testing
- Test Data Management
- CI/CD Integration

**Sources:**
- FOCUS_GROUP_TESTING_GUIDE.md
- docs/AI_TESTING_GUIDE.md
- docs/TESTING_PHASE_2.md
- Existing test files in codebase

**Time Estimate:** 6-8 hours

#### Task 3.4: Create Monitoring & Operations Guide

**File:** `/docs/operations/monitoring.md`

**Sections:**
- Performance Monitoring Setup
- Cost Tracking (Claude API)
- Error Tracking (Sentry)
- Uptime Monitoring
- Log Aggregation
- Alerting Configuration
- Dashboard Setup
- Incident Response

**Time Estimate:** 6-8 hours

#### Task 3.5: Create Security & Compliance Guide

**File:** `/docs/operations/security.md`

**Sections:**
- Authentication & Authorization
- Data Encryption
- Audit Logging
- Compliance Requirements
- SOC 2 Preparation
- Security Best Practices
- Vulnerability Management
- Incident Response

**Sources:**
- README.md security section
- SYSTEM_OVERVIEW.md security mentions
- Industry best practices

**Time Estimate:** 6-8 hours

**Total Phase 3 Time:** 32-42 hours (1-1.5 weeks)

---

### Phase 4: Organize & Polish (Week 4)

**Goal:** Finalize structure, update cross-references

#### Task 4.1: Create Directory READMEs

**Files to Create:**
- `/docs/getting-started/README.md`
- `/docs/architecture/README.md`
- `/docs/features/README.md`
- `/docs/deployment/README.md`
- `/docs/operations/README.md`
- `/docs/development/README.md`
- `/docs/reference/README.md`
- `/docs/session-summaries/README.md`

**Content:** Each README should:
- List documents in that directory
- Explain purpose of each document
- Recommended reading order
- Links to related sections

**Time Estimate:** 4-6 hours

#### Task 4.2: Create CHANGELOG.md

**File:** `/docs/CHANGELOG.md`

**Structure:**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

## [1.0.0] - 2026-01-31

### Added
- Initial production release
- [List major features from session summaries]

### Changed
- [List major changes]

## Historical Releases

See `/docs/session-summaries/` for detailed session-by-session changes.
```

**Time Estimate:** 3-4 hours

#### Task 4.3: Update DOCUMENTATION_INDEX.md

**File:** Root `/DOCUMENTATION_INDEX.md`

**Content:**
- Complete index of all documentation
- Reading paths for different personas (developer, architect, operator)
- Quick links to common tasks
- Status indicators (Active, Archived, Draft)
- Last updated dates
- Supersession relationships

**Time Estimate:** 3-4 hours

#### Task 4.4: Update Core Documents

**Files to Update:**
- CURRENT_STATE.md - Update documentation section
- ai_instructions.md - Update documentation references
- README.md - Update documentation links
- CLAUDE.md - Update documentation management instructions

**Actions:**
- Update all internal links to reflect new structure
- Add references to new guides
- Remove references to archived documents
- Ensure consistency across all core docs

**Time Estimate:** 4-6 hours

#### Task 4.5: Add Document Metadata

**Action:** Add standard header to all active documentation:

```markdown
# Document Title

**Status:** [Active|Archived|Draft]
**Last Updated:** YYYY-MM-DD
**Maintained By:** [Team/Person]
**Supersedes:** [List of docs]
**Superseded By:** [None | Document name]
**Related Docs:** [List]

---
```

**Files:** All documents in `/docs/` subdirectories (except archives)

**Time Estimate:** 4-6 hours

**Total Phase 4 Time:** 18-26 hours (3-4 days)

---

## Summary Timeline

| Phase | Duration | Hours | Key Deliverables |
|-------|----------|-------|------------------|
| **Phase 1: Triage** | Week 1 | 4-6 | Index, session summaries organized, phase markers archived |
| **Phase 2: Consolidate** | Week 2 | 26-32 | Deployment, personas, focus groups consolidated |
| **Phase 3: Create Missing** | Week 3 | 32-42 | Troubleshooting, API ref, testing, monitoring, security guides |
| **Phase 4: Polish** | Week 4 | 18-26 | Directory READMEs, changelog, updated core docs, metadata |
| **Total** | 4 weeks | 80-106 hours | Fully organized, comprehensive documentation system |

---

## Document Disposition Table

### Keep in Root (9 documents)

| Document | Reason |
|----------|--------|
| README.md | Entry point, project overview |
| CURRENT_STATE.md | Primary status hub |
| ai_instructions.md | Project structure reference |
| CLAUDE.md | AI assistant instructions |
| DOCUMENTATION_INDEX.md | Navigation hub (NEW) |
| TrialForge_AI_PRD.md | Move to docs/architecture/ |
| TrialForge_AI_Architecture.md | Move to docs/architecture/ |
| TrialForge_AI_Technical_Design.md | Move to docs/architecture/ |
| CHANGELOG.md | Move to docs/ (NEW) |

### Move to docs/getting-started/

| Current | New Location | Action |
|---------|--------------|--------|
| GETTING_STARTED.md | docs/getting-started/README.md | MOVE |
| DEVELOPER_GUIDE.md | docs/getting-started/developer-guide.md | MOVE |
| QUICK_DEMO.md | docs/getting-started/demo-guide.md | MOVE |
| DEMO_GUIDE.md | CONSOLIDATE into demo-guide.md | CONSOLIDATE |
| DEMO_README.md | CONSOLIDATE into demo-guide.md | CONSOLIDATE |

### Move to docs/architecture/

| Current | New Location | Action |
|---------|--------------|--------|
| TrialForge_AI_PRD.md | docs/architecture/prd.md | MOVE |
| TrialForge_AI_Architecture.md | docs/architecture/system-design.md | MOVE |
| TrialForge_AI_Technical_Design.md | docs/architecture/technical-design.md | MOVE |
| SYSTEM_OVERVIEW.md | CONSOLIDATE into system-design.md | CONSOLIDATE |

### Consolidate into docs/features/

| Documents to Consolidate | New Location | Count |
|--------------------------|--------------|-------|
| All persona docs | docs/features/personas.md | 11+ |
| All focus group/roundtable docs | docs/features/focus-groups.md | 10+ |
| DEEP_RESEARCH_TECHNICAL.md | docs/features/deep-research.md | 1 |
| DEEP_RESEARCH_GUIDE.md | CONSOLIDATE into deep-research.md | 1 |
| ARCHETYPE_SYSTEM_SUMMARY.md | docs/features/archetype-system.md | 1 |
| PHASE_4_COMPLETE.md | docs/features/ocr-capture.md | 1 |
| API_CHAT_SYSTEM.md | docs/features/api-chat.md | 1 |
| ADMIN_UTILITIES.md | docs/features/admin-utilities.md | 1 |

### Consolidate into docs/deployment/

| Documents to Consolidate | New Location | Count |
|--------------------------|--------------|-------|
| All deployment guides | docs/deployment/README.md | 34+ |
| RAILWAY_DEPLOYMENT.md | docs/deployment/railway.md | 1 |
| Feature-specific checklists | docs/deployment/pre-deployment-checklist.md | 12+ |

### Archive to docs/archive/

| Current | Archive Location | Category |
|---------|------------------|----------|
| All PHASE_*_COMPLETE.md | docs/archive/phase-completions/ | Phase markers |
| All feature-specific deployment docs | docs/archive/deployment-milestones/ | Deployment history |
| PROJECT_STATUS.md | docs/archive/ | Superseded by CURRENT_STATE |
| All interim planning docs | docs/archive/planning/ | Planning artifacts |

### Move to docs/session-summaries/

| Current | New Location |
|---------|--------------|
| SESSION_SUMMARY_2026-01-22.md | docs/session-summaries/2026-01/ |
| SESSION_SUMMARY_2026-01-22_FILEVINE_DOCUMENTS.md | docs/session-summaries/2026-01/ |
| SESSION_SUMMARY_2026-01-23_*.md (5 files) | docs/session-summaries/2026-01/ |
| SESSION_SUMMARY_2026-01-26_*.md (2 files) | docs/session-summaries/2026-01/ |
| SESSION_SUMMARY_2026-01-27_*.md (4 files) | docs/session-summaries/2026-01/ |
| SESSION_SUMMARY_2026-01-29_*.md (1 file) | docs/session-summaries/2026-01/ |
| SESSION_SUMMARY_PHASE_5_2026-01-27.md | docs/session-summaries/2026-01/ |

---

## Implementation Guidelines

### Before You Start

1. **Backup Everything:** Create a git branch for this cleanup work
2. **Read First:** Review all documents you plan to consolidate
3. **Track Changes:** Keep a log of what you move/consolidate
4. **Update Links:** Use find/replace to update cross-references
5. **Test Links:** Verify all markdown links work after moving files

### Consolidation Process

When consolidating multiple documents into one:

1. **Create Outline:**
   - List all sections from all source documents
   - Identify overlaps
   - Organize into logical structure

2. **Merge Content:**
   - Keep most recent/accurate information
   - Note contradictions and resolve them
   - Preserve code examples and screenshots
   - Combine similar sections

3. **Add Navigation:**
   - Table of contents for long documents
   - Cross-references to related docs
   - Links back to core docs (CURRENT_STATE.md)

4. **Update Metadata:**
   - Status: Active
   - Last Updated: Today's date
   - Supersedes: List of source documents

5. **Archive Sources:**
   - Move to appropriate archive subdirectory
   - Update archive README with supersession info
   - Keep note in new doc about archived sources

### Markdown Style Guide

**Headers:**
- Use ATX-style headers (`#`, `##`, `###`)
- One H1 per document (title)
- Don't skip header levels

**Links:**
- Use relative links for internal docs: `[text](../path/to/doc.md)`
- Use absolute URLs for external links
- Include link text that describes destination

**Code Blocks:**
- Use triple backticks with language identifier: ```typescript
- Use inline code for: file paths, variable names, commands

**Lists:**
- Use `-` for unordered lists
- Use `1.` for ordered lists (auto-numbering)
- Indent nested lists with 2 spaces

**Tables:**
- Use GitHub-flavored Markdown tables
- Include header separator row
- Align columns for readability in source

**Formatting:**
- **Bold** for emphasis and key terms
- *Italic* for slight emphasis or introducing terms
- `Code` for technical terms, file names, commands

---

## Success Metrics

**Quantitative Goals:**
- Reduce root directory markdown files from 94 to <15
- Consolidate deployment docs from 34 to 5-7
- Consolidate persona docs from 11+ to 1-2
- Consolidate focus group docs from 10+ to 1-2
- Create 7+ new essential guides (troubleshooting, API ref, testing, monitoring, security, migration, changelog)

**Qualitative Goals:**
- New developers can find what they need in <5 minutes
- Clear documentation hierarchy (core → specialized)
- No contradictory information across docs
- Every document has clear purpose and audience
- All cross-references work correctly
- AI agents can easily understand project state

**Validation:**
- Ask 2-3 people unfamiliar with the project to:
  1. Find how to set up local environment
  2. Find deployment instructions
  3. Find troubleshooting for a specific error
  4. Find information about a specific feature
- Should succeed in <5 minutes for each task

---

## Maintenance Strategy

### Documentation Owners

Assign ownership for each major documentation area:

| Area | Owner | Responsibilities |
|------|-------|------------------|
| Getting Started | [TBD] | Onboarding docs, developer guide |
| Architecture | [TBD] | PRD, system design, technical specs |
| Features | [TBD] | Feature guides, implementation details |
| Deployment | [TBD] | Deployment guides, checklists |
| Operations | [TBD] | Monitoring, troubleshooting, security |
| Reference | [TBD] | API docs, database schema, glossary |
| Changelog | [TBD] | Release notes, version tracking |

### Update Process

**When to Update Documentation:**
- ✅ After completing a major feature
- ✅ Before/after deployment
- ✅ When fixing bugs that affect documented behavior
- ✅ When adding new API endpoints
- ✅ When changing database schema
- ✅ When deprecating features
- ✅ Monthly review of CURRENT_STATE.md

**Update Checklist:**
1. Update relevant feature documentation
2. Update CURRENT_STATE.md if major change
3. Update ai_instructions.md if structure changes
4. Add entry to CHANGELOG.md
5. Update session summary if significant work
6. Check and update cross-references
7. Update "Last Updated" date in metadata

### Session Summary Guidelines

**When to Create Session Summary:**
- Major work session (4+ hours) with multiple changes
- Multiple bugs found and fixed
- Significant architectural decisions made
- Production deployment or hotfix
- Major feature completed

**Session Summary Format:**
```markdown
# Session Summary: [Date] - [Topic]

**Date:** YYYY-MM-DD
**Duration:** X hours
**Status:** [Completed|In Progress]

## Summary
[2-3 sentences describing what was accomplished]

## Changes Made
- [List of specific changes]

## Bugs Fixed
- [List of bugs with issue numbers if applicable]

## Decisions Made
- [Architectural or implementation decisions]

## Files Changed
- [Key files modified]

## Next Steps
- [What needs to happen next]

## Related Documentation
- [Links to updated docs]
```

### Quarterly Documentation Review

**Q1 Goals (Jan-Mar):**
- Execute this cleanup plan
- Establish documentation ownership
- Create missing essential guides

**Q2+ Goals (Apr onwards):**
- Review all documentation for accuracy
- Archive outdated session summaries (>3 months old)
- Update FEATURE_MATRIX.md
- Review and update CURRENT_STATE.md
- Check for broken links
- Identify new gaps

---

## Risks & Mitigation

### Risk: Breaking Existing Links

**Probability:** High
**Impact:** Medium
**Mitigation:**
- Use git branch for cleanup work
- Create redirect document in old locations pointing to new location
- Use find/replace to update internal references
- Test all links before merging
- Keep old files for 1 release cycle with "MOVED" notice

### Risk: Loss of Historical Context

**Probability:** Medium
**Impact:** Medium
**Mitigation:**
- Archive, don't delete
- Maintain comprehensive archive README
- Link archived docs from new consolidated docs
- Keep session summaries in dedicated directory
- Document supersession relationships clearly

### Risk: Incomplete Consolidation

**Probability:** Medium
**Impact:** High
**Mitigation:**
- Review all source documents completely
- Create outline before writing
- Have second person review consolidated docs
- Keep checklist of source docs to consolidate
- Track progress in project board

### Risk: Ongoing Documentation Drift

**Probability:** High
**Impact:** High
**Mitigation:**
- Assign documentation owners
- Include doc updates in PR checklist
- Monthly review of CURRENT_STATE.md
- Quarterly comprehensive review
- AI assistant reminders (CLAUDE.md)

### Risk: Time Overrun

**Probability:** Medium
**Impact:** Medium
**Mitigation:**
- Break into phases with clear deliverables
- Prioritize high-impact consolidations first
- Can pause after Phase 2 if needed
- Session summaries can wait (Phase 1 task)
- Essential guides can be created iteratively

---

## Conclusion

This documentation cleanup plan will transform the project's 121 documentation files into a well-organized, maintainable system. The phased approach allows for incremental progress while immediately delivering value (Phase 1 organizing session summaries and phase markers).

**Key Benefits:**
- **Reduced Cognitive Load:** Developers find what they need quickly
- **Better Onboarding:** Clear path from README → getting started → deep dives
- **Improved Maintenance:** Clear ownership and update process
- **Enhanced AI Agent Effectiveness:** Structured, non-redundant documentation
- **Scalability:** System can grow as project evolves

**Next Steps:**
1. Review and approve this plan
2. Assign Phase 1 tasks
3. Create git branch: `docs/cleanup-2026-01`
4. Begin Phase 1 execution
5. Track progress in project board

**Questions? Concerns?**
Review this plan and let's discuss before starting execution.

---

**Document Status:** Draft
**Author:** Claude Code Agent
**Date:** January 31, 2026
**Estimated Completion:** Late February 2026 (if 20-25 hrs/week allocated)
