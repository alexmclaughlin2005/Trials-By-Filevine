# TrialForge AI - Project Structure & AI Instructions

**Last Updated:** 2026-01-21
**Version:** 1.0.0

## Project Overview

TrialForge AI is an AI-powered trial preparation and jury intelligence platform that helps legal teams optimize jury selection and craft persuasive arguments. The system uses Claude 4.5 models for AI capabilities.

## Deployment Architecture

- **Frontend:** Vercel (Next.js 14 with App Router)
- **Backend Services:** Railway (containerized microservices)
- **Database:** PostgreSQL on Railway
- **Cache/Queue:** Redis on Railway
- **AI Provider:** Anthropic Claude 4.5 via API
- **File Storage:** Vercel Blob or AWS S3
- **CDN:** Vercel Edge Network

## Repository Structure

```
Trials by Filevine/
├── ai_instructions.md              # THIS FILE - Project structure & directory map
├── claude.md                        # AI assistant instructions for documentation
├── TrialForge_AI_PRD.md            # Product requirements document
├── TrialForge_AI_Architecture.md   # System architecture document
├── TrialForge_AI_Technical_Design.md # Technical specifications
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

**`apps/web/`** - Main web application
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

## Key Architectural Patterns

1. **Multi-Tenancy:** All queries filtered by `organization_id`
2. **Event-Driven:** Services communicate via events (RabbitMQ)
3. **API Versioning:** All endpoints include `/v1/` in path
4. **AI Response Format:** Standard structure with confidence, rationale, sources
5. **Offline-First:** PWA uses IndexedDB with background sync
6. **Audit Trail:** All actions logged to immutable audit log

## Next Steps for Initial Setup

1. Initialize monorepo structure (Turborepo or npm workspaces)
2. Set up `packages/database` with Prisma schema
3. Create base Next.js app in `apps/web`
4. Set up API gateway with auth middleware
5. Create first AI service (persona-suggester) as template
6. Configure Railway project with PostgreSQL and Redis
7. Set up Vercel project for frontend deployment

## Important Notes

- **Security:** Never commit `.env` files; use `.env.example` templates
- **Documentation:** Update this file when adding/removing directories
- **Testing:** Each service must have unit tests before deployment
- **AI Costs:** Monitor Anthropic API usage; implement caching strategies
- **Compliance:** All research must be no-contact, publicly accessible only
