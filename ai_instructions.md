# Juries by Filevine - Project Structure & AI Instructions

**Last Updated:** 2026-01-21
**Version:** 1.0.0

## Project Overview

Juries by Filevine is an AI-powered jury intelligence platform that helps legal teams optimize jury selection and craft persuasive arguments. The system uses Claude 4.5 models for AI capabilities and is built by Filevine.

## Deployment Architecture

- **Frontend:** Vercel (Next.js 14 with App Router)
- **Backend Services:** Railway (containerized microservices)
- **Database:** PostgreSQL on Railway
- **Cache/Queue:** Redis on Railway
- **AI Provider:** Anthropic Claude 4.5 via API
- **File Storage:** Vercel Blob or AWS S3
- **CDN:** Vercel Edge Network

**📘 See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for complete deployment guide**

## Repository Structure

```
Trials by Filevine/
├── ai_instructions.md              # THIS FILE - Project structure & directory map
├── CLAUDE.md                       # AI assistant instructions for documentation
├── RAILWAY_DEPLOYMENT.md           # Railway deployment guide & best practices (500+ lines)
├── RAILWAY_QUICK_START.md          # Quick reference for Railway deployment
├── DEPLOYMENT_SUMMARY.md           # Lessons learned and deployment strategy
├── Trials by Filevine_AI_PRD.md            # Product requirements document
├── Trials by Filevine_AI_Architecture.md   # System architecture document
├── Trials by Filevine_AI_Technical_Design.md # Technical specifications
│
├── apps/
│   ├── web/                        # Next.js 14 web application (Vercel)
│   │   ├── README.md               # Web app setup and structure
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router pages
│   │   │   ├── components/         # React components
│   │   │   ├── lib/                # Utilities and helpers
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   └── types/              # TypeScript type definitions
│   │   └── public/                 # Static assets
│   │
│   └── trial-mode-pwa/             # Progressive Web App for courtroom use
│       ├── README.md               # PWA setup and offline capabilities
│       └── src/                    # PWA-specific code with offline-first
│
├── services/
│   ├── api-gateway/                # Main API gateway (Node.js + Fastify)
│   │   ├── README.md               # API gateway documentation
│   │   ├── src/
│   │   │   ├── routes/             # API route definitions
│   │   │   ├── middleware/         # Auth, validation, rate limiting
│   │   │   ├── services/           # Business logic
│   │   │   └── config/             # Configuration management
│   │   └── Dockerfile              # Railway deployment
│   │
│   ├── case-service/               # Case management service
│   │   ├── README.md               # Case service API & data models
│   │   └── src/                    # CRUD for cases, facts, arguments
│   │
│   ├── jury-panel-service/         # Jury panel & juror management
│   │   ├── README.md               # Juror data models & operations
│   │   └── src/                    # Panel versioning, juror status
│   │
│   ├── research-service/           # Juror research orchestration
│   │   ├── README.md               # Research workflow & connectors
│   │   └── src/                    # Manages research artifacts
│   │
│   ├── persona-service/            # Persona library & mapping
│   │   ├── README.md               # Persona data models & AI integration
│   │   └── src/                    # Persona CRUD, juror-persona mapping
│   │
│   ├── trial-session-service/      # Trial recording & transcription
│   │   ├── README.md               # Audio handling & transcript management
│   │   └── src/                    # Session management, timestamp events
│   │
│   ├── focus-group-service/        # Focus group simulations
│   │   ├── README.md               # Simulation engine integration
│   │   └── src/                    # Session config, result storage
│   │
│   ├── auth-service/               # Authentication & authorization
│   │   ├── README.md               # JWT, RBAC, case-level ACL
│   │   └── src/                    # Auth0/Clerk integration
│   │
│   ├── collaboration-service/      # Real-time collaboration (WebSocket)
│   │   ├── README.md               # WebSocket events & presence
│   │   └── src/                    # Socket.io server, Redis pub/sub
│   │
│   └── notification-service/       # Notifications & alerts
│       ├── README.md               # Email, in-app, webhook dispatch
│       └── src/                    # Notification queue processing
│
├── ai-services/                    # Python AI/ML services
│   ├── identity-resolution/        # Juror identity matching
│   │   ├── README.md               # Match algorithm & confidence scoring
│   │   └── src/                    # Claude-powered identity resolution
│   │
│   ├── research-summarizer/        # Research artifact summarization
│   │   ├── README.md               # Extraction & signal detection
│   │   └── src/                    # Claude-based summarization
│   │
│   ├── persona-suggester/          # AI persona classification
│   │   ├── README.md               # Persona matching with explainability
│   │   └── src/                    # Claude 4.5 persona suggestion
│   │
│   ├── question-generator/         # Voir dire question generation
│   │   ├── README.md               # Question generation from case facts
│   │   └── src/                    # Claude-based question generation
│   │
│   ├── focus-group-engine/         # Jury simulation engine
│   │   ├── README.md               # Multi-persona simulation logic
│   │   └── src/                    # Claude-powered deliberation sim
│   │
│   └── trial-insight-engine/       # Real-time trial analysis
│       ├── README.md               # Transcript analysis & alerts
│       └── src/                    # Streaming transcript analysis
│
├── packages/                       # Shared packages (monorepo)
│   ├── database/                   # Database models & migrations
│   │   ├── README.md               # Schema documentation
│   │   ├── prisma/                 # Prisma schema & migrations
│   │   └── src/                    # Database client & utilities
│   │
│   ├── types/                      # Shared TypeScript types
│   │   ├── README.md               # Type definitions documentation
│   │   └── src/                    # Common types across services
│   │
│   ├── utils/                      # Shared utilities
│   │   ├── README.md               # Utility functions documentation
│   │   └── src/                    # Common helpers & utilities
│   │
│   └── ai-client/                  # Claude API client wrapper
│       ├── README.md               # AI service integration guide
│       └── src/                    # Anthropic SDK wrapper with retry logic
│
├── infrastructure/                 # Infrastructure as Code
│   ├── README.md                   # Deployment & infrastructure docs
│   ├── railway/                    # Railway configuration files
│   ├── vercel/                     # Vercel configuration
│   └── docker/                     # Dockerfiles for services
│
├── docs/                           # Additional documentation
│   ├── api/                        # API documentation
│   ├── architecture/               # Architecture diagrams
│   └── guides/                     # Developer guides
│
└── scripts/                        # Development & deployment scripts
    ├── README.md                   # Scripts documentation
    ├── setup-dev.sh                # Local development setup
    └── seed-data.ts                # Database seeding
```

