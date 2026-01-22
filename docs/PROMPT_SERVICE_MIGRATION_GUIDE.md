# Prompt Service Migration Guide

**Last Updated:** 2026-01-22
**Status:** Ready for Production Use

## Overview

This guide shows how to migrate an existing AI service from hardcoded prompts to the centralized Prompt Management Service.

## Prerequisites

- ✅ Prompt Management Service running on port 3002
- ✅ Database migrated with prompt management schema
- ✅ At least one prompt seeded (e.g., Archetype Classifier)
- ✅ `@juries/prompt-client` package available

## Migration Steps

### Step 1: Install Prompt Client

Add the prompt client as a dependency to your service:

```json
// services/api-gateway/package.json
{
  "dependencies": {
    "@juries/prompt-client": "*",
    // ... other dependencies
  }
}
```

Then install:
```bash
npm install
```

### Step 2: Add Environment Variable

Add the prompt service URL to your `.env`:

```env
# services/api-gateway/.env
PROMPT_SERVICE_URL=http://localhost:3002
```

For production:
```env
PROMPT_SERVICE_URL=https://prompt-service.railway.app
```

### Step 3: Migrate Service Code

#### Before (Hardcoded Prompt)

```typescript
// services/api-gateway/src/services/archetype-classifier.ts
import { ClaudeClient } from '@juries/ai-client';

export class ArchetypeClassifierService {
  private claudeClient: ClaudeClient;

  constructor(apiKey: string) {
    this.claudeClient = new ClaudeClient({ apiKey });
  }

  private buildClassificationPrompt(input: ClassificationInput): string {
    return `You are an expert jury consultant...

## INPUT DATA

${this.formatJurorData(input.juror)}

## ARCHETYPE DEFINITIONS

${this.getArchetypeDefinitions()}

## TASK

Classify the juror into behavioral archetypes...

Return JSON:
\`\`\`json
{
  "primaryArchetype": { ... },
  ...
}
\`\`\``;
  }

  async classifyJuror(input: ClassificationInput): Promise<ClassificationResult> {
    const prompt = this.buildClassificationPrompt(input);

    const response = await this.claudeClient.complete({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 4000,
      temperature: 0.3,
    });

    return this.parseClassificationResponse(response.content);
  }

  private formatJurorData(juror: any): string {
    return `Name: ${juror.name}\nAge: ${juror.age}...`;
  }

  private getArchetypeDefinitions(): string {
    return `1. Bootstrapper: Self-reliant individuals...`;
  }

  private parseClassificationResponse(content: string): ClassificationResult {
    const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonContent.trim());
  }
}
```

#### After (Using Prompt Service)

```typescript
// services/api-gateway/src/services/archetype-classifier.ts
import { PromptClient } from '@juries/prompt-client';

export class ArchetypeClassifierService {
  private promptClient: PromptClient;

  constructor(anthropicApiKey: string) {
    this.promptClient = new PromptClient({
      serviceUrl: process.env.PROMPT_SERVICE_URL!,
      anthropicApiKey,
      cacheEnabled: true,
      cacheTTL: 300000, // 5 minutes
    });
  }

  async classifyJuror(input: ClassificationInput): Promise<ClassificationResult> {
    // Execute prompt via prompt service
    const { result, promptMeta } = await this.promptClient.execute(
      'archetype-classifier',
      {
        variables: {
          jurorData: this.formatJurorData(input.juror),
          archetypeDefinitions: this.getArchetypeDefinitions(),
        },
      }
    );

    // Parse response (keep this logic in service)
    const classification = this.parseClassificationResponse(result.content[0].text);

    // Optionally track additional metadata
    await this.promptClient.trackResult('archetype-classifier', {
      versionId: promptMeta.versionId,
      abTestId: promptMeta.abTestId,
      success: true,
      tokensUsed: result.usage.input_tokens + result.usage.output_tokens,
      latencyMs: 0, // Already tracked by execute()
      confidence: classification.primaryArchetype.confidence,
      metadata: {
        jurorId: input.juror.id,
        hasSecondaryArchetype: !!classification.secondaryArchetype,
      },
    });

    return classification;
  }

