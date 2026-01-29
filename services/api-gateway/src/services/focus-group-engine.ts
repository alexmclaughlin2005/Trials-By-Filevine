import { ClaudeClient } from '@juries/ai-client';

interface Persona {
  id: string;
  name: string;
  description: string;
  attributes: any;
  persuasionLevers: any;
  pitfalls: any;
  // V2 Fields
  instantRead?: string;
  archetype?: string;
  archetypeVerdictLean?: string;
  plaintiffDangerLevel?: number;
  defenseDangerLevel?: number;
  phrasesYoullHear?: string[];
  verdictPrediction?: {
    liability_finding_probability: number;
    damages_if_liability: string;
    role_in_deliberation: string;
  };
  strikeOrKeep?: {
    plaintiff_strategy: string;
    defense_strategy: string;
  };
}

interface DocumentInfo {
  id: string;
  filename: string;
  documentType?: string;
  textContent: string | null;
  notes?: string;
  textExtractionStatus: string;
  extractedTextChars?: number;
}

interface Argument {
  id: string;
  title: string;
  content: string;
  argumentType: string;
  documents?: DocumentInfo[]; // Attached documents with their text content
}

interface CaseFact {
  content: string;
  factType: string;
}

interface FocusGroupInput {
  caseContext: {
    caseName: string;
    caseType: string;
    ourSide: string;
    facts: CaseFact[];
  };
  argument: Argument;
  personas: Persona[];
  simulationMode?: 'quick' | 'detailed' | 'deliberation';
}

interface PersonaReaction {
  personaId: string;
  personaName: string;
  initialReaction: string;
  sentimentScore: number; // -1 to 1 (negative to positive)
  concerns: string[];
  questions: string[];
  persuasiveElements: string[];
  weaknesses: string[];
  verdictLean?: 'favorable' | 'neutral' | 'unfavorable';
  confidence: number; // 0 to 1
}

interface DeliberationExchange {
  speakerPersona: string;
  statement: string;
  influence: string[];
  tension?: string;
}

interface FocusGroupResult {
  overallReception: string;
  averageSentiment: number;
  personaReactions: PersonaReaction[];
  deliberationSummary?: {
    keyDebatePoints: string[];
    influentialPersonas: string[];
    exchanges: DeliberationExchange[];
    consensusAreas: string[];
    divisiveIssues: string[];
  };
  recommendations: {
    priority: number;
    category: string;
    title: string;
    description: string;
    affectedPersonas: string[];
  }[];
  strengthsToEmphasize: string[];
  weaknessesToAddress: string[];
}

export class FocusGroupEngineService {
  private claudeClient: ClaudeClient;
  private useV2Data: boolean;

  constructor(apiKey: string, useV2Data: boolean = false) {
    this.claudeClient = new ClaudeClient({ apiKey });
    this.useV2Data = useV2Data;
  }

  async simulateFocusGroup(input: FocusGroupInput): Promise<FocusGroupResult> {
    const prompt = this.buildPrompt(input);

    const maxTokens = input.simulationMode === 'deliberation' ? 8000 : 5000;

    const response = await this.claudeClient.complete({
      messages: [{ role: 'user', content: prompt }],
      maxTokens,
      temperature: 0.6, // Higher for more creative/varied reactions
    });

    return this.parseResponse(response.content, input.personas);
  }

