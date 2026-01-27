/**
 * TakeawaysGenerator - Generates strategic insights and recommendations from focus group conversations
 *
 * Analyzes completed roundtable conversations and produces:
 * - What landed (persuasive points)
 * - What confused (unclear arguments)
 * - What backfired (negative effects)
 * - Top questions jurors will ask
 * - Concrete recommendations for improvement
 */

import { PrismaClient } from '@juries/database';
import { PromptClient } from '@juries/prompt-client';

export interface TakeawaysResult {
  whatLanded: Array<{
    point: string;
    personaSupport: string[];
    evidence: string[];
  }>;
  whatConfused: Array<{
    point: string;
    personasConfused: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    evidence: string[];
  }>;
  whatBackfired: Array<{
    point: string;
    personasCritical: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    evidence: string[];
  }>;
  topQuestions: Array<{
    question: string;
    askedByCount: number;
    personaNames: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  recommendedEdits: Array<{
    editNumber: number;
    section: string;
    type: 'CLARIFY' | 'ADD' | 'REMOVE' | 'SOFTEN' | 'STRENGTHEN';
    originalText?: string;
    suggestedText: string;
    reason: string;
    affectedPersonas: string[];
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

export class TakeawaysGenerator {
  constructor(
    private prisma: PrismaClient,
    private promptClient: PromptClient
  ) {}

  /**
   * Generate takeaways for a conversation
   * Checks if already exists, returns cached version if available
   */
  async generateTakeaways(conversationId: string, forceRegenerate = false): Promise<TakeawaysResult> {
    console.log(`🎯 Generating takeaways for conversation: ${conversationId}`);

    // Check if takeaways already exist
    if (!forceRegenerate) {
      const existing = await this.prisma.focusGroupTakeaways.findUnique({
        where: { conversationId },
      });

      if (existing) {
        console.log('✓ Using cached takeaways');
        return this.parseTakeaways(existing);
      }
    }

    // Fetch conversation with all related data
    const conversation = await this.fetchConversation(conversationId);

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    if (!conversation.completedAt) {
      throw new Error('Cannot generate takeaways for incomplete conversation');
    }

    // Format data for prompt
    const promptVariables = await this.formatPromptVariables(conversation);

    // Execute prompt
    console.log('📝 Executing takeaways synthesis prompt...');
    console.log('Prompt variables:', {
      argumentTitle: promptVariables.argumentTitle,
      argumentContentLength: promptVariables.argumentContent?.length,
      transcriptLength: promptVariables.conversationTranscript?.length,
      personaSummariesLength: promptVariables.personaSummaries?.length,
    });

    let result;
    try {
      const response = await this.promptClient.execute('roundtable-takeaways-synthesis', {
        variables: promptVariables,
      });
      result = response.result;
      console.log('✅ Prompt execution successful');
    } catch (error) {
      console.error('❌ Prompt execution failed:', error);
      throw error;
    }

    // Parse and validate result
    const takeaways = this.parseAndValidate(result);

    // Save to database
    await this.saveTakeaways(conversationId, takeaways);

    console.log('✅ Takeaways generated and saved');
    return takeaways;
  }

  /**
   * Fetch conversation with all related data
   */
  private async fetchConversation(conversationId: string) {
    return await this.prisma.focusGroupConversation.findUnique({
      where: { id: conversationId },
      include: {
        statements: {
          orderBy: { sequenceNumber: 'asc' },
        },
        personaSummaries: true,
        session: true,
      },
    });
  }

  /**
   * Format conversation data for prompt execution
   */
  private async formatPromptVariables(conversation: any): Promise<Record<string, string>> {
    // Get the argument being discussed
    const argument = await this.prisma.caseArgument.findUnique({
      where: { id: conversation.argumentId },
    });

    if (!argument) {
      throw new Error('Argument not found for conversation');
    }

    // Format transcript
    const transcript = this.formatTranscript(conversation.statements);

    // Format persona summaries
    const summaries = this.formatPersonaSummaries(conversation.personaSummaries);

    // Format consensus/fracture points
    const consensusAreas = this.formatJsonArray(conversation.consensusAreas);
    const fracturePoints = this.formatJsonArray(conversation.fracturePoints);

    return {
      argumentTitle: argument.title || 'Untitled Argument',
      argumentContent: argument.content || '',
      conversationTranscript: transcript,
      personaSummaries: summaries,
      consensusAreas,
      fracturePoints,
    };
  }

  /**
   * Format conversation transcript
   */
  private formatTranscript(statements: any[]): string {
    return statements
      .map((s) => `${s.personaName} (#${s.sequenceNumber}): "${s.content}"`)
      .join('\n\n');
  }

  /**
   * Format persona summaries
   */
  private formatPersonaSummaries(summaries: any[]): string {
    if (!summaries || summaries.length === 0) {
      return 'No persona summaries available';
    }

    return summaries
      .map((s) => {
        const lines = [
          `**${s.personaName}:**`,
          `- Position: ${s.initialPosition} → ${s.finalPosition}`,
          `- Influence: ${s.influenceLevel}`,
          `- Summary: ${s.summary}`,
        ];
        return lines.join('\n');
      })
      .join('\n\n');
  }

  /**
   * Format JSON array for display
   */
  private formatJsonArray(data: any): string {
    if (!data) return 'None';
    if (Array.isArray(data)) {
      return data.length > 0 ? data.map((item, i) => `${i + 1}. ${item}`).join('\n') : 'None';
    }
    return 'None';
  }

  /**
   * Parse and validate AI response
   */
  private parseAndValidate(result: any): TakeawaysResult {
    console.log('🔍 Parsing AI response...');
    console.log('Response type:', typeof result);
    console.log('Response keys:', result && typeof result === 'object' ? Object.keys(result) : 'N/A');

    // Handle different response formats
    let parsed: any;

    try {
      if (typeof result === 'string') {
        console.log('Response is string, length:', result.length);
        console.log('First 200 chars:', result.substring(0, 200));
        // Try to extract JSON from markdown code blocks
        const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/) || result.match(/```\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          console.log('Found JSON in code block');
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          console.log('No code block found, trying direct parse');
          // Try direct JSON parse
          parsed = JSON.parse(result);
        }
      } else if (result && Array.isArray(result.content) && result.content[0]?.text) {
        console.log('Response is Anthropic API format');
        // Anthropic API format
        const text = result.content[0].text;
        console.log('Text length:', text.length);
        console.log('First 200 chars:', text.substring(0, 200));

        // Try to find JSON in code blocks
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          console.log('Found JSON in code block');
          parsed = JSON.parse(jsonMatch[1]);
        } else if (text.trim().startsWith('{')) {
          // Try direct JSON parse if starts with {
          console.log('Text starts with {, trying direct parse');
          parsed = JSON.parse(text);
        } else {
          // Fallback: Try to find any JSON object in the text
          console.log('Looking for JSON object in text');
          const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            console.log('Found JSON object, attempting parse');
            parsed = JSON.parse(jsonObjectMatch[0]);
          } else {
            console.log('No JSON found, response appears to be markdown. Failing with detailed error.');
            throw new Error(`Response is not JSON. First 500 chars: ${text.substring(0, 500)}`);
          }
        }
      } else if (typeof result === 'object') {
        console.log('Response is object, using directly');
        parsed = result;
      } else {
        throw new Error('Unexpected AI response format');
      }

      console.log('Parsed successfully, validating structure...');
      // Validate structure
      this.validateTakeawaysStructure(parsed);
      console.log('✅ Validation passed');

      return parsed as TakeawaysResult;
    } catch (error) {
      console.error('❌ Parse/validation error:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');
      throw error;
    }
  }

  /**
   * Validate takeaways structure
   */
  private validateTakeawaysStructure(data: any): void {
    const required = ['whatLanded', 'whatConfused', 'whatBackfired', 'topQuestions', 'recommendedEdits'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
      if (!Array.isArray(data[field])) {
        throw new Error(`Field ${field} must be an array`);
      }
    }

    // Validate whatLanded items
    for (const item of data.whatLanded) {
      if (!item.point || !item.personaSupport || !item.evidence) {
        throw new Error('Invalid whatLanded item structure');
      }
    }

    // Validate whatConfused items
    for (const item of data.whatConfused) {
      if (!item.point || !item.personasConfused || !item.severity || !item.evidence) {
        throw new Error('Invalid whatConfused item structure');
      }
    }

    // Validate whatBackfired items
    for (const item of data.whatBackfired) {
      if (!item.point || !item.personasCritical || !item.severity || !item.evidence) {
        throw new Error('Invalid whatBackfired item structure');
      }
    }

    // Validate topQuestions items
    for (const item of data.topQuestions) {
      if (!item.question || typeof item.askedByCount !== 'number' || !item.personaNames || !item.priority) {
        throw new Error('Invalid topQuestions item structure');
      }
    }

    // Validate recommendedEdits items
    for (const item of data.recommendedEdits) {
      if (!item.section || !item.type || !item.suggestedText || !item.reason || !item.priority) {
        throw new Error('Invalid recommendedEdits item structure');
      }
    }
  }

  /**
   * Save takeaways to database
   */
  private async saveTakeaways(conversationId: string, takeaways: TakeawaysResult): Promise<void> {
    // Delete existing if regenerating
    await this.prisma.focusGroupTakeaways.deleteMany({
      where: { conversationId },
    });

    // Create new
    await this.prisma.focusGroupTakeaways.create({
      data: {
        conversationId,
        whatLanded: takeaways.whatLanded as any,
        whatConfused: takeaways.whatConfused as any,
        whatBackfired: takeaways.whatBackfired as any,
        topQuestions: takeaways.topQuestions as any,
        recommendedEdits: takeaways.recommendedEdits as any,
        promptVersion: 'takeaways-v1.0.0',
      },
    });
  }

  /**
   * Parse takeaways from database record
   */
  private parseTakeaways(record: any): TakeawaysResult {
    return {
      whatLanded: record.whatLanded as any,
      whatConfused: record.whatConfused as any,
      whatBackfired: record.whatBackfired as any,
      topQuestions: record.topQuestions as any,
      recommendedEdits: record.recommendedEdits as any,
    };
  }
}
