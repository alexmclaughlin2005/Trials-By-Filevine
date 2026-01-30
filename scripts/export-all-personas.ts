/**
 * Export All Personas Script
 * 
 * Exports all personas from the database to a JSON file with all associated data.
 * This includes:
 * - Basic persona information
 * - V2 fields (instantRead, phrasesYoullHear, verdictPrediction, etc.)
 * - Signal weights (positive and negative)
 * - Metadata (version, created/updated dates)
 */

import { PrismaClient } from '@juries/database';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExportedPersona {
  // Basic Information
  id: string;
  organizationId: string | null;
  name: string;
  nickname: string | null;
  description: string;
  tagline: string | null;
  jsonPersonaId: string | null;

  // Archetype Classification
  archetype: string | null;
  archetypeStrength: number | null;
  secondaryArchetype: string | null;
  variant: string | null;

  // Legacy Fields
  sourceType: string;
  attributes: any;
  signals: any;
  persuasionLevers: any;
  pitfalls: any;

  // Archetype System Fields
  demographics: any;
  dimensions: any;
  lifeExperiences: any;
  characteristicPhrases: any;
  voirDireResponses: any;
  deliberationBehavior: any;

  // Roundtable conversation behavior
  leadershipLevel: string | null;
  communicationStyle: string | null;
  persuasionSusceptibility: string | null;
  vocabularyLevel: string | null;
  sentenceStyle: string | null;
  speechPatterns: any;
  responseTendency: string | null;
  engagementStyle: string | null;

  // Simulation Parameters
  simulationParams: any;
  caseTypeModifiers: any;
  regionalModifiers: any;

  // Strategic Guidance
  plaintiffDangerLevel: number | null;
  defenseDangerLevel: number | null;
  causeChallenge: any;
  strategyGuidance: any;

  // V2 Fields - Archetype-level
  archetypeVerdictLean: string | null;
  archetypeWhatTheyBelieve: string | null;
  archetypeDeliberationBehavior: string | null;
  archetypeHowToSpot: any;

  // V2 Fields - Persona-specific
  instantRead: string | null;
  phrasesYoullHear: any;
  verdictPrediction: any;
  strikeOrKeep: any;

  // Signal Weights
  signalWeights: Array<{
    signalId: string;
    signalName: string;
    direction: 'POSITIVE' | 'NEGATIVE';
    weight: number;
  }>;

  // Metadata
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

async function exportAllPersonas(): Promise<void> {
  console.log('📦 Exporting all V2 personas from database...\n');

  try {
    // Fetch all V2 personas with their signal weights
    const personas = await prisma.persona.findMany({
      where: {
        isActive: true, // Only export active personas
        version: 2, // Only V2 personas
      },
      include: {
        signalWeights: {
          include: {
            signal: {
              select: {
                signalId: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { sourceType: 'asc' },
        { archetype: 'asc' },
        { name: 'asc' },
      ],
    });

    console.log(`Found ${personas.length} active V2 personas\n`);

    // Transform to export format
    const exportedPersonas: ExportedPersona[] = personas.map((persona) => {
      // Group signal weights by direction
      const signalWeights = persona.signalWeights.map((sw) => ({
        signalId: sw.signal.signalId,
        signalName: sw.signal.name,
        direction: sw.direction as 'POSITIVE' | 'NEGATIVE',
        weight: Number(sw.weight),
      }));

      return {
        // Basic Information
        id: persona.id,
        organizationId: persona.organizationId,
        name: persona.name,
        nickname: persona.nickname,
        description: persona.description,
        tagline: persona.tagline,
        jsonPersonaId: persona.jsonPersonaId,

        // Archetype Classification
        archetype: persona.archetype,
        archetypeStrength: persona.archetypeStrength ? Number(persona.archetypeStrength) : null,
        secondaryArchetype: persona.secondaryArchetype,
        variant: persona.variant,

        // Legacy Fields (ALL JSON data preserved)
        sourceType: persona.sourceType,
        attributes: persona.attributes, // Legacy attributes JSON
        signals: persona.signals, // Legacy signals JSON
        persuasionLevers: persona.persuasionLevers, // Legacy persuasion levers JSON
        pitfalls: persona.pitfalls, // Legacy pitfalls JSON

        // Archetype System Fields (ALL JSON data preserved)
        demographics: persona.demographics,
        dimensions: persona.dimensions, // 8 psychological dimensions with scores
        lifeExperiences: persona.lifeExperiences, // Key formative experiences array
        characteristicPhrases: persona.characteristicPhrases, // Typical speech patterns array
        voirDireResponses: persona.voirDireResponses, // Predicted Q&A JSON
        deliberationBehavior: persona.deliberationBehavior, // Predicted role and tactics JSON

        // Roundtable conversation behavior (ALL fields preserved)
        leadershipLevel: persona.leadershipLevel, // LEADER | INFLUENCER | FOLLOWER | PASSIVE
        communicationStyle: persona.communicationStyle, // Speaking style description text
        persuasionSusceptibility: persona.persuasionSusceptibility, // What arguments move them text
        vocabularyLevel: persona.vocabularyLevel, // PLAIN | EDUCATED | TECHNICAL | FOLKSY
        sentenceStyle: persona.sentenceStyle, // SHORT_PUNCHY | MEASURED | VERBOSE | FRAGMENTED
        speechPatterns: persona.speechPatterns, // Array of characteristic phrases/verbal tics JSON
        responseTendency: persona.responseTendency, // BRIEF | MODERATE | ELABORATE
        engagementStyle: persona.engagementStyle, // DIRECT_CHALLENGE | BUILDS_ON_OTHERS | ASKS_QUESTIONS | DEFLECTS

        // Simulation Parameters (ALL JSON data preserved)
        simulationParams: persona.simulationParams, // Evidence processing, deliberation weights, verdict priors
        caseTypeModifiers: persona.caseTypeModifiers, // Case-specific behavior predictions
        regionalModifiers: persona.regionalModifiers, // Geographic variations

        // Strategic Guidance (ALL JSON data preserved)
        plaintiffDangerLevel: persona.plaintiffDangerLevel, // 1-5 scale
        defenseDangerLevel: persona.defenseDangerLevel, // 1-5 scale
        causeChallenge: persona.causeChallenge, // Vulnerability and scripts JSON
        strategyGuidance: persona.strategyGuidance, // Recommended questions and approach JSON

        // V2 Fields - Archetype-level (ALL JSON data preserved)
        archetypeVerdictLean: persona.archetypeVerdictLean, // "STRONG DEFENSE" | "STRONG PLAINTIFF" | "NEUTRAL" | etc
        archetypeWhatTheyBelieve: persona.archetypeWhatTheyBelieve, // Core belief system text
        archetypeDeliberationBehavior: persona.archetypeDeliberationBehavior, // How they behave in deliberation text
        archetypeHowToSpot: persona.archetypeHowToSpot, // Array of recognition indicators JSON

        // V2 Fields - Persona-specific (ALL JSON data preserved)
        instantRead: persona.instantRead, // One-sentence summary
        phrasesYoullHear: persona.phrasesYoullHear, // Array of characteristic phrases
        verdictPrediction: persona.verdictPrediction, // {liability_finding_probability, damages_if_liability, role_in_deliberation}
        strikeOrKeep: persona.strikeOrKeep, // {plaintiff_strategy, defense_strategy}

        // Signal Weights
        signalWeights,

        // Metadata
        version: persona.version,
        isActive: persona.isActive,
        createdAt: persona.createdAt.toISOString(),
        updatedAt: persona.updatedAt.toISOString(),
      };
    });

    // Create export object with metadata
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: 2, // Only V2 personas
      totalPersonas: exportedPersonas.length,
      personasBySource: {
        system: exportedPersonas.filter((p) => p.sourceType === 'system').length,
        userCreated: exportedPersonas.filter((p) => p.sourceType === 'user_created').length,
        aiGenerated: exportedPersonas.filter((p) => p.sourceType === 'ai_generated').length,
      },
      personasByArchetype: exportedPersonas.reduce((acc, p) => {
        const arch = p.archetype || 'unknown';
        acc[arch] = (acc[arch] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      personas: exportedPersonas,
    };

    // Write to file
    const outputPath = path.join(process.cwd(), 'personas-v2-export.json');
    await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');

    console.log('✅ Export complete!\n');
    console.log(`📄 Full JSON export: ${outputPath}`);
    console.log(`   Complete data structure with ALL fields preserved as JSON:`);
    console.log(`   - All demographics, dimensions (8 psychological), life experiences`);
    console.log(`   - Characteristic phrases, voir dire responses, deliberation behavior`);
    console.log(`   - Roundtable behavior, simulation parameters, strategic guidance`);
    console.log(`   - V2 fields, legacy fields, signal weights, metadata`);
    console.log(`   - Every field from the database schema\n`);
    console.log('📊 Summary (V2 Personas Only):');
    console.log(`   Total V2 Personas: ${exportData.totalPersonas}`);
    console.log(`   By Source:`);
    console.log(`     - System: ${exportData.personasBySource.system}`);
    console.log(`     - User Created: ${exportData.personasBySource.userCreated}`);
    console.log(`     - AI Generated: ${exportData.personasBySource.aiGenerated}`);
    console.log(`   By Archetype:`);
    for (const [archetype, count] of Object.entries(exportData.personasByArchetype)) {
      console.log(`     - ${archetype}: ${count}`);
    }
    console.log('');

    // Create comprehensive CSV with ALL fields flattened
    const detailedCsvPath = path.join(process.cwd(), 'personas-v2-export-detailed.csv');
    const detailedCsvRows = [
      [
        // Basic Info
        'ID',
        'Name',
        'Nickname',
        'Description',
        'Tagline',
        'JSON Persona ID',
        'Archetype',
        'Archetype Strength',
        'Secondary Archetype',
        'Variant',
        'Version',
        'Source Type',
        'Organization ID',
        'Instant Read',
        // Demographics
        'Age',
        'Gender',
        'Race',
        'Location',
        'Education',
        'Occupation',
        'Income',
        'Family/Marital Status',
        'Religion',
        'Politics',
        // Dimensions (8 psychological dimensions)
        'Dimensions - Attribution Orientation',
        'Dimensions - Just World Belief',
        'Dimensions - Authoritarianism',
        'Dimensions - Institutional Trust Corporations',
        'Dimensions - Institutional Trust Medical',
        'Dimensions - Institutional Trust Legal',
        'Dimensions - Institutional Trust Insurance',
        'Dimensions - Litigation Attitude',
        'Dimensions - Leadership Tendency',
        'Dimensions - Cognitive Style',
        'Dimensions - Damages Orientation',
        // Life Experiences & Phrases
        'Life Experiences',
        'Characteristic Phrases',
        'Phrases You\'ll Hear',
        'Speech Patterns',
        // Voir Dire & Deliberation
        'Voir Dire Responses',
        'Deliberation Behavior',
        'Archetype Deliberation Behavior',
        // Roundtable Behavior
        'Leadership Level',
        'Communication Style',
        'Persuasion Susceptibility',
        'Vocabulary Level',
        'Sentence Style',
        'Response Tendency',
        'Engagement Style',
        // V2 Fields
        'Archetype Verdict Lean',
        'Archetype What They Believe',
        'Archetype How To Spot',
        'Verdict Prediction - Liability Prob',
        'Verdict Prediction - Damages',
        'Verdict Prediction - Role',
        'Strike or Keep - Plaintiff',
        'Strike or Keep - Defense',
        // Strategic Guidance
        'Plaintiff Danger Level',
        'Defense Danger Level',
        'Cause Challenge',
        'Strategy Guidance',
        // Simulation Parameters
        'Simulation Params',
        'Case Type Modifiers',
        'Regional Modifiers',
        // Legacy Fields
        'Attributes',
        'Legacy Signals',
        'Persuasion Levers',
        'Pitfalls',
        // Signal Weights
        'Signal Weights Count',
        'Signal Weights Details',
        // Metadata
        'Is Active',
        'Created',
        'Updated',
      ].join(','),
      ...exportedPersonas.map((p) => {
        // Extract all nested data
        const demographics = (p.demographics as any) || {};
        const dimensions = (p.dimensions as any) || {};
        const verdictPrediction = (p.verdictPrediction as any) || {};
        const strikeOrKeep = (p.strikeOrKeep as any) || {};
        const institutionalTrust = dimensions.institutional_trust || {};
        
        // Format arrays/lists
        const formatArray = (arr: any): string => {
          if (!arr) return '';
          if (Array.isArray(arr)) return arr.join('; ');
          return JSON.stringify(arr);
        };
        
        const formatJSON = (obj: any): string => {
          if (!obj) return '';
          return JSON.stringify(obj);
        };

        // Handle both V1 and V2 field names for demographics
        const age = demographics.age || '';
        const gender = demographics.gender || '';
        const race = demographics.race || demographics.race_ethnicity || '';
        const location = demographics.location || 
          (demographics.location_city && demographics.location_state 
            ? `${demographics.location_city}, ${demographics.location_state}${demographics.location_type ? ` (${demographics.location_type})` : ''}` 
            : demographics.location_city || demographics.location_state || '');
        const education = demographics.education || '';
        const occupation = demographics.occupation || '';
        const income = demographics.income || '';
        const family = demographics.family || demographics.marital_status || '';
        const religion = demographics.religion || '';
        const politics = demographics.politics || demographics.political_affiliation || '';

        // Format signal weights
        const signalWeightsDetails = p.signalWeights.map(sw => 
          `${sw.signalName}(${sw.direction}:${sw.weight.toFixed(2)})`
        ).join('; ');

        return [
          // Basic Info
          p.id,
          `"${p.name}"`,
          p.nickname ? `"${p.nickname}"` : '',
          p.description ? `"${p.description.replace(/"/g, '""')}"` : '',
          p.tagline ? `"${p.tagline}"` : '',
          p.jsonPersonaId || '',
          p.archetype || '',
          p.archetypeStrength || '',
          p.secondaryArchetype || '',
          p.variant || '',
          p.version,
          p.sourceType,
          p.organizationId || '',
          p.instantRead ? `"${p.instantRead.replace(/"/g, '""')}"` : '',
          // Demographics
          age,
          gender,
          race,
          location ? `"${location}"` : '',
          education ? `"${education}"` : '',
          occupation ? `"${occupation}"` : '',
          income,
          family ? `"${family}"` : '',
          religion ? `"${religion}"` : '',
          politics ? `"${politics}"` : '',
          // Dimensions
          dimensions.attribution_orientation || '',
          dimensions.just_world_belief || '',
          dimensions.authoritarianism || '',
          institutionalTrust.corporations || '',
          institutionalTrust.medical || '',
          institutionalTrust.legal_system || '',
          institutionalTrust.insurance || '',
          dimensions.litigation_attitude || '',
          dimensions.leadership_tendency || '',
          dimensions.cognitive_style || '',
          dimensions.damages_orientation || '',
          // Life Experiences & Phrases
          formatArray(p.lifeExperiences) ? `"${formatArray(p.lifeExperiences).replace(/"/g, '""')}"` : '',
          formatArray(p.characteristicPhrases) ? `"${formatArray(p.characteristicPhrases).replace(/"/g, '""')}"` : '',
          formatArray(p.phrasesYoullHear) ? `"${formatArray(p.phrasesYoullHear).replace(/"/g, '""')}"` : '',
          formatArray(p.speechPatterns) ? `"${formatArray(p.speechPatterns).replace(/"/g, '""')}"` : '',
          // Voir Dire & Deliberation
          formatJSON(p.voirDireResponses) ? `"${formatJSON(p.voirDireResponses).replace(/"/g, '""')}"` : '',
          formatJSON(p.deliberationBehavior) ? `"${formatJSON(p.deliberationBehavior).replace(/"/g, '""')}"` : '',
          p.archetypeDeliberationBehavior ? `"${p.archetypeDeliberationBehavior.replace(/"/g, '""')}"` : '',
          // Roundtable Behavior
          p.leadershipLevel || '',
          p.communicationStyle ? `"${p.communicationStyle.replace(/"/g, '""')}"` : '',
          p.persuasionSusceptibility ? `"${p.persuasionSusceptibility.replace(/"/g, '""')}"` : '',
          p.vocabularyLevel || '',
          p.sentenceStyle || '',
          p.responseTendency || '',
          p.engagementStyle || '',
          // V2 Fields
          p.archetypeVerdictLean ? `"${p.archetypeVerdictLean}"` : '',
          p.archetypeWhatTheyBelieve ? `"${p.archetypeWhatTheyBelieve.replace(/"/g, '""')}"` : '',
          formatArray(p.archetypeHowToSpot) ? `"${formatArray(p.archetypeHowToSpot).replace(/"/g, '""')}"` : '',
          verdictPrediction.liability_finding_probability || '',
          verdictPrediction.damages_if_liability ? `"${verdictPrediction.damages_if_liability.replace(/"/g, '""')}"` : '',
          verdictPrediction.role_in_deliberation ? `"${verdictPrediction.role_in_deliberation.replace(/"/g, '""')}"` : '',
          strikeOrKeep.plaintiff_strategy ? `"${strikeOrKeep.plaintiff_strategy.replace(/"/g, '""')}"` : '',
          strikeOrKeep.defense_strategy ? `"${strikeOrKeep.defense_strategy.replace(/"/g, '""')}"` : '',
          // Strategic Guidance
          p.plaintiffDangerLevel || '',
          p.defenseDangerLevel || '',
          formatJSON(p.causeChallenge) ? `"${formatJSON(p.causeChallenge).replace(/"/g, '""')}"` : '',
          formatJSON(p.strategyGuidance) ? `"${formatJSON(p.strategyGuidance).replace(/"/g, '""')}"` : '',
          // Simulation Parameters
          formatJSON(p.simulationParams) ? `"${formatJSON(p.simulationParams).replace(/"/g, '""')}"` : '',
          formatJSON(p.caseTypeModifiers) ? `"${formatJSON(p.caseTypeModifiers).replace(/"/g, '""')}"` : '',
          formatJSON(p.regionalModifiers) ? `"${formatJSON(p.regionalModifiers).replace(/"/g, '""')}"` : '',
          // Legacy Fields
          formatJSON(p.attributes) ? `"${formatJSON(p.attributes).replace(/"/g, '""')}"` : '',
          formatJSON(p.signals) ? `"${formatJSON(p.signals).replace(/"/g, '""')}"` : '',
          formatJSON(p.persuasionLevers) ? `"${formatJSON(p.persuasionLevers).replace(/"/g, '""')}"` : '',
          formatJSON(p.pitfalls) ? `"${formatJSON(p.pitfalls).replace(/"/g, '""')}"` : '',
          // Signal Weights
          p.signalWeights.length,
          signalWeightsDetails ? `"${signalWeightsDetails}"` : '',
          // Metadata
          p.isActive ? 'true' : 'false',
          p.createdAt,
          p.updatedAt,
        ].join(',');
      }),
    ];
    await fs.writeFile(detailedCsvPath, detailedCsvRows.join('\n'), 'utf-8');
    console.log(`📊 Comprehensive CSV with ALL fields exported to: ${detailedCsvPath}`);
    console.log(`   Includes:`);
    console.log(`   - All demographics (age, gender, race, location, education, occupation, income, family, religion, politics)`);
    console.log(`   - All 8 psychological dimensions`);
    console.log(`   - Life experiences, characteristic phrases, speech patterns`);
    console.log(`   - Voir dire responses, deliberation behavior`);
    console.log(`   - Roundtable behavior (leadership, communication, vocabulary, etc.)`);
    console.log(`   - V2 fields (verdict prediction, strike/keep, archetype guidance)`);
    console.log(`   - Strategic guidance (danger levels, cause challenge, strategy)`);
    console.log(`   - Simulation parameters, case/regional modifiers`);
    console.log(`   - Legacy fields (attributes, signals, persuasion levers, pitfalls)`);
    console.log(`   - Complete signal weights list\n`);

    // Also create a basic CSV summary
    const csvPath = path.join(process.cwd(), 'personas-v2-export-summary.csv');
    const csvRows = [
      ['ID', 'Name', 'Nickname', 'Archetype', 'Version', 'Source', 'Signal Weights', 'Created', 'Updated'].join(','),
      ...exportedPersonas.map((p) =>
        [
          p.id,
          `"${p.name}"`,
          p.nickname ? `"${p.nickname}"` : '',
          p.archetype || '',
          p.version,
          p.sourceType,
          p.signalWeights.length,
          p.createdAt,
          p.updatedAt,
        ].join(',')
      ),
    ];
    await fs.writeFile(csvPath, csvRows.join('\n'), 'utf-8');
    console.log(`📊 Basic CSV summary exported to: ${csvPath}`);
    console.log(`   Quick reference with basic fields only\n`);
  } catch (error) {
    console.error('❌ Error exporting personas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the export
exportAllPersonas()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Export failed:', error);
    process.exit(1);
  });
