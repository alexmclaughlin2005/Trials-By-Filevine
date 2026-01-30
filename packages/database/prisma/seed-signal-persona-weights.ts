/**
 * Signal-Persona Weight Mapping Seed Script
 * 
 * Creates weight mappings between signals and personas based on:
 * - Persona demographics (occupation, education, age, etc.)
 * - Persona dimensions (authoritarianism, corporate trust, etc.)
 * - Characteristic phrases and life experiences
 * 
 * Phase 2: Matching Algorithms
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

interface WeightMapping {
  signalId: string;
  personaId: string;
  direction: 'POSITIVE' | 'NEGATIVE';
  weight: number; // 0.0 - 1.0
}

/**
 * Map signals to personas based on demographics and dimensions
 */
async function createSignalPersonaWeights(): Promise<void> {
  console.log('Creating signal-persona weight mappings...');

  // Get all signals
  const signals = await prisma.signal.findMany();
  const signalMap = new Map(signals.map((s) => [s.signalId, s]));

  // Get all active personas
  const personas = await prisma.persona.findMany({
    where: { isActive: true },
  });

  console.log(`Found ${signals.length} signals and ${personas.length} personas`);

  const weights: WeightMapping[] = [];

  for (const persona of personas) {
    const personaWeights = await analyzePersonaForSignals(persona, signalMap);
    weights.push(...personaWeights);
  }

  console.log(`\nGenerated ${weights.length} weight mappings`);

  // Create weight records
  let created = 0;
  let updated = 0;

  for (const weight of weights) {
    const signal = signalMap.get(weight.signalId);
    if (!signal) {
      console.warn(`Signal ${weight.signalId} not found, skipping`);
      continue;
    }

    try {
      await prisma.signalPersonaWeight.upsert({
        where: {
          signalId_personaId_direction: {
            signalId: signal.id,
            personaId: weight.personaId,
            direction: weight.direction,
          },
        },
        create: {
          signalId: signal.id,
          personaId: weight.personaId,
          direction: weight.direction,
          weight: weight.weight,
        },
        update: {
          weight: weight.weight,
        },
      });
      created++;
    } catch (error) {
      console.error(
        `Error creating weight for signal ${weight.signalId}, persona ${weight.personaId}:`,
        error
      );
    }
  }

  console.log(`\n✅ Created/updated ${created} weight mappings`);
}

/**
 * Analyze a persona and determine which signals match (positive or negative)
 */
