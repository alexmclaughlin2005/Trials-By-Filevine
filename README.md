# Trials by Filevine AI

AI-Powered Trial Preparation & Jury Intelligence Platform

> Empower trial attorneys with AI-driven insights that transform jury selection from art to science and trial strategy from guesswork to precision.

## Overview

Trials by Filevine AI is a comprehensive platform that helps legal teams:
- **Automate juror research** - Reduce manual research time by 80%
- **Map juror personas** - AI-powered behavioral classification
- **Test trial arguments** - Simulate jury deliberations before trial
- **Generate voir dire questions** - Strategic questions based on case facts
- **Provide real-time trial support** - Live analysis during proceedings

## Technology Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS (Vercel)
- **Backend:** Node.js, Fastify, TypeScript (Railway)
- **AI Services:** Python, FastAPI, Claude 4.5 (Railway)
- **Database:** PostgreSQL 16 with pgvector (Railway)
- **Cache/Queue:** Redis (Railway)
- **AI Provider:** Anthropic Claude 4.5 Sonnet

## Project Structure

```
trialforge-ai/
├── apps/                    # Frontend applications
│   ├── web/                # Main web app (Next.js)
│   └── trial-mode-pwa/     # Courtroom PWA
├── services/               # Backend microservices (Node.js)
│   ├── api-gateway/
│   ├── case-service/
│   ├── jury-panel-service/
│   └── ...
├── ai-services/           # AI/ML services (Python)
│   ├── persona-suggester/
│   ├── question-generator/
│   └── ...
├── packages/              # Shared packages
│   ├── database/         # Prisma schema & migrations
│   ├── types/           # TypeScript types
│   ├── utils/           # Shared utilities
│   └── ai-client/       # Claude API wrapper
└── infrastructure/       # Deployment configs
    ├── railway/
    └── vercel/
```

