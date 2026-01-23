/**
 * StatementAnalyzer - Analyzes conversation statements for sentiment and social signals
 *
 * Post-processes statements to extract:
 * - Sentiment (plaintiff/defense leaning)
 * - Emotional intensity
 * - Key points made
 * - Social signals (agreement/disagreement, who addressed)
 */

import { PrismaClient } from '@juries/database';
import { PromptClient } from '@juries/prompt-client';

export interface StatementAnalysis {
  sentiment: 'plaintiff_leaning' | 'defense_leaning' | 'neutral' | 'conflicted';
  emotionalIntensity: number; // 0.0 to 1.0
  keyPoints: string[];
  addressedTo: string[];
  agreementSignals: string[];
  disagreementSignals: string[];
}

export class StatementAnalyzer {
  private prisma: PrismaClient;
  private promptClient: PromptClient;

  constructor(prisma: PrismaClient, promptClient: PromptClient) {
    this.prisma = prisma;
    this.promptClient = promptClient;
  }

  /**
   * Analyze all statements in a conversation
   */
  async analyzeConversation(conversationId: string): Promise<void> {
    console.log('🔍 Analyzing statements...');

    const statements = await this.prisma.focusGroupStatement.findMany({
      where: { conversationId },
      orderBy: { sequenceNumber: 'asc' }
    });

    const conversation = await this.prisma.focusGroupConversation.findUnique({
      where: { id: conversationId },
      include: {
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
      console.error('Conversation not found');
      return;
    }

    // Find the argument being discussed
    const argument = conversation.session.case.arguments.find(
      a => a.id === conversation.argumentId
    );

    if (!argument) {
      console.error('Argument not found');
      return;
    }

    // Build context from prior statements
    const contextBuilder: string[] = [];

    for (const statement of statements) {
      // Build conversation context (what was said before this statement)
      const conversationContext = contextBuilder.join('\n');

      // Analyze this statement
      const analysis = await this.analyzeStatement(
        statement.personaName,
        statement.content,
        argument.content,
        conversationContext
      );

      // Update statement with analysis
      await this.prisma.focusGroupStatement.update({
        where: { id: statement.id },
        data: {
          sentiment: analysis.sentiment,
          emotionalIntensity: analysis.emotionalIntensity,
          keyPoints: analysis.keyPoints,
          addressedTo: analysis.addressedTo,
          agreementSignals: analysis.agreementSignals,
          disagreementSignals: analysis.disagreementSignals
        }
      });

      // Add to context for next statement
      contextBuilder.push(`${statement.personaName}: ${statement.content}`);
    }

    console.log(`✅ Analyzed ${statements.length} statements`);
  }

  /**
   * Analyze a single statement
   */
  private async analyzeStatement(
    personaName: string,
    statement: string,
    argumentContent: string,
    conversationContext?: string
  ): Promise<StatementAnalysis> {
    try {
      const { result } = await this.promptClient.execute('roundtable-statement-analysis', {
        variables: {
          personaName,
          statement,
          argumentContent,
          conversationContext: conversationContext || null
        }
      });

      // Validate and normalize the result
      return this.normalizeAnalysis(result);
    } catch (error) {
      console.error(`Error analyzing statement for ${personaName}:`, error);

      // Fallback analysis
      return {
        sentiment: 'neutral',
        emotionalIntensity: 0.5,
        keyPoints: [statement.substring(0, 100)],
        addressedTo: [],
        agreementSignals: [],
        disagreementSignals: []
      };
    }
  }

  /**
   * Normalize and validate analysis result
   */
  private normalizeAnalysis(result: any): StatementAnalysis {
    const validSentiments = ['plaintiff_leaning', 'defense_leaning', 'neutral', 'conflicted'];

    return {
      sentiment: validSentiments.includes(result.sentiment)
        ? result.sentiment
        : 'neutral',
      emotionalIntensity: this.clamp(result.emotionalIntensity || 0.5, 0, 1),
      keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints : [],
      addressedTo: Array.isArray(result.addressedTo) ? result.addressedTo : [],
      agreementSignals: Array.isArray(result.agreementSignals) ? result.agreementSignals : [],
      disagreementSignals: Array.isArray(result.disagreementSignals) ? result.disagreementSignals : []
    };
  }

  /**
   * Clamp a number between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Get conversation statistics
   */
  async getConversationStatistics(conversationId: string) {
    const statements = await this.prisma.focusGroupStatement.findMany({
      where: { conversationId }
    });

    const sentimentCounts = {
      plaintiff_leaning: 0,
      defense_leaning: 0,
      neutral: 0,
      conflicted: 0
    };

    let totalEmotionalIntensity = 0;
    const allKeyPoints: string[] = [];
    const personaInteractions = new Map<string, Set<string>>();

    for (const statement of statements) {
      // Count sentiments
      if (statement.sentiment) {
        sentimentCounts[statement.sentiment as keyof typeof sentimentCounts]++;
      }

      // Average emotional intensity
      if (statement.emotionalIntensity) {
        totalEmotionalIntensity += parseFloat(statement.emotionalIntensity.toString());
      }

      // Collect key points
      if (statement.keyPoints) {
        const points = Array.isArray(statement.keyPoints)
          ? statement.keyPoints
          : JSON.parse(JSON.stringify(statement.keyPoints));
        allKeyPoints.push(...points);
      }

      // Track interactions
      if (statement.addressedTo && statement.addressedTo.length > 0) {
        if (!personaInteractions.has(statement.personaName)) {
          personaInteractions.set(statement.personaName, new Set());
        }
        statement.addressedTo.forEach(target =>
          personaInteractions.get(statement.personaName)!.add(target)
        );
      }
    }

    return {
      totalStatements: statements.length,
      sentimentCounts,
      averageEmotionalIntensity: statements.length > 0
        ? totalEmotionalIntensity / statements.length
        : 0,
      keyPoints: allKeyPoints,
      personaInteractions: Object.fromEntries(
        Array.from(personaInteractions.entries()).map(([persona, targets]) => [
          persona,
          Array.from(targets)
        ])
      )
    };
  }
}
