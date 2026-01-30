/**
 * Discriminative Question Generator
 * 
 * Generates voir dire questions that maximize information gain about persona membership.
 * Targets ambiguous matches and identifies signals that would most change the assessment.
 * 
 * Phase 3: Discriminative Question Generation
 */

import { PrismaClient } from '@juries/database';
import { ClaudeClient } from '@juries/ai-client';
import { EnsembleMatcher, EnsembleMatch } from './ensemble-matcher';

export interface DiscriminatingSignal {
  signalId: string;
  signalName: string;
  weight: number;
  direction: 'POSITIVE' | 'NEGATIVE';
  informationGain: number;
  personaAId: string;
  personaAName: string;
  personaBId: string;
  personaBName: string;
}

export interface DiscriminativeQuestion {
  id?: string; // If stored in database
  questionText: string;
  questionCategory: string;
  discriminatesBetween: Array<{
    personaAId: string;
    personaAName: string;
    personaBId: string;
    personaBName: string;
    expectedInformationGain: number;
  }>;
  responseInterpretations: Array<{
    responsePattern: string;
    signalsToExtract: string[];
    personaImplications: Array<{
      personaId: string;
      probabilityDelta: number;
      direction: 'INCREASE' | 'DECREASE';
    }>;
  }>;
  followUpQuestions?: Array<{
    question: string;
    trigger: string;
  }>;
  priorityScore: number;
  priorityRationale: string;
}

export class DiscriminativeQuestionGenerator {
  constructor(
    private prisma: PrismaClient,
    private claudeClient: ClaudeClient,
    private ensembleMatcher: EnsembleMatcher
  ) {}

  /**
   * Generate discriminative questions for a specific juror
   */
  async generateQuestionsForJuror(
    jurorId: string,
    organizationId: string,
    personaIds?: string[]
  ): Promise<DiscriminativeQuestion[]> {
    // Get available personas if not provided
    let availablePersonaIds = personaIds;
    if (!availablePersonaIds || availablePersonaIds.length === 0) {
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
      availablePersonaIds = personas.map((p) => p.id);
    }

    if (availablePersonaIds.length < 2) {
      return []; // Need at least 2 personas to discriminate
    }

    // Get current persona matches
    const matches = await this.ensembleMatcher.matchJuror(
      jurorId,
      availablePersonaIds
    );

    if (matches.length < 2) {
      return []; // Need at least 2 personas to discriminate
    }

    // Identify ambiguous pairs (within 20% confidence)
    const ambiguousPairs = this.identifyAmbiguousPairs(matches);

    if (ambiguousPairs.length === 0) {
      return []; // No ambiguous matches, questions not needed
    }

    // Find discriminating signals for each ambiguous pair
    const discriminatingSignals = await this.findDiscriminatingSignals(
      jurorId,
      ambiguousPairs
    );

    // Generate questions for top discriminating signals
    const questions = await this.generateQuestionsFromSignals(
      jurorId,
      discriminatingSignals
    );

    // Calculate information gain and rank
    const rankedQuestions = await this.rankQuestionsByInformationGain(
      questions,
      matches
    );

    return rankedQuestions;
  }