See [ai_instructions.md](./ai_instructions.md) for detailed directory structure and responsibilities.

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Python 3.11+ (for AI services)
- PostgreSQL 16+ (local or hosted)
- Redis 7+ (local or hosted)
- Anthropic API key ([get one here](https://console.anthropic.com))

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trialforge-ai
   ```

2. **Run setup script**
   ```bash
   ./scripts/setup-dev.sh
   ```

   This will:
   - Check Node.js and Python versions
   - Install dependencies
   - Create `.env.local` from template
   - Initialize Prisma
   - Set up Python virtual environment

3. **Configure environment variables**

   Edit `.env.local` with your actual values:
   ```env
   DATABASE_URL="postgresql://..."
   REDIS_URL="redis://..."
   ANTHROPIC_API_KEY="sk-ant-..."
   AUTH0_DOMAIN="..."
   AUTH0_CLIENT_ID="..."
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Seed database (optional)**
   ```bash
   npm run db:seed
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Web App: http://localhost:3000
   - API Docs: http://localhost:3000/api/docs

## Development

### Monorepo Commands

```bash
# Run all services in development mode
npm run dev

# Build all services
npm run build

# Run tests
npm run test

# Lint all code
npm run lint

# Format code
npm run format

# Database commands
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database
```

### Working with Services

Each service can be run independently:

```bash
# Run a specific service
cd services/api-gateway
npm run dev

# Run an AI service
cd ai-services/persona-suggester
source .venv/bin/activate
uvicorn src.main:app --reload
```

### Working with Packages

Shared packages are in `packages/`:

```bash
# Update database schema
cd packages/database
# Edit prisma/schema.prisma
npx prisma migrate dev --name add_field
npx prisma generate
```

## Deployment

### Frontend (Vercel)

The web application deploys automatically to Vercel:
- **Production:** Push to `main` → `app.trialforge.ai`
- **Preview:** Pull requests → `pr-123.vercel.app`

See [infrastructure/vercel/README.md](./infrastructure/vercel/README.md) for details.

### Backend (Railway)

Services deploy to Railway:
- PostgreSQL and Redis are managed services
- Each microservice runs in its own container
- Internal networking between services

See [infrastructure/railway/README.md](./infrastructure/railway/README.md) for details.

## Documentation

### Getting Started
- **[CURRENT_STATE.md](./CURRENT_STATE.md)** ⭐ **START HERE** - Complete current state, feature breakdown, and roadmap
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Comprehensive setup guide
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Developer quick reference
- **[QUICK_DEMO.md](./QUICK_DEMO.md)** - 5-minute demo script

### System Documentation
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Phase completion status and next steps
- **[SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)** - Complete system documentation
- **[ai_instructions.md](./ai_instructions.md)** - Complete project structure and AI assistant instructions
- **[claude.md](./claude.md)** - Documentation management protocol for AI assistants

### Architecture & Design
- **[TrialForge_AI_PRD.md](./TrialForge_AI_PRD.md)** - Product requirements
- **[TrialForge_AI_Architecture.md](./TrialForge_AI_Architecture.md)** - System architecture
- **[TrialForge_AI_Technical_Design.md](./TrialForge_AI_Technical_Design.md)** - Technical specifications

### Deployment
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Primary deployment guide
- **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** - Railway-specific deep dive

### Feature Documentation
- **[DEEP_RESEARCH_TECHNICAL.md](./DEEP_RESEARCH_TECHNICAL.md)** - Deep Research implementation (500+ lines)
- **[ARCHETYPE_SYSTEM_SUMMARY.md](./ARCHETYPE_SYSTEM_SUMMARY.md)** - Complete archetype guide
- **[PHASE_4_COMPLETE.md](./PHASE_4_COMPLETE.md)** - Document capture & OCR implementation

### Service Documentation
Each service has its own README:
- [apps/web/README.md](./apps/web/README.md) - Web application
- [services/api-gateway/README.md](./services/api-gateway/README.md) - API gateway
- [ai-services/persona-suggester/README.md](./ai-services/persona-suggester/README.md) - Persona AI service
- [packages/database/README.md](./packages/database/README.md) - Database package
- [packages/ai-client/README.md](./packages/ai-client/README.md) - Claude API client

### Archived Documentation
Historical documentation has been moved to [docs/archive/](./docs/archive/) to reduce clutter. This includes:
- Phase completion documents (Phases 2-3)
- Deployment milestone markers
- Setup completion markers
- Superseded setup and deployment guides

See [docs/archive/README.md](./docs/archive/README.md) for a complete list and information about what superseded each archived document.

## Architecture Highlights

### Multi-Tenant
- Strict data isolation via `organization_id`
- Row-level security in PostgreSQL
- Case-level access control

### Event-Driven
- Async processing via message queues
- Real-time updates via WebSockets
- Background research and AI processing

### AI-First
- All AI services return structured responses
- Confidence scores and explainability
- Counterfactual reasoning
- Source citations with provenance

### Offline-Capable
- PWA with Service Workers
- Local-first data entry
- Background sync when online
- Courthouse connectivity resilience

## Key Features

### ✅ Phase 1-5: Complete & Production-Ready
- ✅ Case management with tabbed interface
- ✅ Auto-created jury panels (simplified workflow)
- ✅ Embedded juror research (no separate navigation)
- ✅ Identity matching with public records search
- ✅ Deep research synthesis with Claude web search (10-60 seconds)
- ✅ Archetype classification (10 behavioral types)
- ✅ Persona library and AI-powered matching
- ✅ Strategic voir dire question generation
- ✅ Focus group deliberation simulations
- ✅ Document capture with OCR (Claude Vision)
- ✅ Batch CSV import for jury panels

### Phase 6: Enhanced Data Sources (Planned)
- ⏳ FEC API integration (political donations)
- ⏳ Voter file pre-loading (county-specific)
- ⏳ People search APIs (Pipl, FullContact)
- ⏳ Social media aggregation
- ⏳ Court records integration

### Phase 7: Trial Support (Future)
- ⏳ Real-time trial audio analysis
- ⏳ Trial mode PWA for courtroom use
- ⏳ Offline recording with sync
- ⏳ Witness preparation mode

### Phase 8: Integrations (Future)
- ⏳ Filevine native integration
- ⏳ Clio integration
- ⏳ Mobile companion app
- ⏳ Verdict prediction

## Testing

```bash
# Run all tests
npm test

# Test specific service
cd services/api-gateway
npm test

# E2E tests (web app)
cd apps/web
npm run test:e2e

# AI service tests
cd ai-services/persona-suggester
pytest
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests
4. Update relevant README files
5. Update `ai_instructions.md` if structure changes
6. Submit a pull request

## Security

- All data encrypted at rest and in transit
- JWT-based authentication with Auth0
- RBAC with case-level permissions
- Comprehensive audit logging
- SOC 2 compliance path

Report security issues to: security@trialforge.ai

## Compliance

- **No-contact research** - Only publicly accessible information
- **Auditability** - Full provenance trail for all AI recommendations
- **Data retention** - Configurable per organization
- **Attorney-client privilege** - Secure data handling

## Monitoring

- **Sentry** - Error tracking
- **Railway Logs** - Centralized logging
- **Vercel Analytics** - Frontend performance
- **Custom metrics** - API latency, AI usage, user actions

## Cost Considerations

- **Anthropic API** - ~$3 per Claude Sonnet 4.5 request (varies by tokens)
- **Railway** - Database, Redis, and service hosting (~$20-50/month starter)
- **Vercel** - Free for hobby, Pro for production (~$20/month per team)

## Support

- **Documentation:** See `docs/` directory
- **Technical Issues:** Open an issue on GitHub
- **Security Issues:** security@trialforge.ai
- **General Questions:** support@trialforge.ai

## License

[License TBD - Proprietary/Commercial]

## Acknowledgments

- Built with [Claude 4.5](https://www.anthropic.com/claude) by Anthropic
- Deployed on [Vercel](https://vercel.com) and [Railway](https://railway.app)
- UI components from [shadcn/ui](https://ui.shadcn.com)

---

**Version:** 1.0.0
**Last Updated:** 2026-01-21
**Status:** Initial Development
