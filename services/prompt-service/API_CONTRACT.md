# Prompt Service API Contract

## Overview

The Prompt Service is a centralized microservice for managing AI prompts across all services in the Trials by Filevine platform. It provides versioning, A/B testing, analytics tracking, and runtime prompt rendering.

**Base URL (Production):** `https://prompt-service-production-a2e3.up.railway.app`
**Base URL (Development):** `http://localhost:3002`

## Architecture Principles

### 1. **Separation of Concerns**
- **Prompt Management:** Admin UI manages prompts, versions, and deployment
- **Prompt Execution:** Services request rendered prompts at runtime
- **Analytics:** Services report back execution results for optimization

### 2. **Version Control**
- All prompts are versioned (e.g., "v1.0.0", "v1.1.0")
- Services can request specific versions or "latest"
- Rollback capability for quick recovery from bad prompts

### 3. **No Code Deployments**
- Update prompts without redeploying services
- Test new prompts in production with A/B testing
- Deploy changes instantly to all consuming services

## API Endpoints for Services

### 1. Get Prompt Metadata

Retrieve information about a prompt (optional - use if you need metadata before rendering).

**Endpoint:** `GET /api/v1/prompts/:serviceId`

**Parameters:**
- `serviceId` (path): Unique identifier for the prompt (e.g., "juror-analysis", "case-summary")

**Response:**
```json
{
  "id": "uuid",
  "serviceId": "juror-analysis",
  "name": "Juror Analysis Prompt",
  "description": "Analyzes juror profiles for case strategy",
  "category": "analysis",
  "currentVersionId": "uuid",
  "createdAt": "2026-01-23T00:00:00.000Z",
  "updatedAt": "2026-01-23T00:00:00.000Z"
}
```

### 2. Render Prompt (PRIMARY ENDPOINT)

This is the main endpoint services should use to get a rendered prompt for AI execution.

**Endpoint:** `POST /api/v1/prompts/:serviceId/render`

**Parameters:**
- `serviceId` (path): Unique identifier for the prompt

**Request Body:**
```json
{
  "variables": {
    "jurorName": "John Doe",
    "age": 45,
    "occupation": "Software Engineer",
    "background": "...",
    "caseType": "Personal Injury"
  },
  "version": "latest",  // Optional: "latest" (default), "v1.0.0", or specific version
  "abTestEnabled": true  // Optional: Enable A/B testing (default: true)
}
```

**Response:**
```json
{
  "promptId": "uuid",
  "versionId": "uuid",
  "version": "v1.2.0",
  "systemPrompt": "You are an expert legal analyst...",
  "userPrompt": "Analyze this juror profile:\n\nName: John Doe\nAge: 45...",
  "config": {
    "model": "claude-sonnet-4-5",
    "maxTokens": 4096,
    "temperature": 0.7,
    "topP": 0.9
  },
  "abTestId": "uuid"  // Present if A/B test is active
}
```

**Error Responses:**
- `404`: Prompt not found for serviceId
- `400`: Validation error (missing required variables)
- `500`: Server error

### 3. Track Execution Results (REQUIRED)

After executing a prompt with your AI service, you MUST report the results back for analytics and optimization.

**Endpoint:** `POST /api/v1/prompts/:serviceId/results`

**Parameters:**
- `serviceId` (path): Unique identifier for the prompt

**Request Body:**
```json
{
  "versionId": "uuid",           // From render response
  "abTestId": "uuid",            // From render response (if present)
  "success": true,               // Whether execution succeeded
  "tokensUsed": 1523,            // Optional: Token count from AI provider
  "latencyMs": 2341,             // Optional: Execution time in milliseconds
  "confidence": 0.87,            // Optional: Confidence score (0-1)
  "errorMessage": null,          // Optional: Error message if success=false
  "metadata": {                  // Optional: Custom metadata
    "modelUsed": "claude-sonnet-4-5",
    "userId": "uuid",
    "caseId": "uuid"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

## Integration Guide

### Step 1: Identify Your Prompts

Each service should have unique `serviceId` values for each type of prompt it uses:

**Recommended Naming Convention:** `{service-name}-{prompt-purpose}`

Examples:
- `juror-analysis-detailed`
- `case-summary-generation`
- `witness-credibility-assessment`
- `settlement-recommendation`
- `document-classification`

### Step 2: Create Service-Specific Client

Create a reusable client in your service for interacting with the Prompt Service.

**Example (Node.js/TypeScript):**

```typescript
import axios from 'axios';

interface RenderPromptRequest {
  variables: Record<string, any>;
  version?: string;
  abTestEnabled?: boolean;
}

