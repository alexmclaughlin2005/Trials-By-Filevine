/**
 * Archetype Classifier Service
 *
 * Classifies jurors into one of 10 behavioral archetypes based on:
 * - Demographics (age, occupation, education, etc.)
 * - Questionnaire responses
 * - Observable behavior patterns
 * - Research artifacts
 *
 * Uses Claude AI to analyze juror data and match to closest archetype
 * with confidence scores and reasoning.
 */

import { ClaudeClient } from '@trialforge/ai-client';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type Archetype =
  | 'bootstrapper'        // Personal Responsibility Enforcer
  | 'crusader'            // Systemic Thinker
  | 'scale_balancer'      // Fair-Minded Evaluator
  | 'captain'             // Authoritative Leader
  | 'chameleon'           // Compliant Follower
  | 'scarred'             // Wounded Veteran
  | 'calculator'          // Numbers Person
  | 'heart'               // Empathic Connector
  | 'trojan_horse'        // Stealth Juror
  | 'maverick';           // Nullifier

export interface DimensionScores {
  attribution_orientation: number;      // 1.0 (dispositional) - 5.0 (situational)
  just_world_belief: number;            // 1.0 (low) - 5.0 (high)
  authoritarianism: number;             // 1.0 (low) - 5.0 (high)
  institutional_trust: {
    corporations: number;
    medical: number;
    legal_system: number;
    insurance: number;
  };
  litigation_attitude: number;          // 1.0 (anti) - 5.0 (pro)
  leadership_tendency: number;          // 1.0 (follower) - 5.0 (leader)
  cognitive_style: number;              // 1.0 (narrative) - 5.0 (analytical)
  damages_orientation: number;          // 1.0 (conservative) - 5.0 (liberal)
}

export interface JurorData {
  // Demographics
  age?: number;
  occupation?: string;
  employer?: string;
  education?: string;
  income?: number;
  maritalStatus?: string;
  city?: string;
  zipCode?: string;

  // Questionnaire responses
  questionnaireData?: Record<string, any>;

  // Optional enrichment
  voirDireResponses?: Array<{
    question: string;
    response: string;
  }>;

  researchSummary?: string;
  observedBehavior?: string;
}

export interface ArchetypeMatch {
  archetype: Archetype;
  archetypeName: string;
  confidence: number;              // 0.0 - 1.0
  strength: number;                // How strongly they match (0.0 - 1.0)
  reasoning: string;
  keyIndicators: string[];         // What signals led to this match
  concerns: string[];              // Warning signs or caveats
  dimensionScores: DimensionScores;
}

export interface ClassificationResult {
  primary: ArchetypeMatch;
  secondary?: ArchetypeMatch;      // If hybrid archetype detected
  allMatches: ArchetypeMatch[];    // All archetypes ranked by confidence
  recommendations: {
    plaintiffDangerLevel: number;  // 1-5
    defenseDangerLevel: number;    // 1-5
    causeChallenge?: {
      vulnerability: number;       // 0.0 - 1.0
      suggestedQuestions: string[];
    };
    voirDireQuestions: string[];
  };
  classifiedAt: Date;
}

export interface ClassificationInput {
  jurorData: JurorData;
  caseType?: string;               // For case-specific modifiers
  jurisdiction?: string;           // For regional variations
  ourSide?: 'plaintiff' | 'defense';
}

// ============================================
// ARCHETYPE CENTROIDS
// ============================================

