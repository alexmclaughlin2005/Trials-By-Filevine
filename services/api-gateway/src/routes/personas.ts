import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getPersonaImageUrl, getPersonaImagePath, findPersonaIdFromDatabase, listAvailableJsonPersonas, loadPersonaImageMappings } from '../services/persona-image-utils';
import { generateSinglePersonaHeadshot } from '../services/persona-headshot-service';
import * as fs from 'fs/promises';
import * as path from 'path';

// Simple string similarity function (Levenshtein-like)
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

const createPersonaSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  attributes: z.record(z.any()),
  voirDireApproach: z.string().optional(),
  challengeStrategy: z.string().optional(),
});

const updatePersonaSchema = createPersonaSchema.partial();

export async function personasRoutes(server: FastifyInstance) {
  // Get all personas (system + organization-specific)
  server.get('/', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { version, archetype } = request.query as any;

      const personas = await server.prisma.persona.findMany({
        where: {
          OR: [{ organizationId }, { sourceType: 'system' }],
          ...(version && { version: parseInt(version) }),
          ...(archetype && { archetype }),
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          description: true,
          tagline: true,
          archetype: true,
          secondaryArchetype: true,
          archetypeStrength: true,
          sourceType: true,

          // NEW V2 Fields - Archetype-level
          archetypeVerdictLean: true,
          archetypeWhatTheyBelieve: true,
          archetypeDeliberationBehavior: true,
          archetypeHowToSpot: true,

          // NEW V2 Fields - Persona-specific
          instantRead: true,
          phrasesYoullHear: true,
          verdictPrediction: true,
          strikeOrKeep: true,

          // Demographics and existing fields
          demographics: true,
          dimensions: true,
          plaintiffDangerLevel: true,
          defenseDangerLevel: true,

          // Metadata
          version: true,
          isActive: true,
          createdAt: true,

          _count: {
            select: {
              jurorMappings: true,
              focusGroupPersonas: true,
            },
          },
        },
        orderBy: [{ sourceType: 'asc' }, { archetype: 'asc' }, { createdAt: 'desc' }],
      });

      // Add imageUrl to each persona (gracefully handle errors to not break persona fetching)
      const personasWithImages = await Promise.all(
        personas.map(async (persona) => {
          let imageUrl: string | null = null;
          try {
            imageUrl = await getPersonaImageUrl(
              persona.id,
              persona.name,
              persona.nickname || null,
              persona.archetype || null
            );
          } catch (error) {
            // Log error but don't break persona fetching
            server.log.warn({ error, personaId: persona.id }, 'Failed to get persona image URL');
          }
          return {
            ...persona,
            imageUrl: imageUrl || undefined,
          };
        })
      );

      return { personas: personasWithImages };
    },
  });

  // Get a single persona
  server.get('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;

      const persona = await server.prisma.persona.findFirst({
        where: {
          id,
          OR: [{ organizationId }, { sourceType: 'system' }],
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          description: true,
          tagline: true,
          archetype: true,
          secondaryArchetype: true,
          archetypeStrength: true,
          sourceType: true,
          variant: true,

          // NEW V2 Fields - Archetype-level
          archetypeVerdictLean: true,
          archetypeWhatTheyBelieve: true,
          archetypeDeliberationBehavior: true,
          archetypeHowToSpot: true,

          // NEW V2 Fields - Persona-specific
          instantRead: true,
          phrasesYoullHear: true,
          verdictPrediction: true,
          strikeOrKeep: true,

          // Demographics and attributes
          demographics: true,
          dimensions: true,
          lifeExperiences: true,
          characteristicPhrases: true,
          voirDireResponses: true,
          deliberationBehavior: true,

          // Strategic guidance
          plaintiffDangerLevel: true,
          defenseDangerLevel: true,
          causeChallenge: true,
          strategyGuidance: true,

          // Simulation parameters
          simulationParams: true,
          caseTypeModifiers: true,

          // Metadata
          version: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,

          jurorMappings: {
            include: {
              juror: {
                include: {
                  panel: {
                    include: {
                      case: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              focusGroupPersonas: true,
            },
          },
        },
      });

      if (!persona) {
        reply.code(404);
        return { error: 'Persona not found' };
      }

      return { persona };
    },
  });

  // Create a new custom persona
  server.post('/', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId, userId } = request.user as any;
      const body = createPersonaSchema.parse(request.body as any);

      const persona = await server.prisma.persona.create({
        data: {
          ...body,
          sourceType: 'user_created',
          organizationId,
        },
      });

      reply.code(201);
      return { persona };
    },
  });

  // Update a persona
  server.patch('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;
      const body = updatePersonaSchema.parse(request.body as any);

      // Verify persona belongs to organization (can't update system personas)
      const existingPersona = await server.prisma.persona.findFirst({
        where: {
          id,
          organizationId,
          sourceType: 'user_created',
        },
      });

      if (!existingPersona) {
        reply.code(404);
        return { error: 'Persona not found or cannot be modified' };
      }

      const persona = await server.prisma.persona.update({
        where: { id },
        data: body,
      });

      return { persona };
    },
  });

  // Delete a persona
  server.delete('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;

      // Verify persona belongs to organization (can't delete system personas)
      const existingPersona = await server.prisma.persona.findFirst({
        where: {
          id,
          organizationId,
          sourceType: 'user_created',
        },
      });

      if (!existingPersona) {
        reply.code(404);
        return { error: 'Persona not found or cannot be deleted' };
      }

      await server.prisma.persona.delete({
        where: { id },
      });

      reply.code(204);
      return;
    },
  });

  // Get persona suggestions for a juror (AI-powered)
  server.post('/suggest', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId, juror: jurorData, attorneySide } = request.body as any;

      let juror: any;

      // Support two modes: database juror lookup OR direct juror data for testing
      if (jurorId) {
        // Mode 1: Database lookup (production usage)
        juror = await server.prisma.juror.findFirst({
          where: {
            id: jurorId,
            panel: {
              case: { organizationId },
            },
          },
          include: {
            researchArtifacts: true,
            panel: {
              include: {
                case: true,
              },
            },
          },
        });

        if (!juror) {
          reply.code(404);
          return { error: 'Juror not found' };
        }
      } else if (jurorData) {
        // Mode 2: Direct juror data (testing mode)
        juror = jurorData;
      } else {
        reply.code(400);
        return { error: 'Either jurorId or juror data must be provided' };
      }

      // Get available personas (system personas and org-specific) with V2 fields
      const personas = await server.prisma.persona.findMany({
        where: {
          OR: [
            { organizationId },
            { organizationId: null }, // System personas have NULL organizationId
          ],
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          archetype: true,
          archetypeVerdictLean: true,
          instantRead: true,
          phrasesYoullHear: true,
          verdictPrediction: true,
          strikeOrKeep: true,
          plaintiffDangerLevel: true,
          defenseDangerLevel: true,
          attributes: true,
          persuasionLevers: true,
          pitfalls: true,
        },
      });

      // Initialize AI service
      const { PersonaSuggesterService } = await import('../services/persona-suggester');
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        // Fallback to mock response if no API key
        server.log.warn('ANTHROPIC_API_KEY not set, using mock suggestions');
        const mockSuggestions = personas.slice(0, 3).map((persona: Record<string, unknown>) => ({
          persona,
          confidence: Math.random() * 0.3 + 0.7,
          reasoning: `Mock analysis: Based on juror demographics and profile, this persona appears to match key characteristics.`,
          keyMatches: ['Demographic alignment', 'Professional background', 'Decision-making style'],
          potentialConcerns: ['Limited research data available'],
        }));

        return { suggestions: mockSuggestions };
      }

      try {
        const suggester = new PersonaSuggesterService(apiKey);

        const suggestions = await suggester.suggestPersonas({
          juror,
          availablePersonas: personas.map((p: any) => ({
            id: p.id as string,
            name: p.name as string,
            description: p.description as string,
            attributes: (p.attributes as Record<string, unknown>) || {},
            persuasionLevers: (p.persuasionLevers as Record<string, unknown>) || {},
            pitfalls: (p.pitfalls as Record<string, unknown>) || {},
            // V2 Fields
            instantRead: p.instantRead,
            archetype: p.archetype,
            archetypeVerdictLean: p.archetypeVerdictLean,
            plaintiffDangerLevel: p.plaintiffDangerLevel,
            defenseDangerLevel: p.defenseDangerLevel,
            phrasesYoullHear: p.phrasesYoullHear,
            verdictPrediction: p.verdictPrediction,
            strikeOrKeep: p.strikeOrKeep,
          })),
          caseContext: {
            caseType: juror.panel?.case?.caseType || 'civil',
            keyIssues: [], // Could be expanded
            attorneySide: attorneySide || 'plaintiff', // NEW: Allow attorney side to be specified
          },
        });

        return { suggestions };
      } catch (error) {
        server.log.error(error);
        reply.code(500);
        return { error: 'Failed to generate persona suggestions' };
      }
    },
  });

  // NEW: Get all archetypes with metadata
  server.get('/archetypes', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const { organizationId } = request.user as any;

      // Get one persona per archetype to extract archetype-level data
      const archetypePersonas = await server.prisma.persona.findMany({
        where: {
          version: 2,
          isActive: true,
          sourceType: 'system',
        },
        select: {
          archetype: true,
          archetypeVerdictLean: true,
          archetypeWhatTheyBelieve: true,
          archetypeDeliberationBehavior: true,
          archetypeHowToSpot: true,
        },
        distinct: ['archetype'],
        orderBy: {
          archetype: 'asc',
        },
      });

      // Count personas per archetype
      const archetypeCounts = await server.prisma.persona.groupBy({
        by: ['archetype'],
        where: {
          version: 2,
          isActive: true,
          sourceType: 'system',
        },
        _count: {
          archetype: true,
        },
      });

      const countMap = Object.fromEntries(
        archetypeCounts.map(c => [c.archetype, c._count.archetype])
      );

      // Combine data
      const archetypes = archetypePersonas
        .filter(p => p.archetype) // Filter out null archetypes
        .map(persona => ({
          id: persona.archetype,
          display_name: formatArchetypeName(persona.archetype!),
          verdict_lean: persona.archetypeVerdictLean,
          what_they_believe: persona.archetypeWhatTheyBelieve,
          how_they_behave_in_deliberation: persona.archetypeDeliberationBehavior,
          how_to_spot_them: persona.archetypeHowToSpot,
          persona_count: countMap[persona.archetype!] || 0,
        }));

      return { archetypes };
    },
  });

  // NEW: Get all personas for a specific archetype
  server.get('/archetypes/:archetype/personas', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { archetype } = request.params as any;

      // Get archetype metadata from one persona
      const archetypeData = await server.prisma.persona.findFirst({
        where: {
          archetype,
          version: 2,
          isActive: true,
          sourceType: 'system',
        },
        select: {
          archetype: true,
          archetypeVerdictLean: true,
          archetypeWhatTheyBelieve: true,
          archetypeDeliberationBehavior: true,
          archetypeHowToSpot: true,
        },
      });

      if (!archetypeData) {
        reply.code(404);
        return { error: 'Archetype not found' };
      }

      // Get all personas for this archetype
      const personas = await server.prisma.persona.findMany({
        where: {
          archetype,
          version: 2,
          isActive: true,
          sourceType: 'system',
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          tagline: true,
          instantRead: true,
          demographics: true,
          phrasesYoullHear: true,
          verdictPrediction: true,
          strikeOrKeep: true,
          plaintiffDangerLevel: true,
          defenseDangerLevel: true,
          secondaryArchetype: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        archetype: {
          id: archetypeData.archetype,
          display_name: formatArchetypeName(archetypeData.archetype!),
          verdict_lean: archetypeData.archetypeVerdictLean,
          what_they_believe: archetypeData.archetypeWhatTheyBelieve,
          how_they_behave_in_deliberation: archetypeData.archetypeDeliberationBehavior,
          how_to_spot_them: archetypeData.archetypeHowToSpot,
        },
        personas,
      };
    },
  });

  /**
   * GET /api/personas/images/:personaId
   * Serve persona headshot image
   * Public endpoint - images are not sensitive data
   */
  server.get('/images/:personaId', {
    config: {
      rateLimit: false, // Exempt from rate limiting (images are cached)
    },
  }, async (request: FastifyRequest<{ Params: { personaId: string }; Querystring: { t?: string } }>, reply: FastifyReply) => {
    try {
      const { personaId } = request.params;

      server.log.info({ personaId }, 'Image request received');

      // Get persona from database (public - only check if active)
      const persona = await server.prisma.persona.findFirst({
        where: {
          id: personaId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          archetype: true,
          jsonPersonaId: true, // Get stored JSON persona_id for direct lookup
        },
      });

      if (!persona) {
        server.log.warn({ personaId }, 'Persona not found for image request');
        return reply.status(404).send({
          error: 'Persona not found',
          message: `Persona with ID ${personaId} not found`,
        });
      }

      server.log.info({ 
        personaId, 
        personaName: persona.name,
        jsonPersonaId: persona.jsonPersonaId 
      }, 'Serving image for persona');

      // Get image path - use jsonPersonaId directly to construct filename (most reliable)
      let imagePath: string | null = null;
      
      if (persona.jsonPersonaId) {
        // Direct lookup: construct filename from jsonPersonaId (e.g., "BOOT_08" -> "BOOT_08.png")
        const filename = `${persona.jsonPersonaId}.png`;
        
        // Use the same image directory finding logic as persona-image-utils
        const possibleImageDirs = [
          path.join(process.cwd(), 'Juror Personas', 'images'),
          path.join(process.cwd(), '..', 'Juror Personas', 'images'),
          path.join(process.cwd(), '..', '..', 'Juror Personas', 'images'),
          path.join(__dirname, '..', '..', '..', '..', 'Juror Personas', 'images'),
        ];
        
        for (const imageDir of possibleImageDirs) {
          const fullImagePath = path.join(imageDir, filename);
          try {
            await fs.access(fullImagePath);
            imagePath = fullImagePath;
            server.log.info({ 
              personaId, 
              jsonPersonaId: persona.jsonPersonaId, 
              imagePath,
              filename 
            }, 'Found image via direct jsonPersonaId lookup');
            break;
          } catch {
            continue;
          }
        }
        
        if (!imagePath) {
          server.log.warn({ 
            personaId, 
            jsonPersonaId: persona.jsonPersonaId, 
            filename,
            checkedDirs: possibleImageDirs 
          }, 'Image file not found for jsonPersonaId');
        }
      }
      
      // Fallback to fuzzy matching if direct lookup failed
      if (!imagePath) {
        server.log.info({ personaId, name: persona.name }, 'Falling back to fuzzy matching for image path');
        imagePath = await getPersonaImagePath(
          persona.id,
          persona.name,
          persona.nickname || null,
          persona.archetype || null
        );
      }

      if (!imagePath) {
        server.log.warn({ 
          personaId, 
          personaName: persona.name,
          jsonPersonaId: persona.jsonPersonaId 
        }, 'Image file not found');
        return reply.status(404).send({
          error: 'Image not found',
          message: `No image found for persona ${persona.name}`,
        });
      }

      server.log.info({ 
        personaId, 
        personaName: persona.name,
        jsonPersonaId: persona.jsonPersonaId,
        imagePath,
        filename: path.basename(imagePath)
      }, 'Serving image file');

      // Read and serve image
      const imageBuffer = await fs.readFile(imagePath);
      const ext = path.extname(imagePath).toLowerCase();
      
      // Set appropriate content type
      const contentType = ext === '.png' ? 'image/png' : 
                          ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                          'image/png';

      reply.type(contentType);
      reply.header('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
      return reply.send(imageBuffer);
    } catch (error) {
      server.log.error({ error }, 'Error serving persona image');
      return reply.status(500).send({
        error: 'Failed to serve image',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/personas/:personaId/generate-image
   * Generate headshot image for a single persona
   */
  server.post('/:personaId/generate-image', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      try {
      const { personaId } = request.params as { personaId: string };
      const { regenerate = false } = (request.body as { regenerate?: boolean }) || {};
      const { organizationId } = request.user as any;

      // Get persona from database
      const persona = await server.prisma.persona.findFirst({
        where: {
          id: personaId,
          OR: [{ organizationId }, { sourceType: 'system' }],
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          archetype: true,
          sourceType: true,
          organizationId: true,
          jsonPersonaId: true, // NEW: Get the stored JSON persona_id
        },
      });

      server.log.info({
        personaId,
        name: persona?.name,
        nickname: persona?.nickname,
        jsonPersonaId: persona?.jsonPersonaId,
      }, 'Generating image for persona');

      if (!persona) {
        return reply.status(404).send({
          error: 'Persona not found',
          message: `Persona with ID ${personaId} not found`,
        });
      }

      // Only system personas can have images generated from JSON files
      if (persona.sourceType !== 'system' || persona.organizationId !== null) {
        return reply.status(400).send({
          error: 'Image generation only available for system personas',
          message: `Persona ${persona.name} is not a system persona. Image generation is only available for system personas imported from JSON files.`,
        });
      }

      // Use stored jsonPersonaId if available (1:1 mapping), otherwise fall back to fuzzy matching
      let jsonPersonaId: string | null = null;
      
      if (persona.jsonPersonaId) {
        // Direct 1:1 mapping - no fuzzy matching needed!
        jsonPersonaId = persona.jsonPersonaId;
        server.log.info({
          personaId,
          jsonPersonaId,
          method: 'direct_mapping',
        }, 'Using stored jsonPersonaId for direct mapping');
      } else {
        // Fallback to fuzzy matching for personas imported before jsonPersonaId was added
        server.log.warn({
          personaId,
          name: persona.name,
          nickname: persona.nickname,
          archetype: persona.archetype,
        }, 'Persona missing jsonPersonaId, falling back to fuzzy matching');

        // Temporarily enable debug mode for this request
        const originalDebug = process.env.DEBUG_PERSONA_MATCHING;
        process.env.DEBUG_PERSONA_MATCHING = 'true';

        jsonPersonaId = await findPersonaIdFromDatabase(
          persona.name,
          persona.nickname || null,
          persona.archetype || null
        );

        // Restore original debug setting
        process.env.DEBUG_PERSONA_MATCHING = originalDebug || 'false';

        server.log.info({
          personaId,
          databaseName: persona.name,
          databaseNickname: persona.nickname,
          matchedJsonPersonaId: jsonPersonaId,
          method: 'fuzzy_matching',
        }, 'Persona matching result (fuzzy)');
      }

      if (!jsonPersonaId) {
        // Get list of available personas for debugging
        const availablePersonas = await listAvailableJsonPersonas(persona.archetype || null);
        
        // Also get personas from other archetypes for comparison
        const allAvailablePersonas = await listAvailableJsonPersonas(null);
        
        server.log.error({
          personaId,
          name: persona.name,
          nickname: persona.nickname,
          archetype: persona.archetype,
          searchedFor: {
            normalizedName: persona.name?.toLowerCase().trim(),
            normalizedNickname: persona.nickname?.toLowerCase().trim(),
            normalizedArchetype: persona.archetype?.toLowerCase(),
          },
          availablePersonasCount: availablePersonas.length,
          allPersonasCount: allAvailablePersonas.length,
          samplePersonas: availablePersonas.slice(0, 10).map(p => ({
            persona_id: p.persona_id,
            nickname: p.nickname,
            full_name: p.full_name,
            name: p.name,
          })),
          sampleAllPersonas: allAvailablePersonas.slice(0, 5).map(p => ({
            persona_id: p.persona_id,
            nickname: p.nickname,
            full_name: p.full_name,
            archetype: 'unknown', // We'd need to check file for this
          })),
        }, 'Could not find JSON persona_id - detailed debug info');
        
        // Check if there's a similar persona (same last name or similar name)
        const similarPersonas = allAvailablePersonas.filter(p => {
          const pFullName = p.full_name?.toLowerCase().trim() || '';
          const pNickname = p.nickname?.toLowerCase().trim() || '';
          const dbName = persona.name?.toLowerCase().trim() || '';
          const dbNickname = persona.nickname?.toLowerCase().trim() || '';
          
          // Extract last name from database persona
          const dbNameParts = dbName.split(/\s+/);
          const dbLastName = dbNameParts[dbNameParts.length - 1];
          
          // Check if last name matches
          if (dbLastName && dbLastName.length > 2) {
            if (pFullName.includes(dbLastName) || pNickname.includes(dbLastName)) {
              return true;
            }
          }
          
          // Check if names are similar (fuzzy match)
          const similarity = calculateSimilarity(dbName, pFullName);
          if (similarity > 0.6) {
            return true;
          }
          
          return false;
        });

        return reply.status(404).send({
          error: 'Persona not found in JSON files',
          message: `Could not find JSON persona_id for "${persona.name}". This persona does not exist in the JSON files and cannot generate an image. ${similarPersonas.length > 0 ? `Found ${similarPersonas.length} similar persona(s) that might match.` : 'This appears to be a custom persona that was created directly in the database without a corresponding JSON file.'}`,
          debug: {
            searchedFor: {
              name: persona.name,
              nickname: persona.nickname,
              archetype: persona.archetype,
              normalized: {
                name: persona.name?.toLowerCase().trim(),
                nickname: persona.nickname?.toLowerCase().trim(),
                archetype: persona.archetype?.toLowerCase(),
              },
            },
            availablePersonasCount: availablePersonas.length,
            allPersonasCount: allAvailablePersonas.length,
            similarPersonas: similarPersonas.slice(0, 5).map(p => ({
              persona_id: p.persona_id,
              nickname: p.nickname,
              full_name: p.full_name,
              name: p.name,
            })),
            samplePersonas: availablePersonas.slice(0, 20).map(p => ({
              persona_id: p.persona_id,
              nickname: p.nickname,
              full_name: p.full_name,
              name: p.name,
            })),
            note: 'To generate images, personas must exist in the JSON files located in "Juror Personas/generated/". Custom personas created directly in the database cannot generate images unless they are added to the JSON files first.',
          },
        });
      }

      server.log.info({
        personaId,
        personaName: persona.name,
        personaNickname: persona.nickname,
        jsonPersonaId,
      }, 'Found JSON persona_id - generating image');

      // Generate image
      const result = await generateSinglePersonaHeadshot(jsonPersonaId, {
        regenerate,
        updateJson: true,
      });
      
      server.log.info({
        personaId,
        personaName: persona.name,
        jsonPersonaId,
        resultSuccess: result.success,
        resultImageUrl: result.imageUrl,
      }, 'Image generation completed');

      if (!result.success) {
        server.log.error({
          personaId,
          jsonPersonaId,
          error: result.error,
        }, 'Image generation failed');
        return reply.status(500).send({
          error: 'Failed to generate image',
          message: result.error || 'Unknown error',
        });
      }

      server.log.info({
        personaId,
        jsonPersonaId,
        imageUrl: result.imageUrl,
      }, 'Image generated successfully');

      // Return the image URL (use the API endpoint path, not the relative path)
      // The frontend expects: /api/personas/images/{personaId}
      return reply.send({
        success: true,
        imageUrl: `/api/personas/images/${personaId}`,
        message: 'Image generated successfully',
      });
    } catch (error) {
      server.log.error({ error }, 'Error generating persona image');
      return reply.status(500).send({
        error: 'Failed to generate image',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      }
    },
  });
}

// Helper function to format archetype names
function formatArchetypeName(archetype: string): string {
  const nameMap: Record<string, string> = {
    bootstrapper: 'The Bootstrapper',
    crusader: 'The Crusader',
    scale_balancer: 'The Scale-Balancer',
    captain: 'The Captain',
    chameleon: 'The Chameleon',
    heart: 'The Heart',
    calculator: 'The Calculator',
    scarred: 'The Scarred',
    trojan_horse: 'The Trojan Horse',
    maverick: 'The Maverick',
  };
  return nameMap[archetype] || archetype;
}
