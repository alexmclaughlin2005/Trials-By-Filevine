# Claude AI Assistant Instructions

## Documentation Management Protocol

### Documentation Structure
This project maintains a hierarchical documentation system:

1. **Top-Level Documentation** (`ai_instructions.md`)
   - Contains complete app structure and directory map
   - Explains purpose and responsibilities of each directory
   - Serves as the primary reference for understanding project organization
   - MUST be updated whenever directories are added/removed/restructured

2. **Service/Directory-Level Documentation** (each directory has `README.md`)
   - Specific implementation details for that service/module
   - API contracts, data models, and dependencies
   - Local setup and testing instructions
   - MUST be updated when significant changes are made to that service

### My Responsibilities

1. **Before Making Changes:**
   - Read `ai_instructions.md` to understand current project structure
   - Read relevant directory `README.md` files for context
   - Verify changes align with architectural decisions in PRD/Architecture docs

2. **After Making Changes:**
   - Update `ai_instructions.md` if directory structure changes
   - Update relevant `README.md` files with implementation details
   - Ensure documentation reflects actual code state

3. **When Creating New Services/Directories:**
   - Create a `README.md` in the new directory immediately
   - Update `ai_instructions.md` with the new directory entry
   - Document purpose, responsibilities, and key interfaces

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
- [ ] Update `ai_instructions.md` if structure changed
- [ ] Update relevant service `README.md` files
- [ ] Ensure documentation matches code reality
- [ ] Include setup instructions for new services
- [ ] Document environment variables and configuration
