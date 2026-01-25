# API Gateway Service

RESTful API Gateway for Trials by Filevine AI platform built with Fastify.

## Features

- **JWT Authentication** - Secure token-based authentication
- **Request Validation** - Zod schema validation for all endpoints
- **Rate Limiting** - Prevent API abuse
- **CORS Support** - Configurable cross-origin resource sharing
- **Multi-tenancy** - Organization-level data isolation
- **Comprehensive Logging** - Structured logging with Pino
- **Interactive API Documentation** - Swagger UI with live endpoint testing

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Running database with Prisma schema applied

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude AI integration (optional, falls back to mock data)

### Development

```bash
npm run dev
```

Server will start on `http://localhost:3001`

## API Documentation

### Interactive Swagger UI

**Access the interactive API documentation at:**
```
http://localhost:3001/docs
```

**Features:**
- Browse all API endpoints with detailed descriptions
- Test endpoints directly in the browser
- View request/response schemas and examples
- Authenticate with JWT token to test protected endpoints
- Download OpenAPI specification (YAML/JSON)

**How to Use:**
1. Start the server: `npm run dev`
2. Open http://localhost:3001/docs in your browser
3. Click "Authorize" button and enter your JWT token
4. Explore and test any endpoint

### OpenAPI Specification

Download the complete OpenAPI specification:

- **YAML Format**: http://localhost:3001/openapi.yaml
- **JSON Format**: http://localhost:3001/openapi.json
- **Comprehensive Spec**: [docs/api/openapi.yaml](../../docs/api/openapi.yaml) (9,000+ lines)

These can be imported into:
- **Postman** - Generate collections automatically
- **Insomnia** - Import and test endpoints
- **Code Generators** - Generate client SDKs
- **AI Agents** - Control the app via conversational AI

### Documentation Files

See the `docs/api/` directory for complete documentation:

- **[openapi.yaml](../../docs/api/openapi.yaml)** - Full OpenAPI 3.0 specification
- **[README.md](../../docs/api/README.md)** - API overview and quick start guide
- **[CONVERSATIONAL_AI_GUIDE.md](../../docs/api/CONVERSATIONAL_AI_GUIDE.md)** - Guide for building AI agents

### Root Endpoint

Visit http://localhost:3001 for API information:

```json
{
  "name": "Trials by Filevine API",
  "version": "1.0.0",
  "documentation": {
    "swaggerUI": "http://localhost:3001/docs",
    "openapi": {
      "yaml": "http://localhost:3001/openapi.yaml",
      "json": "http://localhost:3001/openapi.json"
    }
  },
  "endpoints": { ... }
}
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user

### Cases

- `GET /api/cases` - List all cases
- `GET /api/cases/:id` - Get case details
- `POST /api/cases` - Create new case
- `PATCH /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

### Jurors

- `GET /api/jurors/panel/:panelId` - Get jurors for panel
- `GET /api/jurors/:id` - Get juror details
- `POST /api/jurors` - Create new juror
- `PATCH /api/jurors/:id` - Update juror
- `DELETE /api/jurors/:id` - Delete juror

### Personas

- `GET /api/personas` - List all personas
- `GET /api/personas/:id` - Get persona details
- `POST /api/personas` - Create custom persona
- `PATCH /api/personas/:id` - Update persona
- `DELETE /api/personas/:id` - Delete persona
- `POST /api/personas/suggest` - AI-powered persona suggestions for juror

### Juror Research

- `POST /api/jurors/:id/research` - Add research artifact to juror
- `POST /api/jurors/:id/persona-mapping` - Map persona to juror

### Health

- `GET /health` - Health check endpoint

## AI Services

### Archetype Classifier Service

Located at `src/services/archetype-classifier.ts`, this service classifies jurors into 10 behavioral archetypes based on psychological research.

**Features:**
- Classifies jurors into validated behavioral archetypes with confidence scores
- Analyzes 8 psychological dimensions (attribution orientation, just world belief, authoritarianism, etc.)
- Provides plaintiff and defense danger levels (1-5 scale)
- Identifies cause challenge opportunities with suggested questions
- Generates targeted voir dire questions for each archetype
- Detects hybrid archetypes when jurors match multiple profiles

