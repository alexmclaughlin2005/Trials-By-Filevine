import { ClaudeClient } from '@juries/ai-client';

interface Persona {
  id: string;
  name: string;
  description: string;
  attributes: Record<string, unknown>;
  persuasionLevers: Record<string, unknown>;
  pitfalls: Record<string, unknown>;
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

interface PersonaSuggestion {
  persona: Persona;
  confidence: number;
  reasoning: string;
  keyMatches: string[];
  potentialConcerns: string[];
  // V2 Enhancements
  dangerAssessment?: {
    level: 'low' | 'medium' | 'high' | 'critical';
    plaintiffDanger: number;
    defenseDanger: number;
    recommendation: string;
  };
  strikeRecommendation?: {
    action: 'MUST STRIKE' | 'STRIKE IF POSSIBLE' | 'NEUTRAL' | 'CONSIDER KEEPING' | 'KEEP';
    reasoning: string;
  };
}

interface PersonaSuggesterInput {
  juror: Record<string, unknown> & {
    researchArtifacts?: Record<string, unknown>[];
  };
  availablePersonas: Persona[];
  caseContext?: {
    caseType: string;
    keyIssues: string[];
    attorneySide?: 'plaintiff' | 'defense'; // NEW: For strike/keep recommendations
  };
}

export class PersonaSuggesterService {
  private claudeClient: ClaudeClient;

  constructor(apiKey: string) {
    this.claudeClient = new ClaudeClient({ apiKey });
  }

  async suggestPersonas(input: PersonaSuggesterInput): Promise<PersonaSuggestion[]> {
    const { juror, availablePersonas, caseContext } = input;

    // Build the prompt for Claude
    const prompt = this.buildPrompt(juror, availablePersonas, caseContext);

    try {
      const response = await this.claudeClient.complete({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent analysis
      });

      // Parse the structured response
      const suggestions = this.parseResponse(response.content, availablePersonas);

      return suggestions;
    } catch (error) {
      console.error('Error in persona suggestion:', error);
      throw new Error('Failed to generate persona suggestions');
    }
  }

  private buildPrompt(
    juror: PersonaSuggesterInput['juror'],
    personas: Persona[],
    caseContext?: PersonaSuggesterInput['caseContext']
  ): string {
    const jurorInfo = this.formatJurorInfo(juror);
    const personaDescriptions = this.formatPersonaDescriptions(personas);
    const contextInfo = caseContext
      ? `\n\nCase Context:\n- Type: ${caseContext.caseType}\n- Key Issues: ${caseContext.keyIssues.join(', ')}`
      : '';

    const attorneySide = caseContext?.attorneySide || 'plaintiff';

    return `You are an expert jury consultant analyzing juror profiles to match them with established juror personas. You have access to enhanced V2 persona data including instant reads, danger levels, verdict predictions, and strike/keep strategies.

JUROR INFORMATION:
${jurorInfo}
${contextInfo}

AVAILABLE PERSONAS (V2 Enhanced):
${personaDescriptions}

TASK:
Analyze this juror's profile and suggest the top 3 most likely matching personas. For each suggestion, provide:
1. The persona ID
2. A confidence score (0.0 to 1.0)
3. Detailed reasoning for the match
4. Key behavioral/demographic matches
5. Potential concerns or caveats
6. DANGER ASSESSMENT (based on danger levels)
7. STRIKE RECOMMENDATION (based on attorney side: ${attorneySide})

Consider when matching:
- Demographics and background alignment
- Occupation and education patterns
- Communication style matches with "Phrases You'll Hear"
- Values and belief systems from research
- Instant Read summaries for quick pattern recognition
- Archetype verdict lean alignment with case needs
- Relevance to the case context

For DANGER ASSESSMENT:
- Plaintiff Danger Level (1-5): How dangerous is this juror to plaintiff's case
- Defense Danger Level (1-5): How dangerous is this juror to defense's case
- Provide overall danger level: "low" (1-2), "medium" (2-3), "high" (3-4), "critical" (4-5)
- Give specific recommendation based on ${attorneySide} attorney perspective

For STRIKE RECOMMENDATION:
- Based on Strike/Keep Strategy for ${attorneySide} attorney
- Choose from: "MUST STRIKE", "STRIKE IF POSSIBLE", "NEUTRAL", "CONSIDER KEEPING", "KEEP"
- Explain why from ${attorneySide} attorney's perspective

Respond ONLY with valid JSON in this exact format:
{
  "suggestions": [
    {
      "personaId": "persona-id-here",
      "confidence": 0.85,
      "reasoning": "Detailed explanation of why this persona matches, referencing instant read, phrases they'll hear, and verdict prediction...",
      "keyMatches": ["Match 1 with specific V2 data", "Match 2", "Match 3"],
      "potentialConcerns": ["Concern 1", "Concern 2"],
      "dangerAssessment": {
        "level": "high",
        "plaintiffDanger": 4,
        "defenseDanger": 2,
        "recommendation": "This juror poses significant risk to plaintiff's case because..."
      },
      "strikeRecommendation": {
        "action": "STRIKE IF POSSIBLE",
        "reasoning": "Based on strike/keep strategy and danger levels, ${attorneySide} attorney should..."
      }
    }
  ]
}`;
  }