  /**
   * Generate panel-wide questions (questions that discriminate for multiple jurors)
   */
  async generatePanelWideQuestions(
    caseId: string,
    jurorIds: string[],
    organizationId: string
  ): Promise<DiscriminativeQuestion[]> {
    // Get available personas
    const personas = await this.prisma.persona.findMany({
      where: {
        OR: [
          { organizationId },
          { organizationId: null },
        ],
        isActive: true,
      },
      select: { id: true },
    });
    const personaIds = personas.map((p) => p.id);

    // Get matches for all jurors
    const allMatches = await Promise.all(
      jurorIds.map(async (jurorId) => {
        const matches = await this.ensembleMatcher.matchJuror(jurorId, personaIds);
        return { jurorId, matches };
      })
    );

    // Find common ambiguous pairs across jurors
    const commonAmbiguousPairs = this.findCommonAmbiguousPairs(allMatches);

    // Generate questions for common pairs
    const questions: DiscriminativeQuestion[] = [];

    for (const pair of commonAmbiguousPairs) {
      // Get discriminating signals for this pair
      const signals = await this.findDiscriminatingSignalsForPair(
        pair.personaAId,
        pair.personaBId,
        pair.jurorIds
      );

      // Generate questions
      const pairQuestions = await this.generateQuestionsFromSignals(
        pair.jurorIds[0], // Use first juror as template
        signals
      );

      // Annotate with panel value
      for (const question of pairQuestions) {
        question.priorityRationale += ` This question is particularly valuable for ${pair.jurorIds.length} jurors (${pair.jurorIds.join(', ')}) who all have ambiguity between ${pair.personaAName} and ${pair.personaBName}.`;
        question.priorityScore *= 1 + pair.jurorIds.length * 0.1; // Boost score for panel value
      }

      questions.push(...pairQuestions);
    }

    // Rank by panel value
    questions.sort((a, b) => b.priorityScore - a.priorityScore);

    return questions.slice(0, 20); // Top 20 panel-wide questions
  }

  /**
   * Identify ambiguous persona pairs (within 20% confidence)
   */
  private identifyAmbiguousPairs(
    matches: EnsembleMatch[]
  ): Array<{
    personaAId: string;
    personaAName: string;
    personaAProbability: number;
    personaBId: string;
    personaBName: string;
    personaBProbability: number;
  }> {
    const pairs: Array<{
      personaAId: string;
      personaAName: string;
      personaAProbability: number;
      personaBId: string;
      personaBName: string;
      personaBProbability: number;
    }> = [];

    // Get top 3 personas
    const topPersonas = matches.slice(0, 3);

    // Check each pair
    for (let i = 0; i < topPersonas.length; i++) {
      for (let j = i + 1; j < topPersonas.length; j++) {
        const personaA = topPersonas[i];
        const personaB = topPersonas[j];

        const probabilityDiff = Math.abs(
          personaA.probability - personaB.probability
        );

        if (probabilityDiff < 0.2) {
          // Within 20% - ambiguous
          pairs.push({
            personaAId: personaA.personaId,
            personaAName: personaA.personaId, // Will be replaced with actual name
            personaAProbability: personaA.probability,
            personaBId: personaB.personaId,
            personaBName: personaB.personaId, // Will be replaced with actual name
            personaBProbability: personaB.probability,
          });
        }
      }
    }

    return pairs;
  }

