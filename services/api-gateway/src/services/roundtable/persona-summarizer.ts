/**
 * PersonaSummarizer - Generates per-persona summaries of roundtable participation
 *
 * Analyzes all statements from each persona to produce:
 * - Position tracking (initial → final)
 * - Key contributions (points, concerns, questions)
 * - Social dynamics (influence, agreements, disagreements)
 * - Narrative summary of their journey through the conversation
 */

import { PrismaClient } from '@juries/database';
import { PromptClient } from '@juries/prompt-client';
import { Statement } from './turn-manager';

export interface PersonaSummary {
  personaId: string;
  personaName: string;
  totalStatements: number;
  firstStatement: string;
  lastStatement: string;
  initialPosition: 'favorable' | 'neutral' | 'unfavorable' | 'mixed';
  finalPosition: 'favorable' | 'neutral' | 'unfavorable' | 'mixed';
  positionShifted: boolean;
  shiftDescription?: string;
  mainPoints: string[];
  concernsRaised: string[];
  questionsAsked: string[];
  influenceLevel: 'high' | 'medium' | 'low';
  agreedWithMost: string[];
  disagreedWithMost: string[];
  influencedBy: string[];
  averageSentiment: string;
  averageEmotionalIntensity: number;
  mostEmotionalStatement?: string;
  summary: string;
}

interface ConversationContext {
  argumentContent: string;
  fullTranscript: string;
  ourSide: string;
}

export class PersonaSummarizer {
  private prisma: PrismaClient;
  private promptClient: PromptClient;

  constructor(prisma: PrismaClient, promptClient: PromptClient) {
    this.prisma = prisma;
    this.promptClient = promptClient;
  }

