# Prompt Service - README

Centralized service for managing AI prompts across all AI services in Juries by Filevine.

## Overview

The Prompt Management Service provides:
- **Centralized Storage** - All prompts in database, not code
- **Version Control** - Track every prompt change with full history
- **A/B Testing** - Test prompt variations with traffic splitting
- **Analytics** - Track success rates, token usage, latency, confidence
- **Template Engine** - Handlebars-based variable injection
- **Caching** - Redis caching for fast prompt retrieval
- **No Deployments** - Change prompts instantly without code changes

## Architecture

```
AI Services → PromptClient → Prompt Service → PostgreSQL + Redis
                    ↓
            Anthropic Claude API
```

**Key Components:**
- **Prompt Service** - Fastify REST API (port 3002)
- **Prompt Client** - NPM package (`@juries/prompt-client`)
- **Template Engine** - Handlebars for variable injection
- **Cache Service** - Redis caching layer
- **Database** - PostgreSQL with Prisma ORM

## Installation

```bash
# From root of monorepo
npm install

# Or from this directory
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3002
HOST=0.0.0.0
NODE_ENV=development

DATABASE_URL=postgresql://user:password@localhost:5432/trialforge
REDIS_URL=redis://localhost:6379

JWT_SECRET=your-secret-key-change-me
CACHE_ENABLED=true
CACHE_TTL=300  # seconds
REQUIRE_AUTH=false  # Set true in production
```

## Development

```bash
# Start development server
npm run dev

# Build
npm run build

# Production start
npm start

# Type check
npm run typecheck
```

## Database Schema

The service adds 5 new models to the shared Prisma schema:

1. **Prompt** - Main prompt metadata
2. **PromptVersion** - Immutable version history
3. **PromptTemplate** - Reusable base templates
4. **ABTest** - A/B test configurations
5. **PromptAnalytics** - Execution tracking

**Key relationships:**
- Prompt → PromptVersion (1:many)
- Prompt → ABTest (1:many)
- PromptVersion → PromptAnalytics (1:many)

## API Endpoints

### Public API (for AI services)

**GET `/api/v1/prompts/:serviceId`**
Get prompt metadata

**POST `/api/v1/prompts/:serviceId/render`**
Render prompt with variables

```json
{
  "variables": {
    "jurorData": "...",
    "archetypeDefinitions": "..."
  },
  "version": "latest",
  "abTestEnabled": true
}
```

Response:
```json
{
  "promptId": "uuid",
  "versionId": "uuid",
  "version": "v2.0.0",
  "systemPrompt": "string | null",
  "userPrompt": "rendered string",
  "config": {
    "model": "claude-sonnet-4-5-20250929",
    "maxTokens": 4000,
    "temperature": 0.3
  },
  "abTestId": "uuid (if A/B test active)",
  "isVariant": false
}
```

**POST `/api/v1/prompts/:serviceId/results`**
Track execution result

```json
{
  "versionId": "uuid",
  "abTestId": "uuid (optional)",
  "success": true,
  "tokensUsed": 3500,
  "latencyMs": 2300,
  "confidence": 0.87,
  "errorMessage": "string (if failed)",
  "metadata": {}
}
```

**GET `/api/v1/prompts/:serviceId/versions/:versionId/analytics`**
Get analytics for a version

Query params: `?limit=100`

### Admin API

**GET `/api/v1/admin/prompts`**
List all prompts

**POST `/api/v1/admin/prompts`**
Create new prompt

```json
{
  "serviceId": "archetype-classifier",
  "name": "Archetype Classification",
  "description": "Classifies jurors into 10 behavioral archetypes",
  "category": "classification"
}
```

**GET `/api/v1/admin/prompts/:id/versions`**
Get all versions of a prompt

**POST `/api/v1/admin/prompts/:id/versions`**
Create new version

```json
{
  "version": "v2.1.0",
  "systemPrompt": "You are an expert...",
  "userPromptTemplate": "Classify this juror:\n\n{{jurorData}}",
  "config": {
    "model": "claude-sonnet-4-5-20250929",
    "maxTokens": 4000,
    "temperature": 0.3
  },
  "variables": {
    "jurorData": "string",
    "archetypeDefinitions": "string"
  },
  "outputSchema": { ... },
  "notes": "Improved classification accuracy",
  "isDraft": false
}
```

**POST `/api/v1/admin/prompts/:serviceId/deploy`**
Deploy a version (set as current)

