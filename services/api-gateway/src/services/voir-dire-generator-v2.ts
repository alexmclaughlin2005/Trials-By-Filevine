import { ClaudeClient } from '@juries/ai-client';

interface PersonaData {
  id: string;
  name: string;
  archetype: string;
  instantRead: string;
  phrasesYoullHear: string[];
  archetypeVerdictLean: string;
  strikeOrKeep: {
    plaintiff_strategy: string;
    defense_strategy: string;
  };
  verdictPrediction?: {
    liability_finding_probability: number;
    damages_if_liability: string;
    role_in_deliberation: string;
  };
}

interface VoirDireQuestion {
  question: string;
  purpose: string;
  targetArchetypes: string[];
  expectedResponses: {
    archetype: string;
    likelyResponse: string;
    redFlags: string[];
  }[];
  followUpPrompts: string[];
}

interface VoirDireQuestionSet {
  openingQuestions: VoirDireQuestion[];
  archetypeIdentification: VoirDireQuestion[];
  caseSpecific: VoirDireQuestion[];
  strikeJustification: VoirDireQuestion[];
}

interface VoirDireGeneratorInput {
  personas: PersonaData[];
  caseContext: {
    caseType: string;
    keyIssues: string[];
    plaintiffTheory?: string;
    defenseTheory?: string;
    attorneySide: 'plaintiff' | 'defense';
  };
  questionCategories?: ('opening' | 'identification' | 'case-specific' | 'strike-justification')[];
}

/**
 * VoirDireGeneratorV2Service
 *
 * Generates targeted voir dire questions using V2 persona data, specifically:
 * - "Phrases You'll Hear" - to craft questions that elicit archetype-revealing responses
 * - Strike/Keep strategies - to help attorneys identify favorable/unfavorable jurors
 * - Verdict predictions - to understand how jurors will deliberate
 * - Instant reads - to quickly identify behavioral patterns
 */
export class VoirDireGeneratorV2Service {
  private claudeClient: ClaudeClient;

  constructor(apiKey: string) {
    this.claudeClient = new ClaudeClient({ apiKey });
  }

  async generateQuestions(input: VoirDireGeneratorInput): Promise<VoirDireQuestionSet> {
    const { personas, caseContext, questionCategories = ['opening', 'identification', 'case-specific', 'strike-justification'] } = input;

    const prompt = this.buildPrompt(personas, caseContext, questionCategories);

    try {
      const response = await this.claudeClient.complete({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 6000,
        temperature: 0.4, // Balanced for creativity while maintaining strategic focus
      });

      const questionSet = this.parseResponse(response.content);
      return questionSet;
    } catch (error) {
      console.error('Error generating voir dire questions:', error);
      throw new Error('Failed to generate voir dire questions');
    }
  }

  private buildPrompt(
    personas: PersonaData[],
    caseContext: VoirDireGeneratorInput['caseContext'],
    categories: string[]
  ): string {
    const personaSummaries = this.formatPersonaSummaries(personas);
    const phrasesReference = this.buildPhrasesReference(personas);
    const strikeGuidance = this.buildStrikeGuidance(personas, caseContext.attorneySide);

    return `You are an expert jury consultant creating strategic voir dire questions for a ${caseContext.attorneySide} attorney. You have access to enhanced V2 persona data including "Phrases You'll Hear" - exact language patterns that reveal juror archetypes during voir dire.

CASE CONTEXT:
- Type: ${caseContext.caseType}
- Key Issues: ${caseContext.keyIssues.join(', ')}
${caseContext.plaintiffTheory ? `- Plaintiff Theory: ${caseContext.plaintiffTheory}` : ''}
${caseContext.defenseTheory ? `- Defense Theory: ${caseContext.defenseTheory}` : ''}
- Attorney Side: ${caseContext.attorneySide.toUpperCase()}

JUROR PERSONAS (V2 Data):
${personaSummaries}

PHRASES YOU'LL HEAR (Recognition Patterns):
${phrasesReference}

STRIKE/KEEP GUIDANCE FOR ${caseContext.attorneySide.toUpperCase()} ATTORNEY:
${strikeGuidance}

TASK:
Generate strategic voir dire questions across ${categories.length} categories. Each question should:
1. Be designed to elicit responses that reveal juror archetypes
2. Reference "Phrases You'll Hear" to help attorneys recognize patterns
3. Include expected responses for different archetypes
4. Provide follow-up prompts to dig deeper
5. Help ${caseContext.attorneySide} attorney identify favorable/unfavorable jurors

CATEGORIES TO GENERATE:
${categories.includes('opening') ? '- OPENING QUESTIONS: Broad questions to start conversation and set tone' : ''}
${categories.includes('identification') ? '- ARCHETYPE IDENTIFICATION: Questions designed to reveal behavioral patterns' : ''}
${categories.includes('case-specific') ? '- CASE-SPECIFIC: Questions tied to key issues and theories' : ''}
${categories.includes('strike-justification') ? '- STRIKE JUSTIFICATION: Questions to document cause for strike' : ''}

For each question, provide:
1. The question text (open-ended, non-leading)
2. Purpose (what archetype/pattern it reveals)
3. Target archetypes (which personas this question helps identify)
4. Expected responses (how different archetypes will respond, including specific phrases)
5. Red flags (warning signs for ${caseContext.attorneySide} attorney)
6. Follow-up prompts (3-4 follow-up questions to explore further)

CRITICAL: When providing expected responses, reference specific "Phrases You'll Hear" from the persona data. This helps attorneys instantly recognize archetypes during voir dire.

Respond ONLY with valid JSON in this exact format:
{
  "openingQuestions": [
    {
      "question": "The question text here...",
      "purpose": "Why we're asking this...",
      "targetArchetypes": ["bootstrapper", "crusader"],
      "expectedResponses": [
        {
          "archetype": "bootstrapper",
          "likelyResponse": "Reference specific phrases from persona data...",
          "redFlags": ["Red flag 1", "Red flag 2"]
        }
      ],
      "followUpPrompts": ["Follow-up 1", "Follow-up 2", "Follow-up 3"]
    }
  ],
  "archetypeIdentification": [...],
  "caseSpecific": [...],
  "strikeJustification": [...]
}`;
  }

