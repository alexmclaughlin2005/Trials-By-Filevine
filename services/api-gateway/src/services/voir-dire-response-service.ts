/**
 * Voir Dire Response Service
 * 
 * Handles business logic for voir dire responses including:
 * - Creating and managing responses
 * - Extracting signals from responses
 * - Updating persona matches based on new signals
 */

import { PrismaClient } from '@juries/database';
import { SignalExtractorService } from './signal-extractor';
import { EnsembleMatcher } from './matching/ensemble-matcher';
import { ClaudeClient } from '@juries/ai-client';

export interface CreateVoirDireResponseInput {
  questionId?: string;
  questionText: string;
  responseSummary: string;
  entryMethod: 'TYPED' | 'VOICE_TO_TEXT' | 'QUICK_SELECT';
  responseTimestamp?: Date;
}

export interface UpdateVoirDireResponseInput {
  questionText?: string;
  responseSummary?: string;
  entryMethod?: 'TYPED' | 'VOICE_TO_TEXT' | 'QUICK_SELECT';
  responseTimestamp?: Date;
}

export interface ListOptions {
  limit: number;
  offset: number;
  orderBy: 'responseTimestamp' | 'createdAt';
  order: 'asc' | 'desc';
}

export class VoirDireResponseService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new voir dire response
   */
  async createResponse(
    jurorId: string,
    data: CreateVoirDireResponseInput,
    userId: string
  ) {
    return await this.prisma.voirDireResponse.create({
      data: {
        jurorId,
        questionId: data.questionId || null,
        questionText: data.questionText,
        responseSummary: data.responseSummary,
        responseTimestamp: data.responseTimestamp || new Date(),
        enteredBy: userId,
        entryMethod: data.entryMethod,
      },
    });
  }

  /**
   * List voir dire responses for a juror
   */
  async listResponses(jurorId: string, options: ListOptions) {
    return await this.prisma.voirDireResponse.findMany({
      where: { jurorId },
      include: {
        extractedSignals: {
          include: {
            signal: {
              select: {
                id: true,
                signalId: true,
                name: true,
              },
            },
          },
        },
        personaImpacts: {
          include: {
            persona: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        [options.orderBy]: options.order,
      },
      take: options.limit,
      skip: options.offset,
    });
  }

  /**
   * Get a single response with all relations
   */
  async getResponseWithRelations(responseId: string) {
    return await this.prisma.voirDireResponse.findUnique({
      where: { id: responseId },
      include: {
        extractedSignals: {
          include: {
            signal: {
              select: {
                id: true,
                signalId: true,
                name: true,
              },
            },
          },
        },
        personaImpacts: {
          include: {
            persona: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update a voir dire response
   */
  async updateResponse(responseId: string, data: UpdateVoirDireResponseInput) {
    const updateData: any = {};
    if (data.questionText !== undefined) updateData.questionText = data.questionText;
    if (data.responseSummary !== undefined) updateData.responseSummary = data.responseSummary;
    if (data.entryMethod !== undefined) updateData.entryMethod = data.entryMethod;
    if (data.responseTimestamp !== undefined) updateData.responseTimestamp = data.responseTimestamp;

    return await this.prisma.voirDireResponse.update({
      where: { id: responseId },
      data: updateData,
    });
  }

  /**
   * Delete a voir dire response
   */
  async deleteResponse(responseId: string) {
    // Delete associated signals and persona impacts first (cascade should handle this, but being explicit)
    await this.prisma.jurorSignal.deleteMany({
      where: {
        source: 'VOIR_DIRE',
        sourceReference: responseId,
      },
    });

    await this.prisma.personaMatchUpdate.deleteMany({
      where: {
        voirDireResponseId: responseId,
      },
    });

    return await this.prisma.voirDireResponse.delete({
      where: { id: responseId },
    });
  }

  /**
   * Extract signals from a voir dire response and update persona matches
   * This is called asynchronously after response creation/update
   */
  async extractSignalsAndUpdateMatches(
    responseId: string,
    organizationId: string
  ): Promise<{ signals: any[]; updates: any[] }> {
    // Get the response
    const response = await this.prisma.voirDireResponse.findUnique({
      where: { id: responseId },
      include: {
        juror: {
          select: {
            id: true,
            panel: {
              select: {
                case: {
                  select: {
                    organizationId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!response) {
      throw new Error('Voir dire response not found');
    }

    const jurorId = response.jurorId;

    // Extract signals
    const extractor = new SignalExtractorService(this.prisma);
    const extractedSignals = await extractor.extractFromVoirDireResponse(
      jurorId,
      responseId,
      response.responseSummary
    );

    // Get available personas for the organization
    const personas = await this.prisma.persona.findMany({
      where: {
        OR: [
          { organizationId },
          { organizationId: null }, // System personas
        ],
        isActive: true,
      },
      select: { id: true },
    });

    const personaIds = personas.map((p) => p.id);

    if (personaIds.length === 0) {
      return { signals: extractedSignals, updates: [] };
    }

    // Get current persona matches to calculate deltas
    const currentMappings = await this.prisma.jurorPersonaMapping.findMany({
      where: {
        jurorId,
        personaId: { in: personaIds },
        mappingType: 'primary',
      },
      select: {
        personaId: true,
        confidence: true,
      },
    });

    const previousProbabilities = new Map<string, number>();
    currentMappings.forEach((m) => {
      previousProbabilities.set(m.personaId, Number(m.confidence));
    });

    // Update persona matches using ensemble matcher
    // Get Claude API key for matcher
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // If no API key, skip persona updates but still extract signals
      return { signals: extractedSignals, updates: [] };
    }

    const claudeClient = new ClaudeClient({ apiKey });
    const matcher = new EnsembleMatcher(this.prisma, claudeClient);

    // Run matching to get updated probabilities
    const matches = await matcher.matchJuror(jurorId, personaIds);

    // Create PersonaMatchUpdate records for significant changes
    const updates: any[] = [];
    for (const match of matches) {
      const previousProb = previousProbabilities.get(match.personaId) || 0;
      const newProb = match.probability;
      const delta = newProb - previousProb;

      // Only record updates if delta is significant (>0.01 or 1%)
      if (Math.abs(delta) > 0.01) {
        const update = await this.prisma.personaMatchUpdate.create({
          data: {
            jurorId,
            personaId: match.personaId,
            voirDireResponseId: responseId,
            probabilityDelta: delta,
            previousProbability: previousProb > 0 ? previousProb : null,
            newProbability: newProb,
          },
          include: {
            persona: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        updates.push(update);

        // Update or create primary mapping if probability is high enough
        if (newProb > 0.3) {
          const existingMapping = await this.prisma.jurorPersonaMapping.findFirst({
            where: {
              jurorId,
              personaId: match.personaId,
              mappingType: 'primary',
            },
          });

          if (existingMapping) {
            await this.prisma.jurorPersonaMapping.update({
              where: { id: existingMapping.id },
              data: {
                confidence: newProb,
                rationale: match.rationale,
                counterfactual: match.counterfactual,
              },
            });
          } else {
            await this.prisma.jurorPersonaMapping.create({
              data: {
                jurorId,
                personaId: match.personaId,
                mappingType: 'primary',
                source: 'ai_suggested',
                confidence: newProb,
                rationale: match.rationale,
                counterfactual: match.counterfactual,
              },
            });
          }
        }
      }
    }

    return { signals: extractedSignals, updates };
  }
}