```json
{
  "versionId": "uuid"
}
```

**POST `/api/v1/admin/prompts/:serviceId/rollback`**
Rollback to previous version

```json
{
  "versionId": "uuid"
}
```

## Using the Prompt Client

### Installation

```bash
npm install @juries/prompt-client
```

### Basic Usage

```typescript
import { PromptClient } from '@juries/prompt-client';

const client = new PromptClient({
  serviceUrl: process.env.PROMPT_SERVICE_URL!,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
});

// Get and execute prompt
const { result, promptMeta } = await client.execute('archetype-classifier', {
  variables: {
    jurorData: formatJurorData(juror),
    archetypeDefinitions: getArchetypeDefinitions(),
  },
});

// Parse response
const classification = parseResponse(result.content[0].text);
```

### Advanced Usage

```typescript
// Get prompt without executing
const prompt = await client.getPrompt('archetype-classifier', {
  variables: { ... },
  version: 'v2.0.0', // Specific version
  abTestEnabled: false, // Disable A/B testing
});

// Manually track result
await client.trackResult('archetype-classifier', {
  versionId: prompt.versionId,
  success: true,
  tokensUsed: 3500,
  latencyMs: 2100,
  confidence: 0.87,
});

// Get analytics
const analytics = await client.getAnalytics(
  'archetype-classifier',
  versionId,
  100 // limit
);

console.log(`Success rate: ${analytics.successRate}`);
console.log(`Avg tokens: ${analytics.avgTokens}`);
console.log(`Avg latency: ${analytics.avgLatencyMs}ms`);
```

## Migrating an AI Service

### Before (Current)

```typescript
// services/api-gateway/src/services/archetype-classifier.ts
export class ArchetypeClassifierService {
  private buildPrompt(input: any): string {
    return `You are an expert...`; // Hardcoded
  }

  async classifyJuror(input: any) {
    const prompt = this.buildPrompt(input);
    const response = await this.claudeClient.complete({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 4000,
      temperature: 0.3,
    });
    return this.parseResponse(response.content);
  }
}
```

### After (With Prompt Service)

```typescript
// services/api-gateway/src/services/archetype-classifier.ts
import { PromptClient } from '@juries/prompt-client';

export class ArchetypeClassifierService {
  private promptClient: PromptClient;

  constructor() {
    this.promptClient = new PromptClient({
      serviceUrl: process.env.PROMPT_SERVICE_URL!,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async classifyJuror(input: any) {
    // Get and execute prompt
    const { result } = await this.promptClient.execute('archetype-classifier', {
      variables: {
        jurorData: this.formatJurorData(input),
        archetypeDefinitions: this.getArchetypeDefinitions(),
      },
    });

    // Parse response (keep this logic in service)
    return this.parseResponse(result.content[0].text);
  }

  private formatJurorData(input: any): string {
    // Keep data formatting in service
    return `Name: ${input.name}\nAge: ${input.age}...`;
  }

  private parseResponse(content: string): any {
    // Keep parsing logic in service
    const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    return JSON.parse(jsonMatch ? jsonMatch[1] : content);
  }
}
```

### Environment Variables

Add to API Gateway `.env`:
```env
PROMPT_SERVICE_URL=http://localhost:3002
```

## Template System

The service uses Handlebars for template rendering.

### Basic Variables

```handlebars
Classify this juror:

Name: {{name}}
Age: {{age}}
Occupation: {{occupation}}
```

### Conditionals

```handlebars
{{#if caseContext}}
Case Type: {{caseContext.caseType}}
{{/if}}
```

### Loops

```handlebars
Archetypes:
{{#each archetypes}}
- {{this.name}}: {{this.description}}
{{/each}}
```

### Custom Helpers

```handlebars
{{json outputSchema}}  <!-- Pretty-print JSON -->
{{join categories ", "}}  <!-- Join array -->
```

### Variable Validation

The service validates that all required variables are provided before rendering:

```typescript
// Missing variables will throw error:
// "Missing required variables: jurorData, archetypeDefinitions"
```

## Caching

The service implements two-level caching:

1. **Redis Cache** (Server-side)
   - Caches rendered prompts
   - Default TTL: 5 minutes
   - Invalidated on version deploy

2. **Client Cache** (Client-side)
   - In-memory Map cache in PromptClient
   - Default TTL: 5 minutes
   - Reduces network calls

**Cache Keys:**
```
prompt:{serviceId}:{version}:{base64(variables)}
```

