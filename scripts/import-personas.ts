#!/usr/bin/env tsx
/**
 * Import Juror Personas from JSON files into the database
 *
 * This script imports archetype-based persona definitions from the
 * "Juror Personas" directory into the Persona table.
 *
 * Usage:
 *   npm run import-personas
 *   # or
 *   npx tsx scripts/import-personas.ts
 */

import { PrismaClient } from '@juries/database';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface PersonaJSON {
  persona_id: string;
  nickname: string;
  full_name: string;
  tagline: string;
  archetype: string;
  archetype_strength: number;
  secondary_archetype: string | null;
  variant: string | null;
  demographics: any;
  dimensions: any;
  life_experiences?: string[];
  legal_experience?: any;
  characteristic_phrases?: string[];
  voir_dire_responses?: any;
  deliberation_behavior?: any;
  simulation_parameters?: any;
  case_type_predictions?: any;
  strategy_guidance?: any;
  regional_notes?: any;
  special_traits?: any;
}

interface ArchetypeFile {
  archetype: string;
  archetype_display_name: string;
  archetype_tagline: string;
  plaintiff_danger_level: number;
  defense_danger_level: number;
  archetype_centroids: any;
  personas: PersonaJSON[];
}

async function importPersonasFromFile(filePath: string) {
  console.log(`\n📂 Reading file: ${path.basename(filePath)}`);

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const archetypeData: ArchetypeFile = JSON.parse(fileContent);

  console.log(`📊 Archetype: ${archetypeData.archetype_display_name}`);
  console.log(`   Plaintiff Danger: ${archetypeData.plaintiff_danger_level}/5`);
  console.log(`   Defense Danger: ${archetypeData.defense_danger_level}/5`);
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
        console.log(`   ⏭️  Skipping ${persona.nickname} (already exists)`);
        skippedCount++;
        continue;
      }

      // Create the persona
      await prisma.persona.create({
        data: {
          // Basic Information
          name: persona.full_name,
          nickname: persona.nickname,
          description: persona.tagline || `${archetypeData.archetype_display_name} persona`,
          tagline: persona.tagline,
          
          // Store JSON persona_id for 1:1 mapping
          jsonPersonaId: persona.persona_id,

          // Archetype Classification
          archetype: archetypeData.archetype,
          archetypeStrength: persona.archetype_strength,
          secondaryArchetype: persona.secondary_archetype,
          variant: persona.variant,

          // Core Fields
          sourceType: 'system',

          // Rich Archetype Data
          demographics: persona.demographics || {},
          dimensions: persona.dimensions || {},
          lifeExperiences: persona.life_experiences || [],
          characteristicPhrases: persona.characteristic_phrases || [],
          voirDireResponses: persona.voir_dire_responses || {},
          deliberationBehavior: persona.deliberation_behavior || {},

          // Simulation Parameters
          simulationParams: persona.simulation_parameters || {},
          caseTypeModifiers: persona.case_type_predictions || {},
          regionalModifiers: persona.regional_notes || {},

          // Strategic Guidance
          plaintiffDangerLevel: archetypeData.plaintiff_danger_level,
          defenseDangerLevel: archetypeData.defense_danger_level,
          causeChallenge: persona.strategy_guidance?.cause_challenge_approach || {},
          strategyGuidance: persona.strategy_guidance || {},

          // Legacy fields (for backward compatibility)
          attributes: {
            legal_experience: persona.legal_experience,
            special_traits: persona.special_traits,
          },
          signals: persona.dimensions ? Object.keys(persona.dimensions) : [],
          persuasionLevers: persona.strategy_guidance?.if_must_keep || {},
          pitfalls: persona.strategy_guidance?.red_flags_in_responses || [],

          // Metadata
          isActive: true,
          version: 1,
        },
      });

      console.log(`   ✅ Imported: ${persona.nickname} (${persona.full_name})`);
      importedCount++;
    } catch (error) {
      console.error(`   ❌ Error importing ${persona.nickname}:`, error);
    }
  }

  return { imported: importedCount, skipped: skippedCount };
}

