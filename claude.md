# Claude AI Assistant Instructions

## Documentation Management Protocol

### Documentation Structure
This project maintains a hierarchical documentation system:

1. **Top-Level Status Documentation**
   - `CURRENT_STATE.md` - **⭐ START HERE** - Complete current state, feature breakdown, and roadmap
   - `PROJECT_STATUS.md` - Phase completion status and next steps
   - `ai_instructions.md` - Complete app structure and directory map
   - `README.md` - Project overview and quick start
   - **When to Update:** After major features complete, before/after deployment, when priorities shift

2. **Feature Documentation**
   - `DEEP_RESEARCH_TECHNICAL.md` - Deep research implementation (500+ lines)
   - `ARCHETYPE_SYSTEM_SUMMARY.md` - Archetype classification system
   - `PHASE_4_COMPLETE.md` - Document capture & OCR
   - `QUICK_DEMO.md` - Demo script for presentations
   - **When to Update:** When features are added/changed, or demo flow changes

3. **Service/Directory-Level Documentation** (each directory has `README.md`)
   - Specific implementation details for that service/module
   - API contracts, data models, and dependencies
   - Local setup and testing instructions
   - **When to Update:** When significant changes are made to that service

4. **Session Notes** (date-stamped)
   - `SESSION_SUMMARY_2026-01-22.md` - Example: Testing session and bug fixes
   - **When to Create:** For major work sessions with multiple changes, bug fixes, or decisions
   - **Purpose:** Track progress, document bugs found/fixed, capture decisions made

### My Responsibilities

1. **Before Making Changes:**
   - Read `CURRENT_STATE.md` to understand current features and priorities
   - Read `ai_instructions.md` to understand project structure
   - Read relevant directory `README.md` files for context
   - Verify changes align with architectural decisions in PRD/Architecture docs

2. **After Making Changes:**
   - Update `CURRENT_STATE.md` if major features completed or priorities changed
   - Update `PROJECT_STATUS.md` with phase progress
   - Update `ai_instructions.md` if directory structure changes
   - Update relevant `README.md` files with implementation details
   - Update `QUICK_DEMO.md` if user workflows changed
   - Create session summary if multiple changes made
   - Ensure documentation reflects actual code state

3. **When Creating New Services/Directories:**
   - Create a `README.md` in the new directory immediately
   - Update `ai_instructions.md` with the new directory entry
   - Update `CURRENT_STATE.md` if it's a major feature
   - Document purpose, responsibilities, and key interfaces

4. **After Major Milestones:**
   - Create comprehensive session summary document
   - Update all top-level status documents
   - Review and update feature documentation
   - Ensure roadmap reflects current priorities

### Project Context

- **Frontend Hosting:** Vercel (Next.js)
- **Backend Hosting:** Railway (Node.js/Python services)
- **AI Provider:** Claude 4.5 models (Anthropic API)
- **Database:** PostgreSQL (Railway managed)
- **Architecture:** Microservices-based, event-driven

### Key Architectural Principles

1. **Security First:** Encryption, audit logs, SOC 2 compliance path
2. **Offline Resilient:** PWA with local-first data entry
3. **AI as Services:** Versioned ML services with explainability
4. **Multi-Tenant:** Strict data isolation via organization_id
5. **Event-Driven:** Async processing with message queues

### Technology Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend Services:** Node.js + Fastify (API), Python + FastAPI (AI)
- **Database:** PostgreSQL 16 with pgvector
- **Cache/Queue:** Redis, RabbitMQ or Railway-managed queues
- **Auth:** Auth0 or Clerk
- **AI Integration:** Anthropic Claude API via SDKs

### Documentation Updates Checklist

When I make changes, I will:
- [ ] Read `CURRENT_STATE.md` first to understand context
- [ ] Update `CURRENT_STATE.md` if major features completed
- [ ] Update `PROJECT_STATUS.md` with phase progress
- [ ] Update `ai_instructions.md` if structure changed
- [ ] Update relevant service `README.md` files
- [ ] Update `QUICK_DEMO.md` if workflows changed
- [ ] Create session summary for major work sessions
- [ ] Ensure documentation matches code reality
- [ ] Include setup instructions for new services
- [ ] Document environment variables and configuration

### Documentation Quick Reference

**For AI Assistants:**
- **Start Here:** Read [CURRENT_STATE.md](CURRENT_STATE.md) to understand current state
- **Project Structure:** See [ai_instructions.md](ai_instructions.md)
- **Recent Work:** Check [SESSION_SUMMARY_*.md](SESSION_SUMMARY_2026-01-22.md) files
- **Deployment:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**For Developers:**
- **Getting Started:** See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- **Quick Demo:** See [QUICK_DEMO.md](QUICK_DEMO.md)
- **System Overview:** See [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)

**For Product/Business:**
- **Current Status:** See [CURRENT_STATE.md](CURRENT_STATE.md)
- **Phase Status:** See [PROJECT_STATUS.md](PROJECT_STATUS.md)
- **Demo Script:** See [QUICK_DEMO.md](QUICK_DEMO.md)

When making changes that involve new prompts, use the prompt/seed endpoint to create/update the admin tool for prompt seeding in the prod database.