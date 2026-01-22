import { ClaudeClient } from '@trialforge/ai-client';

interface Persona {
  id: string;
  name: string;
  description: string;
  attributes: any;
  signals: any;
  persuasionLevers: any;
  pitfalls: any;
}

interface CaseFact {
  content: string;
  factType: string;
}

interface QuestionGeneratorInput {
  caseContext: {
    caseType: string;
    caseName: string;
    ourSide: string;
    keyFacts: CaseFact[];
    keyIssues?: string[];
    jurisdiction?: string;
  };
  targetPersonas: Persona[];
  focusAreas?: string[];
  questionLimit?: number;
}

interface FollowUpQuestion {
  question: string;
  trigger: string;
  listenFor: string[];
}

interface VoirDireQuestion {
  question: string;
  purpose: string;
  targetPersonas: string[];
  category: string;
  listenFor: string[];
  redFlags: string[];
  idealAnswers: string[];
  followUps: FollowUpQuestion[];
  legalNotes?: string;
  priority: number;
}

interface QuestionSet {
  openingQuestions: VoirDireQuestion[];
  personaIdentificationQuestions: VoirDireQuestion[];
  caseSpecificQuestions: VoirDireQuestion[];
  challengeForCauseQuestions: VoirDireQuestion[];
  generalStrategy: string;
  timingNotes: string[];
}

export class QuestionGeneratorService {
  private claudeClient: ClaudeClient;

  constructor(apiKey: string) {
    this.claudeClient = new ClaudeClient({ apiKey });
  }

  async generateQuestions(input: QuestionGeneratorInput): Promise<QuestionSet> {
    const prompt = this.buildPrompt(input);

    const response = await this.claudeClient.complete({
      prompt,
      maxTokens: 6000,
      temperature: 0.4, // Balance creativity with consistency
    });

    return this.parseResponse(response.content);
  }

