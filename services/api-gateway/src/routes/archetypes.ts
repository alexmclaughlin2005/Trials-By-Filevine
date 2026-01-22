/**
 * Archetype Classification Routes
 *
 * Endpoints for:
 * - Classifying jurors into behavioral archetypes
 * - Retrieving archetype configuration data
 * - Getting archetype-specific recommendations
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  ArchetypeClassifierService,
  type ClassificationInput,
  type Archetype,
} from '../services/archetype-classifier.js';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface ClassifyJurorRequest {
  Body: {
    jurorId: string;
    includeResearch?: boolean;
    caseType?: string;
    jurisdiction?: string;
    ourSide?: 'plaintiff' | 'defense';
  };
}

interface ClassifyDataRequest {
  Body: {
    jurorData: ClassificationInput['jurorData'];
    caseType?: string;
    jurisdiction?: string;
    ourSide?: 'plaintiff' | 'defense';
  };
}

interface GetArchetypeInfoRequest {
  Params: {
    archetype: Archetype;
  };
}

// ============================================
// ROUTES
// ============================================

export async function archetypeRoutes(server: FastifyInstance) {
  /**
   * POST /api/archetypes/classify/juror
   *
   * Classify an existing juror from the database
   */
  server.post<ClassifyJurorRequest>('/classify/juror', {
    onRequest: [server.authenticate],
    handler: async (request, reply) => {
      const { jurorId, includeResearch, caseType, jurisdiction, ourSide } = request.body;
      const organizationId = (request.user as any).organizationId;

      // Fetch juror with related data
      const juror = await server.prisma.juror.findFirst({
        where: {
          id: jurorId,
          panel: {
            case: {
              organizationId,
            },
          },
        },
        include: {
          researchArtifacts: includeResearch
            ? {
                where: { userAction: { in: ['confirmed', 'pending'] } },
                select: {
                  sourceType: true,
                  extractedSnippets: true,
                  signals: true,
                  matchRationale: true,
                },
              }
            : false,
          panel: {
            include: {
              case: {
                select: {
                  caseType: true,
                  jurisdiction: true,
                  ourSide: true,
                },
              },
            },
          },
        },
      });

      if (!juror) {
        return reply.status(404).send({ error: 'Juror not found' });
      }

      // Build research summary if requested
      let researchSummary: string | undefined;
      if (includeResearch && juror.researchArtifacts && juror.researchArtifacts.length > 0) {
        const summaryParts = juror.researchArtifacts.map((artifact: any) => {
          const parts = [`Source: ${artifact.sourceType}`];
          if (artifact.matchRationale) parts.push(artifact.matchRationale);
          if (artifact.signals) parts.push(`Signals: ${JSON.stringify(artifact.signals)}`);
          return parts.join('\n');
        });
        researchSummary = summaryParts.join('\n\n');
      }

      // Prepare classification input
      const input: ClassificationInput = {
        jurorData: {
          age: juror.age || undefined,
          occupation: juror.occupation || undefined,
          employer: juror.employer || undefined,
          city: juror.city || undefined,
          zipCode: juror.zipCode || undefined,
          questionnaireData: (juror.questionnaireData as Record<string, any>) || undefined,
          researchSummary,
        },
        caseType: caseType || juror.panel.case.caseType || undefined,
        jurisdiction: jurisdiction || juror.panel.case.jurisdiction || undefined,
        ourSide: (ourSide || juror.panel.case.ourSide || undefined) as 'plaintiff' | 'defense' | undefined,
      };

      // Classify juror
      const apiKey = process.env.ANTHROPIC_API_KEY;
      const classifier = new ArchetypeClassifierService(apiKey || '');

      const result = apiKey
        ? await classifier.classifyJuror(input)
        : classifier.getMockClassification(input);

      // Update juror record with classification
      await server.prisma.juror.update({
        where: { id: jurorId },
        data: {
          classifiedArchetype: result.primary.archetype,
          archetypeConfidence: result.primary.confidence,
          dimensionScores: result.primary.dimensionScores as any,
          classifiedAt: result.classifiedAt,
        },
      });

      // Log audit trail
      await server.prisma.auditLog.create({
        data: {
          organizationId,
          userId: (request.user as any).id,
          action: 'archetype_classified',
          entityType: 'juror',
          entityId: jurorId,
          caseId: juror.panel.caseId,
          details: {
            archetype: result.primary.archetype,
            confidence: result.primary.confidence,
            includeResearch,
          },
        },
      });

      return {
        jurorId,
        classification: result,
      };
    },
  });

  /**
   * POST /api/archetypes/classify/data
   *
   * Classify raw juror data (not yet in database)
   */
  server.post<ClassifyDataRequest>('/classify/data', {
    onRequest: [server.authenticate],
    handler: async (request, reply) => {
      const { jurorData, caseType, jurisdiction, ourSide } = request.body;
      const organizationId = (request.user as any).organizationId;

      const input: ClassificationInput = {
        jurorData,
        caseType,
        jurisdiction,
        ourSide,
      };

      // Classify juror
      const apiKey = process.env.ANTHROPIC_API_KEY;
      const classifier = new ArchetypeClassifierService(apiKey || '');

      const result = apiKey
        ? await classifier.classifyJuror(input)
        : classifier.getMockClassification(input);

      // Log audit trail
      await server.prisma.auditLog.create({
        data: {
          organizationId,
          userId: (request.user as any).id,
          action: 'archetype_classified_data',
          entityType: 'juror_data',
          entityId: 'n/a',
          details: {
            archetype: result.primary.archetype,
            confidence: result.primary.confidence,
          },
        },
      });

      return {
        classification: result,
      };
    },
  });

  /**
   * GET /api/archetypes/info/:archetype
   *
   * Get detailed information about a specific archetype
   */
  server.get<GetArchetypeInfoRequest>('/info/:archetype', {
    onRequest: [server.authenticate],
    handler: async (request, reply) => {
      const { archetype } = request.params;

      // Validate archetype
      const validArchetypes = [
        'bootstrapper',
        'crusader',
        'scale_balancer',
        'captain',
        'chameleon',
        'scarred',
        'calculator',
        'heart',
        'trojan_horse',
        'maverick',
      ];

      if (!validArchetypes.includes(archetype)) {
        return reply.status(400).send({ error: 'Invalid archetype' });
      }

      // Fetch system personas for this archetype
      const personas = await server.prisma.persona.findMany({
        where: {
          archetype,
          organizationId: null, // System personas only
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          description: true,
          tagline: true,
          archetypeStrength: true,
          variant: true,
          plaintiffDangerLevel: true,
          defenseDangerLevel: true,
        },
        orderBy: {
          archetypeStrength: 'desc',
        },
      });

      // Fetch archetype configuration
      const config = await server.prisma.archetypeConfig.findFirst({
        where: {
          configType: 'influence_matrix',
          isActive: true,
        },
        select: {
          data: true,
        },
      });

      const influenceData = config?.data as any;
      const archetypeInfluence = influenceData?.archetype_influence_matrix?.matrix?.[archetype];

      return {
        archetype,
        personas: personas.map((p: Record<string, unknown>) => ({
          ...p,
          archetypeStrength: p.archetypeStrength ? parseFloat(p.archetypeStrength.toString()) : null,
        })),
        influence: archetypeInfluence || null,
      };
    },
  });

  /**
   * GET /api/archetypes/config/:configType
   *
   * Get archetype configuration data (influence matrices, etc.)
   */
  server.get<{ Params: { configType: string } }>('/config/:configType', {
    onRequest: [server.authenticate],
    handler: async (request, reply) => {
      const { configType } = request.params;

      const config = await server.prisma.archetypeConfig.findFirst({
        where: {
          configType,
          isActive: true,
        },
        select: {
          id: true,
          configType: true,
          version: true,
          data: true,
          description: true,
        },
      });

      if (!config) {
        return reply.status(404).send({ error: 'Configuration not found' });
      }

      return config;
    },
  });

  /**
   * GET /api/archetypes/panel-analysis/:panelId
   *
   * Analyze entire jury panel composition
   */
  server.get<{ Params: { panelId: string } }>('/panel-analysis/:panelId', {
    onRequest: [server.authenticate],
    handler: async (request, reply) => {
      const { panelId } = request.params;
      const organizationId = (request.user as any).organizationId;

      // Fetch panel with jurors
      const panel = await server.prisma.juryPanel.findFirst({
        where: {
          id: panelId,
          case: {
            organizationId,
          },
        },
        include: {
          jurors: {
            where: {
              classifiedArchetype: { not: null },
            },
            select: {
              id: true,
              jurorNumber: true,
              firstName: true,
              lastName: true,
              classifiedArchetype: true,
              archetypeConfidence: true,
              status: true,
            },
          },
          case: {
            select: {
              id: true,
              name: true,
              caseType: true,
              ourSide: true,
            },
          },
        },
      });

      if (!panel) {
        return reply.status(404).send({ error: 'Panel not found' });
      }

      // Count archetype distribution
      const archetypeDistribution: Record<string, number> = {};
      panel.jurors.forEach((juror) => {
        if (juror.classifiedArchetype) {
          archetypeDistribution[juror.classifiedArchetype] =
            (archetypeDistribution[juror.classifiedArchetype] || 0) + 1;
        }
      });

      // Calculate composition analysis
      const totalClassified = panel.jurors.length;
      const composition = Object.entries(archetypeDistribution).map(([archetype, count]) => ({
        archetype,
        count,
        percentage: (count / totalClassified) * 100,
      }));

      // Simple plaintiff/defense favorability calculation
      const dangerLevels = {
        bootstrapper: { plaintiff: 5, defense: 1 },
        crusader: { plaintiff: 1, defense: 5 },
        scale_balancer: { plaintiff: 2.5, defense: 2.5 },
        captain: { plaintiff: 3, defense: 3 },
        chameleon: { plaintiff: 3, defense: 3 },
        scarred: { plaintiff: 2, defense: 3 },
        calculator: { plaintiff: 3, defense: 2 },
        heart: { plaintiff: 1, defense: 4 },
        trojan_horse: { plaintiff: 4, defense: 2 },
        maverick: { plaintiff: 3, defense: 3 },
      };

      let avgPlaintiffDanger = 0;
      let avgDefenseDanger = 0;

      panel.jurors.forEach((juror: Record<string, unknown>) => {
        if (juror.classifiedArchetype) {
          const levels = dangerLevels[juror.classifiedArchetype as Archetype];
          avgPlaintiffDanger += levels.plaintiff;
          avgDefenseDanger += levels.defense;
        }
      });

      avgPlaintiffDanger = totalClassified > 0 ? avgPlaintiffDanger / totalClassified : 0;
      avgDefenseDanger = totalClassified > 0 ? avgDefenseDanger / totalClassified : 0;

      return {
        panelId,
        caseId: panel.case.id,
        caseName: panel.case.name,
        ourSide: panel.case.ourSide,
        totalJurors: panel.totalJurors,
        classifiedJurors: totalClassified,
        composition,
        favorability: {
          plaintiffDangerAverage: avgPlaintiffDanger.toFixed(2),
          defenseDangerAverage: avgDefenseDanger.toFixed(2),
          recommendation:
            avgPlaintiffDanger > avgDefenseDanger
              ? 'Panel leans defense-favorable'
              : avgDefenseDanger > avgPlaintiffDanger
              ? 'Panel leans plaintiff-favorable'
              : 'Balanced panel',
        },
        jurors: panel.jurors.map((j: Record<string, unknown>) => ({
          ...j,
          archetypeConfidence: j.archetypeConfidence ? parseFloat(j.archetypeConfidence.toString()) : null,
        })),
      };
    },
  });
}
