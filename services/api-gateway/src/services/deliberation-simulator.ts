/**
 * Deliberation Simulator
 *
 * Advanced deliberation simulation using archetype influence matrices,
 * evidence processing weights, and behavioral psychology to predict
 * jury deliberation outcomes.
 *
 * Based on the juror archetype system with 10 behavioral archetypes.
 */

import { ClaudeClient } from '@trialforge/ai-client';
import type { Archetype } from './archetype-classifier';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface JurorInDeliberation {
  seatNumber: number;
  archetype: Archetype;
  archetypeName: string;
  archetypeStrength: number;
  dimensionScores?: any;
}

export interface EvidenceStrength {
  liability: number;                    // 0.0 - 1.0
  economicDamages?: number;             // Dollar amount
  nonEconomicDamages?: number;          // Dollar amount
  punitiveBasis?: number;               // 0.0 - 1.0
}

export interface DeliberationInput {
  jurors: JurorInDeliberation[];
  caseType: string;
  evidenceStrength: EvidenceStrength;
  caseContext: {
    caseName: string;
    plaintiffName: string;
    defendantName: string;
    keyFacts: string[];
  };
  influenceMatrix?: Record<Archetype, Record<Archetype, number>>;
  region?: string;
}

export interface VerdictProbabilities {
  plaintiff: number;
  defense: number;
  hung: number;
}

export interface ExpectedDamages {
  economic: number;
  nonEconomic: number;
  punitive: number;
  total: number;
}

export interface DeliberationPhase {
  phase: string;
  duration: string;
  events: string[];
}

export interface FactionDynamic {
  faction: 'plaintiff' | 'defense' | 'undecided';
  members: string[];                    // Archetype names
  leaderArchetype: string;
  strength: number;                     // 0.0 - 1.0
}

export interface DeliberationResult {
  predictedVerdict: 'plaintiff' | 'defense' | 'hung';
  verdictProbabilities: VerdictProbabilities;
  expectedDamagesIfPlaintiff: ExpectedDamages;

  keyJurors: {
    mostInfluential: string;            // Archetype or seat number
    likelyForeperson: string;
    swingVotes: string[];
    potentialHoldouts: string[];
  };

  deliberationSummary: {
    estimatedRoundsToVerdict: number;
    phases: DeliberationPhase[];
    factionDynamics: FactionDynamic[];
    criticalMoments: string[];
  };

  strategicRecommendations: {
    forPlaintiff: string[];
    forDefense: string[];
    strikePriorities: Array<{
      archetype: string;
      reason: string;
      priority: number;
    }>;
  };

  riskFactors: {
    hungJuryRisk: number;               // 0.0 - 1.0
    runawayVerdictRisk: number;
    riskExplanation: string[];
  };
}

// ============================================
// CONFIGURATION DATA
// ============================================

// Default influence matrix (how much archetype A influences archetype B)
const DEFAULT_INFLUENCE_MATRIX: Record<Archetype, Partial<Record<Archetype, number>>> = {
  bootstrapper: {
    bootstrapper: 0.4,
    crusader: 0.1,
    scale_balancer: 0.4,
    captain: 0.2,
    chameleon: 0.8,
    scarred: 0.3,
    calculator: 0.5,
    heart: 0.2,
    trojan_horse: 0.3,
    maverick: 0.1,
  },
  crusader: {
    bootstrapper: 0.1,
    crusader: 0.5,
    scale_balancer: 0.4,
    captain: 0.2,
    chameleon: 0.8,
    scarred: 0.5,
    calculator: 0.3,
    heart: 0.6,
    trojan_horse: 0.3,
    maverick: 0.2,
  },
  scale_balancer: {
    bootstrapper: 0.3,
    crusader: 0.3,
    scale_balancer: 0.5,
    captain: 0.3,
    chameleon: 0.6,
    scarred: 0.4,
    calculator: 0.6,
    heart: 0.4,
    trojan_horse: 0.4,
    maverick: 0.2,
  },
  captain: {
    bootstrapper: 0.6,
    crusader: 0.4,
    scale_balancer: 0.5,
    captain: 0.2,
    chameleon: 0.95,
    scarred: 0.5,
    calculator: 0.5,
    heart: 0.5,
    trojan_horse: 0.4,
    maverick: 0.1,
  },
  chameleon: {
    bootstrapper: 0.1,
    crusader: 0.1,
    scale_balancer: 0.2,
    captain: 0.1,
    chameleon: 0.3,
    scarred: 0.1,
    calculator: 0.1,
    heart: 0.2,
    trojan_horse: 0.1,
    maverick: 0.05,
  },
  scarred: {
    bootstrapper: 0.2,
    crusader: 0.4,
    scale_balancer: 0.5,
    captain: 0.3,
    chameleon: 0.7,
    scarred: 0.6,
    calculator: 0.3,
    heart: 0.7,
    trojan_horse: 0.3,
    maverick: 0.2,
  },
  calculator: {
    bootstrapper: 0.4,
    crusader: 0.2,
    scale_balancer: 0.6,
    captain: 0.3,
    chameleon: 0.5,
    scarred: 0.3,
    calculator: 0.5,
    heart: 0.2,
    trojan_horse: 0.3,
    maverick: 0.1,
  },
  heart: {
    bootstrapper: 0.2,
    crusader: 0.5,
    scale_balancer: 0.5,
    captain: 0.3,
    chameleon: 0.7,
    scarred: 0.6,
    calculator: 0.2,
    heart: 0.6,
    trojan_horse: 0.3,
    maverick: 0.2,
  },
  trojan_horse: {
    bootstrapper: 0.3,
    crusader: 0.4,
    scale_balancer: 0.4,
    captain: 0.2,
    chameleon: 0.7,
    scarred: 0.4,
    calculator: 0.3,
    heart: 0.5,
    trojan_horse: 0.3,
    maverick: 0.1,
  },
  maverick: {
    bootstrapper: 0.1,
    crusader: 0.2,
    scale_balancer: 0.2,
    captain: 0.1,
    chameleon: 0.4,
    scarred: 0.2,
    calculator: 0.1,
    heart: 0.3,
    trojan_horse: 0.1,
    maverick: 0.2,
  },
};

