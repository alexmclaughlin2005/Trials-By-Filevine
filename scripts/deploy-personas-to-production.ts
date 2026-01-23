#!/usr/bin/env tsx
/**
 * Deploy personas to production database
 *
 * This script imports all personas and configs to the production database.
 * It connects to Railway's PostgreSQL database using the production DATABASE_URL.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npm run deploy-personas
 */

import { PrismaClient } from '@juries/database';
import * as fs from 'fs';
import * as path from 'path';

// Check for production DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable not set');
  console.error('\nUsage:');
  console.error('  DATABASE_URL="postgresql://user:pass@host:port/db" npm run deploy-personas');
  console.error('\nOr set it in your environment first:');
  console.error('  export DATABASE_URL="postgresql://..."');
  console.error('  npm run deploy-personas');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
console.log('\n🔍 Target Database:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

interface ArchetypeFile {
  archetype: string;
  archetype_display_name: string;
  archetype_tagline: string;
  plaintiff_danger_level: number;
  defense_danger_level: number;
  archetype_centroids?: any;
  personas: any[];
}

async function importPersonasFromFile(filePath: string) {
  console.log(`\n📂 Reading file: ${path.basename(filePath)}`);

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const archetypeData: ArchetypeFile = JSON.parse(fileContent);

  console.log(`📊 Archetype: ${archetypeData.archetype_display_name || archetypeData.archetype}`);
  console.log(`   Personas to import: ${archetypeData.personas.length}`);

  let importedCount = 0;
  let skippedCount = 0;

  for (const persona of archetypeData.personas) {
    try {
      // Check if persona already exists
      const existing = await prisma.persona.findFirst({
        where: {
          name: persona.full_name,
          archetype: archetypeData.archetype,
        },
      });

      if (existing) {
        console.log(`   ⏭️  Skipping ${persona.nickname || persona.full_name} (already exists)`);
        skippedCount++;
        continue;
      }

      // Create the persona
      await prisma.persona.create({
        data: {
          name: persona.full_name,
          nickname: persona.nickname || persona.full_name,
          description: persona.tagline || `${archetypeData.archetype_display_name} persona`,
          tagline: persona.tagline,
          archetype: archetypeData.archetype,
          archetypeStrength: persona.archetype_strength || 0.8,
          secondaryArchetype: persona.secondary_archetype,
          variant: persona.variant,
          sourceType: 'system',
          demographics: persona.demographics || {},
          dimensions: persona.dimensions || {},
          lifeExperiences: persona.life_experiences || [],
          characteristicPhrases: persona.characteristic_phrases || [],
          voirDireResponses: persona.voir_dire_responses || {},
          deliberationBehavior: persona.deliberation_behavior || {},
          simulationParams: persona.simulation_parameters || {},
          caseTypeModifiers: persona.case_type_predictions || {},
          regionalModifiers: persona.regional_notes || {},
          plaintiffDangerLevel: archetypeData.plaintiff_danger_level,
          defenseDangerLevel: archetypeData.defense_danger_level,
          causeChallenge: persona.strategy_guidance?.cause_challenge_approach || {},
          strategyGuidance: persona.strategy_guidance || {},
          attributes: {
            legal_experience: persona.legal_experience,
            special_traits: persona.special_traits,
          },
          signals: persona.dimensions ? Object.keys(persona.dimensions) : [],
          persuasionLevers: persona.strategy_guidance?.if_must_keep || {},
          pitfalls: persona.strategy_guidance?.red_flags_in_responses || [],
          isActive: true,
          version: 1,
        },
      });

      console.log(`   ✅ Imported: ${persona.nickname || persona.full_name}`);
      importedCount++;
    } catch (error: any) {
      console.error(`   ❌ Error importing ${persona.nickname}:`, error.message);
    }
  }

  return { imported: importedCount, skipped: skippedCount };
}

async function importSimulationConfig(filePath: string) {
  console.log(`\n📂 Reading simulation config: ${path.basename(filePath)}`);

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const configData = JSON.parse(fileContent);

  const configTypes = [
    { type: 'influence_matrix', data: configData.archetype_influence_matrix },
    { type: 'conflict_matrix', data: configData.archetype_conflict_matrix },
    { type: 'alliance_matrix', data: configData.archetype_alliance_matrix },
    { type: 'deliberation_params', data: configData.deliberation_parameters },
    { type: 'evidence_processing', data: configData.evidence_processing_by_archetype },
    { type: 'damages_calc', data: configData.damages_calculation },
    { type: 'composition_scenarios', data: configData.jury_composition_scenarios },
    { type: 'regional_modifiers', data: configData.regional_modifiers },
    { type: 'case_type_modifiers', data: configData.case_type_modifiers },
  ];

  let importedCount = 0;

  for (const { type, data } of configTypes) {
    try {
      const existing = await prisma.archetypeConfig.findFirst({
        where: {
          configType: type,
          isActive: true,
        },
      });

      if (existing) {
        await prisma.archetypeConfig.update({
          where: { id: existing.id },
          data: {
            data: data,
            version: configData.meta?.version || '1.0',
            description: data.description || `${type} configuration`,
          },
        });
        console.log(`   🔄 Updated: ${type}`);
      } else {
        await prisma.archetypeConfig.create({
          data: {
            configType: type,
            version: configData.meta?.version || '1.0',
            data: data,
            description: data.description || `${type} configuration`,
            isActive: true,
          },
        });
        console.log(`   ✅ Imported: ${type}`);
      }
      importedCount++;
    } catch (error: any) {
      console.error(`   ❌ Error importing ${type}:`, error.message);
    }
  }

  return importedCount;
}

async function main() {
  console.log('🚀 Deploying Personas to Production Database\n');
  console.log('='.repeat(60));

  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to database successfully\n');
  } catch (error: any) {
    console.error('❌ Failed to connect to database:', error.message);
    console.error('\nPlease check your DATABASE_URL is correct');
    process.exit(1);
  }

  const generatedDir = path.join(__dirname, '..', 'Juror Personas', 'generated');
  const mainDir = path.join(__dirname, '..', 'Juror Personas');

  if (!fs.existsSync(generatedDir)) {
    console.error(`❌ Generated directory not found: ${generatedDir}`);
    console.error('Please run "npm run convert-personas-v2" first');
    process.exit(1);
  }

  const generatedFiles = fs.readdirSync(generatedDir);
  const mainFiles = fs.readdirSync(mainDir);

  console.log(`📁 Found ${generatedFiles.length} files in generated directory`);

  let totalImported = 0;
  let totalSkipped = 0;
  let configImported = 0;

  // Import from generated directory
  for (const file of generatedFiles) {
    if (!file.endsWith('.json')) continue;

    const filePath = path.join(generatedDir, file);
    const result = await importPersonasFromFile(filePath);
    totalImported += result.imported;
    totalSkipped += result.skipped;
  }

  // Import simulation config from main directory
  const configPath = path.join(mainDir, 'simulation_config.json');
  if (fs.existsSync(configPath)) {
    configImported = await importSimulationConfig(configPath);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Deployment Summary:');
  console.log(`   ✅ Personas imported: ${totalImported}`);
  console.log(`   ⏭️  Personas skipped: ${totalSkipped}`);
  console.log(`   📋 Config entries: ${configImported}`);
  console.log('='.repeat(60));

  // Show final count
  const finalCount = await prisma.persona.count({
    where: { isActive: true },
  });
  console.log(`\n📈 Total active personas in database: ${finalCount}`);

  // Show count by archetype
  const archetypeCounts = await prisma.persona.groupBy({
    by: ['archetype'],
    _count: true,
    where: { isActive: true },
  });

  console.log('\n📊 Personas by Archetype:');
  for (const { archetype, _count } of archetypeCounts) {
    console.log(`   ${archetype || 'null'}: ${_count} personas`);
  }

  console.log('\n✨ Deployment complete!\n');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