  /**
   * Generate summaries for all personas in a conversation
   */
  async summarizePersonas(conversationId: string): Promise<PersonaSummary[]> {
    console.log('📋 Generating persona summaries...');

    // Get conversation and all statements
    const conversation = await this.prisma.focusGroupConversation.findUnique({
      where: { id: conversationId },
      include: {
        statements: {
          orderBy: { sequenceNumber: 'asc' }
        },
        session: {
          include: {
            case: {
              include: {
                arguments: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Find the argument being discussed
    const argument = conversation.session.case.arguments.find(
      a => a.id === conversation.argumentId
    );

    if (!argument) {
      throw new Error('Argument not found');
    }

    // Build full conversation transcript for context
    const fullTranscript = conversation.statements
      .map(s => `${s.personaName}: "${s.content}"`)
      .join('\n\n');

    const conversationContext: ConversationContext = {
      argumentContent: argument.content,
      fullTranscript,
      ourSide: conversation.session.case.ourSide || 'unknown'
    };

    // Group statements by persona
    const personaStatements = new Map<string, typeof conversation.statements>();
    for (const statement of conversation.statements) {
      if (!personaStatements.has(statement.personaId)) {
        personaStatements.set(statement.personaId, []);
      }
      personaStatements.get(statement.personaId)!.push(statement);
    }

    // Generate summary for each persona
    const summaries: PersonaSummary[] = [];
    for (const [personaId, statements] of personaStatements.entries()) {
      const summary = await this.summarizePersona(
        personaId,
        statements[0].personaName,
        statements,
        conversationContext
      );

      summaries.push(summary);

      // Save to database
      await this.prisma.focusGroupPersonaSummary.create({
        data: {
          conversationId,
          personaId: summary.personaId,
          personaName: summary.personaName,
          totalStatements: summary.totalStatements,
          firstStatement: summary.firstStatement,
          lastStatement: summary.lastStatement,
          initialPosition: summary.initialPosition,
          finalPosition: summary.finalPosition,
          positionShifted: summary.positionShifted,
          shiftDescription: summary.shiftDescription,
          mainPoints: summary.mainPoints,
          concernsRaised: summary.concernsRaised,
          questionsAsked: summary.questionsAsked,
          influenceLevel: summary.influenceLevel,
          agreedWithMost: summary.agreedWithMost,
          disagreedWithMost: summary.disagreedWithMost,
          influencedBy: summary.influencedBy,
          averageSentiment: summary.averageSentiment,
          averageEmotionalIntensity: summary.averageEmotionalIntensity,
          mostEmotionalStatement: summary.mostEmotionalStatement,
          summary: summary.summary
        }
      });
    }

    console.log(`✅ Generated ${summaries.length} persona summaries`);
    return summaries;
  }

  /**
   * Generate summary for a single persona
   */
  private async summarizePersona(
    personaId: string,
    personaName: string,
    statements: any[],
    context: ConversationContext
  ): Promise<PersonaSummary> {
    // Calculate statistics from statements
    const totalStatements = statements.length;
    const firstStatement = statements[0].content;
    const lastStatement = statements[statements.length - 1].content;

    // Calculate average sentiment and emotional intensity
    let totalEmotionalIntensity = 0;
    let emotionalIntensityCount = 0;
    let maxEmotionalIntensity = 0;
    let mostEmotionalStatement: string | undefined;

    const sentimentCounts: Record<string, number> = {
      plaintiff_leaning: 0,
      defense_leaning: 0,
      neutral: 0,
      conflicted: 0
    };

    for (const statement of statements) {
      if (statement.sentiment) {
        sentimentCounts[statement.sentiment]++;
      }
      if (statement.emotionalIntensity) {
        const intensity = parseFloat(statement.emotionalIntensity.toString());
        totalEmotionalIntensity += intensity;
        emotionalIntensityCount++;

        if (intensity > maxEmotionalIntensity) {
          maxEmotionalIntensity = intensity;
          mostEmotionalStatement = statement.content;
        }
      }
    }

    const averageEmotionalIntensity = emotionalIntensityCount > 0
      ? totalEmotionalIntensity / emotionalIntensityCount
      : 0.5;

    // Determine average sentiment
    const dominantSentiment = Object.entries(sentimentCounts)
      .sort(([, a], [, b]) => b - a)[0][0];

    // Format persona's statements for prompt
    const personaStatementsText = statements
      .map((s, i) => `Statement ${i + 1}: "${s.content}"`)
      .join('\n\n');

    try {
      // Call LLM to generate comprehensive summary
      const { result } = await this.promptClient.execute('roundtable-persona-summary', {
        variables: {
          personaName,
          argumentContent: context.argumentContent,
          ourSide: context.ourSide,
          personaStatements: personaStatementsText,
          conversationTranscript: context.fullTranscript,
          totalStatements
        }
      });

      // Extract and validate response
      const summary = this.extractSummary(result);

      // Filter out self-references from social dynamics
      const agreedWithMost = summary.agreedWithMost.filter(name => name !== personaName);
      const disagreedWithMost = summary.disagreedWithMost.filter(name => name !== personaName);
      const influencedBy = summary.influencedBy.filter(name => name !== personaName);

      return {
        personaId,
        personaName,
        totalStatements,
        firstStatement,
        lastStatement,
        initialPosition: summary.initialPosition,
        finalPosition: summary.finalPosition,
        positionShifted: summary.positionShifted,
        shiftDescription: summary.shiftDescription,
        mainPoints: summary.mainPoints,
        concernsRaised: summary.concernsRaised,
        questionsAsked: summary.questionsAsked,
        influenceLevel: summary.influenceLevel,
        agreedWithMost,
        disagreedWithMost,
        influencedBy,
        averageSentiment: dominantSentiment,
        averageEmotionalIntensity,
        mostEmotionalStatement,
        summary: summary.summary
      };
    } catch (error) {
      console.error(`Error summarizing persona ${personaName}:`, error);

      // Fallback summary
      return {
        personaId,
        personaName,
        totalStatements,
        firstStatement,
        lastStatement,
        initialPosition: 'neutral',
        finalPosition: 'neutral',
        positionShifted: false,
        shiftDescription: undefined,
        mainPoints: [firstStatement],
        concernsRaised: [],
        questionsAsked: [],
        influenceLevel: 'medium',
        agreedWithMost: [],
        disagreedWithMost: [],
        influencedBy: [],
        averageSentiment: dominantSentiment,
        averageEmotionalIntensity,
        mostEmotionalStatement,
        summary: `${personaName} participated in the discussion with ${totalStatements} statement${totalStatements > 1 ? 's' : ''}.`
      };
    }
  }

  /**
   * Extract and validate summary from LLM response
   */
  private extractSummary(result: any): Omit<PersonaSummary, 'personaId' | 'personaName' | 'totalStatements' | 'firstStatement' | 'lastStatement' | 'averageSentiment' | 'averageEmotionalIntensity' | 'mostEmotionalStatement'> {
    const validPositions = ['favorable', 'neutral', 'unfavorable', 'mixed'];
    const validInfluenceLevels = ['high', 'medium', 'low'];

    return {
      initialPosition: validPositions.includes(result.initialPosition)
        ? result.initialPosition
        : 'neutral',
      finalPosition: validPositions.includes(result.finalPosition)
        ? result.finalPosition
        : 'neutral',
      positionShifted: Boolean(result.positionShifted),
      shiftDescription: result.shiftDescription || undefined,
      mainPoints: Array.isArray(result.mainPoints) ? result.mainPoints : [],
      concernsRaised: Array.isArray(result.concernsRaised) ? result.concernsRaised : [],
      questionsAsked: Array.isArray(result.questionsAsked) ? result.questionsAsked : [],
      influenceLevel: validInfluenceLevels.includes(result.influenceLevel)
        ? result.influenceLevel
        : 'medium',
      agreedWithMost: Array.isArray(result.agreedWithMost) ? result.agreedWithMost : [],
      disagreedWithMost: Array.isArray(result.disagreedWithMost) ? result.disagreedWithMost : [],
      influencedBy: Array.isArray(result.influencedBy) ? result.influencedBy : [],
      summary: typeof result.summary === 'string' ? result.summary : 'Summary not available.'
    };
  }

  /**
   * Get persona summaries for a conversation
   */
  async getPersonaSummaries(conversationId: string): Promise<PersonaSummary[]> {
    const summaries = await this.prisma.focusGroupPersonaSummary.findMany({
      where: { conversationId },
      orderBy: { totalStatements: 'desc' } // Most active first
    });

    return summaries.map(s => ({
      personaId: s.personaId,
      personaName: s.personaName,
      totalStatements: s.totalStatements,
      firstStatement: s.firstStatement,
      lastStatement: s.lastStatement,
      initialPosition: s.initialPosition as any,
      finalPosition: s.finalPosition as any,
      positionShifted: s.positionShifted,
      shiftDescription: s.shiftDescription || undefined,
      mainPoints: s.mainPoints as string[],
      concernsRaised: s.concernsRaised as string[],
      questionsAsked: s.questionsAsked as string[],
      influenceLevel: s.influenceLevel as any,
      agreedWithMost: s.agreedWithMost,
      disagreedWithMost: s.disagreedWithMost,
      influencedBy: s.influencedBy,
      averageSentiment: s.averageSentiment,
      averageEmotionalIntensity: parseFloat(s.averageEmotionalIntensity.toString()),
      mostEmotionalStatement: s.mostEmotionalStatement || undefined,
      summary: s.summary
    }));
  }
}