interface RenderPromptResponse {
  promptId: string;
  versionId: string;
  version: string;
  systemPrompt: string | null;
  userPrompt: string;
  config: {
    model: string;
    maxTokens: number;
    temperature?: number;
    topP?: number;
    topK?: number;
  };
  abTestId?: string;
}

interface TrackResultRequest {
  versionId: string;
  abTestId?: string;
  success: boolean;
  tokensUsed?: number;
  latencyMs?: number;
  confidence?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

class PromptServiceClient {
  private baseURL: string;

  constructor(baseURL: string = process.env.PROMPT_SERVICE_URL || 'http://localhost:3002') {
    this.baseURL = baseURL;
  }

  async renderPrompt(
    serviceId: string,
    request: RenderPromptRequest
  ): Promise<RenderPromptResponse> {
    const response = await axios.post(
      `${this.baseURL}/api/v1/prompts/${serviceId}/render`,
      request,
      { timeout: 5000 }
    );
    return response.data;
  }

  async trackResult(
    serviceId: string,
    result: TrackResultRequest
  ): Promise<void> {
    try {
      await axios.post(
        `${this.baseURL}/api/v1/prompts/${serviceId}/results`,
        result,
        { timeout: 3000 }
      );
    } catch (error) {
      // Log but don't throw - tracking failures shouldn't break service
      console.error('Failed to track prompt result:', error);
    }
  }
}

export const promptServiceClient = new PromptServiceClient();
```

### Step 3: Use in Your Service

**Example: Juror Analysis Service**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { promptServiceClient } from './prompt-service-client';

async function analyzeJuror(jurorProfile: any) {
  const startTime = Date.now();

  try {
    // 1. Get rendered prompt from Prompt Service
    const rendered = await promptServiceClient.renderPrompt('juror-analysis-detailed', {
      variables: {
        jurorName: jurorProfile.name,
        age: jurorProfile.age,
        occupation: jurorProfile.occupation,
        background: jurorProfile.background,
        caseType: jurorProfile.caseType,
      },
      version: 'latest', // Or pin to specific version
      abTestEnabled: true,
    });

    // 2. Execute with AI provider
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: rendered.config.model,
      max_tokens: rendered.config.maxTokens,
      temperature: rendered.config.temperature,
      messages: [
        {
          role: 'user',
          content: rendered.userPrompt,
        },
      ],
      ...(rendered.systemPrompt && { system: rendered.systemPrompt }),
    });

    const latencyMs = Date.now() - startTime;
    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

    // 3. Track results (fire and forget)
    promptServiceClient.trackResult('juror-analysis-detailed', {
      versionId: rendered.versionId,
      abTestId: rendered.abTestId,
      success: true,
      tokensUsed,
      latencyMs,
      confidence: 0.85, // Your custom confidence calculation
      metadata: {
        jurorId: jurorProfile.id,
        caseId: jurorProfile.caseId,
      },
    });

    return {
      analysis: message.content[0].text,
      metadata: {
        promptVersion: rendered.version,
        tokensUsed,
        latencyMs,
      },
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // Track failure
    promptServiceClient.trackResult('juror-analysis-detailed', {
      versionId: rendered?.versionId || 'unknown',
      abTestId: rendered?.abTestId,
      success: false,
      latencyMs,
      errorMessage: error.message,
    });

    throw error;
  }
}
```

### Step 4: Error Handling

**Best Practices:**

1. **Timeout Requests:** Set reasonable timeouts (3-5 seconds) for prompt rendering
2. **Fallback Behavior:** Have fallback prompts hardcoded if Prompt Service is unavailable
3. **Retry Logic:** Implement exponential backoff for transient failures
4. **Circuit Breaker:** Prevent cascading failures with circuit breaker pattern
5. **Graceful Degradation:** Track failures but don't break user experience

**Example with Fallback:**

```typescript
async function renderPromptWithFallback(serviceId: string, variables: any) {
  try {
    return await promptServiceClient.renderPrompt(serviceId, { variables });
  } catch (error) {
    console.error('Prompt Service unavailable, using fallback:', error);

    // Return hardcoded fallback prompt
    return {
      promptId: 'fallback',
      versionId: 'fallback',
      version: 'fallback',
      systemPrompt: 'You are an expert legal analyst...',
      userPrompt: `Analyze this juror: ${JSON.stringify(variables)}`,
      config: {
        model: 'claude-sonnet-4-5',
        maxTokens: 4096,
        temperature: 0.7,
      },
    };
  }
}
```

## Variable Requirements

When creating prompts in the Admin UI, you define required variables using Handlebars syntax:

**Example Prompt Template:**
```
Analyze the following juror profile:

Name: {{jurorName}}
Age: {{age}}
Occupation: {{occupation}}
Background: {{background}}
Case Type: {{caseType}}

Provide a detailed analysis of their likely biases and recommendations for voir dire.
```

**Your service must provide all variables:**
```typescript
await promptServiceClient.renderPrompt('juror-analysis', {
  variables: {
    jurorName: 'John Doe',      // Required
    age: 45,                     // Required
    occupation: 'Engineer',      // Required
    background: '...',           // Required
    caseType: 'Personal Injury', // Required
  }
});
```

Missing variables will result in a `400` error.

## A/B Testing

The Prompt Service supports A/B testing for prompt optimization.

**How it works:**
1. Create multiple prompt versions for the same serviceId
2. Enable A/B testing in the Admin UI
3. The Prompt Service randomly selects a version (weighted distribution)
4. Services receive an `abTestId` in the response
5. Track results with the `abTestId` to measure performance

**No changes needed in your service code** - A/B testing is automatic when enabled.

## Analytics

Track these metrics for optimization:

1. **Success Rate:** Percentage of successful executions
2. **Token Usage:** Average tokens per prompt
3. **Latency:** Response time distribution
4. **Confidence:** Your custom confidence scoring
5. **Error Patterns:** Common failure modes

Access analytics via:
- **Admin UI:** `/prompts/{serviceId}` → View Analytics
- **API:** `GET /api/v1/prompts/:serviceId/versions/:versionId/analytics`

## Authentication (Future)

Currently, the Prompt Service has no authentication for the render/track endpoints (to minimize latency). Future versions will add:

- JWT-based service-to-service authentication
- Rate limiting per service
- API key management

For now, deploy the Prompt Service in a private network (Railway internal network) and use network-level security.

## Environment Variables

Add to your service's environment:

```bash
# Prompt Service URL
PROMPT_SERVICE_URL=https://prompt-service-production-a2e3.up.railway.app

# Or for Railway internal network (faster, more secure):
PROMPT_SERVICE_URL=http://prompt-service.railway.internal:3002
```

## Best Practices

### 1. **Version Pinning for Critical Operations**
```typescript
// Pin to tested version for production-critical operations
await promptServiceClient.renderPrompt('settlement-calculation', {
  variables: { ... },
  version: 'v2.1.0', // Stable, tested version
  abTestEnabled: false, // Disable A/B test for critical path
});
```

### 2. **Use Latest for Non-Critical Operations**
```typescript
// Use latest for non-critical operations to get improvements
await promptServiceClient.renderPrompt('document-summary', {
  variables: { ... },
  version: 'latest', // Get latest improvements
  abTestEnabled: true, // Help optimize prompts
});
```

### 3. **Always Track Results**
```typescript
// Even for failures - helps identify bad prompts
promptServiceClient.trackResult(serviceId, {
  versionId,
  success: false,
  errorMessage: 'AI returned invalid JSON',
});
```

### 4. **Include Useful Metadata**
```typescript
// Help correlate prompt performance with business outcomes
promptServiceClient.trackResult(serviceId, {
  versionId,
  success: true,
  metadata: {
    userId: 'uuid',
    caseId: 'uuid',
    caseValue: 50000,
    outcomeAccurate: true, // Track if prediction was correct
  },
});
```

## Testing

### Local Development

1. Start Prompt Service locally: `cd services/prompt-service && npm run dev`
2. Point your service to `http://localhost:3002`
3. Use the Admin UI to create test prompts: `http://localhost:3000/prompts`

### Integration Tests

```typescript
describe('Prompt Service Integration', () => {
  it('should render juror analysis prompt', async () => {
    const rendered = await promptServiceClient.renderPrompt('juror-analysis', {
      variables: {
        jurorName: 'Test User',
        age: 30,
        occupation: 'Teacher',
        background: 'No legal background',
        caseType: 'Criminal',
      },
    });

    expect(rendered.userPrompt).toContain('Test User');
    expect(rendered.config.model).toBe('claude-sonnet-4-5');
  });

  it('should handle missing variables gracefully', async () => {
    await expect(
      promptServiceClient.renderPrompt('juror-analysis', {
        variables: { jurorName: 'Test' }, // Missing required fields
      })
    ).rejects.toThrow();
  });
});
```

## Support

- **Documentation:** See [services/prompt-service/README.md](./README.md)
- **Admin UI:** Access at `/prompts` in main application
- **Issues:** Report at GitHub Issues

## Changelog

- **v1.0.0 (2026-01-23):** Initial release
  - Core render and tracking endpoints
  - Version management
  - A/B testing support
  - Analytics tracking