## Directory Responsibilities

### Frontend Applications (`apps/`)

**`apps/web/`** - Main web application (Juries by Filevine)
- Next.js 14 with App Router and React Server Components
- Case management, jury research, focus groups, trial support
- Deployed to Vercel with Edge Functions
- Real-time updates via WebSocket connections

**`apps/trial-mode-pwa/`** - Progressive Web App for courtroom use
- Offline-first architecture with Service Workers
- Large touch targets, minimal typing, optimized for tablets
- Local audio recording with background sync
- IndexedDB for offline data storage

### Backend Services (`services/`)

**`services/api-gateway/`** - Main API Gateway
- Request routing to microservices
- JWT authentication & rate limiting
- Request/response validation
- CORS and security headers
- **Integrated AI Services (All Claude AI-powered):**
  - `ArchetypeClassifierService` - Classifies jurors into 10 behavioral archetypes ✅
    - POST `/api/archetypes/classify/juror`
    - Returns primary/secondary archetype with confidence scores
    - Includes 8 psychological dimension scores, danger levels, voir dire questions
    - 10 Archetypes: Bootstrapper, Crusader, Scale-Balancer, Captain, Chameleon, Scarred, Calculator, Heart, Trojan Horse, Maverick
  - `PersonaSuggesterService` - Analyzes juror data, suggests matching personas
    - POST `/api/personas/suggest`
    - Returns top 3 suggestions with confidence, reasoning, key matches, concerns
  - `ResearchSummarizerService` - Extracts persona signals from research artifacts
    - POST `/api/research/summarize` - Summarize specific artifacts
    - POST `/api/research/batch-summarize` - Process all pending research
    - Identifies themes, sentiment, concerns from social/professional research
  - `QuestionGeneratorService` - Generates strategic voir dire questions
    - POST `/api/cases/:id/generate-questions`
    - 4 categories: opening, persona identification, case-specific, challenge for cause
    - Includes follow-ups, listening guidance, red flags, ideal answers
  - `FocusGroupEngineService` - Simulates jury focus groups
    - POST `/api/focus-groups/simulate`
    - 3 modes: quick, detailed, deliberation
    - Generates persona reactions, deliberation discussions, recommendations
  - `JurorSynthesisService` - Deep research synthesis with web search ✅ **TESTED**
    - POST `/api/candidates/:candidateId/synthesize` - Start synthesis
    - GET `/api/candidates/:candidateId/synthesis` - Poll status
    - GET `/api/synthesis/:profileId` - Get full profile
    - Uses Claude 4 Sonnet with web_search tool (up to 10 searches)
    - Comprehensive profile: demographics, attitudes, affiliations, litigation relevance
    - Strategic voir dire recommendations with severity ratings
    - Async processing (10-60 seconds) with event emission
    - Data quality assessment (sparse/moderate/comprehensive)
    - Context-based caching for performance optimization
    - Full integration with identity resolution workflow
    - See: `DEEP_RESEARCH_TECHNICAL.md` for complete implementation details
  - `OCRService` - Document capture and OCR processing ✅
    - POST `/api/cases/:caseId/captures` - Create capture and upload image
    - POST `/api/captures/:captureId/process` - Trigger OCR processing
    - GET `/api/captures/:captureId` - Get capture status and results
    - POST `/api/captures/:captureId/confirm` - Create jurors from extractions
    - GET `/api/cases/:caseId/captures` - List all captures for case
    - Uses Claude 3.5 Sonnet Vision API for document analysis
    - Extracts juror information from photos of jury lists, questionnaires
    - Confidence scoring (0-100) for each extraction
    - Supports multiple document types (panel_list, questionnaire, jury_card, other)
    - Async processing with frontend polling pattern

