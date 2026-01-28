/**
 * Import Personas V2.0 to Production Database
 *
 * This script imports personas directly to the production Railway database
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/import-to-production.ts
 */

import { PrismaClient } from '@juries/database';
import * as fs from 'fs';
import * as path from 'path';

// Use production DATABASE_URL from command line or environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required');
  console.error('Usage: DATABASE_URL="postgresql://..." npx tsx scripts/import-to-production.ts');
  process.exit(1);
}

console.log('🔗 Connecting to production database...');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

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

interface PersonaV2 {
  id: string;
  name: string;
  tagline: string;
  instant_read: string;
  backstory: string;
  demographics: Record<string, unknown>;
  phrases_youll_hear: string[];
  verdict_prediction: {
    liability_finding_probability: number;
    damages_if_liability: string;
    role_in_deliberation: string;
  };
  strike_or_keep: {
    plaintiff_strategy: string;
    defense_strategy: string;
  };
  archetype_verdict_lean?: string;
  plaintiff_danger_level?: number;
  defense_danger_level?: number;
  secondary_archetype?: string;
}

interface PersonaFile {
  archetype: string;
  verdict_lean: string;
  personas: PersonaV2[];
}

async function importPersonaFile(fileName: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const filePath = path.join(PERSONA_UPDATES_DIR, fileName);

  console.log(`\n📄 Processing ${fileName}...`);

  if (!fs.existsSync(filePath)) {
    return { imported: 0, skipped: 0, errors: [`File not found: ${fileName}`] };
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const fileData: PersonaFile = JSON.parse(fileContent);

  console.log(`✅ Validated ${fileName} (${fileData.personas.length} personas)`);

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const persona of fileData.personas) {
    try {
      // Check if persona already exists by name
      const existing = await prisma.persona.findFirst({
        where: {
          name: persona.name,
          sourceType: 'system'
        }
      });

      const personaData = {
        name: persona.name,
        nickname: persona.name,
        tagline: persona.tagline,
        description: persona.backstory, // backstory goes in description field
        archetype: fileData.archetype,

        // Archetype-level guidance (from file top-level)
        archetypeVerdictLean: fileData.verdict_lean,
        archetypeWhatTheyBelieve: fileData.what_they_believe,
        archetypeDeliberationBehavior: fileData.how_they_behave_in_deliberation,
        archetypeHowToSpot: fileData.how_to_spot_them,

        // Persona-specific V2 fields
        instantRead: persona.instant_read,
        phrasesYoullHear: persona.phrases_youll_hear,
        verdictPrediction: persona.verdict_prediction,
        strikeOrKeep: persona.strike_or_keep,
        plaintiffDangerLevel: persona.plaintiff_danger_level,
        defenseDangerLevel: persona.defense_danger_level,
        demographics: persona.demographics || {},

        // Metadata
        version: 2, // IMPORTANT: Set version to 2
        isActive: true,
        sourceType: 'system' as const,
        updatedAt: new Date()
      };

      if (existing) {
        // Update existing persona
        await prisma.persona.update({
          where: { id: existing.id },
          data: personaData
        });
        console.log(`   🔄 Updated: ${persona.name} (${persona.id})`);
      } else {
        // Create new persona
        await prisma.persona.create({
          data: {
            ...personaData,
            organizationId: null // NULL = system persona
          }
        });
        console.log(`   ✨ Created: ${persona.name} (${persona.id})`);
      }
      imported++;
    } catch (error) {
      const errorMsg = `Failed to import ${persona.name}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`   ❌ ${errorMsg}`);
      errors.push(errorMsg);
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

async function main() {
  console.log('\n========================================');
  console.log('📦 Persona V2.0 Production Import');
  console.log('========================================\n');

  let totalImported = 0;
  let totalSkipped = 0;
  const allErrors: string[] = [];

  // Import each file
  for (const fileName of PERSONA_FILES) {
    try {
      const result = await importPersonaFile(fileName);
      totalImported += result.imported;
      totalSkipped += result.skipped;
      allErrors.push(...result.errors);
    } catch (error) {
      const errorMsg = `Failed to process ${fileName}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`\n❌ ${errorMsg}\n`);
      allErrors.push(errorMsg);
    }
  }

  // Print summary
  console.log('\n========================================');
  console.log('📊 Import Summary');
  console.log('========================================');
  console.log(`Files processed: ${PERSONA_FILES.length}/${PERSONA_FILES.length}`);
  console.log(`Personas imported: ${totalImported}`);
  console.log(`Personas skipped: ${totalSkipped}`);
  console.log(`Errors: ${allErrors.length}`);

  if (allErrors.length > 0) {
    console.log('\n❌ Errors encountered:');
    allErrors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
  }

  console.log('\n✅ Production import complete!');
  console.log('========================================\n');

  await prisma.$disconnect();
}

main().catch(console.error);
