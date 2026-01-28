import { ClaudeClient } from '@juries/ai-client';

interface JurorWithPersona {
  juror: {
    id: string;
    jurorNumber: string;
    firstName: string;
    lastName: string;
    age?: number;
    occupation?: string;
    notes?: string;
  };
  mappedPersona?: {
    id: string;
    name: string;
    archetype: string;
    instantRead: string;
    archetypeVerdictLean: string;
    plaintiffDangerLevel: number;
    defenseDangerLevel: number;
    strikeOrKeep: {
      plaintiff_strategy: string;
      defense_strategy: string;
    };
    verdictPrediction?: {
      liability_finding_probability: number;
      damages_if_liability: string;
      role_in_deliberation: string;
    };
  };
}

interface StrikeRecommendation {
  jurorId: string;
  jurorNumber: string;
  jurorName: string;
  action: 'MUST STRIKE' | 'STRIKE IF POSSIBLE' | 'NEUTRAL' | 'CONSIDER KEEPING' | 'KEEP';
  priority: number; // 1-10, 10 being highest priority
  reasoning: string;
  dangerLevel: 'low' | 'medium' | 'high' | 'critical';
  archetypeMatch?: string;
  keyFactors: string[];
}

interface PanelComposition {
  totalJurors: number;
  favorableCount: number;
  unfavorableCount: number;
  neutralCount: number;
  archetypeBreakdown: Record<string, number>;
  verdictLeanSummary: {
    strongPlaintiff: number;
    leanPlaintiff: number;
    neutral: number;
    leanDefense: number;
    strongDefense: number;
  };
}

interface CaseStrategyRecommendation {
  overallAssessment: string;
  panelComposition: PanelComposition;
  strikeRecommendations: StrikeRecommendation[];
  keepRecommendations: StrikeRecommendation[];
  deliberationForecast: {
    predictedOutcome: string;
    confidenceLevel: number;
    keyInfluencers: string[];
    potentialLeaders: string[];
    riskFactors: string[];
  };
  strategicPriorities: string[];
}

interface CaseStrategyInput {
  jurors: JurorWithPersona[];
  caseContext: {
    caseType: string;
    keyIssues: string[];
    attorneySide: 'plaintiff' | 'defense';
    plaintiffTheory?: string;
    defenseTheory?: string;
    availableStrikes: number;
  };
}

/**
 * CaseStrategyV2Service
 *
 * Generates strategic recommendations for jury selection using V2 persona data:
 * - Strike/Keep guidance for attorney strategy
 * - Danger level assessments for each juror
 * - Verdict predictions for deliberation forecasting
 * - Panel composition analysis
 */
export class CaseStrategyV2Service {
  private claudeClient: ClaudeClient;

  constructor(apiKey: string) {
    this.claudeClient = new ClaudeClient({ apiKey });
  }

  async generateStrategy(input: CaseStrategyInput): Promise<CaseStrategyRecommendation> {
    const prompt = this.buildPrompt(input);

    try {
      const response = await this.claudeClient.complete({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 4000,
        temperature: 0.3, // Lower temperature for consistent strategic advice
      });

      const strategy = this.parseResponse(response.content);
      return strategy;
    } catch (error) {
      console.error('Error generating case strategy:', error);
      throw new Error('Failed to generate case strategy recommendations');
    }
  }