**`services/case-service/`** - Case Management
- CRUD operations for cases, facts, arguments, witnesses
- Argument versioning with changelog
- Case status management

**`services/jury-panel-service/`** - Jury Panel Management
- Juror CRUD operations
- Panel import (CSV/manual)
- Juror status tracking (available → questioned → struck/seated)
- Strike/keep priority management

**`services/research-service/`** - Research Orchestration
- Initiates research jobs for jurors
- Manages research artifact storage
- Coordinates identity matching workflow
- User confirmation/rejection handling

**`services/persona-service/`** - Persona Library
- System, AI-generated, and user-created personas
- Juror-to-persona mapping with confidence scores
- AI suggestion acceptance/override tracking

**`services/trial-session-service/`** - Trial Recording
- Audio session management
- Transcript storage and retrieval
- User timestamp markers
- Session status tracking

**`services/focus-group-service/`** - Focus Group Simulations
- Simulation session configuration
- Persona panel selection
- Result and recommendation storage

**`services/auth-service/`** - Authentication
- JWT token management (Auth0/Clerk integration)
- RBAC (Admin, Attorney, Paralegal, Consultant)
- Case-level access control lists

**`services/collaboration-service/`** - Real-time Features
- WebSocket server (Socket.io)
- User presence tracking
- Real-time event broadcasting
- Redis pub/sub for multi-instance coordination

**`services/notification-service/`** - Notifications
- Email notifications
- In-app notification delivery
- Alert dispatching

### AI Services (`ai-services/`)

All AI services are Python FastAPI applications that integrate with Claude 4.5 models.

**`ai-services/identity-resolution/`** - Juror Identity Matching
- Input: Juror name, age, location + candidate profiles
- Output: Match confidence, rationale, matching features
- Uses Claude for intelligent disambiguation

