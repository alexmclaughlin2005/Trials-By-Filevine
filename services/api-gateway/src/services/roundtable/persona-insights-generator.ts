/**
 * PersonaInsightsGenerator - Generates deep case interpretation insights for each persona
 *
 * Analyzes how each persona interprets the overall case based on their statements,
 * background, and biases to provide targeted persuasion strategies.
 */

import { PrismaClient } from '@juries/database';
import { PromptClient } from '@juries/prompt-client';

export interface PersonaInsight {
  personaId: string;
  personaName: string;
  archetype: string;
  caseInterpretation: string;
  keyBiases: string[];
  decisionDrivers: string[];
  persuasionStrategy: string;
  vulnerabilities: string[];
  strengths: string[];
}

export class PersonaInsightsGenerator {
  constructor(
    private prisma: PrismaClient,
    private promptClient: PromptClient
  ) {}

  /**
   * Generate insights for all personas in a conversation
   * @param conversationId - The conversation ID
   * @param forceRegenerate - If true, regenerate even if cached insights exist
   */
  async generateInsights(conversationId: string, forceRegenerate: boolean = false): Promise<PersonaInsight[]> {
    console.log(`🧠 Generating persona insights for conversation: ${conversationId} (force: ${forceRegenerate})`);

    // Check if insights already exist in database (unless forced)
    if (!forceRegenerate) {
      const cachedInsights = await this.fetchExistingInsights(conversationId);
      if (cachedInsights.length > 0) {
        console.log(`✅ Using ${cachedInsights.length} cached insights from database`);
        return cachedInsights;
      }
    }

    // Fetch conversation with all related data
    const conversation = await this.fetchConversation(conversationId);

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    if (!conversation.completedAt) {
      throw new Error('Cannot generate insights for incomplete conversation');
    }

    // Get persona summaries
    const personaSummaries = await this.prisma.focusGroupPersonaSummary.findMany({
      where: { conversationId },
    });

    if (personaSummaries.length === 0) {
      throw new Error('No persona summaries found');
    }

    // Fetch personas separately (no relation in schema)
    const personaIds = personaSummaries.map(s => s.personaId);
    const personas = await this.prisma.persona.findMany({
      where: { id: { in: personaIds } },
    });

    // Fetch statements for all summaries
    const statements = await this.prisma.focusGroupStatement.findMany({
      where: { conversationId },
      orderBy: { sequenceNumber: 'asc' },
    });

    // Create maps for easy lookup
    const personaMap = new Map(personas.map((p) => [p.id, p]));
    const statementsMap = new Map<string, any[]>();
    for (const stmt of statements) {
      if (!statementsMap.has(stmt.personaId)) {
        statementsMap.set(stmt.personaId, []);
      }
      statementsMap.get(stmt.personaId)!.push(stmt);
    }

    // Get the argument
    const argument = await this.prisma.caseArgument.findUnique({
      where: { id: conversation.argumentId },
    });

    if (!argument) {
      throw new Error('Argument not found');
    }

    // Generate insights for each persona
    const insights: PersonaInsight[] = [];
    for (const summary of personaSummaries) {
      console.log(`  📊 Analyzing ${summary.personaName}...`);
      const persona = personaMap.get(summary.personaId);
      const personaStatements = statementsMap.get(summary.personaId) || [];
      const insight = await this.generatePersonaInsight(summary, persona, personaStatements, argument, conversation);
      insights.push(insight);
    }

    console.log(`✅ Generated ${insights.length} insights`);

    // Save insights to database
    await this.saveInsights(conversationId, insights);

    return insights;
  }

  /**
   * Generate insight for a single persona
   */
  private async generatePersonaInsight(
    summary: any,
    persona: any,
    statements: any[],
    argument: any,
    conversation: any
  ): Promise<PersonaInsight> {
    // Format persona's statements
    const personaStatements = statements
      .map((s: any) => `Statement #${s.sequenceNumber}: "${s.content}"`)
      .join('\n\n');

    // Format persona profile
    const personaProfile = this.formatPersonaProfile(persona);

    // Format existing summary
    const existingSummary = `
Initial Position: ${summary.initialPosition}
Final Position: ${summary.finalPosition}
Position Shifted: ${summary.positionShifted ? 'Yes' : 'No'}
${summary.shiftDescription ? `Why: ${summary.shiftDescription}` : ''}

Journey Summary: ${summary.summary}

Main Points Made:
${summary.mainPoints.map((p: string) => `- ${p}`).join('\n')}

Concerns Raised:
${summary.concernsRaised.map((c: string) => `- ${c}`).join('\n')}
`;

    try {
      const { result } = await this.promptClient.execute('persona-case-insights', {
        variables: {
          personaName: summary.personaName,
          personaProfile,
          argumentTitle: argument.title || 'Untitled Argument',
          argumentContent: argument.content || '',
          personaStatements,
          existingSummary,
          archetype: persona?.archetype || 'UNKNOWN',
        },
      });

      // Parse result
      const parsed = this.parseInsightResult(result);

      return {
        personaId: summary.personaId,
        personaName: summary.personaName,
        archetype: persona?.archetype || 'UNKNOWN',
        ...parsed,
      };
    } catch (error) {
      console.error(`Error generating insight for ${summary.personaName}:`, error);
      // Return fallback insight
      return {
        personaId: summary.personaId,
        personaName: summary.personaName,
        archetype: persona?.archetype || 'UNKNOWN',
        caseInterpretation: 'Unable to generate insights at this time.',
        keyBiases: [],
        decisionDrivers: [],
        persuasionStrategy: 'Unable to generate strategy at this time.',
        vulnerabilities: [],
        strengths: [],
      };
    }
  }

