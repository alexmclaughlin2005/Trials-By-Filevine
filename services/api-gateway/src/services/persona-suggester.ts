import { ClaudeClient } from '@trialforge/ai-client';
import type { Juror, Persona, ResearchArtifact } from '@trialforge/database';

interface PersonaSuggestion {
  persona: Persona;
  confidence: number;
  reasoning: string;
  keyMatches: string[];
  potentialConcerns: string[];
}

interface PersonaSuggesterInput {
  juror: Juror & {
    researchArtifacts?: ResearchArtifact[];
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
        prompt,
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

    if (juror.name) {
      parts.push(`Name: ${juror.name}`);
    }

    parts.push(`Juror Number: ${juror.jurorNumber}`);

    if (juror.occupation) {
      parts.push(`Occupation: ${juror.occupation}`);
    }

    if (juror.education) {
      parts.push(`Education: ${juror.education}`);
    }

    if (juror.demographics && Object.keys(juror.demographics as object).length > 0) {
      parts.push(`Demographics: ${JSON.stringify(juror.demographics, null, 2)}`);
    }

    if (juror.notes) {
      parts.push(`Notes: ${juror.notes}`);
    }

    if (juror.researchArtifacts && juror.researchArtifacts.length > 0) {
      parts.push('\nResearch Artifacts:');
      juror.researchArtifacts.forEach((artifact, i) => {
        parts.push(`  ${i + 1}. [${artifact.artifactType}] ${artifact.source}: ${artifact.content}`);
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
        .filter((s): s is PersonaSuggestion => s !== null)
        .slice(0, 3); // Top 3 suggestions

      return suggestions;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response');
    }
  }
}