  private buildPrompt(input: QuestionGeneratorInput): string {
    const { caseContext, targetPersonas, focusAreas, questionLimit } = input;

    const factsText = caseContext.keyFacts
      .map((fact) => `- [${fact.factType}] ${fact.content}`)
      .join('\n');

    const personasText = targetPersonas
      .map(
        (persona) => `
## ${persona.name}
${persona.description}

**Decision Style:** ${persona.attributes?.decisionStyle || 'Unknown'}
**Value System:** ${persona.attributes?.valueSystem || 'Unknown'}

**Persuasion Levers:**
${JSON.stringify(persona.persuasionLevers, null, 2)}

**Pitfalls to Avoid:**
${Array.isArray(persona.pitfalls) ? persona.pitfalls.join('\n- ') : JSON.stringify(persona.pitfalls, null, 2)}
`
      )
      .join('\n---\n');

    return `You are an expert trial attorney specializing in jury selection. Your task is to generate strategic voir dire questions that will help identify favorable jurors and reveal potential biases.

# Case Information

**Case:** ${caseContext.caseName}
**Case Type:** ${caseContext.caseType}
**Our Side:** ${caseContext.ourSide}
${caseContext.jurisdiction ? `**Jurisdiction:** ${caseContext.jurisdiction}` : ''}

## Key Facts

${factsText}

${caseContext.keyIssues ? `\n## Key Issues\n${caseContext.keyIssues.join('\n- ')}` : ''}

# Target Personas

These are the juror personas we want to identify and understand:

${personasText}

${focusAreas ? `\n# Focus Areas\n${focusAreas.join('\n- ')}` : ''}

# Your Task

Generate a comprehensive set of voir dire questions organized into four categories:

1. **Opening Questions** - Build rapport and gather basic information
2. **Persona Identification Questions** - Identify which personas jurors match
3. **Case-Specific Questions** - Probe attitudes about key case issues
4. **Challenge for Cause Questions** - Reveal disqualifying biases

For each question, provide:
- The question itself (open-ended when possible)
- Purpose (what you're trying to learn)
- Which personas this targets
- What to listen for in responses
- Red flags that indicate unfavorable jurors
- Ideal answers from favorable jurors
- Follow-up questions based on different answer types
- Legal/tactical notes if relevant
- Priority (1-10, with 10 being highest)

${questionLimit ? `Generate approximately ${questionLimit} questions total.` : 'Generate 15-25 questions total.'}

Return your response as JSON:

\`\`\`json
{
  "openingQuestions": [
    {
      "question": "The question text",
      "purpose": "Why we're asking this",
      "targetPersonas": ["Persona Name 1", "Persona Name 2"],
      "category": "background|values|beliefs|experience",
      "listenFor": ["Signal 1", "Signal 2"],
      "redFlags": ["Warning sign 1", "Warning sign 2"],
      "idealAnswers": ["Good response 1", "Good response 2"],
      "followUps": [
        {
          "question": "Follow-up question",
          "trigger": "When to ask this",
          "listenFor": ["What to listen for"]
        }
      ],
      "legalNotes": "Optional legal considerations",
      "priority": 8
    }
  ],
  "personaIdentificationQuestions": [...],
  "caseSpecificQuestions": [...],
  "challengeForCauseQuestions": [...],
  "generalStrategy": "Overall strategy for voir dire in this case",
  "timingNotes": ["When to ask certain types of questions", "Pacing recommendations"]
}
\`\`\`

IMPORTANT:
- Questions should be open-ended to encourage discussion
- Avoid leading questions that might offend jurors
- Consider jurisdiction-specific rules and time limits
- Questions should be natural and conversational
- Focus on identifying attitudes, not just demographics
- Include follow-ups for different response scenarios`;
  }

  private parseResponse(content: string): QuestionSet {
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : content;

      const parsed = JSON.parse(jsonContent.trim());

      const validateQuestion = (q: any): VoirDireQuestion => ({
        question: q.question || '',
        purpose: q.purpose || '',
        targetPersonas: Array.isArray(q.targetPersonas) ? q.targetPersonas : [],
        category: q.category || 'general',
        listenFor: Array.isArray(q.listenFor) ? q.listenFor : [],
        redFlags: Array.isArray(q.redFlags) ? q.redFlags : [],
        idealAnswers: Array.isArray(q.idealAnswers) ? q.idealAnswers : [],
        followUps: Array.isArray(q.followUps)
          ? q.followUps.map((f: any) => ({
              question: f.question || '',
              trigger: f.trigger || '',
              listenFor: Array.isArray(f.listenFor) ? f.listenFor : [],
            }))
          : [],
        legalNotes: q.legalNotes,
        priority: typeof q.priority === 'number' ? q.priority : 5,
      });

      return {
        openingQuestions: Array.isArray(parsed.openingQuestions)
          ? parsed.openingQuestions.map(validateQuestion)
          : [],
        personaIdentificationQuestions: Array.isArray(parsed.personaIdentificationQuestions)
          ? parsed.personaIdentificationQuestions.map(validateQuestion)
          : [],
        caseSpecificQuestions: Array.isArray(parsed.caseSpecificQuestions)
          ? parsed.caseSpecificQuestions.map(validateQuestion)
          : [],
        challengeForCauseQuestions: Array.isArray(parsed.challengeForCauseQuestions)
          ? parsed.challengeForCauseQuestions.map(validateQuestion)
          : [],
        generalStrategy: parsed.generalStrategy || 'No strategy provided',
        timingNotes: Array.isArray(parsed.timingNotes) ? parsed.timingNotes : [],
      };
    } catch (error) {
      console.error('Failed to parse question generator response:', error);
      console.error('Raw content:', content);

      // Return empty question set as fallback
      return {
        openingQuestions: [],
        personaIdentificationQuestions: [],
        caseSpecificQuestions: [],
        challengeForCauseQuestions: [],
        generalStrategy: 'Failed to generate strategy - manual question preparation required',
        timingNotes: ['AI generation failed - use standard voir dire approach'],
      };
    }
  }
}