// Speaking time distribution by archetype
const SPEAKING_SHARE: Record<Archetype, number> = {
  captain: 0.28,
  bootstrapper: 0.12,
  crusader: 0.14,
  scale_balancer: 0.10,
  calculator: 0.12,
  heart: 0.10,
  scarred: 0.08,
  maverick: 0.08,
  trojan_horse: 0.10,
  chameleon: 0.03,
};

// Foreperson probability by archetype
const FOREPERSON_PROBABILITY: Record<Archetype, number> = {
  captain: 0.45,
  bootstrapper: 0.20,
  crusader: 0.20,
  calculator: 0.15,
  scale_balancer: 0.15,
  heart: 0.10,
  scarred: 0.08,
  trojan_horse: 0.10,
  maverick: 0.05,
  chameleon: 0.02,
};

// ============================================
// SERVICE CLASS
// ============================================

export class DeliberationSimulatorService {
  private claudeClient: ClaudeClient;

  constructor(apiKey: string) {
    this.claudeClient = new ClaudeClient({ apiKey });
  }

  /**
   * Simulate jury deliberation with archetype-based behavior modeling
   */
  async simulateDeliberation(input: DeliberationInput): Promise<DeliberationResult> {
    const prompt = this.buildDeliberationPrompt(input);

    const response = await this.claudeClient.complete({
      prompt,
      maxTokens: 10000, // Large token budget for detailed deliberation
      temperature: 0.5,
    });

    return this.parseDeliberationResponse(response.content, input);
  }