  /**
   * Find discriminating signals for ambiguous pairs
   */
  private async findDiscriminatingSignals(
    jurorId: string,
    ambiguousPairs: Array<{
      personaAId: string;
      personaAName: string;
      personaAProbability: number;
      personaBId: string;
      personaBName: string;
      personaBProbability: number;
    }>
  ): Promise<DiscriminatingSignal[]> {
    // Get juror's current signals
    const jurorSignals = await this.prisma.jurorSignal.findMany({
      where: { jurorId },
      include: { signal: true },
    });

    const jurorSignalDbIds = new Set(jurorSignals.map((js) => js.signalId));

    const allDiscriminatingSignals: DiscriminatingSignal[] = [];

    for (const pair of ambiguousPairs) {
      // Get signal weights for both personas
      const [personaAWeights, personaBWeights] = await Promise.all([
        this.prisma.signalPersonaWeight.findMany({
          where: { personaId: pair.personaAId },
          include: { signal: true },
        }),
        this.prisma.signalPersonaWeight.findMany({
          where: { personaId: pair.personaBId },
          include: { signal: true },
        }),
      ]);

      // Get persona names
      const [personaA, personaB] = await Promise.all([
        this.prisma.persona.findUnique({
          where: { id: pair.personaAId },
          select: { name: true },
        }),
        this.prisma.persona.findUnique({
          where: { id: pair.personaBId },
          select: { name: true },
        }),
      ]);

      const personaAName = personaA?.name || pair.personaAName;
      const personaBName = personaB?.name || pair.personaBName;

      // Create maps
      const personaAWeightMap = new Map(
        personaAWeights.map((pw) => [pw.signal.id, pw])
      );
      const personaBWeightMap = new Map(
        personaBWeights.map((pw) => [pw.signal.id, pw])
      );

      // Find signals that discriminate
      const allSignalIds = new Set([
        ...personaAWeights.map((pw) => pw.signal.id),
        ...personaBWeights.map((pw) => pw.signal.id),
      ]);

      for (const signalDbId of allSignalIds) {
        // Skip if signal already observed
        if (jurorSignalDbIds.has(signalDbId)) {
          continue;
        }

        const personaAWeight = personaAWeightMap.get(signalDbId);
        const personaBWeight = personaBWeightMap.get(signalDbId);

        if (!personaAWeight && !personaBWeight) {
          continue;
        }

        // Calculate discrimination power
        let discriminationPower = 0;
        let direction: 'POSITIVE' | 'NEGATIVE' = 'POSITIVE';
        let weight = 0;

        if (personaAWeight && personaBWeight) {
          // Signal has different weights for different personas
          const weightDiff = Math.abs(
            Number(personaAWeight.weight) - Number(personaBWeight.weight)
          );
          discriminationPower = weightDiff;
          weight = Math.max(
            Number(personaAWeight.weight),
            Number(personaBWeight.weight)
          );
          direction = personaAWeight.direction;
        } else if (personaAWeight) {
          // Signal only relevant to persona A
          discriminationPower = Number(personaAWeight.weight);
          weight = Number(personaAWeight.weight);
          direction = personaAWeight.direction;
        } else if (personaBWeight) {
          // Signal only relevant to persona B (opposite for persona A)
          discriminationPower = Number(personaBWeight.weight);
          weight = Number(personaBWeight.weight);
          direction =
            personaBWeight.direction === 'POSITIVE' ? 'NEGATIVE' : 'POSITIVE';
        }

        if (discriminationPower > 0.3) {
          // High discrimination power
          const signal = personaAWeight?.signal || personaBWeight?.signal;
          if (signal) {
            allDiscriminatingSignals.push({
              signalId: signal.signalId,
              signalName: signal.name,
              weight,
              direction,
              informationGain: discriminationPower,
              personaAId: pair.personaAId,
              personaAName,
              personaBId: pair.personaBId,
              personaBName,
            });
          }
        }
      }
    }

    // Sort by information gain (highest first)
    allDiscriminatingSignals.sort(
      (a, b) => b.informationGain - a.informationGain
    );

    // Return top 10 most discriminating signals
    return allDiscriminatingSignals.slice(0, 10);
  }

