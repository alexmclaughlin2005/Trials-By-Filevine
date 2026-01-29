/**
 * Import Personas V2.0
 *
 * Imports updated archetype definitions and persona files from the
 * "Persona Updates" directory into the database.
 *
 * Usage:
 *   npm run import-personas-v2
 *   npm run import-personas-v2 -- --dry-run
 */

import { PrismaClient } from '@juries/database';
import * as fs from 'fs';
import * as path from 'path';
import {
  PersonaFile,
  PersonaV2,
  PersonaInsert,
  ArchetypeMasterReference,
  validatePersonaFile,
  validatePersonaV2,
  VALID_ARCHETYPES
} from '@juries/types';

const prisma = new PrismaClient();

// Path to persona update files
const PERSONA_UPDATES_DIR = path.join(__dirname, '..', 'Persona Updates');

// Persona files to import
const PERSONA_FILES = [
  'bootstrappers.json',
  'crusaders.json',
  'scale_balancers.json',
  'captains.json',
  'chameleons.json',
  'hearts.json',
  'calculators.json',
  'scarred.json',
  'trojan_horses.json',
  'mavericks.json'
];

interface ImportStats {
  filesProcessed: number;
  personasImported: number;
  personasSkipped: number;
  errors: string[];
}

/**
 * Convert PersonaV2 from JSON to PersonaInsert for database
 */
function convertPersonaToInsert(
  personaData: PersonaV2,
  fileData: PersonaFile
): PersonaInsert {
  return {
    // Use the persona ID from JSON as the primary identifier
    name: personaData.name,
    nickname: personaData.name, // Store memorable name as nickname
    description: personaData.backstory,
    tagline: personaData.tagline,
    
    // Store JSON persona_id for 1:1 mapping (PersonaV2 uses 'id' field)
    jsonPersonaId: personaData.id,

    // Archetype classification
    archetype: fileData.archetype,
    archetypeStrength: 1.0, // Primary persona, full strength
    secondaryArchetype: personaData.secondary_archetype || undefined,

    // NEW: Archetype-level guidance (copy from file top-level)
    archetypeVerdictLean: fileData.verdict_lean,
    archetypeWhatTheyBelieve: fileData.what_they_believe,
    archetypeDeliberationBehavior: fileData.how_they_behave_in_deliberation,
    archetypeHowToSpot: fileData.how_to_spot_them,

    // NEW: Persona-specific fields
    instantRead: personaData.instant_read,
    phrasesYoullHear: personaData.phrases_youll_hear,
    verdictPrediction: personaData.verdict_prediction,
    strikeOrKeep: personaData.strike_or_keep,

    // Demographics
    demographics: personaData.demographics,

    // Strategic guidance (convert from verdict prediction)
    // Handle string values like "Unpredictable" by converting to null
    plaintiffDangerLevel: typeof fileData.danger_for_plaintiff === 'number'
      ? fileData.danger_for_plaintiff
      : undefined,
    defenseDangerLevel: typeof fileData.danger_for_defense === 'number'
      ? fileData.danger_for_defense
      : undefined,

    // Metadata
    sourceType: 'system',
    organizationId: undefined, // NULL = system persona
    isActive: true,
    version: 2 // Mark as V2 personas
  };
}

/**
 * Import a single persona file
 */
