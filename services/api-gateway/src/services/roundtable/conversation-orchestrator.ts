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
import { PersonaSummarizer, PersonaSummary } from './persona-summarizer';
import { RelevanceScorer } from './relevance-scorer';

export interface PersonaInfo {
  id: string;
  name: string;
  description: string;
  archetype?: string;
  demographics?: any;
  worldview?: string;
  leadershipLevel?: string;
  communicationStyle?: string;
  persuasionSusceptibility?: string;
  lifeExperiences?: any;
  dimensions?: any;
  // Voice differentiation attributes
  vocabularyLevel?: string;
  sentenceStyle?: string;
  speechPatterns?: string[] | any;
  responseTendency?: string;
  engagementStyle?: string;
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
  existingConversationId?: string; // Optional: use existing conversation record
  customQuestions?: Array<{
    id: string;
    question: string;
    order: number;
    targetArchetypes?: string[];
  }>; // Optional: custom questions to weave into discussion
}

export interface ConversationResult {
  conversationId: string;
  statements: Statement[];
  personaSummaries: PersonaSummary[];
  consensusAreas: string[];
  fracturePoints: string[];
  keyDebatePoints: string[];
  influentialPersonas: any[];
  converged: boolean;
  convergenceReason: string;
}

/**
 * Length guidance based on leadership level with word count limits
 */
const LENGTH_GUIDANCE: Record<LeadershipLevel, string> = {
  [LeadershipLevel.LEADER]: "3-5 sentences, maximum 150 words. Share your view fully. You often ask others what they think.",
  [LeadershipLevel.INFLUENCER]: "3-5 sentences, maximum 150 words. State your position clearly. You're not shy about disagreeing.",
  [LeadershipLevel.FOLLOWER]: "1-3 sentences, maximum 75 words. Keep it brief. You might reference what someone else said.",
  [LeadershipLevel.PASSIVE]: "1-2 sentences, maximum 75 words. Be very brief. You speak when something truly matters to you."
};

/**
 * Maximum word counts by leadership level (hard caps)
 */
