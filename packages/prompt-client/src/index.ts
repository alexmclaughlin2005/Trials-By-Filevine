import Anthropic from '@anthropic-ai/sdk';

export interface PromptConfig {
  model: string;
  maxTokens: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  [key: string]: any;
}

export interface RenderedPrompt {
  promptId: string;
  versionId: string;
  version: string;
  systemPrompt: string | null;
  userPrompt: string;
  config: PromptConfig;
  abTestId?: string;
  isVariant?: boolean;
}

export interface PromptExecutionResult {
  versionId: string;
  abTestId?: string;
  success: boolean;
  tokensUsed?: number;
  latencyMs?: number;
  confidence?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface PromptClientOptions {
  serviceUrl: string;
  anthropicApiKey?: string;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

export class PromptClient {
  private baseUrl: string;
  private anthropicApiKey?: string;
  private cache: Map<string, { prompt: RenderedPrompt; expiry: number }>;
  private cacheEnabled: boolean;
  private cacheTTL: number;

  constructor(options: PromptClientOptions) {
    this.baseUrl = options.serviceUrl;
    this.anthropicApiKey = options.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    this.cache = new Map();
    this.cacheEnabled = options.cacheEnabled !== false;
    this.cacheTTL = options.cacheTTL || 300000; // 5 minutes default
  }

  /**
   * Get and render a prompt for execution
   */
  async getPrompt(
    serviceId: string,
    context: {
      variables: Record<string, any>;
      version?: string;
      abTestEnabled?: boolean;
    }
  ): Promise<RenderedPrompt> {
    const cacheKey = this.getCacheKey(serviceId, context);

    // Check cache
    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.prompt;
      }
    }

    // Fetch from service
    const response = await fetch(`${this.baseUrl}/api/v1/prompts/${serviceId}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variables: context.variables,
        version: context.version || 'latest',
        abTestEnabled: context.abTestEnabled !== false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
      throw new Error(`Failed to fetch prompt: ${error.error || response.statusText}`);
    }

    const prompt = await response.json() as RenderedPrompt;

    // Cache result
    if (this.cacheEnabled) {
      this.cache.set(cacheKey, {
        prompt,
        expiry: Date.now() + this.cacheTTL,
      });
    }

    return prompt;
  }

  /**
   * Execute prompt with Claude API
   */
  async execute(
    serviceId: string,
    context: {
      variables: Record<string, any>;
      version?: string;
      abTestEnabled?: boolean;
    }
  ): Promise<{
    result: Anthropic.Messages.Message;
    promptMeta: RenderedPrompt;
  }> {
    if (!this.anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const prompt = await this.getPrompt(serviceId, context);
    const anthropic = new Anthropic({ apiKey: this.anthropicApiKey });

    const startTime = Date.now();
    let success = false;
    let tokensUsed = 0;

    try {
      const messages: Anthropic.Messages.MessageParam[] = [
        { role: 'user', content: prompt.userPrompt },
      ];

      const response = await anthropic.messages.create({
        model: prompt.config.model,
        max_tokens: prompt.config.maxTokens,
        temperature: prompt.config.temperature,
        top_p: prompt.config.topP,
        top_k: prompt.config.topK,
        system: prompt.systemPrompt || undefined,
        messages,
      });

      success = true;
      tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

      // Track result
      await this.trackResult(serviceId, {
        versionId: prompt.versionId,
        abTestId: prompt.abTestId,
        success: true,
        tokensUsed,
        latencyMs: Date.now() - startTime,
      });

      return { result: response, promptMeta: prompt };
    } catch (error) {
      // Track failure
      await this.trackResult(serviceId, {
        versionId: prompt.versionId,
        abTestId: prompt.abTestId,
        success: false,
        tokensUsed,
        latencyMs: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Track prompt execution result
   */
  async trackResult(serviceId: string, result: PromptExecutionResult): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/v1/prompts/${serviceId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
    } catch (error) {
      // Don't throw - tracking is best-effort
      console.warn(`Failed to track prompt result for ${serviceId}:`, error);
    }
  }

  /**
   * Get cache key for prompt
   */
  private getCacheKey(
    serviceId: string,
    context: {
      variables: Record<string, any>;
      version?: string;
    }
  ): string {
    const varsHash = JSON.stringify(context.variables);
    const version = context.version || 'latest';
    return `${serviceId}:${version}:${Buffer.from(varsHash).toString('base64')}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get prompt metadata (without rendering)
   */
  async getPromptMetadata(serviceId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/prompts/${serviceId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
      throw new Error(`Failed to fetch prompt metadata: ${error.error || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get analytics for a prompt version
   */
  async getAnalytics(serviceId: string, versionId: string, limit?: number): Promise<any> {
    const url = new URL(
      `${this.baseUrl}/api/v1/prompts/${serviceId}/versions/${versionId}/analytics`
    );

    if (limit) {
      url.searchParams.set('limit', limit.toString());
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
      throw new Error(`Failed to fetch analytics: ${error.error || response.statusText}`);
    }

    return await response.json();
  }
}

export default PromptClient;