  /**
   * Fetch conversation with related data
   */
  private async fetchConversation(conversationId: string) {
    return await this.prisma.focusGroupConversation.findUnique({
      where: { id: conversationId },
      include: {
        session: true,
      },
    });
  }

  /**
   * Format persona profile for prompt
   */
  private formatPersonaProfile(persona: any): string {
    if (!persona) return 'No profile available';

    const parts = [
      `Archetype: ${persona.archetype || 'Unknown'}`,
      persona.tagline ? `Tagline: "${persona.tagline}"` : '',
      persona.description ? `Description: ${persona.description}` : '',
      persona.worldview ? `Worldview: ${persona.worldview}` : '',
      persona.leadershipLevel ? `Leadership: ${persona.leadershipLevel}` : '',
    ];

    if (persona.demographics && typeof persona.demographics === 'object') {
      parts.push(`Demographics: ${JSON.stringify(persona.demographics)}`);
    }

    if (persona.lifeExperiences && typeof persona.lifeExperiences === 'object') {
      parts.push(`Life Experiences: ${JSON.stringify(persona.lifeExperiences)}`);
    }

    return parts.filter(Boolean).join('\n');
  }

  /**
   * Parse AI response
   */
  private parseInsightResult(result: any): Omit<PersonaInsight, 'personaId' | 'personaName' | 'archetype'> {
    let parsed: any;

    try {
      if (typeof result === 'string') {
        // Try to extract JSON
        const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/) || result.match(/```\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else if (result.trim().startsWith('{')) {
          parsed = JSON.parse(result);
        } else {
          const jsonObjectMatch = result.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            parsed = JSON.parse(jsonObjectMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        }
      } else if (result && Array.isArray(result.content) && result.content[0]?.text) {
        // Anthropic API format
        const text = result.content[0].text;
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else if (text.trim().startsWith('{')) {
          parsed = JSON.parse(text);
        } else {
          const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
          if (jsonObjectMatch) {
            parsed = JSON.parse(jsonObjectMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        }
      } else if (typeof result === 'object') {
        parsed = result;
      } else {
        throw new Error('Unexpected AI response format');
      }

      // Validate structure
      this.validateInsightStructure(parsed);

      return parsed;
    } catch (error) {
      console.error('Parse error:', error);
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate insight structure
   */
  private validateInsightStructure(data: any): void {
    const required = ['caseInterpretation', 'keyBiases', 'decisionDrivers', 'persuasionStrategy', 'vulnerabilities', 'strengths'];
    for (const field of required) {
      if (data[field] === undefined) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate arrays
    for (const field of ['keyBiases', 'decisionDrivers', 'vulnerabilities', 'strengths']) {
      if (!Array.isArray(data[field])) {
        throw new Error(`Field ${field} must be an array`);
      }
    }

    // Validate strings
    for (const field of ['caseInterpretation', 'persuasionStrategy']) {
      if (typeof data[field] !== 'string') {
        throw new Error(`Field ${field} must be a string`);
      }
    }
  }

  /**
   * Fetch existing insights from database
   */
  private async fetchExistingInsights(conversationId: string): Promise<PersonaInsight[]> {
    const dbInsights = await this.prisma.focusGroupPersonaInsight.findMany({
      where: { conversationId },
      orderBy: { personaName: 'asc' },
    });

    return dbInsights.map(insight => ({
      personaId: insight.personaId,
      personaName: insight.personaName,
      archetype: insight.archetype,
      caseInterpretation: insight.caseInterpretation,
      keyBiases: insight.keyBiases as string[],
      decisionDrivers: insight.decisionDrivers as string[],
      persuasionStrategy: insight.persuasionStrategy,
      vulnerabilities: insight.vulnerabilities as string[],
      strengths: insight.strengths as string[],
    }));
  }

  /**
   * Save insights to database
   */
  private async saveInsights(conversationId: string, insights: PersonaInsight[]): Promise<void> {
    console.log(`💾 Saving ${insights.length} persona insights to database...`);

    try {
      // Delete existing insights if regenerating
      await this.prisma.focusGroupPersonaInsight.deleteMany({
        where: { conversationId },
      });

      // Insert new insights
      await this.prisma.focusGroupPersonaInsight.createMany({
        data: insights.map(insight => ({
          conversationId,
          personaId: insight.personaId,
          personaName: insight.personaName,
          archetype: insight.archetype,
          caseInterpretation: insight.caseInterpretation,
          keyBiases: insight.keyBiases,
          decisionDrivers: insight.decisionDrivers,
          persuasionStrategy: insight.persuasionStrategy,
          vulnerabilities: insight.vulnerabilities,
          strengths: insight.strengths,
          promptVersion: 'persona-case-insights-v1.0.0', // TODO: Get from prompt client
        })),
      });

      console.log(`✅ Saved ${insights.length} persona insights to database`);
    } catch (error) {
      console.error('❌ Error saving insights to database:', error);
      throw new Error(`Failed to save insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