  // Keep data formatting methods in service
  private formatJurorData(juror: any): string {
    return `Name: ${juror.name}\nAge: ${juror.age}...`;
  }

  private getArchetypeDefinitions(): string {
    return `1. Bootstrapper: Self-reliant individuals...`;
  }

  // Keep response parsing in service
  private parseClassificationResponse(content: string): ClassificationResult {
    const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonContent.trim());
  }
}
```

### What Changed?

✅ **Removed:**
- `buildClassificationPrompt()` method (now in database)
- Direct `ClaudeClient` usage (now handled by PromptClient)
- Hardcoded model configuration

✅ **Added:**
- `PromptClient` instance
- Variable preparation for prompt rendering
- Automatic result tracking with metadata

✅ **Kept in Service:**
- Data formatting logic (`formatJurorData`)
- Business logic (`getArchetypeDefinitions`)
- Response parsing (`parseClassificationResponse`)

### Benefits of Migration

1. **No Deployments for Prompt Changes**
   - Before: Edit code → commit → deploy → wait 5-10 minutes
   - After: Edit in database → instant deployment

2. **Automatic A/B Testing**
   - Prompt service handles traffic splitting
   - No code changes needed

3. **Analytics Tracking**
   - Token usage per prompt version
   - Success rates and confidence scores
   - Performance metrics

4. **Version Control**
   - Full history of all prompt changes
   - One-click rollback

## Testing the Migration

### 1. Verify Service Starts

```bash
# Make sure prompt service is running
curl http://localhost:3002/health
# Should return: {"status":"ok",...}
```

### 2. Test Prompt Rendering

```bash
# Test that the prompt renders correctly
curl -X POST http://localhost:3002/api/v1/prompts/archetype-classifier/render \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "jurorData": "Name: Test Juror",
      "archetypeDefinitions": "..."
    }
  }'
```

### 3. Test Your Service

```typescript
// test-archetype-migration.ts
import { ArchetypeClassifierService } from './services/archetype-classifier';

const service = new ArchetypeClassifierService(process.env.ANTHROPIC_API_KEY!);

const result = await service.classifyJuror({
  juror: {
    id: 'test-123',
    name: 'John Doe',
    age: 45,
    occupation: 'Teacher',
  },
});

console.log('Classification:', result.primaryArchetype.archetypeName);
console.log('Confidence:', result.primaryArchetype.confidence);
```

### 4. Verify Analytics

```bash
# Check that analytics are being tracked
curl http://localhost:3002/api/v1/prompts/archetype-classifier/versions/{versionId}/analytics
```

## Rollback Plan

If something goes wrong, you can quickly rollback:

### Option 1: Keep Old Code (Recommended During Testing)

```typescript
// Keep old implementation with a feature flag
export class ArchetypeClassifierService {
  private usePromptService = process.env.USE_PROMPT_SERVICE === 'true';

  async classifyJuror(input: ClassificationInput) {
    if (this.usePromptService) {
      return this.classifyJurorWithPromptService(input);
    } else {
      return this.classifyJurorLegacy(input);
    }
  }

  private async classifyJurorWithPromptService(input: ClassificationInput) {
    // New implementation
  }

  private async classifyJurorLegacy(input: ClassificationInput) {
    // Old implementation (kept temporarily)
  }
}
```

Then toggle with environment variable:
```env
USE_PROMPT_SERVICE=false  # Use old code
USE_PROMPT_SERVICE=true   # Use new code
```

### Option 2: Git Revert

```bash
git revert <commit-hash>
git push
```

## Common Issues & Solutions

### Issue 1: Prompt Service Unreachable

**Symptoms:** `Failed to fetch prompt: ECONNREFUSED`

**Solutions:**
1. Check prompt service is running: `curl http://localhost:3002/health`
2. Verify `PROMPT_SERVICE_URL` environment variable
3. Check network connectivity in Railway/production