  /**
   * Find discriminating signals for a specific persona pair
   */
  private async findDiscriminatingSignalsForPair(
    personaAId: string,
    personaBId: string,
    jurorIds: string[]
  ): Promise<DiscriminatingSignal[]> {
    // Get all signals for these jurors
    const allJurorSignals = await this.prisma.jurorSignal.findMany({
      where: { jurorId: { in: jurorIds } },
    });

    const observedSignalDbIds = new Set(
      allJurorSignals.map((js) => js.signalId)
    );

    // Get signal weights for both personas
    const [personaAWeights, personaBWeights] = await Promise.all([
      this.prisma.signalPersonaWeight.findMany({
        where: { personaId: personaAId },
        include: { signal: true },
      }),
      this.prisma.signalPersonaWeight.findMany({
        where: { personaId: personaBId },
        include: { signal: true },
      }),
    ]);

    // Get persona names
    const [personaA, personaB] = await Promise.all([
      this.prisma.persona.findUnique({
        where: { id: personaAId },
        select: { name: true },
      }),
      this.prisma.persona.findUnique({
        where: { id: personaBId },
        select: { name: true },
      }),
    ]);

    const discriminatingSignals: DiscriminatingSignal[] = [];

    const personaAWeightMap = new Map(
      personaAWeights.map((pw) => [pw.signal.id, pw])
    );
    const personaBWeightMap = new Map(
      personaBWeights.map((pw) => [pw.signal.id, pw])
    );

    const allSignalIds = new Set([
      ...personaAWeights.map((pw) => pw.signal.id),
      ...personaBWeights.map((pw) => pw.signal.id),
    ]);

    for (const signalDbId of allSignalIds) {
      // Skip if already observed for any juror
      if (observedSignalDbIds.has(signalDbId)) {
        continue;
      }

      const personaAWeight = personaAWeightMap.get(signalDbId);
      const personaBWeight = personaBWeightMap.get(signalDbId);

      if (!personaAWeight && !personaBWeight) {
        continue;
      }

      // Calculate discrimination power
      let discriminationPower = 0;
      let direction: 'POSITIVE' | 'NEGATIVE' = 'POSITIVE';
      let weight = 0;

      if (personaAWeight && personaBWeight) {
        const weightDiff = Math.abs(
          Number(personaAWeight.weight) - Number(personaBWeight.weight)
        );
        discriminationPower = weightDiff;
        weight = Math.max(
          Number(personaAWeight.weight),
          Number(personaBWeight.weight)
        );
        direction = personaAWeight.direction;
      } else if (personaAWeight) {
        discriminationPower = Number(personaAWeight.weight);
        weight = Number(personaAWeight.weight);
        direction = personaAWeight.direction;
      } else if (personaBWeight) {
        discriminationPower = Number(personaBWeight.weight);
        weight = Number(personaBWeight.weight);
        direction =
          personaBWeight.direction === 'POSITIVE' ? 'NEGATIVE' : 'POSITIVE';
      }

      if (discriminationPower > 0.3) {
        const signal = personaAWeight?.signal || personaBWeight?.signal;
        if (signal) {
          discriminatingSignals.push({
            signalId: signal.signalId,
            signalName: signal.name,
            weight,
            direction,
            informationGain: discriminationPower,
            personaAId,
            personaAName: personaA?.name || personaAId,
            personaBId,
            personaBName: personaB?.name || personaBId,
          });
        }
      }
    }

    discriminatingSignals.sort((a, b) => b.informationGain - a.informationGain);
    return discriminatingSignals.slice(0, 5); // Top 5
  }

  /**
   * Generate natural language questions from discriminating signals
   */
  private async generateQuestionsFromSignals(
    jurorId: string,
    signals: DiscriminatingSignal[]
  ): Promise<DiscriminativeQuestion[]> {
    // Get juror context
    const juror = await this.prisma.juror.findUnique({
      where: { id: jurorId },
      include: {
        panel: {
          include: {
            case: {
              select: {
                caseType: true,
                jurisdiction: true,
              },
            },
          },
        },
      },
    });

    const questions: DiscriminativeQuestion[] = [];

    // Group signals by category for better question organization
    const signalsByCategory = new Map<string, DiscriminatingSignal[]>();
    
    // Get all signal records in one query
    const signalIds = signals.map((s) => s.signalId);
    const signalRecords = await this.prisma.signal.findMany({
      where: { signalId: { in: signalIds } },
    });
    const signalRecordMap = new Map(signalRecords.map((s) => [s.signalId, s]));

    for (const signal of signals) {
      const signalRecord = signalRecordMap.get(signal.signalId);
      const category = signalRecord?.category || 'ATTITUDINAL';
      if (!signalsByCategory.has(category)) {
        signalsByCategory.set(category, []);
      }
      signalsByCategory.get(category)!.push(signal);
    }

    // Generate questions using LLM
    for (const [category, categorySignals] of signalsByCategory) {
      const categoryQuestions = await this.generateQuestionsForCategory(
        category,
        categorySignals,
        juror
      );
      questions.push(...categoryQuestions);
    }

    return questions;
  }

  /**
   * Generate questions for a specific signal category
   */
  private async generateQuestionsForCategory(
    category: string,
    signals: DiscriminatingSignal[],
    juror: any
  ): Promise<DiscriminativeQuestion[]> {
    // Build prompt for question generation
    const prompt = this.buildQuestionGenerationPrompt(
      category,
      signals,
      juror
    );

    try {
      const response = await this.claudeClient.complete({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 2000,
        temperature: 0.4,
      });

      // Parse response (expecting JSON)
      const questions = this.parseQuestionResponse(response.content, signals);
      return questions;
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback to template-based questions
      return this.generateTemplateQuestions(signals);
    }
  }

