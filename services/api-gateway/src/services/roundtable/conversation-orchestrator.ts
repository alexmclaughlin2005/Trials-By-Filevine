/**
 * ConversationOrchestrator - Orchestrates roundtable conversations
 *
 * Coordinates personas in argument-centric discussions using:
 * - TurnManager for speaking order
 * - PromptClient for AI-generated statements
 * - Database for persisting conversation
 */

import { PrismaClient } from '@juries/database';
import { PromptClient } from '@juries/prompt-client';
import { TurnManager, LeadershipLevel, PersonaTurnInfo, Statement } from './turn-manager';

export interface PersonaInfo {
  id: string;
  name: string;
  description: string;
  demographics?: any;
  worldview?: string;
  leadershipLevel?: string;
  communicationStyle?: string;
  persuasionSusceptibility?: string;
  lifeExperiences?: any;
  dimensions?: any;
}

export interface ArgumentInfo {
  id: string;
  title: string;
  content: string;
}

export interface CaseContextInfo {
  caseName: string;
  caseType: string;
  ourSide: string;
  facts: string[];
}

export interface ConversationInput {
  sessionId: string;
  argument: ArgumentInfo;
  caseContext: CaseContextInfo;
  personas: PersonaInfo[];
}

export interface ConversationResult {
  conversationId: string;
  statements: Statement[];
  consensusAreas: string[];
  fracturePoints: string[];
  keyDebatePoints: string[];
  influentialPersonas: any[];
  converged: boolean;
  convergenceReason: string;
}

/**
 * Length guidance based on leadership level
 */
const LENGTH_GUIDANCE: Record<LeadershipLevel, string> = {
  [LeadershipLevel.LEADER]: "Share your view fully in 3-5 sentences. You often ask others what they think.",
  [LeadershipLevel.INFLUENCER]: "State your position clearly in 2-4 sentences. You're not shy about disagreeing.",
  [LeadershipLevel.FOLLOWER]: "Keep it brief, 1-2 sentences. You might reference what someone else said.",
  [LeadershipLevel.PASSIVE]: "A short response of 1 sentence. You don't say much unless it really matters."
};

/**
 * Behavioral guidance based on leadership level
 */
const LEADERSHIP_GUIDANCE: Record<LeadershipLevel, string> = {
  [LeadershipLevel.LEADER]: "You tend to dominate discussions and set the tone. Others look to you for direction. You speak first and often, respond to nearly every statement, and attempt to build consensus.",
  [LeadershipLevel.INFLUENCER]: "You have strong opinions and are respected, but don't dominate. You speak regularly and engage with 60-70% of discussion points. You may challenge the leader.",
  [LeadershipLevel.FOLLOWER]: "You have opinions but wait for social cues. You speak when addressed or when strongly moved. You often agree or disagree with leaders.",
  [LeadershipLevel.PASSIVE]: "You rarely contribute and process internally. You only speak when directly called on or when a topic hits personal experience. Your responses are very brief."
};

export class ConversationOrchestrator {
  private prisma: PrismaClient;
  private promptClient: PromptClient;
  private turnManager?: TurnManager;

  constructor(prisma: PrismaClient, promptClient: PromptClient) {
    this.prisma = prisma;
    this.promptClient = promptClient;
  }

  /**
   * Run a complete conversation about an argument
   */
  async runConversation(input: ConversationInput): Promise<ConversationResult> {
    console.log(`🎭 Starting roundtable conversation for argument: ${input.argument.title}`);

    // Create conversation record
    const conversation = await this.prisma.focusGroupConversation.create({
      data: {
        sessionId: input.sessionId,
        argumentId: input.argument.id
      }
    });

    // Initialize turn manager
    const personaTurnInfos: PersonaTurnInfo[] = input.personas.map(p => ({
      personaId: p.id,
      personaName: p.name,
      leadershipLevel: this.normalizeLeadershipLevel(p.leadershipLevel),
      speakCount: 0
    }));

    this.turnManager = new TurnManager(personaTurnInfos);

    // Phase 1: Initial reactions (everyone speaks once, ordered by leadership)
    console.log('📢 Phase 1: Initial reactions...');
    await this.runInitialReactions(conversation.id, input);

    // Phase 2: Dynamic deliberation
    console.log('💬 Phase 2: Dynamic deliberation...');
    await this.runDynamicDeliberation(conversation.id, input);

    // Phase 3: Analyze and synthesize conversation
    console.log('📊 Phase 3: Analyzing conversation...');
    const synthesis = await this.synthesizeConversation(conversation.id, input);

    // Update conversation record with synthesis
    await this.prisma.focusGroupConversation.update({
      where: { id: conversation.id },
      data: {
        completedAt: new Date(),
        converged: true,
        convergenceReason: synthesis.convergenceReason,
        consensusAreas: synthesis.consensusAreas,
        fracturePoints: synthesis.fracturePoints,
        keyDebatePoints: synthesis.keyDebatePoints,
        influentialPersonas: synthesis.influentialPersonas
      }
    });

    console.log(`✅ Conversation complete! ${this.turnManager.getStatistics().totalStatements} statements generated.`);

    return {
      conversationId: conversation.id,
      statements: this.turnManager.getConversationHistory(),
      ...synthesis,
      converged: true
    };
  }