**The 10 Archetypes:**
1. **Bootstrapper** - Personal Responsibility Enforcer (pro-defense in PI cases)
2. **Crusader** - Systemic Thinker (pro-plaintiff vs. corporations)
3. **Scale-Balancer** - Fair-Minded Evaluator (true swing voter)
4. **Captain** - Authoritative Leader (likely foreperson, high influence)
5. **Chameleon** - Compliant Follower (adopts majority position)
6. **Scarred** - Wounded Veteran (personal experience drives view)
7. **Calculator** - Numbers Person (data-driven, skeptical of emotion)
8. **Heart** - Empathic Connector (narrative-focused, pro-plaintiff in injury cases)
9. **Trojan Horse** - Stealth Juror (hides true biases)
10. **Maverick** - Nullifier (independent, hung jury risk)

**Usage:**

```typescript
import { ArchetypeClassifierService } from './services/archetype-classifier';

const classifier = new ArchetypeClassifierService(process.env.ANTHROPIC_API_KEY);

const classification = await classifier.classifyJuror({
  jurorData: {
    age: 52,
    occupation: 'Small Business Owner',
    education: 'High School',
    questionnaireData: { /* responses */ },
  },
  caseType: 'civil',
  jurisdiction: 'Los Angeles County',
  ourSide: 'plaintiff',
});
```

**Response Format:**

```typescript
{
  primary: {
    archetype: 'bootstrapper',
    archetypeName: 'The Bootstrapper (Personal Responsibility Enforcer)',
    confidence: 0.85,
    strength: 0.90,
    reasoning: "Strong indicators of personal responsibility orientation...",
    keyIndicators: [
      "Self-employed contractor suggests self-made success",
      "Age and demographic profile match typical Bootstrapper"
    ],
    concerns: [
      "Might have difficulty awarding damages"
    ],
    dimensionScores: {
      attribution_orientation: 1.5,  // 1.0 (personal) - 5.0 (situational)
      just_world_belief: 4.5,         // 1.0 (low) - 5.0 (high)
      authoritarianism: 4.0,
      institutional_trust: {
        corporations: 4.5,
        medical: 4.0,
        legal_system: 3.5,
        insurance: 3.5
      },
      litigation_attitude: 1.5,       // 1.0 (anti) - 5.0 (pro)
      leadership_tendency: 4.0,
      cognitive_style: 3.5,           // 1.0 (narrative) - 5.0 (analytical)
      damages_orientation: 1.5        // 1.0 (conservative) - 5.0 (liberal)
    }
  },
  secondary: null,  // Only if hybrid archetype detected
  recommendations: {
    plaintiffDangerLevel: 5,  // 1-5 scale
    defenseDangerLevel: 1,
    causeChallenge: {
      vulnerability: 0.70,
      suggestedQuestions: [
        "Is there any amount of damages you feel you just couldn't award?"
      ]
    },
    voirDireQuestions: [
      "Have you or anyone close to you ever considered filing a lawsuit but decided not to?"
    ]
  }
}
```

**Endpoints:**
- `POST /api/archetypes/classify/juror` - Classify a single juror into archetypes
- `POST /api/archetypes/classify/panel` - Bulk classify entire jury panel (planned)

**Fallback Behavior:**
If `ANTHROPIC_API_KEY` is not configured, uses occupation-based heuristics for development/testing.

### Persona Suggester Service

Located at `src/services/persona-suggester.ts`, this service uses Claude AI to analyze jurors and suggest matching personas.

**Features:**
- Analyzes juror demographics, occupation, education, and research artifacts
- Matches against available system and custom personas
- Returns top 3 suggestions with confidence scores (0-1)
- Provides detailed reasoning, key matches, and potential concerns
- Explainable AI with transparent decision-making

**Usage:**

```typescript
import { PersonaSuggesterService } from './services/persona-suggester';

const suggester = new PersonaSuggesterService(process.env.ANTHROPIC_API_KEY);

const suggestions = await suggester.suggestPersonas({
  juror: jurorData,
  availablePersonas: personas,
  caseContext: {
    caseType: 'civil',
    keyIssues: ['employment discrimination', 'age bias'],
  },
});
```

**Response Format:**