  private buildPrompt(input: FocusGroupInput): string {
    const { caseContext, argument, personas, simulationMode = 'detailed' } = input;

    const factsText = caseContext.facts.map((f) => `- [${f.factType}] ${f.content}`).join('\n');

    const personasText = personas
      .map(
        (persona, idx) => {
          // Use V2 data if available and enabled
          if (this.useV2Data && persona.instantRead) {
            return `
### Panelist #${idx + 1}: ${persona.name} (${persona.archetype || 'Unknown archetype'})

**Instant Read:** ${persona.instantRead}

**Verdict Lean:** ${persona.archetypeVerdictLean || 'Neutral'}
**Role in Deliberation:** ${persona.verdictPrediction?.role_in_deliberation || 'Participatory'}

**Typical Phrases You'll Hear:**
${persona.phrasesYoullHear?.slice(0, 5).map(p => `- "${p}"`).join('\n') || '- (No phrases available)'}

**Danger Levels:**
- Plaintiff Risk: ${persona.plaintiffDangerLevel}/5
- Defense Risk: ${persona.defenseDangerLevel}/5

**What Persuades Them:**
${JSON.stringify(persona.persuasionLevers, null, 2)}

**What They Resist:**
${Array.isArray(persona.pitfalls) ? persona.pitfalls.join('\n- ') : JSON.stringify(persona.pitfalls, null, 2)}
`;
          } else {
            // Fall back to V1 format
            return `
### Panelist #${idx + 1}: ${persona.name}
${persona.description}

**Decision Style:** ${persona.attributes?.decisionStyle || 'Mixed'}
**Values:** ${persona.attributes?.valueSystem || 'Varied'}
**Communication Style:** ${persona.attributes?.communicationPreference || 'Balanced'}

**What Persuades Them:**
${JSON.stringify(persona.persuasionLevers, null, 2)}

**What They Resist:**
${Array.isArray(persona.pitfalls) ? persona.pitfalls.join('\n- ') : JSON.stringify(persona.pitfalls, null, 2)}
`;
          }
        }
      )
      .join('\n');

    const modeInstructions = {
      quick: 'Provide brief reactions from each persona focusing on initial impressions.',
      detailed:
        'Provide detailed reactions including concerns, questions, and specific feedback from each persona.',
      deliberation:
        'Simulate a full deliberation discussion with exchanges between personas, showing how they influence each other and arrive at conclusions.',
    };

    return `You are simulating a focus group for a legal case. The focus group panelists represent different juror personas, and they're evaluating an argument that will be presented at trial.

# Case Information

**Case:** ${caseContext.caseName}
**Type:** ${caseContext.caseType}
**Our Side:** ${caseContext.ourSide}

## Key Facts

${factsText}

# Argument Being Tested

**Title:** ${argument.title}
**Type:** ${argument.argumentType}

**Content:**
${argument.content}
${argument.documents && argument.documents.length > 0 ? (() => {
  const documentsWithText = argument.documents.filter(doc => doc.textContent);
  console.log(`📄 [FOCUS_GROUP_ENGINE] Including ${documentsWithText.length} document(s) in prompt`);
  documentsWithText.forEach((doc, idx) => {
    console.log(`   ${idx + 1}. ${doc.filename} (${(doc.textContent?.length || 0).toLocaleString()} chars)`);
  });
  
  if (documentsWithText.length === 0) {
    return '';
  }
  
  return `

## Supporting Documents

The following documents are attached to this argument and provide additional context:

${documentsWithText.map((doc, idx) => {
  return `
### Document ${idx + 1}: ${doc.filename}${doc.documentType ? ` (${doc.documentType})` : ''}${doc.notes ? `\n**Notes:** ${doc.notes}` : ''}

**Full Document Text:**
${doc.textContent}

---`;
}).join('\n')}`;
})() : (() => {
  console.log(`📄 [FOCUS_GROUP_ENGINE] No documents attached to argument`);
  return '';
})()}

# Focus Group Panelists

${personasText}

# Simulation Mode: ${simulationMode}

${modeInstructions[simulationMode]}

# Your Task

Simulate how each persona would react to this argument. Consider:
- Their decision-making style and values
- What persuades them vs. what they resist
- How the argument aligns with their worldview
- Their likely concerns and questions
- How they might interact with others in deliberation
${
  this.useV2Data
    ? `
**IMPORTANT: Use V2 Data for Realistic Simulation**
- Have personas use the "Typical Phrases You'll Hear" in their dialogue
- Align their reactions with their Instant Read personality
- Consider their Verdict Lean when evaluating arguments
- Use their specified Role in Deliberation (leader, follower, etc.)
- Make dialogue authentic to their archetype
`
    : ''
}

${
  simulationMode === 'deliberation'
    ? `
## Deliberation Simulation

Show a realistic jury deliberation discussion where:
- Personas express their views
- They respond to each other's points
- Influential personas sway others (or fail to)
- Consensus emerges or divisions persist
- Real debate dynamics play out

Include 8-12 exchanges showing the flow of deliberation.
`
    : ''
}

Return your response as JSON:

\`\`\`json
{
  "overallReception": "Summary of how the panel received the argument",
  "averageSentiment": 0.5,
  "personaReactions": [
    {
      "personaId": "<ID>",
      "personaName": "<Name>",
      "initialReaction": "Their first impression of the argument",
      "sentimentScore": 0.7,
      "concerns": ["Concern 1", "Concern 2"],
      "questions": ["Question they'd have", "Another question"],
      "persuasiveElements": ["What worked well"],
      "weaknesses": ["What fell flat or raised doubts"],
      "verdictLean": "favorable|neutral|unfavorable",
      "confidence": 0.8
    }
  ],
  ${
    simulationMode === 'deliberation'
      ? `"deliberationSummary": {
    "keyDebatePoints": ["Main point of discussion", "Another debate topic"],
    "influentialPersonas": ["Persona who swayed others"],
    "exchanges": [
      {
        "speakerPersona": "Persona Name",
        "statement": "What they said",
        "influence": ["How this affected other personas"],
        "tension": "Optional: any conflict this created"
      }
    ],
    "consensusAreas": ["Where panel agreed"],
    "divisiveIssues": ["Where panel split"]
  },`
      : ''
  }
  "recommendations": [
    {
      "priority": 9,
      "category": "strengthen|address|reframe|add|remove",
      "title": "Brief recommendation",
      "description": "Detailed explanation and reasoning",
      "affectedPersonas": ["Persona 1", "Persona 2"]
    }
  ],
  "strengthsToEmphasize": ["Element 1", "Element 2"],
  "weaknessesToAddress": ["Weakness 1", "Weakness 2"]
}
\`\`\`

IMPORTANT:
- Stay true to each persona's established characteristics
- Be realistic about how different types of people react
- Note when an argument backfires with certain personas
- Consider group dynamics and social influence
- Provide actionable recommendations
- Base everything on the personas' established profiles`;
  }