  /**
   * Phase 1: Initial reactions from all personas
   */
  private async runInitialReactions(conversationId: string, input: ConversationInput): Promise<void> {
    // Sort personas by leadership (leaders first)
    const sorted = [...input.personas].sort((a, b) => {
      const levelA = this.normalizeLeadershipLevel(a.leadershipLevel);
      const levelB = this.normalizeLeadershipLevel(b.leadershipLevel);
      const weights = {
        [LeadershipLevel.LEADER]: 4,
        [LeadershipLevel.INFLUENCER]: 3,
        [LeadershipLevel.FOLLOWER]: 2,
        [LeadershipLevel.PASSIVE]: 1
      };
      return weights[levelB] - weights[levelA];
    });

    for (const persona of sorted) {
      const statement = await this.generateInitialReaction(persona, input);
      await this.saveStatement(conversationId, persona, statement);
      this.turnManager!.recordStatement({
        personaId: persona.id,
        personaName: persona.name,
        content: statement,
        sequenceNumber: this.turnManager!.getStatistics().totalStatements + 1
      });
    }
  }

  /**
   * Phase 2: Dynamic deliberation with turn-taking
   */
  private async runDynamicDeliberation(conversationId: string, input: ConversationInput): Promise<void> {
    let iterationCount = 0;
    const maxIterations = 50; // Safety limit

    while (this.turnManager!.shouldContinue() && iterationCount < maxIterations) {
      const nextSpeaker = this.turnManager!.determineNextSpeaker();

      if (!nextSpeaker) {
        console.log('No more eligible speakers.');
        break;
      }

      const persona = input.personas.find(p => p.id === nextSpeaker.personaId);
      if (!persona) {
        console.error(`Persona not found: ${nextSpeaker.personaId}`);
        break;
      }

      const statement = await this.generateConversationTurn(persona, input);
      await this.saveStatement(conversationId, persona, statement);

      this.turnManager!.recordStatement({
        personaId: persona.id,
        personaName: persona.name,
        content: statement,
        sequenceNumber: this.turnManager!.getStatistics().totalStatements + 1
      });

      iterationCount++;
    }

    if (iterationCount >= maxIterations) {
      console.warn('⚠️ Maximum iteration count reached');
    }
  }

  /**
   * Generate initial reaction using prompt service
   */
  private async generateInitialReaction(persona: PersonaInfo, input: ConversationInput): Promise<string> {
    const leadershipLevel = this.normalizeLeadershipLevel(persona.leadershipLevel);
    const lengthGuidance = LENGTH_GUIDANCE[leadershipLevel];

    // Build previous speakers context
    const history = this.turnManager!.getConversationHistory();
    const previousSpeakers = history.length > 0
      ? this.formatConversationTranscript(history)
      : null;

    try {
      // Use prompt service
      // Note: System prompt should be set in the prompt template itself
      const { result } = await this.promptClient.execute('roundtable-initial-reaction', {
        variables: {
          caseContext: this.formatCaseContext(input.caseContext),
          argumentContent: input.argument.content,
          previousSpeakers,
          lengthGuidance,
          // Persona context for system prompt
          name: persona.name,
          demographics: this.formatDemographics(persona),
          worldview: persona.worldview || 'Not specified',
          values: this.formatValues(persona),
          biases: this.formatBiases(persona),
          communicationStyle: persona.communicationStyle || 'Conversational',
          lifeExperiences: this.formatLifeExperiences(persona),
          leadershipLevel,
          leadershipGuidance: LEADERSHIP_GUIDANCE[leadershipLevel]
        }
      });

      return this.extractStatement(result);
    } catch (error) {
      console.error(`Error generating initial reaction for ${persona.name}:`, error);
      // Fallback mock response
      return `I think ${input.argument.title.toLowerCase()} raises some important points that we need to consider carefully.`;
    }
  }

