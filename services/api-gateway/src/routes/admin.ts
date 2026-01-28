import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { refreshFeatureFlags } from '../utils/feature-flags';

// TODO: Add proper authentication middleware
// For now, this is open but should be protected in production

export async function adminRoutes(fastify: FastifyInstance) {
  const PROMPT_SERVICE_URL = process.env.PROMPT_SERVICE_URL || 'http://localhost:3002';

  /**
   * POST /api/admin/seed-prompts
   * Seed all required prompts in the database
   */
  fastify.post('/seed-prompts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      fastify.log.info('Triggering prompt seeding...');

      const response = await fetch(`${PROMPT_SERVICE_URL}/api/v1/admin/seed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to seed prompts');
      }

      const data = await response.json();

      return {
        success: true,
        message: 'Prompts seeded successfully',
        data,
      };
    } catch (error) {
      fastify.log.error({ error }, 'Error seeding prompts');
      return reply.status(500).send({
        success: false,
        error: 'Failed to seed prompts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/admin/seed-status
   * Check which prompts are seeded
   */
  fastify.get('/seed-status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = await fetch(`${PROMPT_SERVICE_URL}/api/v1/admin/seed/status`);

      if (!response.ok) {
        throw new Error('Failed to get seed status');
      }

      const data = await response.json();

      return data;
    } catch (error) {
      fastify.log.error({ error }, 'Error getting seed status');
      return reply.status(500).send({
        error: 'Failed to get seed status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/admin/import-personas-v2
   * Import V2 personas from JSON files into the database
   */
  fastify.post('/import-personas-v2', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      fastify.log.info('Starting Persona V2 import...');

      const { PrismaClient } = require('@juries/database');
      const fs = require('fs');
      const path = require('path');
      const localPrisma = new PrismaClient();

      const PERSONA_UPDATES_DIR = path.join(__dirname, '..', '..', '..', '..', 'Persona Updates');

      const PERSONA_FILES = [
        'bootstrappers.json',
        'crusaders.json',
        'scale_balancers.json',
        'captains.json',
        'chameleons.json',
        'hearts.json',
        'calculators.json',
        'scarred.json',
        'trojan_horses.json',
        'mavericks.json'
      ];

      let totalImported = 0;
      const errors: string[] = [];

      for (const filename of PERSONA_FILES) {
        const filePath = path.join(PERSONA_UPDATES_DIR, filename);

        if (!fs.existsSync(filePath)) {
          errors.push(`File not found: ${filename}`);
          continue;
        }

        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const personaFile: any = JSON.parse(fileContent);

          for (const persona of personaFile.personas) {
            const existing = await localPrisma.persona.findFirst({
              where: {
                name: persona.name,
                sourceType: 'system'
              }
            });

            const personaData = {
              name: persona.name,
              nickname: persona.nickname,
              tagline: persona.tagline,
              description: persona.backstory,
              backstory: persona.backstory,
              archetype: persona.archetype,
              archetypeVerdictLean: persona.archetype_verdict_lean,
              instantRead: persona.instant_read,
              phrasesYoullHear: persona.phrases_youll_hear,
              verdictPrediction: persona.verdict_prediction,
              strikeOrKeep: persona.strike_or_keep,
              plaintiffDangerLevel: persona.plaintiff_danger_level,
              defenseDangerLevel: persona.defense_danger_level,
              demographics: persona.demographics || {},
              updatedAt: new Date()
            };

            if (existing) {
              await localPrisma.persona.update({
                where: { id: existing.id },
                data: personaData
              });
            } else {
              await localPrisma.persona.create({
                data: {
                  ...personaData,
                  sourceType: 'system'
                }
              });
            }
            totalImported++;
          }

          fastify.log.info(`Imported personas from ${filename}`);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`Error processing ${filename}: ${errorMessage}`);
        }
      }

      await localPrisma.$disconnect();

      return {
        success: true,
        message: `Successfully imported/updated ${totalImported} personas`,
        imported: totalImported,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      fastify.log.error({ error }, 'Error importing personas');
      return reply.status(500).send({
        success: false,
        error: 'Failed to import personas',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/admin/feature-flags
   * Get all feature flags
   */
  fastify.get('/feature-flags', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const flags = await fastify.prisma.featureFlag.findMany({
        where: {
          organizationId: null, // Only global flags for now
        },
        orderBy: {
          name: 'asc',
        },
      });

      return { flags };
    } catch (error) {
      fastify.log.error({ error }, 'Error fetching feature flags');
      return reply.status(500).send({
        error: 'Failed to fetch feature flags',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * PUT /api/admin/feature-flags/:key
   * Toggle a feature flag
   */
  fastify.put('/feature-flags/:key', async (request: FastifyRequest<{ Params: { key: string }; Body: { enabled: boolean } }>, reply: FastifyReply) => {
    try {
      const { key } = request.params;
      const { enabled } = request.body;

      fastify.log.info({ key, enabled }, 'Toggling feature flag');

      // For global flags (organizationId: null), we can't use upsert with compound unique key
      // Instead, find first and then create or update
      const existingFlag = await fastify.prisma.featureFlag.findFirst({
        where: {
          key,
          organizationId: null,
        },
      });

      let flag;
      if (existingFlag) {
        // Update existing flag
        flag = await fastify.prisma.featureFlag.update({
          where: { id: existingFlag.id },
          data: {
            enabled,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new flag (shouldn't happen if seeding worked, but handle gracefully)
        flag = await fastify.prisma.featureFlag.create({
          data: {
            key,
            name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            enabled,
            organizationId: null,
          },
        });
      }

      fastify.log.info({ flag }, 'Feature flag toggled');

      // Refresh the feature flag cache
      await refreshFeatureFlags(fastify.prisma);

      return { flag };
    } catch (error) {
      fastify.log.error({ error }, 'Error toggling feature flag');
      return reply.status(500).send({
        error: 'Failed to toggle feature flag',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/admin/seed-feature-flags
   * Seed default feature flags
   */
  fastify.post('/seed-feature-flags', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      fastify.log.info('Seeding feature flags...');

      // Check if featureFlag exists on prisma client
      if (!fastify.prisma.featureFlag) {
        const errorMsg = 'Prisma client does not have featureFlag model. Run: yarn db:generate';
        fastify.log.error(errorMsg);
        return reply.status(500).send({
          success: false,
          error: 'Prisma client not updated',
          message: errorMsg,
        });
      }

      const defaultFlags = [
        {
          key: 'personas_v2',
          name: 'Persona V2 Data',
          description: 'Use enhanced V2 persona data with instant reads, danger levels, and strike/keep strategies',
          enabled: false,
        },
        {
          key: 'focus_groups_v2',
          name: 'Focus Groups V2',
          description: 'Use V2 persona data in focus group simulations with realistic language patterns',
          enabled: false,
        },
        {
          key: 'voir_dire_v2',
          name: 'Voir Dire Generator V2',
          description: 'Enable V2 voir dire question generation using "Phrases You\'ll Hear" data',
          enabled: false,
        },
      ];

      const results = [];

      for (const flagData of defaultFlags) {
        fastify.log.info({ flagData }, 'Upserting feature flag');
        
        // For global flags (organizationId: null), we can't use upsert with compound unique key
        // Instead, find first and then create or update
        const existingFlag = await fastify.prisma.featureFlag.findFirst({
          where: {
            key: flagData.key,
            organizationId: null,
          },
        });

        let flag;
        if (existingFlag) {
          // Update existing flag
          flag = await fastify.prisma.featureFlag.update({
            where: { id: existingFlag.id },
            data: {
              name: flagData.name,
              description: flagData.description,
            },
          });
        } else {
          // Create new flag
          flag = await fastify.prisma.featureFlag.create({
            data: {
              ...flagData,
              organizationId: null,
            },
          });
        }
        results.push(flag);
      }

      return {
        success: true,
        message: `Successfully seeded ${results.length} feature flags`,
        flags: results,
      };
    } catch (error) {
      fastify.log.error({ error }, 'Error seeding feature flags');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      fastify.log.error({ errorMessage, errorStack }, 'Detailed error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to seed feature flags',
        message: errorMessage,
        details: errorStack,
      });
    }
  });
}