  private formatJurorInfo(juror: PersonaSuggesterInput['juror']): string {
    const parts: string[] = [];

    // Use firstName and lastName instead of name
    const fullName = `${juror.firstName} ${juror.lastName}`.trim();
    if (fullName) {
      parts.push(`Name: ${fullName}`);
    }

    if (juror.jurorNumber) {
      parts.push(`Juror Number: ${juror.jurorNumber}`);
    }

    if (juror.age) {
      parts.push(`Age: ${juror.age}`);
    }

    if (juror.occupation) {
      parts.push(`Occupation: ${juror.occupation}`);
    }

    if (juror.employer) {
      parts.push(`Employer: ${juror.employer}`);
    }

    if (juror.city) {
      parts.push(`City: ${juror.city}`);
    }

    if (juror.questionnaireData && typeof juror.questionnaireData === 'object' && Object.keys(juror.questionnaireData as object).length > 0) {
      parts.push(`Questionnaire Data: ${JSON.stringify(juror.questionnaireData, null, 2)}`);
    }

    if (juror.notes) {
      parts.push(`Notes: ${juror.notes}`);
    }

    if (juror.researchArtifacts && juror.researchArtifacts.length > 0) {
      parts.push('\nResearch Artifacts:');
      juror.researchArtifacts.forEach((artifact: Record<string, unknown>, i: number) => {
        parts.push(`  ${i + 1}. [${artifact.sourceType}] ${artifact.sourceName || 'Unknown'}: ${artifact.rawContent || 'No content'}`);
      });
    }

    return parts.join('\n');
  }

  private formatPersonaDescriptions(personas: Persona[]): string {
    return personas
      .map((persona) => {
        const parts = [`ID: ${persona.id}`, `Name: ${persona.name}`];

        // V2 Field: Instant Read (most important for quick matching)
        if (persona.instantRead) {
          parts.push(`Instant Read: ${persona.instantRead}`);
        }

        // V2 Field: Archetype and Verdict Lean
        if (persona.archetype) {
          parts.push(`Archetype: ${persona.archetype}`);
        }
        if (persona.archetypeVerdictLean) {
          parts.push(`Verdict Lean: ${persona.archetypeVerdictLean}`);
        }

        // V2 Field: Danger Levels (critical for attorney strategy)
        if (persona.plaintiffDangerLevel !== undefined || persona.defenseDangerLevel !== undefined) {
          parts.push(`Plaintiff Danger Level: ${persona.plaintiffDangerLevel || 'N/A'}/5`);
          parts.push(`Defense Danger Level: ${persona.defenseDangerLevel || 'N/A'}/5`);
        }

        // Original description
        parts.push(`Description: ${persona.description}`);

        // V2 Field: Phrases You'll Hear (key behavioral indicators)
        if (persona.phrasesYoullHear && persona.phrasesYoullHear.length > 0) {
          parts.push(`Phrases You'll Hear: ${persona.phrasesYoullHear.slice(0, 3).join('; ')}`);
        }

        // V2 Field: Verdict Prediction
        if (persona.verdictPrediction) {
          parts.push(`Verdict Prediction:`);
          parts.push(`  - Liability Probability: ${(persona.verdictPrediction.liability_finding_probability * 100).toFixed(0)}%`);
          parts.push(`  - Role in Deliberation: ${persona.verdictPrediction.role_in_deliberation}`);
        }

        // V2 Field: Strike or Keep Strategy
        if (persona.strikeOrKeep) {
          parts.push(`Strike/Keep Strategy:`);
          parts.push(`  - Plaintiff: ${persona.strikeOrKeep.plaintiff_strategy}`);
          parts.push(`  - Defense: ${persona.strikeOrKeep.defense_strategy}`);
        }

        // Legacy attributes (if still relevant)
        if (persona.attributes && Object.keys(persona.attributes).length > 0) {
          parts.push(`Additional Attributes: ${JSON.stringify(persona.attributes)}`);
        }

        return parts.join('\n');
      })
      .join('\n\n---\n\n');
  }

  private parseResponse(content: string, availablePersonas: Persona[]): PersonaSuggestion[] {
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();

      const parsed = JSON.parse(cleanContent);

      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error('Invalid response format');
      }

      // Map persona IDs to full persona objects with V2 enhancements
      const suggestions: PersonaSuggestion[] = parsed.suggestions
        .map((suggestion: any) => {
          const persona = availablePersonas.find((p) => p.id === suggestion.personaId);

          if (!persona) {
            console.warn(`Persona ${suggestion.personaId} not found in available personas`);
            return null;
          }

          return {
            persona,
            confidence: Math.max(0, Math.min(1, suggestion.confidence)), // Clamp to 0-1
            reasoning: suggestion.reasoning || '',
            keyMatches: suggestion.keyMatches || [],
            potentialConcerns: suggestion.potentialConcerns || [],
            // V2 Enhancements
            dangerAssessment: suggestion.dangerAssessment ? {
              level: suggestion.dangerAssessment.level || 'medium',
              plaintiffDanger: suggestion.dangerAssessment.plaintiffDanger || 0,
              defenseDanger: suggestion.dangerAssessment.defenseDanger || 0,
              recommendation: suggestion.dangerAssessment.recommendation || ''
            } : undefined,
            strikeRecommendation: suggestion.strikeRecommendation ? {
              action: suggestion.strikeRecommendation.action || 'NEUTRAL',
              reasoning: suggestion.strikeRecommendation.reasoning || ''
            } : undefined,
          };
        })
        .filter((s: PersonaSuggestion | null): s is PersonaSuggestion => s !== null)
        .slice(0, 3); // Top 3 suggestions

      return suggestions;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response');
    }
  }
}
