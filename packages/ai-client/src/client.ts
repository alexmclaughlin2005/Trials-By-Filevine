import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, ContentBlock } from '@anthropic-ai/sdk/resources';
import {
  ClaudeError,
  RateLimitError,
  InvalidRequestError,
  AuthenticationError,
  TimeoutError,
} from './errors';

export interface ClaudeClientConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  retries?: number;
  retryDelay?: number;
  retryBackoff?: number;
  timeout?: number;
  cacheSystemPrompts?: boolean;
}

export interface CompleteOptions {
  messages: MessageParam[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface CompleteResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  stopReason: string | null;
  model: string;
}

export interface StreamOptions extends CompleteOptions {
  onChunk?: (chunk: { delta: string; stopReason: string | null }) => void;
}

export class ClaudeClient {
  private client: Anthropic;
  private config: Required<ClaudeClientConfig>;

  constructor(config: ClaudeClientConfig) {
    if (!config.apiKey) {
      throw new InvalidRequestError('API key is required');
    }

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'claude-sonnet-4-5-20250929',
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      retryBackoff: config.retryBackoff || 2,
      timeout: config.timeout || 60000,
      cacheSystemPrompts: config.cacheSystemPrompts || false,
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      maxRetries: 0, // We handle retries ourselves
      timeout: this.config.timeout,
    });
  }

  /**
   * Complete a prompt with Claude
   */
  async complete(options: CompleteOptions): Promise<CompleteResponse> {
    const startTime = Date.now();

    try {
      const response = await this.executeWithRetry(async () => {
        return await this.client.messages.create({
          model: this.config.model,
          max_tokens: options.maxTokens || this.config.maxTokens,
          temperature: options.temperature ?? this.config.temperature,
          system: options.system,
          messages: options.messages,
          stop_sequences: options.stopSequences,
        });
      });

      // Extract text content from response
      const textContent = response.content
        .filter((block): block is Extract<ContentBlock, { type: 'text' }> => block.type === 'text')
        .map((block) => block.text)
        .join('');

      const latency = Date.now() - startTime;

      // Log for monitoring (in production, send to monitoring service)
      this.logRequest({
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        latency,
      });

      return {
        content: textContent,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        stopReason: response.stop_reason,
        model: response.model,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Stream a response from Claude
   */
  async stream(options: StreamOptions): Promise<AsyncIterable<{ delta: string; stopReason: string | null }>> {
    try {
      const stream = await this.client.messages.create({
        model: this.config.model,
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature,
        system: options.system,
        messages: options.messages,
        stream: true,
      });

      return this.createStreamIterator(stream, options.onChunk);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Execute a function with exponential backoff retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.config.retryDelay;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain errors
        if (
          error?.status === 400 ||
          error?.status === 401 ||
          error?.status === 403 ||
          error?.status === 404
        ) {
          throw error;
        }

        // Check if we should retry
        if (attempt < this.config.retries) {
          // Handle rate limiting
          if (error?.status === 429) {
            const retryAfter = error?.headers?.['retry-after'];
            delay = retryAfter ? parseInt(retryAfter) * 1000 : delay;
          }

          console.warn(`Retry attempt ${attempt + 1}/${this.config.retries} after ${delay}ms`);
          await this.sleep(delay);
          delay *= this.config.retryBackoff;
        }
      }
    }

    throw lastError || new ClaudeError('Unknown error during retry logic');
  }

  /**
   * Create an async iterator for streaming responses
   */
  private async *createStreamIterator(
    stream: AsyncIterable<Anthropic.MessageStreamEvent>,
    onChunk?: (chunk: { delta: string; stopReason: string | null }) => void
  ): AsyncIterable<{ delta: string; stopReason: string | null }> {
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const chunk = {
          delta: event.delta.text,
          stopReason: null,
        };
        onChunk?.(chunk);
        yield chunk;
      } else if (event.type === 'message_delta') {
        const chunk = {
          delta: '',
          stopReason: event.delta.stop_reason || null,
        };
        onChunk?.(chunk);
        yield chunk;
      }
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any): ClaudeError {
    if (error instanceof ClaudeError) {
      return error;
    }

    const message = error?.message || 'Unknown error';
    const status = error?.status;

    if (status === 429) {
      const retryAfter = error?.headers?.['retry-after'];
      return new RateLimitError(
        message,
        retryAfter ? parseInt(retryAfter) * 1000 : undefined
      );
    }

    if (status === 400) {
      return new InvalidRequestError(message, error?.error);
    }

    if (status === 401 || status === 403) {
      return new AuthenticationError(message);
    }

    if (status === 408 || error?.code === 'ETIMEDOUT') {
      return new TimeoutError(message);
    }

    return new ClaudeError(message, status, error);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log request for monitoring
   */
  private logRequest(data: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    latency: number;
  }): void {
    // In production, send to monitoring service (Sentry, DataDog, etc.)
    if (process.env.NODE_ENV === 'development') {
      console.log('[ClaudeClient]', {
        model: data.model,
        tokens: `${data.inputTokens} in / ${data.outputTokens} out`,
        latency: `${data.latency}ms`,
      });
    }
  }
}