async function analyzePersonaForSignals(
  persona: any,
  signalMap: Map<string, any>
): Promise<WeightMapping[]> {
  const weights: WeightMapping[] = [];
  const demographics = (persona.demographics || {}) as Record<string, any>;
  const dimensions = (persona.dimensions || {}) as Record<string, any>;
  const characteristicPhrases =
    (persona.characteristicPhrases || []) as string[];
  const lifeExperiences = (persona.lifeExperiences || []) as string[];

  // ============================================
  // DEMOGRAPHIC SIGNAL MAPPINGS
  // ============================================

  // Occupation signals
  if (demographics.occupation) {
    const occupation = String(demographics.occupation).toLowerCase();

    if (occupation.match(/nurse|doctor|physician|surgeon|therapist|pharmacist|dentist|veterinarian|medical|healthcare/)) {
      weights.push({
        signalId: 'OCCUPATION_HEALTHCARE',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.8,
      });
    }

    if (occupation.match(/engineer|programmer|developer|software|IT|tech|technology|computer|data scientist|analyst/)) {
      weights.push({
        signalId: 'OCCUPATION_TECH',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.8,
      });
    }

    if (occupation.match(/teacher|professor|educator|principal|administrator|school/)) {
      weights.push({
        signalId: 'OCCUPATION_EDUCATION',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.8,
      });
    }

    if (occupation.match(/lawyer|attorney|judge|paralegal|legal|law/)) {
      weights.push({
        signalId: 'OCCUPATION_LEGAL',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.8,
      });
    }

    if (occupation.match(/manager|executive|CEO|CFO|business|corporate|entrepreneur|owner/)) {
      weights.push({
        signalId: 'OCCUPATION_BUSINESS',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.8,
      });
    }

    if (occupation.match(/police|officer|firefighter|paramedic|EMT|sheriff|deputy/)) {
      weights.push({
        signalId: 'OCCUPATION_FIRST_RESPONDER',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.8,
      });
    }
  }

  // Education signals
  if (demographics.education || demographics.education_level) {
    const education = String(
      demographics.education || demographics.education_level || ''
    ).toLowerCase();

    if (education.match(/bachelor|bachelor's|BA|BS|undergraduate/)) {
      weights.push({
        signalId: 'EDUCATION_BACHELORS',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.7,
      });
    }

    if (education.match(/master|MBA|MS|MA|PhD|doctorate|JD|MD|graduate/)) {
      weights.push({
        signalId: 'EDUCATION_ADVANCED',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.8,
      });
    }
  }

  // Age signals
  if (demographics.age) {
    const age = Number(demographics.age);
    if (age >= 18 && age <= 30) {
      weights.push({
        signalId: 'AGE_RANGE_18_30',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.7,
      });
    } else if (age >= 31 && age <= 50) {
      weights.push({
        signalId: 'AGE_RANGE_31_50',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.7,
      });
    } else if (age >= 51) {
      weights.push({
        signalId: 'AGE_RANGE_51_PLUS',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.7,
      });
    }
  }

  // Marital status
  if (demographics.marital_status) {
    const maritalStatus = String(demographics.marital_status).toLowerCase();
    if (maritalStatus.match(/married|marriage/)) {
      weights.push({
        signalId: 'MARITAL_STATUS_MARRIED',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.6,
      });
    } else if (maritalStatus.match(/single|never married/)) {
      weights.push({
        signalId: 'MARITAL_STATUS_SINGLE',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.6,
      });
    }
  }

  // Children (infer from demographics or life experiences)
  const hasChildren =
    demographics.children !== undefined
      ? Boolean(demographics.children)
      : lifeExperiences.some((exp) =>
          exp.toLowerCase().match(/child|son|daughter|parent|family/)
        );

  if (hasChildren) {
    weights.push({
      signalId: 'HAS_CHILDREN',
      personaId: persona.id,
      direction: 'POSITIVE',
      weight: 0.6,
    });
  }

  // ============================================
  // BEHAVIORAL SIGNAL MAPPINGS
  // ============================================

  // Prior jury service (from legal_experience or life_experiences)
  const legalExperience = (persona.attributes as any)?.legal_experience;
  const hasPriorJuryService =
    legalExperience?.notes?.some((note: string) =>
      note.toLowerCase().match(/jury|served|prior/)
    ) ||
    lifeExperiences.some((exp) =>
      exp.toLowerCase().match(/jury|served|prior/)
    );

  if (hasPriorJuryService) {
    weights.push({
      signalId: 'PRIOR_JURY_SERVICE',
      personaId: persona.id,
      direction: 'POSITIVE',
      weight: 0.7,
    });
  }

  // Litigation experience
  const hasLitigationExperience =
    legalExperience?.notes?.some((note: string) =>
      note.toLowerCase().match(/lawsuit|sued|litigation|party|witness/)
    ) ||
    lifeExperiences.some((exp) =>
      exp.toLowerCase().match(/lawsuit|sued|litigation/)
    );

  if (hasLitigationExperience) {
    weights.push({
      signalId: 'LITIGATION_EXPERIENCE_PARTY',
      personaId: persona.id,
      direction: 'POSITIVE',
      weight: 0.6,
    });
  }

  // ============================================
  // ATTITUDINAL SIGNAL MAPPINGS (from dimensions)
  // ============================================

  // Authority deference (from authoritarianism dimension)
  if (dimensions.authoritarianism !== undefined) {
    const authScore = Number(dimensions.authoritarianism);
    if (authScore >= 4.0) {
      weights.push({
        signalId: 'AUTHORITY_DEFERENCE_HIGH',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.9,
      });
      weights.push({
        signalId: 'AUTHORITY_DEFERENCE_LOW',
        personaId: persona.id,
        direction: 'NEGATIVE',
        weight: 0.8,
      });
    } else if (authScore <= 2.0) {
      weights.push({
        signalId: 'AUTHORITY_DEFERENCE_LOW',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.9,
      });
      weights.push({
        signalId: 'AUTHORITY_DEFERENCE_HIGH',
        personaId: persona.id,
        direction: 'NEGATIVE',
        weight: 0.8,
      });
    }
  }

  // Corporate trust (from institutional_trust_corporations)
  if (dimensions.institutional_trust_corporations !== undefined) {
    const corpTrust = Number(dimensions.institutional_trust_corporations);
    if (corpTrust >= 4.0) {
      weights.push({
        signalId: 'CORPORATE_TRUST_HIGH',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.8,
      });
      weights.push({
        signalId: 'CORPORATE_TRUST_LOW',
        personaId: persona.id,
        direction: 'NEGATIVE',
        weight: 0.7,
      });
    } else if (corpTrust <= 2.0) {
      weights.push({
        signalId: 'CORPORATE_TRUST_LOW',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.8,
      });
      weights.push({
        signalId: 'CORPORATE_TRUST_HIGH',
        personaId: persona.id,
        direction: 'NEGATIVE',
        weight: 0.7,
      });
    }
  }

  // Evidence orientation (from cognitive_style)
  if (dimensions.cognitive_style !== undefined) {
    const cognitiveStyle = Number(dimensions.cognitive_style);
    if (cognitiveStyle >= 4.0) {
      // High cognitive style = analytical = evidence-oriented
      weights.push({
        signalId: 'EVIDENCE_ORIENTATION_HIGH',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.8,
      });
    }
  }

  // Emotional responsiveness (from damages_orientation and attribution_orientation)
  if (
    dimensions.damages_orientation !== undefined ||
    dimensions.attribution_orientation !== undefined
  ) {
    const damagesOrientation = Number(
      dimensions.damages_orientation || 3.0
    );
    const attributionOrientation = Number(
      dimensions.attribution_orientation || 3.0
    );

    // High damages orientation + low attribution = more empathetic
    if (damagesOrientation >= 4.0 && attributionOrientation <= 2.0) {
      weights.push({
        signalId: 'EMOTIONAL_RESPONSIVENESS_HIGH',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.7,
      });
    }
  }

  // Risk tolerance (infer from dimensions and phrases)
  const riskTolerancePhrases = characteristicPhrases.some((phrase) =>
    phrase.toLowerCase().match(/risk|chance|bold|conservative|safe|careful/)
  );

  if (riskTolerancePhrases) {
    // Could be refined based on actual phrase content
    // For now, we'll skip as it requires more nuanced analysis
  }

  // ============================================
  // LINGUISTIC SIGNAL MAPPINGS (from characteristic phrases)
  // ============================================

  const allPhrases = characteristicPhrases.join(' ').toLowerCase();

  // Certainty markers
  if (
    allPhrases.match(
      /definitely|absolutely|certainly|always|never|clearly|obviously|without.*doubt|I.*know|I.*believe|I.*am.*sure|no.*question/
    )
  ) {
    weights.push({
      signalId: 'CERTAINTY_MARKERS',
      personaId: persona.id,
      direction: 'POSITIVE',
      weight: 0.7,
    });
  }

  // Hedging language
  if (
    allPhrases.match(
      /maybe|perhaps|might|could|possibly|sort.*of|kind.*of|I.*think|I.*guess|not.*sure|uncertain/
    )
  ) {
    weights.push({
      signalId: 'HEDGING_LANGUAGE',
      personaId: persona.id,
      direction: 'POSITIVE',
      weight: 0.6,
    });
  }

  // Questioning language
  if (
    allPhrases.match(
      /why|how|what.*if|I.*wonder|I.*question|seems.*like|but.*what.*about|could.*you.*explain|I.*don.*understand|need.*clarification/
    )
  ) {
    weights.push({
      signalId: 'QUESTIONING_LANGUAGE',
      personaId: persona.id,
      direction: 'POSITIVE',
      weight: 0.7,
    });
  }

  // ============================================
  // SOCIAL SIGNAL MAPPINGS (from demographics)
  // ============================================

  // Political affiliation
  if (demographics.political_affiliation) {
    const polAff = String(demographics.political_affiliation).toLowerCase();
    if (polAff.match(/democrat|democratic|liberal|progressive|D|blue/)) {
      weights.push({
        signalId: 'POLITICAL_AFFILIATION_DEMOCRAT',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.8,
      });
    } else if (polAff.match(/republican|conservative|GOP|R|red/)) {
      weights.push({
        signalId: 'POLITICAL_AFFILIATION_REPUBLICAN',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.8,
      });
    } else if (polAff.match(/independent|unaffiliated|no.*party|NPA|NP/)) {
      weights.push({
        signalId: 'POLITICAL_AFFILIATION_INDEPENDENT',
        personaId: persona.id,
        direction: 'POSITIVE',
        weight: 0.8,
      });
    }
  }

  return weights;
}

/**
 * Main execution
 */
async function main() {
  try {
    await createSignalPersonaWeights();
    console.log('\n✅ Signal-persona weight mapping complete!');
  } catch (error) {
    console.error('Error creating signal-persona weights:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { createSignalPersonaWeights };