**Cache Invalidation:**
- Automatic: On version deployment
- Manual: Call `client.clearCache()`

## A/B Testing

Create an A/B test to compare two prompt versions:

```typescript
// 1. Create control and variant versions
const controlVersion = await createVersion({ version: 'v2.0.0', ... });
const variantVersion = await createVersion({ version: 'v2.1.0', ... });

// 2. Create A/B test (via Admin API)
POST /api/v1/admin/ab-tests
{
  "promptId": "uuid",
  "name": "Test new archetype descriptions",
  "controlVersionId": "uuid",
  "variantVersionId": "uuid",
  "trafficSplit": 50  // 50% traffic to variant
}

// 3. Start test
PATCH /api/v1/admin/ab-tests/:id
{ "status": "running" }

// 4. Clients automatically participate
// No code changes needed!

// 5. View results
GET /api/v1/admin/ab-tests/:id/results
```

## Seeding Prompts

To seed the database with initial prompts, create a seed script:

```typescript
// scripts/seed-prompts.ts
import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function seedArchetypeClassifier() {
  // Create prompt
  const prompt = await prisma.prompt.create({
    data: {
      serviceId: 'archetype-classifier',
      name: 'Archetype Classification',
      description: 'Classifies jurors into 10 behavioral archetypes',
      category: 'classification',
    },
  });

  // Create version
  const version = await prisma.promptVersion.create({
    data: {
      promptId: prompt.id,
      version: 'v1.0.0',
      systemPrompt: null,
      userPromptTemplate: `You are an expert jury consultant...

{{jurorData}}

{{archetypeDefinitions}}

Return JSON...`,
      config: {
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 4000,
        temperature: 0.3,
      },
      variables: {
        jurorData: 'string',
        archetypeDefinitions: 'string',
      },
      notes: 'Initial version',
    },
  });

  // Set as current
  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { currentVersionId: version.id },
  });
}

await seedArchetypeClassifier();
```

## Testing

### Health Check

```bash
curl http://localhost:3002/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-22T19:54:00.000Z",
  "cache": "connected"
}
```

### Test Prompt Rendering

```bash
curl -X POST http://localhost:3002/api/v1/prompts/archetype-classifier/render \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "jurorData": "Name: John Doe\nAge: 45",
      "archetypeDefinitions": "..."
    },
    "version": "latest"
  }'
```

## Production Deployment

### Railway

1. Create new service in Railway
2. Connect to repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Configure environment variables (see `.env.example`)
6. Deploy

### Environment Variables

Production settings:
```env
NODE_ENV=production
REQUIRE_AUTH=true
CACHE_ENABLED=true
REDIS_URL=redis://...  # Railway Redis URL
DATABASE_URL=postgresql://...  # Railway Postgres URL
JWT_SECRET=...  # Strong secret
```

## Monitoring

Track these metrics:
- **Success Rate** - % of successful prompt executions
- **Token Usage** - Average tokens per service
- **Latency** - Average response time
- **Confidence** - Average confidence scores
- **Error Rate** - % of failed executions

Access via analytics endpoints or build dashboard.

## Troubleshooting

### Redis Connection Failed
Set `CACHE_ENABLED=false` to disable caching (degrades performance).

### Prompt Not Found
Ensure prompt is seeded in database with correct `serviceId`.

### Missing Variables Error
Check that all `{{variables}}` in template are provided in render request.

### A/B Test Not Working
Verify test status is `running` and `trafficSplit` is set correctly.

## Next Steps

1. ✅ Service built and tested
2. 🔄 Seed database with first prompt (Archetype Classifier)
3. 🔄 Migrate first AI service to use prompt-client
4. 📝 Build Admin UI for prompt management
5. 📊 Add analytics dashboard

## Related Documentation

### For Service Developers
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - 5-minute quick start guide
- **[API_CONTRACT.md](./API_CONTRACT.md)** - Complete API reference and best practices

### For Architecture
- [PROMPT_MANAGEMENT_PROPOSAL.md](../../docs/PROMPT_MANAGEMENT_PROPOSAL.md) - Full proposal
- [PROMPT_MANAGEMENT_QUICK_REF.md](../../docs/PROMPT_MANAGEMENT_QUICK_REF.md) - Quick reference
- [ai_instructions.md](../../ai_instructions.md) - Project structure

---

**Version:** 1.0.0
**Last Updated:** 2026-01-23
**Production URL:** https://prompt-service-production-a2e3.up.railway.app