**Fallback:** Use feature flag to switch to legacy code

### Issue 2: Missing Variables

**Symptoms:** `Missing required variables: jurorData`

**Solutions:**
1. Check variable names match template: `{{jurorData}}`
2. Ensure all required variables are provided
3. Review prompt template in database

### Issue 3: Different Response Format

**Symptoms:** Parsing errors or missing fields

**Solutions:**
1. Verify prompt template matches expected output
2. Test prompt rendering manually
3. Update `parseResponse()` method if needed

### Issue 4: Performance Degradation

**Symptoms:** Slower response times

**Solutions:**
1. Enable client-side caching: `cacheEnabled: true`
2. Check Redis connection for server-side caching
3. Monitor network latency to prompt service

**Metrics to Watch:**
- Prompt fetch time (should be <50ms with cache)
- Total request time (should be similar to before)
- Cache hit rate (should be >80%)

## Migration Checklist

Before migrating a service:

- [ ] Prompt seeded in database with correct `serviceId`
- [ ] Prompt template tested and rendering correctly
- [ ] Environment variable `PROMPT_SERVICE_URL` configured
- [ ] `@juries/prompt-client` package installed
- [ ] Service code updated with PromptClient
- [ ] Response parsing tested
- [ ] Analytics tracking verified
- [ ] Feature flag added for easy rollback (optional)
- [ ] Staging environment tested
- [ ] Production deployment planned

After migration:

- [ ] Monitor error rates (should stay the same)
- [ ] Verify analytics are being tracked
- [ ] Check cache hit rates
- [ ] Measure performance impact
- [ ] Update documentation
- [ ] Remove legacy code (after 2-4 weeks)

## Next Services to Migrate

Recommended migration order (easiest → hardest):

1. ✅ **Archetype Classifier** - Simple classification
2. **Persona Suggester** - Similar to archetype
3. **Research Summarizer** - Batch processing
4. **Question Generator** - Complex output
5. **Focus Group Engine** - Multiple modes
6. **OCR Service** - Vision API (different pattern)
7. **Juror Synthesis** - Tool use (web search)

## Admin Operations

### Updating a Prompt

```bash
# Create new version via API
curl -X POST http://localhost:3002/api/v1/admin/prompts/{promptId}/versions \
  -H "Content-Type: application/json" \
  -d '{
    "version": "v1.1.0",
    "userPromptTemplate": "Updated template...",
    "config": {
      "model": "claude-sonnet-4-5-20250929",
      "maxTokens": 4000,
      "temperature": 0.3
    },
    "variables": { ... },
    "notes": "Improved classification accuracy"
  }'

# Deploy the new version
curl -X POST http://localhost:3002/api/v1/admin/prompts/archetype-classifier/deploy \
  -H "Content-Type: application/json" \
  -d '{"versionId": "new-version-id"}'
```

### Rolling Back

```bash
# Rollback to previous version
curl -X POST http://localhost:3002/api/v1/admin/prompts/archetype-classifier/rollback \
  -H "Content-Type: application/json" \
  -d '{"versionId": "previous-version-id"}'
```

## Success Metrics

Track these after migration:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Prompt Change Time** | <5 minutes | Time from idea → production |
| **Error Rate** | No increase | Compare before/after migration |
| **Response Time** | <10% slower | 95th percentile latency |
| **Token Usage** | Within 5% | Track via analytics API |
| **Cache Hit Rate** | >80% | Redis metrics |

## Support

**Issues?**
- Check [services/prompt-service/README.md](../services/prompt-service/README.md)
- Review [docs/PROMPT_MANAGEMENT_PROPOSAL.md](./PROMPT_MANAGEMENT_PROPOSAL.md)
- See [docs/PROMPT_SERVICE_BUILD_SUMMARY.md](./PROMPT_SERVICE_BUILD_SUMMARY.md)

---

**Version:** 1.0
**Last Updated:** 2026-01-22