  private buildPrompt(input: CaseStrategyInput): string {
    const { jurors, caseContext } = input;
    const { attorneySide, availableStrikes } = caseContext;

    const jurorAnalysis = this.formatJurorAnalysis(jurors, attorneySide);
    const panelOverview = this.buildPanelOverview(jurors);

    return `You are an expert jury consultant providing strategic recommendations for jury selection. You are advising the ${attorneySide.toUpperCase()} attorney.

CASE CONTEXT:
- Type: ${caseContext.caseType}
- Key Issues: ${caseContext.keyIssues.join(', ')}
${caseContext.plaintiffTheory ? `- Plaintiff Theory: ${caseContext.plaintiffTheory}` : ''}
${caseContext.defenseTheory ? `- Defense Theory: ${caseContext.defenseTheory}` : ''}
- Attorney Side: ${attorneySide.toUpperCase()}
- Available Strikes: ${availableStrikes}

JUROR PANEL OVERVIEW:
${panelOverview}

DETAILED JUROR ANALYSIS (with V2 Persona Matching):
${jurorAnalysis}

TASK:
Provide strategic recommendations for jury selection from the ${attorneySide} attorney's perspective. Your analysis should include:

1. OVERALL PANEL ASSESSMENT
   - Is this panel favorable, unfavorable, or neutral?
   - What's the overall risk profile?
   - Key trends in the panel composition

2. STRIKE RECOMMENDATIONS (Top Priority)
   - Which jurors MUST be struck (highest priority)
   - Which jurors SHOULD be struck if possible
   - Prioritize based on danger levels and strike/keep guidance
   - Explain reasoning referencing instant reads and danger levels

3. KEEP RECOMMENDATIONS
   - Which jurors are most favorable to keep
   - Why they're valuable to your case
   - Their likely role in deliberation

4. DELIBERATION FORECAST
   - Predicted outcome based on likely panel composition
   - Confidence level (0.0 to 1.0)
   - Who will likely emerge as leaders/influencers
   - Key risk factors to watch

5. STRATEGIC PRIORITIES
   - Top 3-5 strategic priorities for jury selection
   - What patterns to watch during voir dire
   - How to use strikes most effectively

CRITICAL CONSIDERATIONS:
- You have ${availableStrikes} strikes available
- Focus on HIGH and CRITICAL danger level jurors first
- Reference specific V2 data: instant reads, danger levels, verdict predictions
- Consider deliberation behavior and influence patterns
- Balance striking unfavorable jurors vs keeping favorable ones

Respond ONLY with valid JSON in this exact format:
{
  "overallAssessment": "Brief assessment of the panel...",
  "panelComposition": {
    "totalJurors": ${jurors.length},
    "favorableCount": 0,
    "unfavorableCount": 0,
    "neutralCount": 0,
    "archetypeBreakdown": {
      "bootstrapper": 2,
      "crusader": 1
    },
    "verdictLeanSummary": {
      "strongPlaintiff": 0,
      "leanPlaintiff": 0,
      "neutral": 0,
      "leanDefense": 0,
      "strongDefense": 0
    }
  },
  "strikeRecommendations": [
    {
      "jurorId": "juror-id",
      "jurorNumber": "12",
      "jurorName": "John Doe",
      "action": "MUST STRIKE",
      "priority": 10,
      "reasoning": "Based on V2 data...",
      "dangerLevel": "critical",
      "archetypeMatch": "bootstrapper",
      "keyFactors": ["Factor 1", "Factor 2"]
    }
  ],
  "keepRecommendations": [...],
  "deliberationForecast": {
    "predictedOutcome": "Description of likely outcome...",
    "confidenceLevel": 0.75,
    "keyInfluencers": ["Juror 5", "Juror 12"],
    "potentialLeaders": ["Juror 8"],
    "riskFactors": ["Risk 1", "Risk 2"]
  },
  "strategicPriorities": [
    "Priority 1: Strike all bootstrapper archetypes (high danger)",
    "Priority 2: Keep crusader archetypes (favorable)",
    "Priority 3: Watch for leadership patterns in deliberation forecast"
  ]
}`;
  }

  private formatJurorAnalysis(jurors: JurorWithPersona[], attorneySide: 'plaintiff' | 'defense'): string {
    return jurors.map((j, index) => {
      const { juror, mappedPersona } = j;
      const jurorInfo = `${juror.jurorNumber}: ${juror.firstName} ${juror.lastName}${juror.age ? `, age ${juror.age}` : ''}${juror.occupation ? `, ${juror.occupation}` : ''}`;

      if (!mappedPersona) {
        return `
[${index + 1}] ${jurorInfo}
- Persona Match: NONE
- Assessment: No archetype match available`;
      }

      const strategy = attorneySide === 'plaintiff'
        ? mappedPersona.strikeOrKeep.plaintiff_strategy
        : mappedPersona.strikeOrKeep.defense_strategy;

      const dangerLevel = attorneySide === 'plaintiff'
        ? mappedPersona.plaintiffDangerLevel
        : mappedPersona.defenseDangerLevel;

      return `
[${index + 1}] ${jurorInfo}
- Archetype: ${mappedPersona.archetype}
- Instant Read: ${mappedPersona.instantRead}
- Verdict Lean: ${mappedPersona.archetypeVerdictLean}
- Danger Level (for ${attorneySide}): ${dangerLevel}/5
- Strike/Keep Strategy: ${strategy}
${mappedPersona.verdictPrediction ? `- Verdict Prediction: ${(mappedPersona.verdictPrediction.liability_finding_probability * 100).toFixed(0)}% liability, ${mappedPersona.verdictPrediction.role_in_deliberation}` : ''}`;
    }).join('\n');
  }

  private buildPanelOverview(jurors: JurorWithPersona[]): string {
    const withPersona = jurors.filter(j => j.mappedPersona);
    const withoutPersona = jurors.length - withPersona.length;

    const archetypes = withPersona.reduce((acc, j) => {
      const archetype = j.mappedPersona!.archetype;
      acc[archetype] = (acc[archetype] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return `
Total Jurors: ${jurors.length}
Jurors with Persona Match: ${withPersona.length}
Jurors without Match: ${withoutPersona}

Archetype Distribution:
${Object.entries(archetypes).map(([archetype, count]) => `  - ${archetype}: ${count}`).join('\n')}`;
  }

  private parseResponse(content: string): CaseStrategyRecommendation {
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);

      if (!parsed) {
        throw new Error('Invalid response format');
      }

      return {
        overallAssessment: parsed.overallAssessment || '',
        panelComposition: parsed.panelComposition || {
          totalJurors: 0,
          favorableCount: 0,
          unfavorableCount: 0,
          neutralCount: 0,
          archetypeBreakdown: {},
          verdictLeanSummary: {
            strongPlaintiff: 0,
            leanPlaintiff: 0,
            neutral: 0,
            leanDefense: 0,
            strongDefense: 0,
          },
        },
        strikeRecommendations: parsed.strikeRecommendations || [],
        keepRecommendations: parsed.keepRecommendations || [],
        deliberationForecast: parsed.deliberationForecast || {
          predictedOutcome: '',
          confidenceLevel: 0,
          keyInfluencers: [],
          potentialLeaders: [],
          riskFactors: [],
        },
        strategicPriorities: parsed.strategicPriorities || [],
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response');
    }
  }
}
