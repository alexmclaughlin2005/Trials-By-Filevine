import { ClaudeClient } from '@juries/ai-client';

interface ResearchArtifact {
  id: string;
  artifactType: string;
  source: string;
  content: string;
  url?: string;
}

interface PersonaSignal {
  category: string;
  signal: string;
  confidence: number;
  evidence: string[];
  relevance: string;
}

interface ExtractedSnippet {
  text: string;
  context: string;
  relevance: 'high' | 'medium' | 'low';
}

interface SummarizedArtifact {
  artifactId: string;
  summary: string;
  personaSignals: PersonaSignal[];
  extractedSnippets: ExtractedSnippet[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  keyThemes: string[];
  warnings?: string[];
}

interface ResearchSummarizerInput {
  artifacts: ResearchArtifact[];
  jurorContext: {
    name: string;
    occupation?: string;
    age?: number;
  };
  caseContext?: {
    caseType: string;
    keyIssues?: string[];
  };
}

export class ResearchSummarizerService {
  private claudeClient: ClaudeClient;

  constructor(apiKey: string) {
    this.claudeClient = new ClaudeClient({ apiKey });
  }

  async summarizeResearch(input: ResearchSummarizerInput): Promise<SummarizedArtifact[]> {
    const { artifacts, jurorContext, caseContext } = input;

    if (artifacts.length === 0) {
      return [];
    }

    // Process artifacts in batches to avoid token limits
    const batchSize = 3;
    const results: SummarizedArtifact[] = [];

    for (let i = 0; i < artifacts.length; i += batchSize) {
      const batch = artifacts.slice(i, i + batchSize);
      const batchResults = await this.processBatch(batch, jurorContext, caseContext);
      results.push(...batchResults);
    }

    return results;
  }

  private async processBatch(
    artifacts: ResearchArtifact[],
    jurorContext: ResearchSummarizerInput['jurorContext'],
    caseContext: ResearchSummarizerInput['caseContext']
  ): Promise<SummarizedArtifact[]> {
    const prompt = this.buildPrompt(artifacts, jurorContext, caseContext);

    const response = await this.claudeClient.complete({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 4000,
      temperature: 0.2, // Low temperature for consistent extraction
    });

    return this.parseResponse(response.content, artifacts);
  }

  private buildPrompt(
    artifacts: ResearchArtifact[],
    jurorContext: ResearchSummarizerInput['jurorContext'],
    caseContext?: ResearchSummarizerInput['caseContext']
  ): string {
    const artifactsText = artifacts
      .map(
        (artifact, idx) => `
## Artifact ${idx + 1}
**Type:** ${artifact.artifactType}
**Source:** ${artifact.source}
${artifact.url ? `**URL:** ${artifact.url}` : ''}

**Content:**
${artifact.content}
`
      )
      .join('\n---\n');

    return `You are a legal research analyst helping attorneys understand potential jurors. Your task is to analyze research artifacts and extract persona-relevant signals.

# Juror Context
- **Name:** ${jurorContext.name}
${jurorContext.occupation ? `- **Occupation:** ${jurorContext.occupation}` : ''}
${jurorContext.age ? `- **Age:** ${jurorContext.age}` : ''}

${
  caseContext
    ? `
# Case Context
- **Case Type:** ${caseContext.caseType}
${caseContext.keyIssues ? `- **Key Issues:** ${caseContext.keyIssues.join(', ')}` : ''}
`
    : ''
}

# Research Artifacts

${artifactsText}

# Your Task

Analyze each artifact and extract:
1. **Persona Signals** - Indicators of decision-making style, values, communication preferences
2. **Key Snippets** - Relevant quotes or content with context
3. **Sentiment** - Overall tone (positive, neutral, negative, mixed)
4. **Themes** - Main topics or interests discussed
5. **Warnings** - Any concerning content or potential biases

Focus on:
- Values and belief systems
- Decision-making patterns (analytical vs. emotional)
- Authority and expertise signals
- Community and relationship focus
- Professional interests and expertise
- Political or ideological indicators (if relevant)
- Life experiences that might influence case perception

Return your analysis as a JSON array with one entry per artifact:

\`\`\`json
[
  {
    "artifactId": "<artifact ID from input>",
    "summary": "2-3 sentence summary of the artifact's content and relevance",
    "personaSignals": [
      {
        "category": "decision_style|values|communication|expertise|community",
        "signal": "Brief description of the signal",
        "confidence": 0.0-1.0,
        "evidence": ["Quote or specific content supporting this signal"],
        "relevance": "Why this matters for jury selection or case strategy"
      }
    ],
    "extractedSnippets": [
      {
        "text": "Relevant quote or content",
        "context": "Where this appeared and what it relates to",
        "relevance": "high|medium|low"
      }
    ],
    "sentiment": "positive|neutral|negative|mixed",
    "keyThemes": ["theme1", "theme2"],
    "warnings": ["Any concerning content or biases"]
  }
]
\`\`\`

IMPORTANT:
- Be objective and evidence-based
- Don't make assumptions beyond what's in the content
- Flag any concerning content (extreme views, bias, etc.)
- All signals must have concrete evidence
- Consider case relevance when available`;
  }

  private parseResponse(content: string, artifacts: ResearchArtifact[]): SummarizedArtifact[] {
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : content;

      const parsed = JSON.parse(jsonContent.trim());

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      // Map artifact IDs to actual artifact objects
      return parsed.map((item: any) => {
        const artifact = artifacts.find((a) => a.id === item.artifactId);

        return {
          artifactId: item.artifactId,
          summary: item.summary || '',
          personaSignals: (item.personaSignals || []).map((signal: any) => ({
            category: signal.category || 'other',
            signal: signal.signal || '',
            confidence: Math.max(0, Math.min(1, signal.confidence || 0.5)),
            evidence: Array.isArray(signal.evidence) ? signal.evidence : [],
            relevance: signal.relevance || '',
          })),
          extractedSnippets: (item.extractedSnippets || []).map((snippet: any) => ({
            text: snippet.text || '',
            context: snippet.context || '',
            relevance: ['high', 'medium', 'low'].includes(snippet.relevance)
              ? snippet.relevance
              : 'medium',
          })),
          sentiment: ['positive', 'neutral', 'negative', 'mixed'].includes(item.sentiment)
            ? item.sentiment
            : 'neutral',
          keyThemes: Array.isArray(item.keyThemes) ? item.keyThemes : [],
          warnings: Array.isArray(item.warnings) ? item.warnings : undefined,
        };
      });
    } catch (error) {
      console.error('Failed to parse research summarizer response:', error);
      console.error('Raw content:', content);

      // Return basic summaries as fallback
      return artifacts.map((artifact) => ({
        artifactId: artifact.id,
        summary: 'Failed to parse AI response',
        personaSignals: [],
        extractedSnippets: [],
        sentiment: 'neutral' as const,
        keyThemes: [],
        warnings: ['AI analysis failed - manual review required'],
      }));
    }
  }
}