  private parseResponse(content: string, personas: Persona[]): FocusGroupResult {
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : content;

      const parsed = JSON.parse(jsonContent.trim());

      return {
        overallReception: parsed.overallReception || 'No overall assessment provided',
        averageSentiment: Math.max(-1, Math.min(1, parsed.averageSentiment || 0)),
        personaReactions: (parsed.personaReactions || []).map((reaction: any) => ({
          personaId: reaction.personaId || '',
          personaName: reaction.personaName || '',
          initialReaction: reaction.initialReaction || '',
          sentimentScore: Math.max(-1, Math.min(1, reaction.sentimentScore || 0)),
          concerns: Array.isArray(reaction.concerns) ? reaction.concerns : [],
          questions: Array.isArray(reaction.questions) ? reaction.questions : [],
          persuasiveElements: Array.isArray(reaction.persuasiveElements)
            ? reaction.persuasiveElements
            : [],
          weaknesses: Array.isArray(reaction.weaknesses) ? reaction.weaknesses : [],
          verdictLean: ['favorable', 'neutral', 'unfavorable'].includes(reaction.verdictLean)
            ? reaction.verdictLean
            : undefined,
          confidence: Math.max(0, Math.min(1, reaction.confidence || 0.5)),
        })),
        deliberationSummary: parsed.deliberationSummary
          ? {
              keyDebatePoints: Array.isArray(parsed.deliberationSummary.keyDebatePoints)
                ? parsed.deliberationSummary.keyDebatePoints
                : [],
              influentialPersonas: Array.isArray(parsed.deliberationSummary.influentialPersonas)
                ? parsed.deliberationSummary.influentialPersonas
                : [],
              exchanges: Array.isArray(parsed.deliberationSummary.exchanges)
                ? parsed.deliberationSummary.exchanges.map((ex: any) => ({
                    speakerPersona: ex.speakerPersona || '',
                    statement: ex.statement || '',
                    influence: Array.isArray(ex.influence) ? ex.influence : [],
                    tension: ex.tension,
                  }))
                : [],
              consensusAreas: Array.isArray(parsed.deliberationSummary.consensusAreas)
                ? parsed.deliberationSummary.consensusAreas
                : [],
              divisiveIssues: Array.isArray(parsed.deliberationSummary.divisiveIssues)
                ? parsed.deliberationSummary.divisiveIssues
                : [],
            }
          : undefined,
        recommendations: (parsed.recommendations || []).map((rec: any) => ({
          priority: typeof rec.priority === 'number' ? rec.priority : 5,
          category: rec.category || 'other',
          title: rec.title || '',
          description: rec.description || '',
          affectedPersonas: Array.isArray(rec.affectedPersonas) ? rec.affectedPersonas : [],
        })),
        strengthsToEmphasize: Array.isArray(parsed.strengthsToEmphasize)
          ? parsed.strengthsToEmphasize
          : [],
        weaknessesToAddress: Array.isArray(parsed.weaknessesToAddress)
          ? parsed.weaknessesToAddress
          : [],
      };
    } catch (error) {
      console.error('Failed to parse focus group response:', error);
      console.error('Raw content:', content);

      // Return minimal result as fallback
      return {
        overallReception: 'Failed to parse AI response - manual review required',
        averageSentiment: 0,
        personaReactions: personas.map((p) => ({
          personaId: p.id,
          personaName: p.name,
          initialReaction: 'Analysis failed',
          sentimentScore: 0,
          concerns: ['AI analysis failed'],
          questions: [],
          persuasiveElements: [],
          weaknesses: ['Unable to generate feedback'],
          confidence: 0,
        })),
        recommendations: [
          {
            priority: 10,
            category: 'system_error',
            title: 'AI Analysis Failed',
            description: 'The focus group simulation failed to complete. Please try again or conduct manual testing.',
            affectedPersonas: personas.map((p) => p.name),
          },
        ],
        strengthsToEmphasize: [],
        weaknessesToAddress: ['AI simulation error - manual review required'],
      };
    }
  }
}