const MAX_WORD_COUNTS: Record<LeadershipLevel, number> = {
  [LeadershipLevel.LEADER]: 150,
  [LeadershipLevel.INFLUENCER]: 150,
  [LeadershipLevel.FOLLOWER]: 75,
  [LeadershipLevel.PASSIVE]: 75
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
  private personaSummarizer: PersonaSummarizer;
  private relevanceScorer: RelevanceScorer;

  constructor(prisma: PrismaClient, promptClient: PromptClient) {
    this.prisma = prisma;
    this.promptClient = promptClient;
    this.personaSummarizer = new PersonaSummarizer(prisma, promptClient);
    this.relevanceScorer = new RelevanceScorer();
  }

  /**
   * Run a complete conversation about an argument
   */
  async runConversation(input: ConversationInput): Promise<ConversationResult> {
    console.log(`🎭 Starting roundtable conversation for argument: ${input.argument.title}`);

    // Use existing conversation or create new one
    const conversation = input.existingConversationId
      ? await this.prisma.focusGroupConversation.findUnique({
          where: { id: input.existingConversationId }
        })
      : await this.prisma.focusGroupConversation.create({
          data: {
            sessionId: input.sessionId,
            argumentId: input.argument.id
          }
        });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Phase 0: Compute relevance scores
    console.log('🔍 Phase 0: Computing persona relevance scores...');
    const relevanceScores = this.computeRelevanceScores(input);

    // Initialize turn manager WITH relevance scores
    const personaTurnInfos: PersonaTurnInfo[] = input.personas.map(p => ({
      personaId: p.id,
      personaName: p.name,
      leadershipLevel: this.normalizeLeadershipLevel(p.leadershipLevel),
      speakCount: 0,
      relevanceScore: relevanceScores.get(p.id)
    }));

    this.turnManager = new TurnManager(personaTurnInfos);

    // Phase 1: Initial reactions (everyone speaks once, ordered by leadership)
    console.log('📢 Phase 1: Initial reactions...');
    await this.runInitialReactions(conversation.id, input);

    // Phase 2: Dynamic deliberation
    console.log('💬 Phase 2: Dynamic deliberation...');
    await this.runDynamicDeliberation(conversation.id, input);

    // Phase 3: Generate per-persona summaries
    console.log('👤 Phase 3: Generating persona summaries...');
    const personaSummaries = await this.personaSummarizer.summarizePersonas(conversation.id);

    // Phase 4: Analyze and synthesize conversation
    console.log('📊 Phase 4: Analyzing overall conversation...');
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
      personaSummaries,
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

      // Extract key points for novelty tracking
      const keyPoints = await this.extractKeyPoints(statement);

      this.turnManager!.recordStatement({
        personaId: persona.id,
        personaName: persona.name,
        content: statement,
        sequenceNumber: this.turnManager!.getStatistics().totalStatements + 1,
        keyPoints
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

      // Extract key points for novelty tracking
      const keyPoints = await this.extractKeyPoints(statement);

      this.turnManager!.recordStatement({
        personaId: persona.id,
        personaName: persona.name,
        content: statement,
        sequenceNumber: this.turnManager!.getStatistics().totalStatements + 1,
        keyPoints
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
      const customQuestionsText = this.formatCustomQuestions(input.customQuestions, persona.archetype);

      const { result } = await this.promptClient.execute('roundtable-initial-reaction', {
        variables: {
          caseContext: this.formatCaseContext(input.caseContext),
          argumentContent: input.argument.content,
          previousSpeakers,
          lengthGuidance,
          customQuestions: customQuestionsText,
          // Persona context for system prompt
          name: persona.name,
          demographics: this.formatDemographics(persona),
          worldview: persona.worldview || 'Not specified',
          values: this.formatValues(persona),
          biases: this.formatBiases(persona),
          communicationStyle: persona.communicationStyle || 'Conversational',
          lifeExperiences: this.formatLifeExperiences(persona),
          leadershipLevel,
          leadershipGuidance: LEADERSHIP_GUIDANCE[leadershipLevel],
          // Voice characteristics
          vocabularyLevel: this.formatVocabularyLevel(persona.vocabularyLevel),
          sentenceStyle: this.formatSentenceStyle(persona.sentenceStyle),
          speechPatterns: this.formatSpeechPatterns(persona.speechPatterns),
          responseTendency: this.formatResponseTendency(persona.responseTendency)
        }
      });

      const statement = this.extractStatement(result);
      return this.enforceWordCount(statement, leadershipLevel);
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
      const customQuestionsText = this.formatCustomQuestions(input.customQuestions, persona.archetype);

      // Extract established points to prevent repetition
      const establishedPoints = await this.getEstablishedPoints(history);
      const establishedPointsText = this.formatEstablishedPoints(establishedPoints);

      // Get dissent context if present
      const dissentContext = this.turnManager!.getDissentContext();
      const dissentInfo = dissentContext && dissentContext.isPresent ? {
        dissenterName: dissentContext.dissenterPersonaName,
        dissentStatement: dissentContext.dissentStatement,
        dissentKeyPoints: (dissentContext.dissentKeyPoints || []).join('\n- ')
      } : null;

      const { result } = await this.promptClient.execute('roundtable-conversation-turn', {
        variables: {
          caseContext: this.formatCaseContext(input.caseContext),
          argumentContent: input.argument.content,
          conversationTranscript: this.formatConversationTranscript(history),
          lastSpeaker: lastStatement ? {
            name: lastStatement.personaName,
            statement: lastStatement.content
          } : null,
          addressedToYou: null, // TODO: Implement mention detection
          dissentInfo, // Add dissent context
          lengthGuidance,
          customQuestions: customQuestionsText,
          establishedPoints: establishedPointsText,
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
          leadershipGuidance: LEADERSHIP_GUIDANCE[leadershipLevel],
          // Voice characteristics
          vocabularyLevel: this.formatVocabularyLevel(persona.vocabularyLevel),
          sentenceStyle: this.formatSentenceStyle(persona.sentenceStyle),
          speechPatterns: this.formatSpeechPatterns(persona.speechPatterns),
          engagementStyle: this.formatEngagementStyle(persona.engagementStyle)
        }
      });

      const statement = this.extractStatement(result);
      return this.enforceWordCount(statement, leadershipLevel);
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
   * Enforce word count limit on statement
   */
  private enforceWordCount(statement: string, leadershipLevel: LeadershipLevel): string {
    const maxWords = MAX_WORD_COUNTS[leadershipLevel];
    const words = statement.trim().split(/\s+/);

    if (words.length <= maxWords) {
      return statement;
    }

    // Truncate to max words and try to end at sentence boundary
    let truncated = words.slice(0, maxWords).join(' ');

    // Find last sentence-ending punctuation
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclamation = truncated.lastIndexOf('!');

    const lastPunctuation = Math.max(lastPeriod, lastQuestion, lastExclamation);

    if (lastPunctuation > truncated.length * 0.7) {
      // If we can end at a sentence within 70% of the limit, do so
      truncated = truncated.substring(0, lastPunctuation + 1);
    } else {
      // Otherwise just add ellipsis
      truncated += '...';
    }

    console.log(`[LENGTH CAP] Truncated ${words.length} words to ${maxWords} words for ${leadershipLevel}`);
    return truncated;
  }

  /**
   * Extract statement from AI response
   */
  private extractStatement(result: any): string {
    // Handle direct string response
    if (typeof result === 'string') {
      return result;
    }

    // Handle Anthropic API response format
    if (result && Array.isArray(result.content) && result.content.length > 0) {
      const firstContent = result.content[0];
      if (firstContent && typeof firstContent.text === 'string') {
        return firstContent.text;
      }
    }

    // Handle structured response with statement field
    if (result && typeof result.statement === 'string') {
      return result.statement;
    }

    // Handle structured response with content field as string
    if (result && typeof result.content === 'string') {
      return result.content;
    }

    // Fallback
    console.warn('[EXTRACT_STATEMENT] Unexpected result format:', result ? Object.keys(result) : 'null');
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
      // Format personas as text instead of array to avoid template validation issues
      const personasText = input.personas.map(p =>
        `- ${p.name} (${this.normalizeLeadershipLevel(p.leadershipLevel)}): ${p.description}`
      ).join('\n');

      const { result } = await this.promptClient.execute('roundtable-conversation-synthesis', {
        variables: {
          argumentContent: input.argument.content,
          conversationTranscript: this.formatConversationTranscript(history),
          personasText
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
   * Compute relevance scores for all personas against the argument
   */
  private computeRelevanceScores(input: ConversationInput): Map<string, number> {
    const scores = new Map<string, number>();

    for (const persona of input.personas) {
      const score = this.relevanceScorer.scoreRelevance(
        {
          id: persona.id,
          name: persona.name,
          description: persona.description,
          demographics: persona.demographics,
          worldview: persona.worldview,
          lifeExperiences: persona.lifeExperiences,
          dimensions: persona.dimensions
        },
        {
          id: input.argument.id,
          title: input.argument.title,
          content: input.argument.content
        }
      );

      scores.set(persona.id, score.compositeRelevance);

      // Log relevance score for debugging
      console.log(`  ${persona.name}: relevance=${score.compositeRelevance.toFixed(2)} (topic=${score.topicMatch.toFixed(2)}, trigger=${score.emotionalTrigger.toFixed(2)}, exp=${score.experienceMatch.toFixed(2)}, values=${score.valuesAlignment.toFixed(2)})`);
    }

    return scores;
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

  /**
   * Extract key points from a statement to track what's been said
   */
  private async extractKeyPoints(statement: string): Promise<string[]> {
    try {
      const { result } = await this.promptClient.execute('extract-key-points', {
        variables: {
          statement
        }
      });

      // Parse the result - expecting array of strings or formatted text
      if (Array.isArray(result)) {
        return result as string[];
      }

      // Check if result is an object with keyPoints property
      if (typeof result === 'object' && result !== null) {
        const resultObj = result as any;
        if (resultObj.keyPoints && Array.isArray(resultObj.keyPoints)) {
          return resultObj.keyPoints as string[];
        }
      }

      // Fallback: split by newlines and clean up
      if (typeof result === 'string') {
        const stringResult = result as string;
        return stringResult
          .split('\n')
          .map((line: string) => line.trim().replace(/^[-•*]\s*/, ''))
          .filter((line: string) => line.length > 0 && line.length < 200);
      }

      return [];
    } catch (error) {
      console.error('Error extracting key points:', error);
      return [];
    }
  }

  /**
   * Get all established key points from conversation history
   */
  private async getEstablishedPoints(history: Statement[]): Promise<string[]> {
    const allPoints: string[] = [];

    // Extract points from recent statements (last 10 to keep it manageable)
    const recentStatements = history.slice(-10);

    for (const statement of recentStatements) {
      const points = await this.extractKeyPoints(statement.content);
      allPoints.push(...points);
    }

    // Simple deduplication (case-insensitive contains check)
    const uniquePoints: string[] = [];
    for (const point of allPoints) {
      const pointLower = point.toLowerCase();
      const isDuplicate = uniquePoints.some(existing =>
        existing.toLowerCase().includes(pointLower) ||
        pointLower.includes(existing.toLowerCase())
      );

      if (!isDuplicate) {
        uniquePoints.push(point);
      }
    }

    return uniquePoints;
  }

  /**
   * Format established points for prompt
   */
  private formatEstablishedPoints(points: string[]): string | null {
    if (points.length === 0) {
      return null;
    }

    return points.map(point => `- ${point}`).join('\n');
  }

  /**
   * Format speech patterns for prompt
   */
  private formatSpeechPatterns(speechPatterns?: string[] | any): string | null {
    if (!speechPatterns) {
      return null;
    }

    if (Array.isArray(speechPatterns)) {
      return speechPatterns.join(', ');
    }

    // Handle JSON object
    if (typeof speechPatterns === 'object') {
      const patterns = Object.values(speechPatterns);
      if (patterns.length > 0) {
        return patterns.join(', ');
      }
    }

    return null;
  }

  /**
   * Format vocabulary level for human-readable display
   */
  private formatVocabularyLevel(level?: string): string | null {
    if (!level) return null;

    const levelMap: Record<string, string> = {
      PLAIN: 'plain, everyday',
      EDUCATED: 'educated, well-spoken',
      TECHNICAL: 'technical, precise',
      FOLKSY: 'folksy, down-to-earth'
    };

    return levelMap[level] || level.toLowerCase();
  }

  /**
   * Format sentence style for human-readable display
   */
  private formatSentenceStyle(style?: string): string | null {
    if (!style) return null;

    const styleMap: Record<string, string> = {
      SHORT_PUNCHY: 'short and punchy',
      MEASURED: 'measured and complete',
      VERBOSE: 'verbose and detailed',
      FRAGMENTED: 'fragmented or interrupted'
    };

    return styleMap[style] || style.toLowerCase().replace(/_/g, ' ');
  }

  /**
   * Format engagement style for human-readable display
   */
  private formatEngagementStyle(style?: string): string | null {
    if (!style) return null;

    const styleMap: Record<string, string> = {
      DIRECT_CHALLENGE: 'directly challenge others\' views',
      BUILDS_ON_OTHERS: 'build on what others say',
      ASKS_QUESTIONS: 'ask clarifying questions',
      DEFLECTS: 'deflect or redirect'
    };

    return styleMap[style] || style.toLowerCase().replace(/_/g, ' ');
  }

  /**
   * Format response tendency for human-readable display
   */
  private formatResponseTendency(tendency?: string): string | null {
    if (!tendency) return null;

    return tendency.toLowerCase();
  }

  /**
   * Format custom questions for inclusion in prompts
   */
  private formatCustomQuestions(customQuestions?: Array<{
    id: string;
    question: string;
    order: number;
    targetArchetypes?: string[];
  }>, personaArchetype?: string): string | null {
    if (!customQuestions || customQuestions.length === 0) {
      return null;
    }

    // Filter questions for this persona's archetype if specified
    const relevantQuestions = personaArchetype
      ? customQuestions.filter(q =>
          !q.targetArchetypes ||
          q.targetArchetypes.length === 0 ||
          q.targetArchetypes.includes(personaArchetype)
        )
      : customQuestions;

    if (relevantQuestions.length === 0) {
      return null;
    }

    // Sort by order and format
    const sortedQuestions = [...relevantQuestions].sort((a, b) => a.order - b.order);
    return sortedQuestions.map(q => `- ${q.question}`).join('\n');
  }
}