  private formatPersonaSummaries(personas: PersonaData[]): string {
    // Group personas by archetype
    const byArchetype = personas.reduce((acc, persona) => {
      if (!acc[persona.archetype]) {
        acc[persona.archetype] = [];
      }
      acc[persona.archetype].push(persona);
      return acc;
    }, {} as Record<string, PersonaData[]>);

    return Object.entries(byArchetype)
      .map(([archetype, personaList]) => {
        const first = personaList[0];
        return `
ARCHETYPE: ${archetype.toUpperCase()}
- Verdict Lean: ${first.archetypeVerdictLean}
- Example: ${first.name} - ${first.instantRead}
- Count: ${personaList.length} personas in this archetype`;
      })
      .join('\n');
  }

  private buildPhrasesReference(personas: PersonaData[]): string {
    // Group phrases by archetype for easy reference
    const byArchetype = personas.reduce((acc, persona) => {
      if (!acc[persona.archetype]) {
        acc[persona.archetype] = new Set<string>();
      }
      persona.phrasesYoullHear.forEach(phrase => acc[persona.archetype].add(phrase));
      return acc;
    }, {} as Record<string, Set<string>>);

    return Object.entries(byArchetype)
      .map(([archetype, phrases]) => {
        const phraseList = Array.from(phrases).slice(0, 5); // Top 5 phrases per archetype
        return `
${archetype.toUpperCase()}:
${phraseList.map(p => `  • "${p}"`).join('\n')}`;
      })
      .join('\n');
  }

  private buildStrikeGuidance(personas: PersonaData[], attorneySide: 'plaintiff' | 'defense'): string {
    // Group personas by strike recommendation
    const mustStrike: PersonaData[] = [];
    const shouldKeep: PersonaData[] = [];
    const neutral: PersonaData[] = [];

    personas.forEach(persona => {
      const strategy = attorneySide === 'plaintiff'
        ? persona.strikeOrKeep.plaintiff_strategy
        : persona.strikeOrKeep.defense_strategy;

      if (strategy.includes('MUST STRIKE') || strategy.includes('STRIKE IF POSSIBLE')) {
        mustStrike.push(persona);
      } else if (strategy.includes('KEEP') || strategy.includes('DREAM')) {
        shouldKeep.push(persona);
      } else {
        neutral.push(persona);
      }
    });

    return `
FAVORABLE JURORS (Keep):
${shouldKeep.map(p => `  • ${p.archetype} - ${p.instantRead}`).join('\n') || '  (None identified)'}

UNFAVORABLE JURORS (Strike):
${mustStrike.map(p => `  • ${p.archetype} - ${p.instantRead}`).join('\n') || '  (None identified)'}

NEUTRAL JURORS:
${neutral.map(p => `  • ${p.archetype} - ${p.instantRead}`).join('\n') || '  (None identified)'}`;
  }

  private parseResponse(content: string): VoirDireQuestionSet {
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);

      if (!parsed) {
        throw new Error('Invalid response format');
      }

      return {
        openingQuestions: parsed.openingQuestions || [],
        archetypeIdentification: parsed.archetypeIdentification || [],
        caseSpecific: parsed.caseSpecific || [],
        strikeJustification: parsed.strikeJustification || [],
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response');
    }
  }
}