const ARCHETYPE_CENTROIDS: Record<Archetype, Partial<DimensionScores>> = {
  bootstrapper: {
    attribution_orientation: 1.5,
    just_world_belief: 4.5,
    authoritarianism: 4.0,
    litigation_attitude: 1.5,
    leadership_tendency: 3.5,
    cognitive_style: 3.0,
    damages_orientation: 1.5,
  },
  crusader: {
    attribution_orientation: 4.5,
    just_world_belief: 2.0,
    authoritarianism: 2.5,
    litigation_attitude: 4.5,
    leadership_tendency: 3.5,
    cognitive_style: 2.5,
    damages_orientation: 4.5,
  },
  scale_balancer: {
    attribution_orientation: 3.0,
    just_world_belief: 3.0,
    authoritarianism: 2.5,
    litigation_attitude: 3.0,
    leadership_tendency: 2.5,
    cognitive_style: 4.0,
    damages_orientation: 3.0,
  },
  captain: {
    attribution_orientation: 3.0,
    just_world_belief: 3.5,
    authoritarianism: 4.5,
    litigation_attitude: 2.5,
    leadership_tendency: 5.0,
    cognitive_style: 3.5,
    damages_orientation: 2.5,
  },
  chameleon: {
    attribution_orientation: 3.0,
    just_world_belief: 3.0,
    authoritarianism: 4.0,
    litigation_attitude: 3.0,
    leadership_tendency: 1.5,
    cognitive_style: 2.5,
    damages_orientation: 3.0,
  },
  scarred: {
    attribution_orientation: 4.0,
    just_world_belief: 2.0,
    authoritarianism: 3.0,
    litigation_attitude: 4.0,
    leadership_tendency: 2.5,
    cognitive_style: 2.0,
    damages_orientation: 4.0,
  },
  calculator: {
    attribution_orientation: 2.5,
    just_world_belief: 3.5,
    authoritarianism: 3.0,
    litigation_attitude: 2.5,
    leadership_tendency: 3.0,
    cognitive_style: 5.0,
    damages_orientation: 2.5,
  },
  heart: {
    attribution_orientation: 4.5,
    just_world_belief: 2.5,
    authoritarianism: 2.0,
    litigation_attitude: 4.0,
    leadership_tendency: 2.5,
    cognitive_style: 1.5,
    damages_orientation: 4.5,
  },
  trojan_horse: {
    attribution_orientation: 2.0,
    just_world_belief: 4.0,
    authoritarianism: 3.5,
    litigation_attitude: 2.0,
    leadership_tendency: 3.0,
    cognitive_style: 3.5,
    damages_orientation: 2.0,
  },
  maverick: {
    attribution_orientation: 4.0,
    just_world_belief: 2.0,
    authoritarianism: 1.5,
    litigation_attitude: 2.0,
    leadership_tendency: 3.5,
    cognitive_style: 3.0,
    damages_orientation: 3.5,
  },
};

const ARCHETYPE_NAMES: Record<Archetype, string> = {
  bootstrapper: 'The Bootstrapper (Personal Responsibility Enforcer)',
  crusader: 'The Crusader (Systemic Thinker)',
  scale_balancer: 'The Scale-Balancer (Fair-Minded Evaluator)',
  captain: 'The Captain (Authoritative Leader)',
  chameleon: 'The Chameleon (Compliant Follower)',
  scarred: 'The Scarred (Wounded Veteran)',
  calculator: 'The Calculator (Numbers Person)',
  heart: 'The Heart (Empathic Connector)',
  trojan_horse: 'The Trojan Horse (Stealth Juror)',
  maverick: 'The Maverick (Nullifier)',
};

// ============================================
// SERVICE CLASS
// ============================================

export class ArchetypeClassifierService {
  private claudeClient: ClaudeClient;

  constructor(apiKey: string) {
    this.claudeClient = new ClaudeClient({ apiKey });
  }

  /**
   * Classify a juror into archetype(s) based on available data
   */
  async classifyJuror(input: ClassificationInput): Promise<ClassificationResult> {
    const prompt = this.buildClassificationPrompt(input);

    const response = await this.claudeClient.complete({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      maxTokens: 4000,
      temperature: 0.3, // Lower temperature for more consistent classification
    });

    return this.parseClassificationResponse(response.content);
  }