  /**
   * Build prompt for question generation
   */
  private buildQuestionGenerationPrompt(
    category: string,
    signals: DiscriminatingSignal[],
    juror: any
  ): string {
    const parts: string[] = [];

    parts.push(
      `Generate voir dire questions designed to identify the following signals:`
    );
    parts.push('');

    for (const signal of signals) {
      parts.push(
        `- ${signal.signalName} (discriminates between ${signal.personaAName} and ${signal.personaBName})`
      );
    }

    parts.push('');
    parts.push(
      `Category: ${category}`
    );
    parts.push(
      `Case Type: ${juror?.panel?.case?.caseType || 'civil'}`
    );
    parts.push(
      `Jurisdiction: ${juror?.panel?.case?.jurisdiction || 'general'}`
    );

    parts.push('');
    parts.push(
      `Generate 2-3 natural, conversational voir dire questions that would help identify these signals.`
    );
    parts.push('');
    parts.push(`For each question, provide:`);
    parts.push(`1. The question text (open-ended when possible)`);
    parts.push(`2. What to listen for in responses`);
    parts.push(`3. How different responses would affect persona probabilities`);
    parts.push(`4. Follow-up questions if response is ambiguous`);

    parts.push('');
    parts.push(`Return as JSON array:`);
    parts.push(`[`);
    parts.push(`  {`);
    parts.push(`    "questionText": "...",`);
    parts.push(`    "questionCategory": "${category}",`);
    parts.push(`    "discriminatesBetween": [...],`);
    parts.push(`    "responseInterpretations": [...],`);
    parts.push(`    "followUpQuestions": [...],`);
    parts.push(`    "priorityScore": 0.0-1.0`);
    parts.push(`  }`);
    parts.push(`]`);

    return parts.join('\n');
  }

  /**
   * Parse LLM response into question objects
   */
  private parseQuestionResponse(
    content: string,
    signals: DiscriminatingSignal[]
  ): DiscriminativeQuestion[] {
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);

      if (!Array.isArray(parsed)) {
        return this.generateTemplateQuestions(signals);
      }