  /**
   * Generate conversation turn using prompt service
   */
  private async generateConversationTurn(persona: PersonaInfo, input: ConversationInput): Promise<string> {
    const leadershipLevel = this.normalizeLeadershipLevel(persona.leadershipLevel);
    const lengthGuidance = LENGTH_GUIDANCE[leadershipLevel];

    const history = this.turnManager!.getConversationHistory();
    const lastStatement = history[history.length - 1];

    try {
      const { result } = await this.promptClient.execute('roundtable-conversation-turn', {
        variables: {
          caseContext: this.formatCaseContext(input.caseContext),
          argumentContent: input.argument.content,
          conversationTranscript: this.formatConversationTranscript(history),
          lastSpeaker: lastStatement ? {
            name: lastStatement.personaName,
            statement: lastStatement.content
          } : null,
          lengthGuidance,
          personaName: persona.name,
          // Persona context
          name: persona.name,
          demographics: this.formatDemographics(persona),
          worldview: persona.worldview || 'Not specified',
          values: this.formatValues(persona),
          biases: this.formatBiases(persona),
          communicationStyle: persona.communicationStyle || 'Conversational',
          lifeExperiences: this.formatLifeExperiences(persona),
          leadershipLevel,
          leadershipGuidance: LEADERSHIP_GUIDANCE[leadershipLevel]
        }
      });

      return this.extractStatement(result);
    } catch (error) {
      console.error(`Error generating conversation turn for ${persona.name}:`, error);
      // Fallback mock response
      return `I ${leadershipLevel === LeadershipLevel.LEADER ? 'agree' : 'see the point'}.`;
    }
  }

  /**
   * Format demographics for prompt
   */
  private formatDemographics(persona: PersonaInfo): string {
    if (typeof persona.demographics === 'object' && persona.demographics !== null) {
      return JSON.stringify(persona.demographics);
    }
    return persona.demographics as string || 'No demographic information provided';
  }

  /**
   * Format values for prompt
   */
  private formatValues(persona: PersonaInfo): string {
    return persona.description || 'Core values not specified';
  }

  /**
   * Format biases for prompt
   */
  private formatBiases(persona: PersonaInfo): string {
    if (typeof persona.dimensions === 'object' && persona.dimensions !== null) {
      return JSON.stringify(persona.dimensions);
    }
    return 'No specific biases documented';
  }

  /**
   * Format life experiences for prompt
   */
  private formatLifeExperiences(persona: PersonaInfo): string {
    if (typeof persona.lifeExperiences === 'object' && persona.lifeExperiences !== null) {
      return JSON.stringify(persona.lifeExperiences);
    }
    return persona.lifeExperiences as string || 'No life experiences documented';
  }

  /**
   * Format case context for prompt
   */
  private formatCaseContext(context: CaseContextInfo): string {
    return `Case: ${context.caseName}
Type: ${context.caseType}
Our Side: ${context.ourSide}

Key Facts:
${context.facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}`;
  }

  /**
   * Format conversation transcript
   */
  private formatConversationTranscript(statements: Statement[]): string {
    return statements
      .map(s => `${s.personaName}: "${s.content}"`)
      .join('\n\n');
  }

  /**
   * Extract statement from AI response
   */
  private extractStatement(result: any): string {
    if (typeof result === 'string') {
      return result;
    }
    if (result && typeof result.statement === 'string') {
      return result.statement;
    }
    if (result && typeof result.content === 'string') {
      return result.content;
    }
    console.warn('Unexpected result format:', result);
    return 'I need more time to think about this.';
  }

  /**
   * Save statement to database
   */
  private async saveStatement(conversationId: string, persona: PersonaInfo, content: string): Promise<void> {
    const speakCount = this.turnManager!.getSpeakCount(persona.id) + 1;
    const sequenceNumber = this.turnManager!.getStatistics().totalStatements + 1;

    await this.prisma.focusGroupStatement.create({
      data: {
        conversationId,
        personaId: persona.id,
        personaName: persona.name,
        sequenceNumber,
        content,
        speakCount
      }
    });
  }

  /**
   * Synthesize conversation after completion
   */
  private async synthesizeConversation(conversationId: string, input: ConversationInput): Promise<any> {
    const history = this.turnManager!.getConversationHistory();

    try {
      const { result } = await this.promptClient.execute('roundtable-conversation-synthesis', {
        variables: {
          argumentContent: input.argument.content,
          conversationTranscript: this.formatConversationTranscript(history),
          personas: input.personas.map(p => ({
            name: p.name,
            leadershipLevel: this.normalizeLeadershipLevel(p.leadershipLevel),
            description: p.description
          }))
        }
      });

      return result;
    } catch (error) {
      console.error('Error synthesizing conversation:', error);
      // Fallback synthesis
      return {
        consensusAreas: ['The group discussed the argument thoroughly'],
        fracturePoints: [],
        keyDebatePoints: ['Main argument evaluation'],
        influentialPersonas: [],
        overallReception: 'divided',
        convergenceReason: 'Natural conclusion of discussion'
      };
    }
  }

  /**
   * Normalize leadership level string to enum
   */
  private normalizeLeadershipLevel(level?: string): LeadershipLevel {
    const normalized = level?.toUpperCase();
    if (normalized === 'LEADER') return LeadershipLevel.LEADER;
    if (normalized === 'INFLUENCER') return LeadershipLevel.INFLUENCER;
    if (normalized === 'FOLLOWER') return LeadershipLevel.FOLLOWER;
    if (normalized === 'PASSIVE') return LeadershipLevel.PASSIVE;
    // Default to FOLLOWER if not specified
    return LeadershipLevel.FOLLOWER;
  }
}