**`ai-services/research-summarizer/`** - Research Summarization
- Input: Raw research artifacts (social, professional, public records)
- Output: Structured signals with provenance and citations
- Extracts persona-relevant signals

**`ai-services/persona-suggester/`** - Persona Classification
- Input: Juror profile (research + questionnaire + voir dire responses)
- Output: Persona matches with confidence, rationale, counterfactual
- Supports multi-persona assignment

**`ai-services/question-generator/`** - Voir Dire Questions
- Input: Case facts, target personas, jurisdiction constraints
- Output: Strategic questions with follow-up trees
- Generates "what to listen for" guidance

**`ai-services/focus-group-engine/`** - Jury Simulation
- Input: Arguments + selected persona panel
- Output: Per-persona reactions, concerns, verdict leans
- Simulates deliberation with persona interactions

**`ai-services/trial-insight-engine/`** - Trial Analysis
- Input: Transcript stream + seated jury personas + case themes
- Output: Tagged moments, alerts, follow-up suggestions
- Real-time testimony analysis

### Shared Packages (`packages/`)

**`packages/database/`** - Database Layer
- Prisma schema definitions
- Database migrations
- Type-safe database client
- Seed scripts

**`packages/types/`** - Shared Types
- TypeScript interfaces for API contracts
- Shared domain models
- Event schemas

**`packages/utils/`** - Shared Utilities
- Date/time helpers
- Validation functions
- Common formatters

**`packages/ai-client/`** - Claude API Client
- Anthropic SDK wrapper
- Retry logic and error handling
- Response format standardization
- Model versioning support

### Infrastructure (`infrastructure/`)

**`infrastructure/railway/`** - Railway Configuration
- Service definitions
- Environment variable templates
- Database configuration

**`infrastructure/vercel/`** - Vercel Configuration
- `vercel.json` configuration
- Environment variable setup
- Edge function configuration

**`infrastructure/docker/`** - Docker Images
- Dockerfiles for each service
- Multi-stage builds for optimization
- Base images for consistency

## Technology Stack Summary

### Frontend
- **Framework:** Next.js 14 (App Router, React Server Components)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI, shadcn/ui
- **State Management:** React Context, Zustand
- **Real-time:** Socket.io-client
- **Forms:** React Hook Form + Zod validation

### Backend (Node.js Services)
- **Framework:** Fastify
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Validation:** Zod
- **Authentication:** Auth0 SDK or Clerk
- **WebSocket:** Socket.io

### AI Services (Python)
- **Framework:** FastAPI
- **Language:** Python 3.11+
- **AI SDK:** Anthropic Python SDK
- **HTTP Client:** httpx
- **Validation:** Pydantic

### Infrastructure
- **Database:** PostgreSQL 16 (with pgvector extension)
- **Cache:** Redis 7
- **Queue:** RabbitMQ or Railway-managed queues
- **File Storage:** Vercel Blob or S3
- **Monitoring:** Railway logs, Sentry for errors

## Critical Package Dependencies

### Monorepo Packages (Internal)
**Build Order:** database → ai-client → utils → types → services

1. **`@juries/database`** - Prisma client and database utilities
   - Dependencies: `@prisma/client@^5.8.1`, `typescript@^5.3.3`
   - Must be built FIRST (generates Prisma client)

2. **`@juries/ai-client`** - Claude API wrapper
   - Dependencies: `@anthropic-ai/sdk@^0.71.2`, `@juries/types`
   - Must use SDK version `0.71.2+` for `/resources` exports

3. **`@juries/utils`** - Shared utilities
   - Dependencies: Minimal (TypeScript only)

4. **`@juries/types`** - Shared TypeScript types
   - Dependencies: None (pure types)

### Service Dependencies

**API Gateway** (`services/api-gateway`)
- `fastify@^4.26.0` - Web framework
- `@fastify/jwt@^8.0.0` - JWT authentication (v8 for Fastify v4)
- `@fastify/cors@^9.0.1`
- `@fastify/helmet@^11.1.1`
- `@anthropic-ai/sdk@^0.71.2` - Must match ai-client version
- `@juries/database`, `@juries/ai-client`, `@juries/types`, `@juries/utils`

