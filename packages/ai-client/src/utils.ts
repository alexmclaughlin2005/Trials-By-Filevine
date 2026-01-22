import type { AIResponse } from '@juries/types';

/**
 * Create a structured prompt that instructs Claude to return JSON in our standard format
 */
export function createStructuredPrompt<T>(options: {
  task: string;
  input: unknown;
  outputSchema?: Record<string, unknown>;
  additionalInstructions?: string;
}): string {
  const { task, input, outputSchema, additionalInstructions } = options;

  return `${task}

INPUT:
${JSON.stringify(input, null, 2)}

${outputSchema ? `EXPECTED OUTPUT SCHEMA:\n${JSON.stringify(outputSchema, null, 2)}\n` : ''}

INSTRUCTIONS:
You must respond with a JSON object in the following format:
{
  "result": <your analysis result>,
  "confidence": <number between 0.0 and 1.0>,
  "rationale": "<clear explanation of your reasoning>",
  "sources": [
    {
      "sourceType": "<type of source>",
      "artifactId": "<optional artifact ID>",
      "snippet": "<relevant text from source>",
      "relevance": "<why this is relevant>"
    }
  ],
  "counterfactual": "<what would change this assessment>"
}

${additionalInstructions || ''}

IMPORTANT:
- Be specific and cite sources
- Confidence should reflect how certain you are
- Rationale should be clear and actionable
- Counterfactual should identify what evidence would change your mind
- Return ONLY valid JSON, no markdown formatting or code blocks`;
}

/**
 * Parse Claude's response into our standard AI response format
 */
export function parseStructuredResponse<T>(
  content: string,
  validator?: (result: T) => boolean
): AIResponse<T> {
  try {
    // Remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleanContent);

    // Validate structure
    if (!parsed.result || typeof parsed.confidence !== 'number' || !parsed.rationale) {
      throw new Error('Response missing required fields');
    }

    if (parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }

    // Validate result if validator provided
    if (validator && !validator(parsed.result)) {
      throw new Error('Result validation failed');
    }

    return {
      result: parsed.result as T,
      confidence: parsed.confidence,
      rationale: parsed.rationale,
      sources: parsed.sources || [],
      counterfactual: parsed.counterfactual || '',
      modelVersion: parsed.modelVersion || 'unknown',
      latencyMs: parsed.latencyMs || 0,
    };
  } catch (error) {
    throw new Error(`Failed to parse structured response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate approximate token count for text
 * Note: This is a rough estimate. Use Anthropic's tokenization for accuracy.
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within token limit
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokenCount(text);
  if (estimatedTokens <= maxTokens) {
    return text;
  }

  const ratio = maxTokens / estimatedTokens;
  const targetLength = Math.floor(text.length * ratio * 0.9); // 90% to be safe
  return text.slice(0, targetLength) + '...';
}

/**
 * Build conversation history for context
 */
export function buildConversationHistory(messages: Array<{
  role: 'user' | 'assistant';
  content: string;
}>): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Format sources for display
 */
export function formatSources(sources: AIResponse<unknown>['sources']): string {
  if (!sources || sources.length === 0) {
    return 'No sources cited';
  }

  return sources
    .map((source, idx) => {
      return `[${idx + 1}] ${source.sourceType}: "${source.snippet}" (${source.relevance})`;
    })
    .join('\n');
}
