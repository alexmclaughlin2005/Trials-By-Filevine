import { ClaudeClient } from '@juries/ai-client';

interface Persona {
  id: string;
  name: string;
  description: string;
  attributes: Record<string, unknown>;
  persuasionLevers: Record<string, unknown>;
  pitfalls: Record<string, unknown>;
}

interface PersonaSuggestion {
  persona: Persona;
  confidence: number;
  reasoning: string;
  keyMatches: string[];
  potentialConcerns: string[];
}

interface PersonaSuggesterInput {
  juror: Record<string, unknown> & {
    researchArtifacts?: Record<string, unknown>[];
  };
  availablePersonas: Persona[];
  caseContext?: {
    caseType: string;
    keyIssues: string[];
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

    return `You are an expert jury consultant analyzing juror profiles to match them with established juror personas.

JUROR INFORMATION:
${jurorInfo}
${contextInfo}

AVAILABLE PERSONAS:
${personaDescriptions}

TASK:
Analyze this juror's profile and suggest the top 3 most likely matching personas. For each suggestion, provide:
1. The persona ID
2. A confidence score (0.0 to 1.0)
3. Detailed reasoning for the match
4. Key behavioral/demographic matches
5. Potential concerns or caveats

Consider:
- Demographics and background
- Occupation and education
- Communication style and decision-making patterns
- Values and belief systems evident from research
- Relevance to the case context

Respond ONLY with valid JSON in this exact format:
{
  "suggestions": [
    {
      "personaId": "persona-id-here",
      "confidence": 0.85,
      "reasoning": "Detailed explanation of why this persona matches...",
      "keyMatches": ["Match 1", "Match 2", "Match 3"],
      "potentialConcerns": ["Concern 1", "Concern 2"]
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
        const attrs = persona.attributes ? JSON.stringify(persona.attributes) : 'N/A';
        return `
ID: ${persona.id}
Name: ${persona.name}
Description: ${persona.description}
Attributes: ${attrs}
`;
      })
      .join('\n---\n');
  }

  private parseResponse(content: string, availablePersonas: Persona[]): PersonaSuggestion[] {
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();

      const parsed = JSON.parse(cleanContent);

      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error('Invalid response format');
      }

      // Map persona IDs to full persona objects
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