      return parsed.map((q: any) => ({
        questionText: q.questionText || '',
        questionCategory: q.questionCategory || 'ATTITUDINAL',
        discriminatesBetween: q.discriminatesBetween || [],
        responseInterpretations: q.responseInterpretations || [],
        followUpQuestions: q.followUpQuestions || [],
        priorityScore: q.priorityScore || 0.5,
        priorityRationale: q.priorityRationale || 'Generated question',
      }));
    } catch (error) {
      console.error('Error parsing question response:', error);
      return this.generateTemplateQuestions(signals);
    }
  }

  /**
   * Generate template-based questions as fallback
   */
  private generateTemplateQuestions(
    signals: DiscriminatingSignal[]
  ): DiscriminativeQuestion[] {
    const questions: DiscriminativeQuestion[] = [];

    for (const signal of signals.slice(0, 3)) {
      // Generate question based on signal category and name
      let questionText = '';
      let category = 'ATTITUDINAL';

      if (signal.signalId.startsWith('OCCUPATION_')) {
        questionText = `Tell me about your work. What do you do for a living?`;
        category = 'DEMOGRAPHIC';
      } else if (signal.signalId.startsWith('AUTHORITY_')) {
        questionText = `How do you feel about following rules that you personally disagree with?`;
        category = 'ATTITUDINAL';
      } else if (signal.signalId.startsWith('CORPORATE_')) {
        questionText = `Have you or anyone close to you had an experience with a large company that affected your view of corporations?`;
        category = 'ATTITUDINAL';
      } else if (signal.signalId.startsWith('EVIDENCE_')) {
        questionText = `When you make an important decision, do you tend to go with your gut or do you prefer to gather a lot of information first?`;
        category = 'ATTITUDINAL';
      } else {
        questionText = `Can you tell me more about your views on ${signal.signalName.toLowerCase()}?`;
        category = 'ATTITUDINAL';
      }

      questions.push({
        questionText,
        questionCategory: category,
        discriminatesBetween: [
          {
            personaAId: signal.personaAId,
            personaAName: signal.personaAName,
            personaBId: signal.personaBId,
            personaBName: signal.personaBName,
            expectedInformationGain: signal.informationGain,
          },
        ],
        responseInterpretations: [
          {
            responsePattern: 'Positive response indicating signal presence',
            signalsToExtract: [signal.signalId],
            personaImplications: [
              {
                personaId: signal.personaAId,
                probabilityDelta: signal.direction === 'POSITIVE' ? 0.15 : -0.15,
                direction: signal.direction === 'POSITIVE' ? 'INCREASE' : 'DECREASE',
              },
              {
                personaId: signal.personaBId,
                probabilityDelta: signal.direction === 'POSITIVE' ? -0.15 : 0.15,
                direction: signal.direction === 'POSITIVE' ? 'DECREASE' : 'INCREASE',
              },
            ],
          },
        ],
        priorityScore: signal.informationGain,
        priorityRationale: `This question discriminates between ${signal.personaAName} and ${signal.personaBName} with ${(signal.informationGain * 100).toFixed(0)}% information gain.`,
      });
    }

    return questions;
  }

  /**
   * Rank questions by expected information gain
   */
  private async rankQuestionsByInformationGain(
    questions: DiscriminativeQuestion[],
    currentMatches: EnsembleMatch[]
  ): Promise<DiscriminativeQuestion[]> {
    // Calculate expected entropy reduction for each question
    for (const question of questions) {
      let totalInformationGain = 0;

      for (const pair of question.discriminatesBetween) {
        // Find current probabilities for these personas
        const personaAMatch = currentMatches.find(
          (m) => m.personaId === pair.personaAId
        );
        const personaBMatch = currentMatches.find(
          (m) => m.personaId === pair.personaBId
        );

        if (personaAMatch && personaBMatch) {
          // Current entropy
          const currentEntropy = this.calculateEntropy([
            personaAMatch.probability,
            personaBMatch.probability,
          ]);

          // Expected entropy after question (assume 50/50 chance of each response)
          // This is a simplification - real calculation would consider all possible responses
          const expectedEntropy = currentEntropy * 0.7; // Assume 30% reduction on average

          const informationGain = currentEntropy - expectedEntropy;
          totalInformationGain += informationGain;
        }
      }

      // Update priority score based on information gain
      question.priorityScore = Math.min(1.0, totalInformationGain * 2); // Scale to 0-1
    }

    // Sort by priority score
    questions.sort((a, b) => b.priorityScore - a.priorityScore);

    return questions;
  }

  /**
   * Calculate information entropy
   */
  private calculateEntropy(probabilities: number[]): number {
    let entropy = 0;
    for (const prob of probabilities) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    return entropy;
  }

  /**
   * Find common ambiguous pairs across multiple jurors
   */
  private findCommonAmbiguousPairs(
    allMatches: Array<{ jurorId: string; matches: EnsembleMatch[] }>
  ): Array<{
    personaAId: string;
    personaAName: string;
    personaBId: string;
    personaBName: string;
    jurorIds: string[];
  }> {
    const pairCounts = new Map<
      string,
      {
        personaAId: string;
        personaAName: string;
        personaBId: string;
        personaBName: string;
        jurorIds: string[];
      }
    >();

    for (const { jurorId, matches } of allMatches) {
      const ambiguousPairs = this.identifyAmbiguousPairs(matches);

      for (const pair of ambiguousPairs) {
        const pairKey = `${pair.personaAId}-${pair.personaBId}`;
        if (!pairCounts.has(pairKey)) {
          pairCounts.set(pairKey, {
            personaAId: pair.personaAId,
            personaAName: pair.personaAName,
            personaBId: pair.personaBId,
            personaBName: pair.personaBName,
            jurorIds: [],
          });
        }
        pairCounts.get(pairKey)!.jurorIds.push(jurorId);
      }
    }

    // Return pairs that appear for multiple jurors
    return Array.from(pairCounts.values()).filter(
      (pair) => pair.jurorIds.length > 1
    );
  }
}