  /**
   * Build a detailed prompt for archetype classification
   */
  private buildClassificationPrompt(input: ClassificationInput): string {
    const { jurorData, caseType, jurisdiction, ourSide } = input;

    return `You are an expert jury consultant specializing in juror behavioral psychology. Your task is to classify a juror into one of 10 validated behavioral archetypes based on the available data.

## THE 10 ARCHETYPES

1. **Bootstrapper** (Personal Responsibility Enforcer)
   - Believes individuals control their fate
   - Skeptical of victimhood narratives
   - High just-world belief, dispositional attribution
   - Pro-defendant, especially in personal injury
   - Danger to plaintiffs: 5/5, Defense: 1/5

2. **Crusader** (Systemic Thinker)
   - Sees structural injustice in systems
   - Empathetic to David vs Goliath narratives
   - Situational attribution, low just-world belief
   - Pro-plaintiff, especially against corporations
   - Danger to plaintiffs: 1/5, Defense: 5/5

3. **Scale-Balancer** (Fair-Minded Evaluator)
   - Genuinely open to evidence
   - Balanced attribution style
   - Values procedural fairness
   - True swing voter
   - Danger to plaintiffs: 2-3/5, Defense: 2-3/5

4. **Captain** (Authoritative Leader)
   - Natural leadership tendency
   - Confident, directive, decisive
   - Will dominate deliberations (28% of speaking time)
   - Danger depends on underlying lean
   - High foreperson probability (45%)

5. **Chameleon** (Compliant Follower)
   - Adopts majority position
   - Low leadership tendency
   - Highly susceptible to social pressure
   - Outcome depends on room dynamics
   - Minimal speaking share (3%)

6. **Scarred** (Wounded Veteran)
   - Personal negative experience (lawsuit, medical, accident)
   - Processes through analogical reasoning
   - Can flip either direction based on experience similarity
   - High emotional weight on evidence

7. **Calculator** (Numbers Person)
   - Analytical cognitive style
   - Values data and expert testimony
   - Skeptical of emotional appeals
   - Conservative on non-economic damages
   - Evidence-driven deliberation style

8. **Heart** (Empathic Connector)
   - Narrative cognitive style
   - Weights emotional evidence highly
   - Plaintiff-friendly in injury cases
   - Liberal on pain/suffering damages
   - Influenced by "day in the life" evidence

9. **Trojan Horse** (Stealth Juror)
   - Hides true biases in voir dire
   - Presents as balanced but has agenda
   - Often defense-leaning hiding as neutral
   - Difficult to detect without careful probing

10. **Maverick** (Nullifier)
    - Independent thinker, resists authority
    - May vote conscience over law
    - Hung jury risk factor
    - Unpredictable, cause challenge risk
    - Very low persuadability (0.9 threshold)

## PSYCHOLOGICAL DIMENSIONS (scored 1.0 - 5.0)

1. **Attribution Orientation**: Do they blame circumstances (5.0) or personal choices (1.0)?
2. **Just World Belief**: Do they believe people get what they deserve (5.0)?
3. **Authoritarianism**: Do they value order, hierarchy, rules (5.0)?
4. **Institutional Trust**: Trust in corporations, medical, legal, insurance systems
5. **Litigation Attitude**: Pro-lawsuit (5.0) or anti-lawsuit (1.0)?
6. **Leadership Tendency**: Follower (1.0) or leader (5.0)?
7. **Cognitive Style**: Narrative/emotional (1.0) or analytical/data (5.0)?
8. **Damages Orientation**: Conservative (1.0) or liberal (5.0)?

## JUROR DATA

${this.formatJurorData(jurorData)}

${caseType ? `Case Type: ${caseType}` : ''}
${jurisdiction ? `Jurisdiction: ${jurisdiction}` : ''}
${ourSide ? `Our Side: ${ourSide}` : ''}

## YOUR TASK

Analyze the juror data and provide a JSON response with the following structure:

\`\`\`json
{
  "primary": {
    "archetype": "bootstrapper",
    "archetypeName": "The Bootstrapper (Personal Responsibility Enforcer)",
    "confidence": 0.85,
    "strength": 0.90,
    "reasoning": "Strong indicators of personal responsibility orientation based on...",
    "keyIndicators": [
      "Occupation suggests self-made success",
      "Questionnaire responses emphasize personal accountability",
      "Age/demographic profile matches typical Bootstrapper"
    ],
    "concerns": [
      "Might be even more extreme than typical Bootstrapper",
      "Could have difficulty awarding any damages"
    ],
    "dimensionScores": {
      "attribution_orientation": 1.5,
      "just_world_belief": 4.5,
      "authoritarianism": 4.0,
      "institutional_trust": {
        "corporations": 4.5,
        "medical": 4.0,
        "legal_system": 3.5,
        "insurance": 3.5
      },
      "litigation_attitude": 1.5,
      "leadership_tendency": 4.0,
      "cognitive_style": 3.5,
      "damages_orientation": 1.5
    }
  },
  "secondary": null,
  "allMatches": [
    { "archetype": "bootstrapper", "confidence": 0.85 },
    { "archetype": "calculator", "confidence": 0.45 },
    { "archetype": "captain", "confidence": 0.30 }
  ],
  "recommendations": {
    "plaintiffDangerLevel": 5,
    "defenseDangerLevel": 1,
    "causeChallenge": {
      "vulnerability": 0.70,
      "suggestedQuestions": [
        "Is there any amount of damages you feel you just couldn't award?",
        "Would it be fair to say that someone bringing this lawsuit starts with a strike against them?"
      ]
    },
    "voirDireQuestions": [
      "Have you or anyone close to you ever considered filing a lawsuit but decided not to? Why?",
      "What's your reaction when you hear about large jury verdicts in the news?"
    ]
  }
}
\`\`\`

IMPORTANT:
- Base dimension scores on evidence from the juror data
- Confidence should reflect data quality (more data = higher confidence)
- Identify secondary archetype only if truly hybrid (within 0.15 distance)
- Provide specific, actionable voir dire questions
- Consider case type and jurisdiction in danger levels
- Be explicit about uncertainty in reasoning`;
  }

