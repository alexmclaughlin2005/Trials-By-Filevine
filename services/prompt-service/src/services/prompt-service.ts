import { PrismaClient } from '@prisma/client';
import { TemplateEngine } from './template-engine.js';
import { CacheService } from './cache-service.js';

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

export class PromptService {
  private prisma: PrismaClient;
  private templateEngine: TemplateEngine;
  private cache: CacheService;

  constructor(prisma: PrismaClient, cache: CacheService) {
    this.prisma = prisma;
    this.templateEngine = new TemplateEngine();
    this.cache = cache;
  }

  /**
   * Get prompt by service ID
   */
  async getPrompt(serviceId: string) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { serviceId },
      include: {
        versions: {
          where: { isDraft: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return prompt;
  }

  /**
   * Get specific version of a prompt
   */
  async getPromptVersion(serviceId: string, version: string = 'latest') {
    const prompt = await this.getPrompt(serviceId);

    if (!prompt) {
      throw new Error(`Prompt not found: ${serviceId}`);
    }

    // If "latest", get current version
    if (version === 'latest') {
      if (!prompt.currentVersionId) {
        throw new Error(`No current version set for prompt: ${serviceId}`);
      }

      return await this.prisma.promptVersion.findUnique({
        where: { id: prompt.currentVersionId },
      });
    }

    // Otherwise find by version string
    return await this.prisma.promptVersion.findUnique({
      where: {
        promptId_version: {
          promptId: prompt.id,
          version,
        },
      },
    });
  }

  /**
   * Render prompt with variables
   */
  async renderPrompt(
    serviceId: string,
    variables: Record<string, any>,
    version: string = 'latest',
    abTestEnabled: boolean = true
  ): Promise<RenderedPrompt> {
    // Check cache first
    const cacheKey = this.getCacheKey(serviceId, variables, version);
    const cached = await this.cache.get<RenderedPrompt>(cacheKey);

    if (cached) {
      return cached;
    }

    // Determine which version to use (handle A/B tests)
    let promptVersion = await this.getPromptVersion(serviceId, version);
    let abTestId: string | undefined;
    let isVariant = false;

    if (abTestEnabled && version === 'latest') {
      const abTest = await this.getActiveABTest(serviceId);
      if (abTest) {
        // Determine which version to use based on traffic split
        const useVariant = Math.random() * 100 < abTest.trafficSplit;
        promptVersion = useVariant
          ? await this.prisma.promptVersion.findUnique({
              where: { id: abTest.variantVersionId },
            })
          : await this.prisma.promptVersion.findUnique({
              where: { id: abTest.controlVersionId },
            });

        if (!promptVersion) {
          throw new Error(`A/B test version not found`);
        }

        abTestId = abTest.id;
        isVariant = useVariant;
      }
    }

    if (!promptVersion) {
      throw new Error(`Prompt version not found: ${serviceId} v${version}`);
    }

    // Validate variables
    const validation = this.templateEngine.validateVariables(
      promptVersion.userPromptTemplate,
      variables
    );

    if (!validation.valid) {
      throw new Error(
        `Missing required variables: ${validation.missingVariables.join(', ')}`
      );
    }

    // Render user prompt
    const userPrompt = this.templateEngine.render(
      promptVersion.userPromptTemplate,
      variables
    );

    const prompt = await this.getPrompt(serviceId);

    const result: RenderedPrompt = {
      promptId: prompt!.id,
      versionId: promptVersion.id,
      version: promptVersion.version,
      systemPrompt: promptVersion.systemPrompt,
      userPrompt,
      config: promptVersion.config as PromptConfig,
      abTestId,
      isVariant,
    };

    // Cache result
    await this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Track prompt execution result
   */
  async trackResult(serviceId: string, result: PromptExecutionResult): Promise<void> {
    const prompt = await this.getPrompt(serviceId);

    if (!prompt) {
      console.warn(`Cannot track result for unknown prompt: ${serviceId}`);
      return;
    }

    await this.prisma.promptAnalytics.create({
      data: {
        promptId: prompt.id,
        versionId: result.versionId,
        abTestId: result.abTestId,
        success: result.success,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        confidence: result.confidence,
        errorMessage: result.errorMessage,
        metadata: result.metadata || {},
      },
    });
  }

  /**
   * Get active A/B test for a prompt
   */
  private async getActiveABTest(serviceId: string) {
    const prompt = await this.getPrompt(serviceId);

    if (!prompt) {
      return null;
    }

    return await this.prisma.aBTest.findFirst({
      where: {
        promptId: prompt.id,
        status: 'running',
      },
    });
  }

  /**
   * Create cache key for prompt
   */
  private getCacheKey(
    serviceId: string,
    variables: Record<string, any>,
    version: string
  ): string {
    const varsHash = JSON.stringify(variables);
    return `prompt:${serviceId}:${version}:${Buffer.from(varsHash).toString('base64')}`;
  }

  /**
   * Invalidate cache for a prompt
   */
  async invalidateCache(serviceId: string): Promise<void> {
    await this.cache.delPattern(`prompt:${serviceId}:*`);
  }

  /**
   * Create a new prompt
   */
  async createPrompt(data: {
    serviceId: string;
    name: string;
    description?: string;
    category?: string;
  }) {
    return await this.prisma.prompt.create({
      data,
    });
  }

  /**
   * Create a new prompt version
   */
  async createPromptVersion(data: {
    promptId: string;
    version: string;
    systemPrompt?: string;
    userPromptTemplate: string;
    config: PromptConfig;
    variables: Record<string, any>;
    outputSchema?: any;
    createdBy?: string;
    notes?: string;
    isDraft?: boolean;
  }) {
    return await this.prisma.promptVersion.create({
      data: {
        ...data,
        config: data.config as any,
        variables: data.variables as any,
        outputSchema: data.outputSchema as any,
      },
    });
  }

  /**
   * Deploy a prompt version (set as current)
   */
  async deployPromptVersion(serviceId: string, versionId: string) {
    const prompt = await this.getPrompt(serviceId);

    if (!prompt) {
      throw new Error(`Prompt not found: ${serviceId}`);
    }

    // Verify version exists and belongs to this prompt
    const version = await this.prisma.promptVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.promptId !== prompt.id) {
      throw new Error(`Invalid version: ${versionId}`);
    }

    // Update prompt to use this version
    await this.prisma.prompt.update({
      where: { id: prompt.id },
      data: { currentVersionId: versionId },
    });

    // Invalidate cache
    await this.invalidateCache(serviceId);
  }

  /**
   * List all prompts
   */
  async listPrompts() {
    return await this.prisma.prompt.findMany({
      include: {
        versions: {
          where: { isDraft: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  /**
   * Get analytics for a prompt version
   */
  async getAnalytics(versionId: string, limit: number = 100) {
    return await this.prisma.promptAnalytics.findMany({
      where: { versionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