  /**
   * Build detailed deliberation prompt with archetype dynamics
   */
  private buildDeliberationPrompt(input: DeliberationInput): string {
    const { jurors, caseType, evidenceStrength, caseContext, influenceMatrix } = input;

    const jurorsText = jurors
      .map(
        (j, idx) => `
**Juror ${idx + 1} (Seat ${j.seatNumber})**: ${j.archetypeName}
- Archetype: ${j.archetype}
- Strength: ${(j.archetypeStrength * 100).toFixed(0)}%
- Speaking Share: ${(SPEAKING_SHARE[j.archetype] * 100).toFixed(0)}%
- Foreperson Probability: ${(FOREPERSON_PROBABILITY[j.archetype] * 100).toFixed(0)}%
`
      )
      .join('\n');

    const influenceMatrixText = this.formatInfluenceMatrix(jurors, influenceMatrix);

    return `You are simulating a jury deliberation using behavioral psychology and archetype dynamics.

# CASE INFORMATION

**Case**: ${caseContext.caseName}
**Type**: ${caseType}
**Plaintiff**: ${caseContext.plaintiffName}
**Defendant**: ${caseContext.defendantName}

## Key Facts:
${caseContext.keyFacts.map((f) => `- ${f}`).join('\n')}

## Evidence Strength (0.0 - 1.0):
- Liability: ${evidenceStrength.liability.toFixed(2)}
${evidenceStrength.economicDamages ? `- Economic Damages: $${evidenceStrength.economicDamages.toLocaleString()}` : ''}
${evidenceStrength.nonEconomicDamages ? `- Non-Economic Damages: $${evidenceStrength.nonEconomicDamages.toLocaleString()}` : ''}
${evidenceStrength.punitiveBasis ? `- Punitive Basis: ${evidenceStrength.punitiveBasis.toFixed(2)}` : ''}

# JURY COMPOSITION

${jurorsText}

# ARCHETYPE INFLUENCE MATRIX

${influenceMatrixText}

# DELIBERATION DYNAMICS RULES

1. **First Ballot Rule**: First ballot majority wins 90% of the time
2. **Leadership Impact**: Captains account for 28% of speaking time and dominate discussions
3. **Chameleon Effect**: Chameleons adopt the majority position quickly
4. **Maverick Risk**: Mavericks create hung jury risk (15% increase if present)
5. **Captain Conflict**: Two opposing Captains = 35% hung jury risk
6. **Evidence-Driven vs. Verdict-Driven**: Style affects polarization and hung jury risk

# YOUR TASK

Simulate a realistic jury deliberation and predict the outcome. Consider:
- How each archetype processes the evidence
- Who emerges as foreperson
- Influence patterns between archetypes
- Faction formation (plaintiff vs. defense vs. undecided)
- Deliberation phases and critical moments
- Hung jury risk factors

Provide a detailed JSON response:

\`\`\`json
{
  "predictedVerdict": "plaintiff|defense|hung",
  "verdictProbabilities": {
    "plaintiff": 0.45,
    "defense": 0.40,
    "hung": 0.15
  },
  "expectedDamagesIfPlaintiff": {
    "economic": 500000,
    "nonEconomic": 750000,
    "punitive": 0,
    "total": 1250000
  },
  "keyJurors": {
    "mostInfluential": "Juror 3 (Captain)",
    "likelyForeperson": "Juror 3 (Captain)",
    "swingVotes": ["Juror 5 (Scale-Balancer)", "Juror 8 (Chameleon)"],
    "potentialHoldouts": ["Juror 10 (Maverick)"]
  },
  "deliberationSummary": {
    "estimatedRoundsToVerdict": 3,
    "phases": [
      {
        "phase": "Foreperson Selection",
        "duration": "5 minutes",
        "events": ["Captain speaks first", "Group naturally defers to Captain"]
      },
      {
        "phase": "First Ballot",
        "duration": "10 minutes",
        "events": ["7 for defense, 5 for plaintiff", "Faction lines emerge"]
      }
    ],
    "factionDynamics": [
      {
        "faction": "defense",
        "members": ["Bootstrapper", "Calculator", "Captain"],
        "leaderArchetype": "Captain",
        "strength": 0.75
      }
    ],
    "criticalMoments": [
      "Captain frames deliberation as evidence-driven, favoring defense",
      "Crusader makes emotional appeal, sways Hearts",
      "Chameleons follow majority to defense"
    ]
  },
  "strategicRecommendations": {
    "forPlaintiff": [
      "Must strike the Captain - will dominate and lead to defense verdict",
      "Keep the Crusader and Hearts for emotional appeal",
      "Target Scale-Balancers with strong evidence presentation"
    ],
    "forDefense": [
      "Protect the Captain at all costs",
      "Strike Crusaders and Hearts",
      "Bootstrappers and Calculators are favorable"
    ],
    "strikePriorities": [
      {
        "archetype": "Captain",
        "reason": "Will become foreperson and dominate deliberations toward defense",
        "priority": 10
      },
      {
        "archetype": "Bootstrapper",
        "reason": "Strong defense lean, high influence",
        "priority": 9
      }
    ]
  },
  "riskFactors": {
    "hungJuryRisk": 0.15,
    "runawayVerdictRisk": 0.05,
    "riskExplanation": [
      "Maverick present increases hung jury risk",
      "Strong Captain may prevent runaway verdict",
      "Evidence strength moderate - some uncertainty remains"
    ]
  }
}
\`\`\`

IMPORTANT:
- Base predictions on archetype psychology, not random guessing
- Show how influence flows between specific archetypes
- Explain faction formation and leadership dynamics
- Consider evidence strength in verdict probabilities
- Be realistic about hung jury risk
- Provide actionable strategic recommendations`;
  }

  /**
   * Format influence matrix for prompt
   */
  private formatInfluenceMatrix(
    jurors: JurorInDeliberation[],
    customMatrix?: Record<Archetype, Record<Archetype, number>>
  ): string {
    const matrix = customMatrix || DEFAULT_INFLUENCE_MATRIX;
    const archetypesPresent = [...new Set(jurors.map((j) => j.archetype))];

    const lines = ['How much each archetype influences others (0.0 - 1.0):\n'];

    archetypesPresent.forEach((speaker) => {
      const influences = archetypesPresent
        .map((listener) => {
          const influence = matrix[speaker]?.[listener] || 0.5;
          return `${listener}: ${influence.toFixed(2)}`;
        })
        .join(', ');

      lines.push(`**${speaker}** influences: ${influences}`);
    });

    return lines.join('\n');
  }

