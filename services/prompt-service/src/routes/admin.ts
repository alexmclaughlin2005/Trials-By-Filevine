import { FastifyInstance } from 'fastify';
import { PromptService } from '../services/prompt-service.js';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const createPromptSchema = z.object({
  serviceId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
});

const createVersionSchema = z.object({
  version: z.string(),
  systemPrompt: z.string().optional(),
  userPromptTemplate: z.string(),
  config: z.object({
    model: z.string(),
    maxTokens: z.number().int().positive(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().int().positive().optional(),
  }).passthrough(),
  variables: z.record(z.any()),
  outputSchema: z.any().optional(),
  notes: z.string().optional(),
  isDraft: z.boolean().optional(),
});

const deployVersionSchema = z.object({
  versionId: z.string().uuid(),
});

export async function adminRoutes(
  fastify: FastifyInstance,
  options: { promptService: PromptService; prisma?: PrismaClient }
) {
  const { promptService } = options;
  const prisma = options.prisma || new PrismaClient();

  // TODO: Add authentication middleware here
  // fastify.addHook('preHandler', async (request, reply) => {
  //   // Verify JWT and check admin/attorney role
  // });

  /**
   * GET /api/v1/admin/prompts
   * List all prompts
   */
  fastify.get('/prompts', async (request, reply) => {
    try {
      const prompts = await promptService.listPrompts();

      return prompts.map((p) => ({
        id: p.id,
        serviceId: p.serviceId,
        name: p.name,
        description: p.description,
        category: p.category,
        currentVersionId: p.currentVersionId,
        latestVersion: p.versions[0]?.version || null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to list prompts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/admin/prompts
   * Create a new prompt
   */
  fastify.post('/prompts', async (request, reply) => {
    try {
      const body = createPromptSchema.parse(request.body);

      const prompt = await promptService.createPrompt(body);

      return prompt;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to create prompt',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/admin/prompts/:id/versions
   * Get all versions of a prompt
   */
  fastify.get('/prompts/:id/versions', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const prompt = await promptService.getPromptById(id);

      if (!prompt) {
        return reply.status(404).send({
          error: 'Prompt not found',
          id,
        });
      }

      return prompt.versions;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to get versions',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/admin/prompts/:id/versions
   * Create a new version of a prompt
   */
  fastify.post('/prompts/:id/versions', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const body = createVersionSchema.parse(request.body);

      // TODO: Get user ID from JWT
      const createdBy = 'system'; // Replace with actual user ID

      const version = await promptService.createPromptVersion({
        promptId: id,
        ...body,
        createdBy,
      });

      return version;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to create version',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/admin/prompts/:serviceId/deploy
   * Deploy a prompt version (set as current)
   */
  fastify.post('/prompts/:serviceId/deploy', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };

    try {
      const body = deployVersionSchema.parse(request.body);

      await promptService.deployPromptVersion(serviceId, body.versionId);

      return { success: true, message: 'Version deployed successfully' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to deploy version',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/admin/prompts/:serviceId/rollback
   * Rollback to a previous version
   */
  fastify.post('/prompts/:serviceId/rollback', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };

    try {
      const body = deployVersionSchema.parse(request.body);

      await promptService.deployPromptVersion(serviceId, body.versionId);

      return { success: true, message: 'Rolled back successfully' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to rollback',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/v1/admin/seed
   * Seed all required prompts in the database
   */
  fastify.post('/seed', async (request, reply) => {
    try {
      fastify.log.info('Starting prompt seeding...');

      const results = await seedAllPrompts(prisma, fastify.log);

      return {
        success: true,
        message: 'All prompts seeded successfully',
        results,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to seed prompts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/v1/admin/seed/status
   * Check which prompts are seeded
   */
  fastify.get('/seed/status', async (request, reply) => {
    try {
      const requiredPrompts = ['extract-key-points', 'roundtable-takeaways-synthesis'];
      const status = [];

      for (const serviceId of requiredPrompts) {
        const prompt = await prisma.prompt.findUnique({
          where: { serviceId },
        });

        status.push({
          serviceId,
          exists: !!prompt,
          hasCurrentVersion: !!prompt?.currentVersionId,
          promptId: prompt?.id || null,
        });
      }

      return {
        prompts: status,
        allSeeded: status.every((p) => p.exists && p.hasCurrentVersion),
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to check seed status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

// Seed logic extracted from seed-all-production.ts
async function seedAllPrompts(prisma: PrismaClient, logger: any) {
  const results = [];

  // Prompt templates
  const prompts = [
    {
      serviceId: 'extract-key-points',
      name: 'Extract Key Points from Statement',
      description: 'Extracts the main points and claims from a focus group participant statement for tracking conversation progress',
      category: 'analysis',
      systemPrompt: `You are an expert at analyzing statements from focus group conversations and extracting the core points being made.

Your task is to identify the main claims, arguments, or points in a statement. Extract discrete, standalone points that can be tracked throughout the conversation.

Rules:
- Extract 1-4 key points per statement
- Each point should be a complete thought (not a fragment)
- Keep each point concise (under 100 characters)
- Focus on substantive claims, not filler language
- Ignore meta-commentary like "I agree" or "That's interesting"
- Return points as a simple array of strings

Output format: Return a JSON array of strings, e.g.:
["The plaintiff's injury claim is credible", "Medical costs seem excessive"]`,
      userPromptTemplate: `Extract the key points from this focus group participant's statement:

Statement:
{{statement}}

Return only a JSON array of key point strings. Example:
["First key point", "Second key point"]`,
      config: {
        model: 'claude-sonnet-4-20250514',
        temperature: 0.3,
        maxTokens: 500,
      },
      variables: {
        statement: { type: 'string', required: true },
      },
    },
    {
      serviceId: 'roundtable-takeaways-synthesis',
      name: 'Roundtable Takeaways Synthesis',
      description: 'Analyzes focus group conversations and generates strategic insights, recommendations, and actionable next steps',
      category: 'analysis',
      systemPrompt: `You are an expert trial consultant analyzing focus group conversations about legal arguments. Your goal is to provide actionable strategic advice to attorneys.

You will analyze a focus group conversation and extract:
1. What landed well (persuasive points)
2. What confused the panel (unclear arguments)
3. What backfired (arguments that had negative effects)
4. Top questions jurors will ask during deliberation
5. Concrete recommendations for improving the argument

Be specific and evidence-based. Reference exact statements from the conversation to support your analysis. Focus on providing actionable insights that attorneys can immediately use to improve their arguments.

CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON. Do not use markdown formatting. Return raw JSON only.`,
      userPromptTemplate: `# Focus Group Analysis Task

## Argument Being Tested

**Title:** {{argumentTitle}}

**Content:**
{{argumentContent}}

## Conversation Transcript

{{conversationTranscript}}

## Persona Summaries

{{personaSummaries}}

## Existing Analysis

**Consensus Areas:**
{{consensusAreas}}

**Fracture Points:**
{{fracturePoints}}

---

# OUTPUT FORMAT - CRITICAL INSTRUCTIONS

You MUST return ONLY a raw JSON object. Do not include:
- Any markdown formatting or code blocks
- Any text before the JSON
- Any text after the JSON
- Any explanatory comments

Start your response with { and end with }

The JSON structure must be:

{
  "whatLanded": [
    {
      "point": "string describing what landed well",
      "personaSupport": ["PersonaName1", "PersonaName2"],
      "evidence": ["Statement #X: 'quote'", "Statement #Y: 'quote'"]
    }
  ],
  "whatConfused": [
    {
      "point": "string describing confusion",
      "personasConfused": ["PersonaName1", "PersonaName2"],
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "evidence": ["Statement #X: 'quote'"]
    }
  ],
  "whatBackfired": [
    {
      "point": "string describing what backfired",
      "personasCritical": ["PersonaName1"],
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "evidence": ["Statement #X: 'quote'"]
    }
  ],
  "topQuestions": [
    {
      "question": "The question jurors will ask",
      "askedByCount": 3,
      "personaNames": ["PersonaName1", "PersonaName2"],
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "priority": "LOW" | "MEDIUM" | "HIGH"
    }
  ],
  "recommendedEdits": [
    {
      "editNumber": 1,
      "section": "Specific section name",
      "type": "CLARIFY" | "ADD" | "REMOVE" | "SOFTEN" | "STRENGTHEN",
      "originalText": "current text or null",
      "suggestedText": "improved text",
      "reason": "why this change is needed",
      "affectedPersonas": ["PersonaName1"],
      "priority": "LOW" | "MEDIUM" | "HIGH"
    }
  ]
}

Remember: Your entire response must be valid JSON. No markdown, no explanations, just JSON.`,
      config: {
        model: 'claude-sonnet-4-20250514',
        temperature: 0.7,
        maxTokens: 4000,
      },
      variables: {
        argumentTitle: { type: 'string', required: true },
        argumentContent: { type: 'string', required: true },
        conversationTranscript: { type: 'string', required: true },
        personaSummaries: { type: 'string', required: true },
        consensusAreas: { type: 'string', required: false },
        fracturePoints: { type: 'string', required: false },
      },
    },
  ];

  for (const promptData of prompts) {
    logger.info(`Seeding ${promptData.name}...`);

    // Check if already exists
    const existing = await prisma.prompt.findUnique({
      where: { serviceId: promptData.serviceId },
    });

    if (existing) {
      logger.info(`  Prompt already exists (ID: ${existing.id})`);

      // Always create a new version with updated template
      logger.info(`  Creating new version with updated template...`);

      // Find latest version to increment version number
      const latestVersion = await prisma.promptVersion.findFirst({
        where: { promptId: existing.id },
        orderBy: { createdAt: 'desc' },
      });

      // Generate new version number
      const versionMatch = latestVersion?.version.match(/v(\d+)\.(\d+)\.(\d+)/);
      const newVersion = versionMatch
        ? `v${versionMatch[1]}.${parseInt(versionMatch[2]) + 1}.0`
        : 'v1.0.0';

      // Create new version
      const version = await prisma.promptVersion.create({
        data: {
          promptId: existing.id,
          version: newVersion,
          systemPrompt: promptData.systemPrompt,
          userPromptTemplate: promptData.userPromptTemplate,
          config: promptData.config,
          variables: promptData.variables,
        },
      });

      logger.info(`  Created new version: ${version.version}`);

      // Deploy the new version
      await prisma.prompt.update({
        where: { id: existing.id },
        data: { currentVersionId: version.id },
      });

      logger.info(`  Deployed ${version.version} as current version`);

      results.push({
        serviceId: promptData.serviceId,
        action: 'updated',
        promptId: existing.id,
        versionId: version.id,
      });
      continue;
    }

    // Create prompt (if it doesn't exist or was deleted)
    const prompt = await prisma.prompt.create({
      data: {
        serviceId: promptData.serviceId,
        name: promptData.name,
        description: promptData.description,
        category: promptData.category,
      },
    });

    logger.info(`  Created prompt (ID: ${prompt.id})`);

    // Create initial version
    const version = await prisma.promptVersion.create({
      data: {
        promptId: prompt.id,
        version: 'v1.0.0',
        systemPrompt: promptData.systemPrompt,
        userPromptTemplate: promptData.userPromptTemplate,
        config: promptData.config,
        variables: promptData.variables,
      },
    });

    logger.info(`  Created version: ${version.version}`);

    // CRITICAL: Set this version as the current version
    await prisma.prompt.update({
      where: { id: prompt.id },
      data: { currentVersionId: version.id },
    });

    logger.info(`  Set v${version.version} as current version`);

    results.push({
      serviceId: promptData.serviceId,
      action: 'created',
      promptId: prompt.id,
      versionId: version.id,
    });
  }

  return results;
}