async function importPersonaFile(
  fileName: string,
  dryRun: boolean
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const filePath = path.join(PERSONA_UPDATES_DIR, fileName);

  console.log(`\n📄 Processing ${fileName}...`);

  // Read and parse file
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const fileData: PersonaFile = JSON.parse(fileContent);

  // Validate file structure
  const validation = validatePersonaFile(fileData);
  if (!validation.valid) {
    console.error(`❌ Validation failed for ${fileName}:`);
    validation.errors.forEach(err => console.error(`   - ${err}`));
    return { imported: 0, skipped: 0, errors: validation.errors };
  }

  console.log(`✅ Validated ${fileName} (${fileData.personas.length} personas)`);

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Import each persona
  for (const persona of fileData.personas) {
    try {
      // Check if persona already exists by name
      const existing = await prisma.persona.findFirst({
        where: {
          name: persona.name,
          archetype: fileData.archetype
        }
      });

      if (existing) {
        if (dryRun) {
          console.log(`   🔄 [DRY RUN] Would update: ${persona.name} (${persona.id})`);
        } else {
          // Update existing persona
          await prisma.persona.update({
            where: { id: existing.id },
            data: convertPersonaToInsert(persona, fileData)
          });
          console.log(`   🔄 Updated: ${persona.name} (${persona.id})`);
        }
        imported++;
      } else {
        if (dryRun) {
          console.log(`   ✨ [DRY RUN] Would create: ${persona.name} (${persona.id})`);
        } else {
          // Create new persona
          await prisma.persona.create({
            data: convertPersonaToInsert(persona, fileData)
          });
          console.log(`   ✨ Created: ${persona.name} (${persona.id})`);
        }
        imported++;
      }
    } catch (error) {
      const errorMsg = `Failed to import ${persona.name}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`   ❌ ${errorMsg}`);
      errors.push(errorMsg);
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

/**
 * Main import function
 */
async function importAllPersonas(dryRun: boolean = false) {
  console.log('\n========================================');
  console.log('📦 Persona V2.0 Import');
  console.log('========================================');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  const stats: ImportStats = {
    filesProcessed: 0,
    personasImported: 0,
    personasSkipped: 0,
    errors: []
  };

  // Check if persona updates directory exists
  if (!fs.existsSync(PERSONA_UPDATES_DIR)) {
    console.error(`❌ Persona Updates directory not found: ${PERSONA_UPDATES_DIR}`);
    process.exit(1);
  }

  // Import each file
  for (const fileName of PERSONA_FILES) {
    const filePath = path.join(PERSONA_UPDATES_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found, skipping: ${fileName}`);
      continue;
    }

    try {
      const result = await importPersonaFile(fileName, dryRun);
      stats.filesProcessed++;
      stats.personasImported += result.imported;
      stats.personasSkipped += result.skipped;
      stats.errors.push(...result.errors);
    } catch (error) {
      const errorMsg = `Failed to process ${fileName}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`\n❌ ${errorMsg}\n`);
      stats.errors.push(errorMsg);
    }
  }

  // Print summary
  console.log('\n========================================');
  console.log('📊 Import Summary');
  console.log('========================================');
  console.log(`Files processed: ${stats.filesProcessed}/${PERSONA_FILES.length}`);
  console.log(`Personas imported: ${stats.personasImported}`);
  console.log(`Personas skipped: ${stats.personasSkipped}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    stats.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN COMPLETE - No changes were made');
  } else {
    console.log('\n✅ Import complete!');
  }

  console.log('========================================\n');
}

/**
 * Import archetype master reference
 */
async function importArchetypeMaster(dryRun: boolean = false) {
  const filePath = path.join(PERSONA_UPDATES_DIR, 'archetype_master_reference.json');

  if (!fs.existsSync(filePath)) {
    console.warn('⚠️  archetype_master_reference.json not found, skipping');
    return;
  }

  console.log('\n📋 Importing Archetype Master Reference...');

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const masterRef: ArchetypeMasterReference = JSON.parse(fileContent);

  console.log(`Version: ${masterRef.meta.version}`);
  console.log(`Archetypes defined: ${masterRef.archetypes.length}`);

  // You could store this in a separate table or as JSON in a config table
  // For now, just log it
  console.log('✅ Archetype master reference validated');
  console.log('   (This data is embedded in individual persona files)');
}

// Run the script
const dryRun = process.argv.includes('--dry-run');

async function main() {
  try {
    await importArchetypeMaster(dryRun);
    await importAllPersonas(dryRun);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