  /**
   * Parse deliberation response
   */
  private parseDeliberationResponse(
    content: string,
    input: DeliberationInput
  ): DeliberationResult {
    // Extract JSON from markdown
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;

    try {
      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch (error) {
      console.error('Failed to parse deliberation response:', error);

      // Return fallback result
      return this.createFallbackResult(input);
    }
  }

  /**
   * Create fallback result if AI parsing fails
   */
  private createFallbackResult(input: DeliberationInput): DeliberationResult {
    return {
      predictedVerdict: 'hung',
      verdictProbabilities: {
        plaintiff: 0.33,
        defense: 0.33,
        hung: 0.34,
      },
      expectedDamagesIfPlaintiff: {
        economic: input.evidenceStrength.economicDamages || 0,
        nonEconomic: input.evidenceStrength.nonEconomicDamages || 0,
        punitive: 0,
        total: (input.evidenceStrength.economicDamages || 0) + (input.evidenceStrength.nonEconomicDamages || 0),
      },
      keyJurors: {
        mostInfluential: 'Analysis failed',
        likelyForeperson: 'Analysis failed',
        swingVotes: [],
        potentialHoldouts: [],
      },
      deliberationSummary: {
        estimatedRoundsToVerdict: 0,
        phases: [],
        factionDynamics: [],
        criticalMoments: ['AI analysis failed - manual review required'],
      },
      strategicRecommendations: {
        forPlaintiff: ['AI analysis failed - conduct manual jury consulting'],
        forDefense: ['AI analysis failed - conduct manual jury consulting'],
        strikePriorities: [],
      },
      riskFactors: {
        hungJuryRisk: 0.5,
        runawayVerdictRisk: 0.5,
        riskExplanation: ['Analysis failed - unable to assess risks'],
      },
    };
  }

  /**
   * Get mock deliberation result for development
   */
  getMockResult(input: DeliberationInput): DeliberationResult {
    const { jurors, evidenceStrength } = input;

    // Simple mock: count defense-leaning vs plaintiff-leaning archetypes
    const defenseLean = ['bootstrapper', 'calculator', 'trojan_horse'];
    const plaintiffLean = ['crusader', 'heart', 'scarred'];

    let defenseCount = 0;
    let plaintiffCount = 0;

    jurors.forEach((j) => {
      if (defenseLean.includes(j.archetype)) defenseCount++;
      if (plaintiffLean.includes(j.archetype)) plaintiffCount++;
    });

    const captainPresent = jurors.some((j) => j.archetype === 'captain');
    const maverickPresent = jurors.some((j) => j.archetype === 'maverick');

    let verdict: 'plaintiff' | 'defense' | 'hung' = 'hung';
    if (defenseCount > plaintiffCount + 2) verdict = 'defense';
    else if (plaintiffCount > defenseCount + 2) verdict = 'plaintiff';

    return {
      predictedVerdict: verdict,
      verdictProbabilities: {
        plaintiff: plaintiffCount / jurors.length,
        defense: defenseCount / jurors.length,
        hung: maverickPresent ? 0.15 : 0.05,
      },
      expectedDamagesIfPlaintiff: {
        economic: evidenceStrength.economicDamages || 0,
        nonEconomic: evidenceStrength.nonEconomicDamages || 0,
        punitive: 0,
        total: (evidenceStrength.economicDamages || 0) + (evidenceStrength.nonEconomicDamages || 0),
      },
      keyJurors: {
        mostInfluential: captainPresent ? 'Captain' : 'Bootstrapper',
        likelyForeperson: captainPresent ? 'Captain' : 'Scale-Balancer',
        swingVotes: ['Chameleon', 'Scale-Balancer'],
        potentialHoldouts: maverickPresent ? ['Maverick'] : [],
      },
      deliberationSummary: {
        estimatedRoundsToVerdict: 3,
        phases: [
          {
            phase: 'Mock Deliberation',
            duration: '30 minutes',
            events: ['This is mock data for development'],
          },
        ],
        factionDynamics: [
          {
            faction: 'defense',
            members: ['Bootstrapper', 'Calculator'],
            leaderArchetype: 'Captain',
            strength: 0.7,
          },
        ],
        criticalMoments: ['Mock data - configure ANTHROPIC_API_KEY for real simulation'],
      },
      strategicRecommendations: {
        forPlaintiff: ['Mock recommendations - use real API for actual strategy'],
        forDefense: ['Mock recommendations - use real API for actual strategy'],
        strikePriorities: [
          {
            archetype: 'bootstrapper',
            reason: 'Mock data',
            priority: 8,
          },
        ],
      },
      riskFactors: {
        hungJuryRisk: maverickPresent ? 0.15 : 0.05,
        runawayVerdictRisk: 0.05,
        riskExplanation: ['Mock data - configure ANTHROPIC_API_KEY for real analysis'],
      },
    };
  }
}
