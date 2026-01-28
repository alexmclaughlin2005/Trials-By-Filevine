import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

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
}