```typescript
{
  suggestions: [
    {
      persona: { id, name, description, attributes, signals, persuasionLevers },
      confidence: 0.85,
      reasoning: "Juror's technical background and analytical mindset...",
      keyMatches: [
        "Software engineering occupation aligns with Tech Pragmatist signals",
        "STEM education indicates analytical thinking style"
      ],
      potentialConcerns: [
        "May be overly skeptical of emotional appeals",
        "Could focus too much on technical details"
      ]
    }
  ]
}
```

**Fallback Behavior:**
If `ANTHROPIC_API_KEY` is not configured, the endpoint returns mock suggestions for development/testing.

### Research Summarizer Service

Located at `src/services/research-summarizer.ts`, this service analyzes research artifacts and extracts persona-relevant signals.

**Features:**
- Processes social media, LinkedIn, public records, and other research artifacts
- Extracts structured persona signals with evidence and confidence scores
- Identifies key themes, sentiment, and concerning content
- Provides actionable insights for jury selection strategy
- Batches processing to handle multiple artifacts efficiently

**Usage:**

```typescript
import { ResearchSummarizerService } from './services/research-summarizer';

const summarizer = new ResearchSummarizerService(process.env.ANTHROPIC_API_KEY);

const summaries = await summarizer.summarizeResearch({
  artifacts: researchArtifacts,
  jurorContext: {
    name: 'John Doe',
    occupation: 'Software Engineer',
    age: 35,
  },
  caseContext: {
    caseType: 'civil',
    keyIssues: ['employment discrimination'],
  },
});
```

**Endpoints:**
- `POST /api/research/summarize` - Summarize specific artifacts for a juror
- `POST /api/research/batch-summarize` - Process all pending research for a case

### Question Generator Service

Located at `src/services/question-generator.ts`, this service generates strategic voir dire questions tailored to target personas.

**Features:**
- Creates 4 categories of questions: opening, persona identification, case-specific, challenge for cause
- Provides detailed guidance on what to listen for, red flags, and ideal answers
- Includes follow-up questions based on different response scenarios
- Considers jurisdiction-specific rules and constraints
- Prioritizes questions by strategic importance

**Usage:**

```typescript
import { QuestionGeneratorService } from './services/question-generator';

const generator = new QuestionGeneratorService(process.env.ANTHROPIC_API_KEY);

const questions = await generator.generateQuestions({
  caseContext: {
    caseType: 'civil',
    caseName: 'Johnson v. TechCorp',
    ourSide: 'plaintiff',
    keyFacts: facts,
    jurisdiction: 'California',
  },
  targetPersonas: personas,
  questionLimit: 20,
});
```

**Endpoint:**
- `POST /api/cases/:id/generate-questions` - Generate voir dire questions for a case

### Focus Group Simulation Engine

Located at `src/services/focus-group-engine.ts`, this service simulates jury focus groups with AI-powered persona reactions.

**Features:**
- Three simulation modes: quick, detailed, deliberation
- Generates realistic persona reactions to arguments
- Simulates deliberation discussions and group dynamics
- Identifies persuasive elements and weaknesses
- Provides actionable recommendations for argument refinement
- Tracks sentiment and verdict leans across personas

**Simulation Modes:**
- **Quick:** Brief initial reactions (good for rapid testing)
- **Detailed:** Comprehensive feedback with concerns and questions (default)
- **Deliberation:** Full simulated jury discussion with exchanges and group dynamics

**Usage:**

```typescript
import { FocusGroupEngineService } from './services/focus-group-engine';

const engine = new FocusGroupEngineService(process.env.ANTHROPIC_API_KEY);

const result = await engine.simulateFocusGroup({
  caseContext: caseInfo,
  argument: argumentToTest,
  personas: selectedPersonas,
  simulationMode: 'deliberation',
});
```

**Endpoints:**
- `POST /api/focus-groups/simulate` - Run a focus group simulation
- `GET /api/focus-groups/case/:caseId` - List focus group sessions for a case
- `GET /api/focus-groups/:sessionId` - Get detailed session results

### Juror Synthesis Service (Deep Research)

Located at `src/services/juror-synthesis.ts`, this service uses Claude API with web search to synthesize raw candidate data into comprehensive, structured profiles with voir dire recommendations.

**Features:**
- Triggers AFTER user confirms a candidate match (not during initial search)
- Runs asynchronously (10-20 seconds) with background processing
- Calls Claude API (Sonnet 4) with web_search tool enabled (up to 10 searches)
- Returns structured JSON profile with case-specific recommendations
- Emits event on completion for real-time WebSocket notifications
- Caches results based on case context hash for efficiency
- Provides data quality assessment (sparse/moderate/comprehensive)

