# @juries/ai-client

Claude API client wrapper for consistent AI service integration across the platform.

## Overview

This package provides a standardized interface for interacting with Anthropic's Claude 4.5 models, including:
- Structured request/response handling
- Automatic retry logic with exponential backoff
- Response format standardization
- Error handling and logging
- Rate limiting awareness
- Token usage tracking

## Installation

```bash
npm install @juries/ai-client
```

## Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL_VERSION=claude-sonnet-4-5-20250929
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7
```

## Usage

### Basic Claude Call

```typescript
import { ClaudeClient } from '@juries/ai-client';

const client = new ClaudeClient({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-5-20250929'
});

const response = await client.complete({
  messages: [
    { role: 'user', content: 'Analyze this juror profile...' }
  ],
  system: 'You are an expert jury consultant.',
  max_tokens: 2048
});

console.log(response.content);
```

### Structured AI Response

All AI services return responses in a standardized format:

```typescript
interface AIResponse<T> {
  result: T;                    // The primary result
  confidence: number;           // 0.0 - 1.0
  rationale: string;            // Human-readable explanation
  sources: Source[];            // Citations with provenance
  counterfactual: string;       // What would change this
  model_version: string;        // Model used
  latency_ms: number;           // Processing time
}
```

### Using Structured Responses

```typescript
import { createStructuredPrompt, parseStructuredResponse } from '@juries/ai-client';

// Create prompt with expected response structure
const prompt = createStructuredPrompt({
  task: 'Suggest personas for this juror',
  input: jurorProfile,
  outputSchema: PersonaSuggestionSchema
});

// Call Claude
const response = await client.complete({
  messages: [{ role: 'user', content: prompt }],
  system: personaSuggesterSystemPrompt
});

// Parse structured response
const parsed = parseStructuredResponse<PersonaSuggestion>(
  response.content,
  PersonaSuggestionSchema
);

console.log(parsed.result); // Type-safe persona suggestions
console.log(parsed.confidence); // 0.85
console.log(parsed.rationale); // "Based on social media activity..."
```

### Retry Logic

The client automatically retries failed requests:

```typescript
const client = new ClaudeClient({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  retries: 3,
  retryDelay: 1000, // ms
  retryBackoff: 2 // exponential multiplier
});

// Automatically retries on transient failures
const response = await client.complete({...});
```

### Streaming Responses

For real-time trial analysis:

```typescript
const stream = await client.stream({
  messages: [{ role: 'user', content: transcriptChunk }],
  system: trialInsightSystemPrompt
});

for await (const chunk of stream) {
  console.log(chunk.delta); // Incremental response
  // Push to WebSocket for real-time UI updates
}
```

### Token Usage Tracking

```typescript
const response = await client.complete({...});

console.log(response.usage);
// {
//   input_tokens: 1234,
//   output_tokens: 567,
//   total_tokens: 1801
// }

// Track costs
const cost = response.usage.total_tokens * COST_PER_TOKEN;
```

### Error Handling

```typescript
import { ClaudeError, RateLimitError, InvalidRequestError } from '@juries/ai-client';

try {
  const response = await client.complete({...});
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limiting - wait and retry
    console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
  } else if (error instanceof InvalidRequestError) {
    // Handle invalid request - fix input
    console.error('Invalid request:', error.message);
  } else if (error instanceof ClaudeError) {
    // Generic Claude API error
    console.error('Claude API error:', error.message);
  }
}
```

## Advanced Features

### Caching Prompts

For repeated system prompts:

```typescript
const client = new ClaudeClient({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  cacheSystemPrompts: true // Enable prompt caching
});

// System prompt will be cached for 5 minutes
const response = await client.complete({
  system: longSystemPrompt, // Cached
  messages: [{ role: 'user', content: 'New query' }]
});
```

### Model Versioning

Support multiple model versions:

```typescript
// Use latest model
const latestClient = new ClaudeClient({
  model: 'claude-sonnet-4-5-20250929'
});

// Use specific version for consistency
const stableClient = new ClaudeClient({
  model: 'claude-sonnet-4-5-20250929',
  modelVersion: 'v1.0.0' // Your internal versioning
});
```

### Audit Logging

All AI calls are automatically logged:

```typescript
const response = await client.complete({...});

// Logged information:
// - Request timestamp
// - Input hash (for deduplication)
// - Model version
// - Tokens used
// - Latency
// - Response summary
```

## Best Practices

1. **Always handle errors** - Network issues, rate limits, and API errors can occur
2. **Use structured responses** - Enforce consistent AI output formats
3. **Set appropriate timeouts** - AI calls can be slow; set realistic timeouts
4. **Monitor token usage** - Track costs and optimize prompts
5. **Cache when possible** - Reuse system prompts to reduce costs
6. **Validate AI outputs** - Never trust AI responses without validation
7. **Include counterfactuals** - Always ask "what would change this?"

## Testing

```bash
npm test
```

Mock client for testing:

```typescript
import { MockClaudeClient } from '@juries/ai-client/testing';

const mockClient = new MockClaudeClient({
  mockResponse: {
    content: 'Mocked response',
    usage: { input_tokens: 100, output_tokens: 50 }
  }
});

// Use in tests
const response = await mockClient.complete({...});
```

## Rate Limits

Be aware of Anthropic rate limits:
- Tier 1: 50 requests/minute
- Tier 2: 1000 requests/minute
- Monitor `x-ratelimit-*` headers

The client automatically handles rate limiting with exponential backoff.

## Support

For issues with this package, see the main project documentation or contact the AI services team.