async function importSimulationConfig(filePath: string) {
  console.log(`\n📂 Reading simulation config: ${path.basename(filePath)}`);

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const configData = JSON.parse(fileContent);

  console.log(`📊 Config version: ${configData.meta.version}`);
  console.log(`   Description: ${configData.meta.description}`);

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
      // Check if config already exists
      const existing = await prisma.archetypeConfig.findFirst({
        where: {
          configType: type,
          isActive: true,
        },
      });

      if (existing) {
        // Update existing config
        await prisma.archetypeConfig.update({
          where: { id: existing.id },
          data: {
            data: data,
            version: configData.meta.version,
            description: data.description || `${type} configuration`,
          },
        });
        console.log(`   🔄 Updated: ${type}`);
      } else {
        // Create new config
        await prisma.archetypeConfig.create({
          data: {
            configType: type,
            version: configData.meta.version,
            data: data,
            description: data.description || `${type} configuration`,
            isActive: true,
          },
        });
        console.log(`   ✅ Imported: ${type}`);
      }
      importedCount++;
    } catch (error) {
      console.error(`   ❌ Error importing ${type}:`, error);
    }
  }

  return importedCount;
}

async function main() {
  console.log('🚀 Starting Persona Import Process\n');
  console.log('=' .repeat(60));

  // Check both the main directory and generated directory
  const personasDir = path.join(__dirname, '..', 'Juror Personas');
  const generatedDir = path.join(personasDir, 'generated');

  // Check if directory exists
  if (!fs.existsSync(personasDir)) {
    console.error(`❌ Directory not found: ${personasDir}`);
    process.exit(1);
  }

  // Read files from both directories
  const mainFiles = fs.existsSync(personasDir) ? fs.readdirSync(personasDir) : [];
  const generatedFiles = fs.existsSync(generatedDir) ? fs.readdirSync(generatedDir) : [];
  const allFiles = [
    ...mainFiles.map(f => ({ file: f, dir: personasDir })),
    ...generatedFiles.map(f => ({ file: f, dir: generatedDir }))
  ];

  console.log(`📁 Found ${allFiles.length} files to process`);
  console.log(`   Main directory: ${mainFiles.length} files`);
  console.log(`   Generated directory: ${generatedFiles.length} files`);

  let totalImported = 0;
  let totalSkipped = 0;
  let configImported = 0;

  for (const { file, dir } of allFiles) {
    const filePath = path.join(dir, file);

    // Skip non-JSON files
    if (!file.endsWith('.json')) {
      console.log(`⏭️  Skipping non-JSON file: ${file}`);
      continue;
    }

    // Skip markdown and other documentation
    if (file.endsWith('.md')) {
      continue;
    }

    try {
      // Handle simulation config separately
      if (file === 'simulation_config.json') {
        configImported = await importSimulationConfig(filePath);
        continue;
      }

      // Import persona files
      const result = await importPersonasFromFile(filePath);
      totalImported += result.imported;
      totalSkipped += result.skipped;
    } catch (error) {
      console.error(`❌ Error processing file ${file}:`, error);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 Import Summary:');
  console.log(`   ✅ Personas imported: ${totalImported}`);
  console.log(`   ⏭️  Personas skipped: ${totalSkipped}`);
  console.log(`   📋 Config entries imported/updated: ${configImported}`);
  console.log('=' .repeat(60));

  // Show current persona count by archetype
  console.log('\n📈 Current Persona Count by Archetype:');
  const archetypeCounts = await prisma.persona.groupBy({
    by: ['archetype'],
    _count: true,
    where: {
      sourceType: 'system',
      isActive: true,
    },
  });

  for (const { archetype, _count } of archetypeCounts) {
    console.log(`   ${archetype || 'null'}: ${_count} personas`);
  }

  console.log('\n✨ Import complete!\n');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