**What It Synthesizes:**
- **Juror Profile:** Demographics, location, occupation, education, family
- **Attitudes & Affiliations:** Political indicators, donations, organizational memberships, social media activity, worldview indicators
- **Litigation Relevance:** Prior jury service, lawsuit history, connections to law enforcement/legal/medical professions
- **Voir Dire Recommendations:** Suggested questions with rationales, areas to probe, potential concerns with severity ratings, favorable indicators

**Usage:**

```typescript
import { JurorSynthesisService } from './services/juror-synthesis';

const synthesisService = new JurorSynthesisService(prisma);

// Start synthesis (returns immediately with job ID)
const job = await synthesisService.startSynthesis({
  candidateId: 'uuid',
  caseId: 'uuid',
  caseContext: {
    case_type: 'personal injury - medical malpractice',
    key_issues: ['hospital negligence', 'damages valuation'],
    client_position: 'plaintiff',
  },
});
// => { id: 'job-uuid', status: 'processing' }

// Poll for status
const status = await synthesisService.getSynthesisStatus(candidateId);
// => { id: 'job-uuid', status: 'completed', profileId: 'profile-uuid' }

// Get full synthesized profile
const profile = await synthesisService.getProfile(profileId);
```

**Example Synthesized Profile (excerpt):**

```json
{
  "schema_version": "1.0",
  "juror_profile": {
    "name": "John Smith",
    "age": 45,
    "occupation": {
      "current_title": "Senior Accountant",
      "employer": "Deloitte",
      "industry": "Professional Services",
      "management_level": "individual_contributor"
    },
    "education": {
      "highest_level": "bachelors",
      "field_of_study": "Accounting",
      "institutions": ["University of California, Berkeley"]
    }
  },
  "attitudes_and_affiliations": {
    "political_indicators": {
      "party_registration": "democrat",
      "donation_history": [
        {
          "recipient": "Biden for President",
          "amount": 500,
          "year": 2020,
          "party": "democrat"
        }
      ],
      "confidence": "confirmed"
    },
    "organizational_memberships": [
      {
        "organization": "American Institute of CPAs",
        "type": "professional",
        "role": "member",
        "source": "LinkedIn profile"
      }
    ]
  },
  "voir_dire_recommendations": {
    "suggested_questions": [
      {
        "question": "In your work as an accountant, do you find yourself more focused on following established procedures or looking at the bigger picture?",
        "rationale": "Assesses analytical vs. holistic thinking; accountants often favor rule-based approaches which may be defense-favorable in malpractice cases"
      }
    ],
    "potential_concerns": [
      {
        "concern": "Strong analytical mindset may favor medical defense experts",
        "evidence": "Professional background in accounting, CPA membership",
        "severity": "medium"
      }
    ],
    "favorable_indicators": [
      {
        "indicator": "Political donations suggest liberal leaning on damages",
        "evidence": "$500 donation to Biden 2020 campaign"
      }
    ]
  },
  "data_quality": {
    "sources_consulted": ["voter records", "FEC donations", "LinkedIn", "Whitepages"],
    "sources_count": 8,
    "data_richness": "moderate",
    "confidence_overall": "medium",
    "gaps_identified": ["No social media presence found", "Prior jury service unknown"]
  },
  "summary": "45-year-old accountant with analytical mindset and Democratic political leanings. Professional background may favor expert testimony and structured evidence, but liberal donations suggest potential openness to plaintiff damages. Moderate data richness with confirmed political and professional affiliations."
}
```

**Endpoints:**
- `POST /api/candidates/:candidateId/synthesize` - Start synthesis for a confirmed candidate
- `GET /api/candidates/:candidateId/synthesis` - Poll synthesis status
- `GET /api/synthesis/:profileId` - Get full synthesized profile

**Request Body for Synthesis:**
```json
{
  "case_context": {
    "case_type": "personal injury - medical malpractice",
    "key_issues": ["hospital negligence", "damages valuation"],
    "client_position": "plaintiff"
  }
}
```

**Response (202 Accepted):**
```json
{
  "job_id": "uuid",
  "status": "processing"
}
```

