# Prompt Service - Integration Quick Start

## TL;DR

1. **Render prompt:** `POST /api/v1/prompts/:serviceId/render` with variables
2. **Execute with AI:** Use returned `systemPrompt`, `userPrompt`, and `config`
3. **Track results:** `POST /api/v1/prompts/:serviceId/results` with success/failure data

## 5-Minute Integration

### Step 1: Install Client (Optional)

Create `src/lib/prompt-client.ts`:

```typescript
import axios from 'axios';

const PROMPT_SERVICE_URL = process.env.PROMPT_SERVICE_URL || 'http://localhost:3002';

export async function renderPrompt(serviceId: string, variables: Record<string, any>) {
  const response = await axios.post(
    `${PROMPT_SERVICE_URL}/api/v1/prompts/${serviceId}/render`,
    { variables, version: 'latest' }
  );
  return response.data;
}

export async function trackResult(serviceId: string, data: {
  versionId: string;
  success: boolean;
  tokensUsed?: number;
  latencyMs?: number;
}) {
  try {
    await axios.post(
      `${PROMPT_SERVICE_URL}/api/v1/prompts/${serviceId}/results`,
      data
    );
  } catch (error) {
    console.error('Failed to track result:', error);
  }
}
```

### Step 2: Use in Your Service

```typescript
import { renderPrompt, trackResult } from './lib/prompt-client';
import Anthropic from '@anthropic-ai/sdk';

async function analyzeDocument(document: any) {
  const startTime = Date.now();

  // 1. Get prompt
  const prompt = await renderPrompt('document-analysis', {
    documentText: document.text,
    documentType: document.type,
  });

  // 2. Execute with AI
  const anthropic = new Anthropic();
  const message = await anthropic.messages.create({
    model: prompt.config.model,
    max_tokens: prompt.config.maxTokens,
    messages: [{ role: 'user', content: prompt.userPrompt }],
    ...(prompt.systemPrompt && { system: prompt.systemPrompt }),
  });

  // 3. Track results (fire and forget)
  trackResult('document-analysis', {
    versionId: prompt.versionId,
    success: true,
    tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    latencyMs: Date.now() - startTime,
  });

  return message.content[0].text;
}
```

### Step 3: Create Prompts

1. Go to `/prompts` in the admin UI
2. Click "New Prompt"
3. Set `serviceId` to match your code (e.g., "document-analysis")
4. Create a version with your prompt template
5. Deploy the version

## Prompt Template Example

Use Handlebars syntax for variables:

```
You are an expert document analyst.

Analyze this {{documentType}} document:

{{documentText}}

Provide:
1. Summary
2. Key points
3. Risk assessment
```

Then pass variables when rendering:

```typescript
await renderPrompt('document-analysis', {
  documentType: 'contract',
  documentText: '...',
});
```

## Common Use Cases

### Use Case 1: Dynamic Prompts

**Problem:** You need to update prompt wording without redeploying.

**Solution:**
```typescript
// No hardcoded prompts in code!
const prompt = await renderPrompt('case-summary', { caseData: '...' });
```

Update prompt in Admin UI → Changes live instantly.

### Use Case 2: A/B Testing

**Problem:** You want to test two prompt variations.

**Solution:**
1. Create two versions in Admin UI
2. Enable A/B testing
3. Prompt Service randomly selects version
4. Track results to see which performs better

**No code changes needed.**

### Use Case 3: Version Pinning

**Problem:** Critical operation needs stable, tested prompt.

**Solution:**
```typescript
await renderPrompt('settlement-calculation', {
  variables: { ... },
  version: 'v2.1.0', // Pin to tested version
});
```

## Error Handling

Always add fallback:

```typescript
async function renderWithFallback(serviceId: string, variables: any) {
  try {
    return await renderPrompt(serviceId, variables);
  } catch (error) {
    console.error('Prompt Service down, using fallback');
    return {
      systemPrompt: 'You are a helpful assistant.',
      userPrompt: JSON.stringify(variables),
      config: { model: 'claude-sonnet-4-5', maxTokens: 4096 },
    };
  }
}
```

## Environment Variables

```bash
# Add to your service
PROMPT_SERVICE_URL=https://prompt-service-production-a2e3.up.railway.app

# Or use Railway internal (faster):
PROMPT_SERVICE_URL=http://prompt-service.railway.internal:3002
```

## Testing Locally

1. Start Prompt Service: `cd services/prompt-service && npm run dev`
2. Create test prompts at `http://localhost:3000/prompts`
3. Point your service to `http://localhost:3002`

## API Reference

See [API_CONTRACT.md](./API_CONTRACT.md) for complete documentation.

## Quick Reference

| Action | Endpoint | Method |
|--------|----------|--------|
| Render prompt | `/api/v1/prompts/:serviceId/render` | POST |
| Track result | `/api/v1/prompts/:serviceId/results` | POST |
| Get metadata | `/api/v1/prompts/:serviceId` | GET |
| List prompts | `/api/v1/admin/prompts` | GET |

## Support

Questions? Check:
1. [API_CONTRACT.md](./API_CONTRACT.md) - Full API documentation
2. [README.md](./README.md) - Service overview
3. Admin UI at `/prompts` - Visual prompt management
