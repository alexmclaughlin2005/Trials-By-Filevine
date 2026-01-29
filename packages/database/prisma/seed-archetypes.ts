/**
 * Seed Archetype System
 *
 * Imports:
 * - System personas from bootstrappers_sample.json (and future archetype files)
 * - Simulation configuration from simulation_config.json
 * - Archetype metadata and descriptions
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================
// ARCHETYPE METADATA
// ============================================

const ARCHETYPE_INFO = {
  bootstrapper: {
    name: 'The Bootstrapper',
    tagline: 'Pull yourself up by your bootstraps',
    description: 'Personal Responsibility Enforcer who believes individuals control their fate and is skeptical of victimhood narratives.',
    plaintiffDanger: 5,
    defenseDanger: 1,
  },
  crusader: {
    name: 'The Crusader',
    tagline: 'Fight the power',
    description: 'Systemic Thinker who sees structural injustice in systems and empathizes with David vs Goliath narratives.',
    plaintiffDanger: 1,
    defenseDanger: 5,
  },
  scale_balancer: {
    name: 'The Scale-Balancer',
    tagline: 'Just the facts',
    description: 'Fair-Minded Evaluator who is genuinely open to evidence and values procedural fairness.',
    plaintiffDanger: 2.5,
    defenseDanger: 2.5,
  },
  captain: {
    name: 'The Captain',
    tagline: 'Someone has to lead',
    description: 'Authoritative Leader with natural leadership tendency who will dominate deliberations.',
    plaintiffDanger: 3,
    defenseDanger: 3,
  },
  chameleon: {
    name: 'The Chameleon',
    tagline: 'Go with the flow',
    description: 'Compliant Follower who adopts majority position and is highly susceptible to social pressure.',
    plaintiffDanger: 3,
    defenseDanger: 3,
  },
  scarred: {
    name: 'The Scarred',
    tagline: 'I know how it feels',
    description: 'Wounded Veteran with personal negative experience who processes through analogical reasoning.',
    plaintiffDanger: 2,
    defenseDanger: 3,
  },
  calculator: {
    name: 'The Calculator',
    tagline: 'Show me the numbers',
    description: 'Numbers Person with analytical cognitive style who values data and expert testimony.',
    plaintiffDanger: 3,
    defenseDanger: 2,
  },
  heart: {
    name: 'The Heart',
    tagline: 'Feel their pain',
    description: 'Empathic Connector with narrative cognitive style who weights emotional evidence highly.',
    plaintiffDanger: 1,
    defenseDanger: 4,
  },
  trojan_horse: {
    name: 'The Trojan Horse',
    tagline: 'Not what they seem',
    description: 'Stealth Juror who hides true biases in voir dire and presents as balanced but has agenda.',
    plaintiffDanger: 4,
    defenseDanger: 2,
  },
  maverick: {
    name: 'The Maverick',
    tagline: 'I vote my conscience',
    description: 'Nullifier who is an independent thinker, resists authority, and may vote conscience over law.',
    plaintiffDanger: 3,
    defenseDanger: 3,
  },
};

// ============================================
// IMPORT FUNCTIONS
// ============================================

async function importPersonasFromFile(filePath: string) {
  console.log(`\n📄 Reading personas from: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  const archetype = data.archetype;
  const personas = data.personas || [];

  console.log(`   Found ${personas.length} personas for archetype: ${archetype}`);

  for (const persona of personas) {
    try {
      // Check if persona already exists
      const existing = await prisma.persona.findFirst({
        where: {
          nickname: persona.nickname,
          organizationId: null,
        },
      });

      if (existing) {
        console.log(`   ⏭️  Skipping ${persona.nickname} (already exists)`);
        continue;
      }

      // Create persona
      await prisma.persona.create({
        data: {
          organizationId: null, // System persona
          name: persona.full_name || persona.nickname,
          nickname: persona.nickname,
          description: ARCHETYPE_INFO[archetype as keyof typeof ARCHETYPE_INFO]?.description || 'Archetype description',
          tagline: persona.tagline,
          
          // Store JSON persona_id for 1:1 mapping
          jsonPersonaId: persona.persona_id,

          // Archetype classification
          archetype: persona.archetype,
          archetypeStrength: persona.archetype_strength,
          secondaryArchetype: persona.secondary_archetype,
          variant: persona.variant,

          // Source type
          sourceType: 'system',

          // Archetype system fields
          demographics: persona.demographics,
          dimensions: persona.dimensions,
          lifeExperiences: persona.life_experiences,
          characteristicPhrases: persona.characteristic_phrases,
          voirDireResponses: persona.voir_dire_responses,
          deliberationBehavior: persona.deliberation_behavior,

          // Simulation parameters
          simulationParams: persona.simulation_parameters,
          caseTypeModifiers: persona.case_type_predictions,
          regionalModifiers: persona.regional_notes,

          // Strategic guidance
          plaintiffDangerLevel: persona.strategy_guidance?.plaintiff_danger_level || data.plaintiff_danger_level,
          defenseDangerLevel: persona.strategy_guidance?.defense_danger_level || data.defense_danger_level,
          causeChallenge: persona.strategy_guidance?.cause_challenge_approach,
          strategyGuidance: persona.strategy_guidance,

          isActive: true,
          version: 1,
        },
      });

      console.log(`   ✅ Imported ${persona.nickname}`);
    } catch (error) {
      console.error(`   ❌ Failed to import ${persona.nickname}:`, error);
    }
  }
}

async function importSimulationConfig(filePath: string) {
  console.log(`\n⚙️  Reading simulation config from: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const config = JSON.parse(content);

  const configTypes = [
    { type: 'influence_matrix', data: config.archetype_influence_matrix },
    { type: 'conflict_matrix', data: config.archetype_conflict_matrix },
    { type: 'alliance_matrix', data: config.archetype_alliance_matrix },
    { type: 'deliberation_params', data: config.deliberation_parameters },
    { type: 'evidence_processing', data: config.evidence_processing_weights },
    { type: 'damages_calc', data: config.damages_calculation_model },
    { type: 'composition_scenarios', data: config.composition_scenarios },
    { type: 'regional_modifiers', data: config.regional_modifiers },
    { type: 'case_type_modifiers', data: config.case_type_modifiers },
  ];

  for (const { type, data } of configTypes) {
    if (!data) {
      console.log(`   ⏭️  Skipping ${type} (not in config file)`);
      continue;
    }

    try {
      // Check if config already exists
      const existing = await prisma.archetypeConfig.findFirst({
        where: {
          configType: type,
          version: config.meta?.version || '1.0',
        },
      });

      if (existing) {
        console.log(`   ⏭️  Skipping ${type} (already exists)`);
        continue;
      }

      // Create config
      await prisma.archetypeConfig.create({
        data: {
          configType: type,
          version: config.meta?.version || '1.0',
          data: data,
          description: data.description || `${type} configuration`,
          isActive: true,
        },
      });

      console.log(`   ✅ Imported ${type}`);
    } catch (error) {
      console.error(`   ❌ Failed to import ${type}:`, error);
    }
  }
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedArchetypes() {
  console.log('🌱 Starting Archetype System Seed');
  console.log('=' .repeat(60));

  try {
    // Path to Juror Personas directory
    const personasDir = path.join(__dirname, '../../../Juror Personas');

    // Import personas from bootstrappers_sample.json
    const bootstrappersFile = path.join(personasDir, 'bootstrappers_sample.json');
    if (fs.existsSync(bootstrappersFile)) {
      await importPersonasFromFile(bootstrappersFile);
    } else {
      console.log(`⚠️  File not found: ${bootstrappersFile}`);
    }

    // TODO: Import other archetype files when available
    // const crusadersFile = path.join(personasDir, 'crusaders_sample.json');
    // const scaleBalancersFile = path.join(personasDir, 'scale_balancers_sample.json');
    // etc...

    // Import simulation configuration
    const configFile = path.join(personasDir, 'simulation_config.json');
    if (fs.existsSync(configFile)) {
      await importSimulationConfig(configFile);
    } else {
      console.log(`⚠️  File not found: ${configFile}`);
    }

    // Count imported personas by archetype
    console.log('\n📊 Import Summary');
    console.log('=' .repeat(60));

    const personaCounts = await prisma.persona.groupBy({
      by: ['archetype'],
      where: {
        organizationId: null,
        archetype: { not: null },
      },
      _count: true,
    });

    console.log('\nPersonas by Archetype:');
    for (const { archetype, _count } of personaCounts) {
      const info = ARCHETYPE_INFO[archetype as keyof typeof ARCHETYPE_INFO];
      console.log(`   ${archetype.padEnd(20)} ${String(_count).padStart(3)} personas  (${info?.name})`);
    }

    const totalPersonas = personaCounts.reduce((sum, { _count }) => sum + _count, 0);
    console.log(`\n✅ Total: ${totalPersonas} system personas imported`);

    // Count imported configurations
    const configCount = await prisma.archetypeConfig.count({
      where: { isActive: true },
    });
    console.log(`✅ Total: ${configCount} configuration sets imported`);

    console.log('\n🎉 Archetype System Seed Complete!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// EXECUTE
// ============================================

seedArchetypes()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