**WebSocket Event on Completion:**
```json
{
  "type": "synthesis_complete",
  "candidate_id": "uuid",
  "juror_id": "uuid",
  "profile_id": "uuid",
  "data_richness": "moderate",
  "confidence_overall": "medium",
  "concerns_count": 2,
  "favorable_count": 1
}
```

**Error Handling:**
- **Claude API timeout:** Retry once, then fail job
- **Invalid JSON response:** Retry with note to return valid JSON, then fail
- **Rate limited:** Queue with exponential backoff
- **Web search fails:** Continue without, note in `gaps_identified`

**Configuration:**
- Model: `claude-sonnet-4-20250514`
- Max tokens: 4096
- Max web searches: 10
- Timeout: 60 seconds
- Retry attempts: 1

---

## Railway Deployment

This service is deployed on Railway using a monorepo configuration.

### Configuration Files

Two configuration files control the Railway deployment:

1. **[railway.json](./railway.json)** - Primary Railway configuration
2. **[nixpacks.toml](./nixpacks.toml)** - Nixpacks build configuration

### Build Strategy

The build executes from the repository root (`/app` in Railway container) with explicit directory changes:

```bash
# 1. Install all dependencies
npm install

# 2. Generate Prisma client
npx prisma generate --schema=./packages/database/prisma/schema.prisma

# 3. Build shared packages (dependencies first!)
cd packages/database && npm run build && cd ../..
cd packages/utils && npm run build && cd ../..

# 4. Build API Gateway service
cd services/api-gateway && npm run build && cd ../..
```

**Why explicit `cd` commands?** npm workspace commands can execute from the wrong context, causing the `dist` folder to be created in the wrong location. Using `cd` ensures each package builds in its own directory.

### Start Command

```bash
cd services/api-gateway && node dist/index.js
```

### Railway Dashboard Settings

**Root Directory:** `/` (not `services/api-gateway/`)

**Watch Paths:**
```
services/api-gateway/**
packages/**
```

This configuration ensures:
- Deployments trigger when API Gateway code changes
- Deployments trigger when any shared package changes
- Other services don't trigger unnecessary API Gateway deployments

### Environment Variables

Configure these in Railway dashboard:

```bash
# Database (Railway provides this when you add PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:port/db

# Server
PORT=3000                      # Railway auto-assigns
NODE_ENV=production

# Authentication
JWT_SECRET=your-secret-key-here

# AI Services
ANTHROPIC_API_KEY=sk-ant-...

# CORS
FRONTEND_URL=https://your-frontend.vercel.app
```

### TypeScript Configuration

The service uses TypeScript path mappings for workspace packages:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@juries/database": ["../../packages/database/src"],
      "@juries/types": ["../../packages/types/src"],
      "@juries/utils": ["../../packages/utils/src"],
      "@juries/ai-client": ["../../packages/ai-client/src"]
    }
  }
}
```

**Important:** Paths point to `src` directories for compile-time resolution. Runtime resolution uses npm workspaces.

### Common Deployment Issues

**Issue:** `Cannot find module '/app/services/api-gateway/dist/index.js'`
- **Cause:** Build didn't create dist folder in correct location
- **Solution:** Use explicit `cd` commands in build script (already configured)

**Issue:** `error TS2307: Cannot find module '@juries/...'`
- **Cause:** Missing TypeScript path mappings
- **Solution:** Add to `tsconfig.json` paths (already configured)

**Issue:** TypeScript not found during build
- **Cause:** TypeScript in devDependencies instead of dependencies
- **Solution:** Move to dependencies in package.json (already done)

**Issue:** Database connection fails
- **Cause:** `DATABASE_URL` not set or incorrect format
- **Solution:** Check Railway environment variables

### Monitoring

Check these after deployment:

1. **Build Logs:** Verify all packages build successfully
2. **Deploy Logs:** Ensure service starts without errors
3. **Health Endpoint:** Test `https://your-service.railway.app/health`
4. **Database Connection:** Verify Prisma connects successfully

### Related Documentation

- **[Railway Deployment Guide](../../RAILWAY_DEPLOYMENT.md)** - Complete Railway setup and best practices
- **[Project Structure](../../ai_instructions.md)** - Full project architecture
- **Database Package** - See `packages/database/README.md` for schema docs