**Notification Service** (`services/notification-service`)
- `fastify@^4.26.0`
- `@fastify/jwt@^8.0.0` - **MUST be v8.x for Fastify v4 compatibility**
- `ioredis@^5.3.2` - Redis client (supports Railway env vars)
- `resend@^3.2.0` - Email provider (optional)
- `@juries/database`, `@juries/types`

### Version Compatibility Matrix

| Package | API Gateway | Notification | ai-client | Notes |
|---------|-------------|--------------|-----------|-------|
| `fastify` | 4.26.0 | 4.26.0 | - | v4.x required |
| `@fastify/jwt` | 8.0.0 | 8.0.0 | - | **v8 for Fastify v4, v10 needs v5** |
| `@anthropic-ai/sdk` | 0.71.2 | - | 0.71.2 | **Must match across packages** |
| `@prisma/client` | 5.8.1 | 5.8.1 | - | Generated, keep in sync |

### Common Dependency Issues

1. **Fastify Plugin Version Mismatch**
   - Error: `fastify-plugin: @fastify/jwt - expected '5.x' fastify version, '4.x' is installed`
   - Fix: Use `@fastify/jwt@^8.0.0` with Fastify v4.x

2. **Anthropic SDK Version Mismatch**
   - Error: `Cannot find module '@anthropic-ai/sdk/resources'`
   - Fix: Update to `@anthropic-ai/sdk@^0.71.2` in all packages

3. **TypeScript Output Path Issues**
   - Without `rootDir`: Output goes to `dist/services/*/src/`
   - Start commands must match: `node dist/services/{service}/src/index.js`

4. **Prisma Client Not Generated**
   - Always run `npx prisma generate` before building services
   - Build order matters: database package must build first

## Environment Variables Structure

Each service maintains its own `.env` file. See individual service `README.md` files for specific variables.

### Common Variables Across Services
```
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Auth
AUTH0_DOMAIN=...
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...

# AI Services
ANTHROPIC_API_KEY=...
AI_MODEL_VERSION=claude-4.5-sonnet-latest

# Service URLs (Railway internal)
API_GATEWAY_URL=...
CASE_SERVICE_URL=...
# ... etc
```

## Development Workflow

1. **Initial Setup:** Run `scripts/setup-dev.sh` to install dependencies
2. **Database:** Use Prisma migrations in `packages/database`
3. **Local Dev:** Each service has `npm run dev` or `python -m uvicorn`
4. **Testing:** Each service has its own test suite
5. **Deployment:** Push to main triggers Railway/Vercel deploys
   - See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for Railway-specific configuration
   - Services use explicit build order: database → utils → service
   - Watch paths configured per service to trigger targeted deployments

## Key Architectural Patterns

1. **Multi-Tenancy:** All queries filtered by `organization_id`
2. **Event-Driven:** Services communicate via events (RabbitMQ)
3. **API Versioning:** All endpoints include `/v1/` in path
4. **AI Response Format:** Standard structure with confidence, rationale, sources
5. **Offline-First:** PWA uses IndexedDB with background sync
6. **Audit Trail:** All actions logged to immutable audit log

## Implementation Status

### ✅ Completed
1. **Monorepo Setup** - Turborepo with npm workspaces configured
2. **Database Layer** (`packages/database`) - Prisma schema with 16 models, migrations, seed data
3. **Shared Packages:**
   - `@juries/types` - Shared TypeScript types
   - `@juries/database` - Prisma client wrapper
   - `@juries/ai-client` - Claude AI client wrapper
4. **Next.js Web App** (`apps/web`) - Full application with:
   - Authentication system (JWT, login, protected routes)
   - Dashboard with real data from API
   - Jurors list and detail pages
   - PersonaSuggester component with AI integration
   - Filevine design system (Tailwind config, custom colors, components)