  /**
   * Format juror data for the prompt
   */
  private formatJurorData(data: JurorData): string {
    const parts: string[] = [];

    if (data.age) parts.push(`Age: ${data.age}`);
    if (data.occupation) parts.push(`Occupation: ${data.occupation}`);
    if (data.employer) parts.push(`Employer: ${data.employer}`);
    if (data.education) parts.push(`Education: ${data.education}`);
    if (data.income) parts.push(`Income: ~$${data.income.toLocaleString()}`);
    if (data.maritalStatus) parts.push(`Marital Status: ${data.maritalStatus}`);
    if (data.city) parts.push(`Location: ${data.city}`);

    if (data.questionnaireData && Object.keys(data.questionnaireData).length > 0) {
      parts.push('\nQuestionnaire Responses:');
      parts.push(JSON.stringify(data.questionnaireData, null, 2));
    }

    if (data.voirDireResponses && data.voirDireResponses.length > 0) {
      parts.push('\nVoir Dire Q&A:');
      data.voirDireResponses.forEach((qa) => {
        parts.push(`Q: ${qa.question}`);
        parts.push(`A: ${qa.response}`);
      });
    }

    if (data.researchSummary) {
      parts.push('\nResearch Summary:');
      parts.push(data.researchSummary);
    }

    if (data.observedBehavior) {
      parts.push('\nObserved Behavior:');
      parts.push(data.observedBehavior);
    }

    return parts.join('\n');
  }

  /**
   * Parse the AI response into a structured result
   */
  private parseClassificationResponse(content: string): ClassificationResult {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;

    try {
      const parsed = JSON.parse(jsonString);

      return {
        ...parsed,
        classifiedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to parse classification response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get mock classification for development without API key
   */
  getMockClassification(input: ClassificationInput): ClassificationResult {
    const { jurorData, ourSide } = input;

    // Simple heuristic classification based on occupation
    let primaryArchetype: Archetype = 'scale_balancer'; // Default

    const occupation = jurorData.occupation?.toLowerCase() || '';

    if (occupation.includes('engineer') || occupation.includes('accountant')) {
      primaryArchetype = 'calculator';
    } else if (occupation.includes('teacher') || occupation.includes('social') || occupation.includes('nurse')) {
      primaryArchetype = 'heart';
    } else if (occupation.includes('manager') || occupation.includes('executive') || occupation.includes('director')) {
      primaryArchetype = 'captain';
    } else if (occupation.includes('business owner') || occupation.includes('entrepreneur')) {
      primaryArchetype = 'bootstrapper';
    }

    const centroid = ARCHETYPE_CENTROIDS[primaryArchetype];

    return {
      primary: {
        archetype: primaryArchetype,
        archetypeName: ARCHETYPE_NAMES[primaryArchetype],
        confidence: 0.75,
        strength: 0.80,
        reasoning: `Mock classification based on occupation: ${jurorData.occupation}. This is simulated data for development.`,
        keyIndicators: [
          `Occupation: ${jurorData.occupation}`,
          'Mock analysis - configure ANTHROPIC_API_KEY for real classification',
        ],
        concerns: [
          'This is mock data for development only',
        ],
        dimensionScores: {
          attribution_orientation: centroid.attribution_orientation || 3.0,
          just_world_belief: centroid.just_world_belief || 3.0,
          authoritarianism: centroid.authoritarianism || 3.0,
          institutional_trust: {
            corporations: 3.0,
            medical: 3.0,
            legal_system: 3.0,
            insurance: 3.0,
          },
          litigation_attitude: centroid.litigation_attitude || 3.0,
          leadership_tendency: centroid.leadership_tendency || 3.0,
          cognitive_style: centroid.cognitive_style || 3.0,
          damages_orientation: centroid.damages_orientation || 3.0,
        },
      },
      allMatches: [
        { archetype: primaryArchetype, confidence: 0.75 } as any,
      ],
      recommendations: {
        plaintiffDangerLevel: ourSide === 'plaintiff' ? 3 : 2,
        defenseDangerLevel: ourSide === 'defense' ? 3 : 2,
        voirDireQuestions: [
          'This is mock data. Configure ANTHROPIC_API_KEY for real recommendations.',
        ],
      },
      classifiedAt: new Date(),
    };
  }
}