5. **API Gateway** (`services/api-gateway`) - Fastify server with:
   - JWT authentication middleware
   - Complete REST API: cases, jurors, personas, research, focus groups
   - All AI services integrated and functional
6. **Complete AI Service Suite:**
   - **ArchetypeClassifierService** - Classifies jurors into 10 behavioral archetypes ✅
     - Fully integrated with Claude 4.5 Sonnet API
     - Rich UI showing archetype match, confidence, psychological dimensions
     - Strategic recommendations with plaintiff/defense danger levels
     - Cause challenge questions and voir dire guidance
   - **PersonaSuggesterService** - Analyzes jurors, suggests matching personas ✅
   - **ResearchSummarizerService** - Extracts signals from research artifacts ✅
   - **QuestionGeneratorService** - Generates strategic voir dire questions ✅
   - **FocusGroupEngineService** - Simulates jury focus groups with deliberation ✅
   - **JurorSynthesisService** - Deep research with Claude web search ✅ **TESTED**
     - Synthesizes candidate data into comprehensive profiles
     - Uses Claude 4 Sonnet with web_search tool (up to 10 searches)
     - Async processing (10-60 seconds) with event emission
     - Structured output: profile, attitudes, litigation relevance, voir dire recommendations
     - Data quality assessment and confidence scoring
     - Context-based caching, full UI integration, production-ready
     - See `DEEP_RESEARCH_TECHNICAL.md` for implementation details
   - All services support mock fallback for development without API key
   - UI displays AI suggestions with visual confidence indicators
   - Persona mapping, research analysis, and focus groups save to database

### ✅ Phase 4 Complete - Document Capture & OCR
1. **OCR Service** - Claude Vision API integration for document analysis
2. **Capture API Routes** - Complete workflow: upload → process → review → confirm
3. **Document Capture Modal** - 4-step wizard (select type → upload → process → review)
4. **Editable Review Interface** - Inline editing with confidence indicators
5. **Integration with Case Page** - "Capture Document" button with camera icon
6. **Multiple Document Types** - Jury lists, questionnaires, jury cards, handwritten notes
7. **Confidence Scoring** - 0-100 scale with automatic review flagging
8. **Base64 Image Storage** - Temporary solution (production will use Vercel Blob/S3)

### ✅ Phase 5 Complete - Deep Research Synthesis
1. **JurorSynthesisService** - Complete backend service with Claude web search integration
2. **Synthesis API Routes** - 3 endpoints: start synthesis, poll status, get profile
3. **DeepResearch Component** - Full frontend with polling, error handling, rich UI
4. **Database Schema** - SynthesizedProfile model with all metrics
5. **Context-Based Caching** - SHA256 hash for cache invalidation on context changes
6. **Identity Resolution Integration** - Automatic appearance after candidate confirmation
7. **Comprehensive Testing** - Test script validates end-to-end workflow
8. **User Documentation** - DEEP_RESEARCH_GUIDE.md with usage instructions
9. **Technical Documentation** - DEEP_RESEARCH_TECHNICAL.md with implementation details
10. **Bug Fixes** - Resolved candidate ID issues and React Query cache synchronization
11. **Production Ready** - Error handling, logging, performance optimization complete

### 🚧 In Progress / Next Steps
1. Test document capture end-to-end with real images
2. Integrate Vercel Blob or AWS S3 for production image storage
3. Add thumbnail generation for captures
4. Create trial mode PWA for courtroom use
5. Add real-time collaboration features (WebSocket - Phase 5)
6. Implement comprehensive audit logging system
7. Deploy to Railway (backend) and Vercel (frontend)
8. Set up monitoring and error tracking (Sentry)
9. Add bulk archetype classification for entire jury panels
10. Implement archetype comparison views and panel composition analysis

## Important Notes

- **Security:** Never commit `.env` files; use `.env.example` templates
- **Documentation:** Update this file when adding/removing directories
- **Testing:** Each service must have unit tests before deployment
- **AI Costs:** Monitor Anthropic API usage; implement caching strategies
- **Compliance:** All research must be no-contact, publicly accessible only
