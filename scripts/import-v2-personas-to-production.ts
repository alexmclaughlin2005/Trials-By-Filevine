#!/usr/bin/env tsx
/**
 * Import V2 Personas to Production Database
 * 
 * Imports personas from personas-v2-export.json (V2 personas only) to production database.
 * This script ensures only V2 personas are imported and skips any that already exist.
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npm run import-v2-personas-production
 * 
 * Or with Railway CLI:
 *   railway run --service api-gateway npm run import-v2-personas-production
 */

import { PrismaClient } from '@juries/database';
import * as fs from 'fs';
import * as path from 'path';

// Check for production DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable not set');
  console.error('\nUsage:');
  console.error('  DATABASE_URL="postgresql://user:pass@host:port/db" npm run import-v2-personas-production');
  console.error('\nOr with Railway CLI:');
  console.error('  railway run --service api-gateway npm run import-v2-personas-production');
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

interface ExportedPersona {
  id: string;
  organizationId: string | null;
  name: string;
  nickname: string | null;
  description: string;
  tagline: string | null;
  jsonPersonaId: string | null;
  archetype: string | null;
  archetypeStrength: number | null;
  secondaryArchetype: string | null;
  variant: string | null;
  sourceType: string;
  attributes: any;
  signals: any;
  persuasionLevers: any;
  pitfalls: any;
  demographics: any;
  dimensions: any;
  lifeExperiences: any;
  characteristicPhrases: any;
  voirDireResponses: any;
  deliberationBehavior: any;
  leadershipLevel: string | null;
  communicationStyle: string | null;
  persuasionSusceptibility: string | null;
  vocabularyLevel: string | null;
  sentenceStyle: string | null;
  speechPatterns: any;
  responseTendency: string | null;
  engagementStyle: string | null;
  simulationParams: any;
  caseTypeModifiers: any;
  regionalModifiers: any;
  plaintiffDangerLevel: number | null;
  defenseDangerLevel: number | null;
  causeChallenge: any;
  strategyGuidance: any;
  archetypeVerdictLean: string | null;
  archetypeWhatTheyBelieve: string | null;
  archetypeDeliberationBehavior: string | null;
  archetypeHowToSpot: any;
  instantRead: string | null;
  phrasesYoullHear: any;
  verdictPrediction: any;
  strikeOrKeep: any;
  signalWeights: Array<{
    signalId: string;
    signalName: string;
    direction: 'POSITIVE' | 'NEGATIVE';
    weight: number;
  }>;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExportData {
  exportedAt: string;
  version: number;
  totalPersonas: number;
  personasBySource: Record<string, number>;
  personasByArchetype: Record<string, number>;
  personas: ExportedPersona[];
}

async function importV2Personas(): Promise<void> {
  console.log('\n🚀 Importing V2 Personas to Production Database\n');
  console.log('='.repeat(60));

  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to database successfully\n');

    // Load export file
    const exportPath = path.join(process.cwd(), 'personas-v2-export.json');
    if (!fs.existsSync(exportPath)) {
      console.error(`❌ Export file not found: ${exportPath}`);
      console.error('\nPlease ensure personas-v2-export.json exists in the project root.');
      process.exit(1);
    }

    console.log(`📂 Loading export file: ${exportPath}`);
    const exportContent = fs.readFileSync(exportPath, 'utf-8');
    const exportData: ExportData = JSON.parse(exportContent);

    console.log(`✅ Loaded export data:`);
    console.log(`   - Version: ${exportData.version}`);
    console.log(`   - Total Personas: ${exportData.totalPersonas}`);
    console.log(`   - Exported At: ${exportData.exportedAt}`);
    console.log(`   - By Source:`, exportData.personasBySource);
    console.log(`   - By Archetype:`, exportData.personasByArchetype);
    console.log('');

    // Verify all personas are V2
    const nonV2Personas = exportData.personas.filter((p) => p.version !== 2);
    if (nonV2Personas.length > 0) {
      console.error(`❌ ERROR: Found ${nonV2Personas.length} non-V2 personas in export file!`);
      console.error('   This script only imports V2 personas.');
      process.exit(1);
    }

    console.log('✅ All personas are V2 - proceeding with import\n');

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Import each persona
    for (const persona of exportData.personas) {
      try {
        // Check if persona already exists (by name and archetype, or by jsonPersonaId)
        const existing = await prisma.persona.findFirst({
          where: {
            OR: [
              {
                name: persona.name,
                archetype: persona.archetype || undefined,
              },
              ...(persona.jsonPersonaId
                ? [{ jsonPersonaId: persona.jsonPersonaId }]
                : []),
            ],
          },
        });

        if (existing) {
          console.log(`   ⏭️  Skipping ${persona.name} (already exists)`);
          skippedCount++;
          continue;
        }

        // Create the persona
        const createdPersona = await prisma.persona.create({
          data: {
            organizationId: persona.organizationId, // null for system personas
            name: persona.name,
            nickname: persona.nickname,
            description: persona.description,
            tagline: persona.tagline,
            jsonPersonaId: persona.jsonPersonaId,
            archetype: persona.archetype,
            archetypeStrength: persona.archetypeStrength,
            secondaryArchetype: persona.secondaryArchetype,
            variant: persona.variant,
            sourceType: persona.sourceType,
            attributes: persona.attributes,
            signals: persona.signals,
            persuasionLevers: persona.persuasionLevers,
            pitfalls: persona.pitfalls,
            demographics: persona.demographics,
            dimensions: persona.dimensions,
            lifeExperiences: persona.lifeExperiences,
            characteristicPhrases: persona.characteristicPhrases,
            voirDireResponses: persona.voirDireResponses,
            deliberationBehavior: persona.deliberationBehavior,
            leadershipLevel: persona.leadershipLevel,
            communicationStyle: persona.communicationStyle,
            persuasionSusceptibility: persona.persuasionSusceptibility,
            vocabularyLevel: persona.vocabularyLevel,
            sentenceStyle: persona.sentenceStyle,
            speechPatterns: persona.speechPatterns,
            responseTendency: persona.responseTendency,
            engagementStyle: persona.engagementStyle,
            simulationParams: persona.simulationParams,
            caseTypeModifiers: persona.caseTypeModifiers,
            regionalModifiers: persona.regionalModifiers,
            plaintiffDangerLevel: persona.plaintiffDangerLevel,
            defenseDangerLevel: persona.defenseDangerLevel,
            causeChallenge: persona.causeChallenge,
            strategyGuidance: persona.strategyGuidance,
            archetypeVerdictLean: persona.archetypeVerdictLean,
            archetypeWhatTheyBelieve: persona.archetypeWhatTheyBelieve,
            archetypeDeliberationBehavior: persona.archetypeDeliberationBehavior,
            archetypeHowToSpot: persona.archetypeHowToSpot,
            instantRead: persona.instantRead,
            phrasesYoullHear: persona.phrasesYoullHear,
            verdictPrediction: persona.verdictPrediction,
            strikeOrKeep: persona.strikeOrKeep,
            version: persona.version, // Ensure V2
            isActive: persona.isActive,
          },
        });

        // Import signal weights if they exist
        if (persona.signalWeights && persona.signalWeights.length > 0) {
          // First, we need to find or create the signals
          for (const signalWeight of persona.signalWeights) {
            // Find the signal by signalId
            const signal = await prisma.signal.findFirst({
              where: {
                signalId: signalWeight.signalId,
              },
            });

            if (signal) {
              // Check if weight already exists
              const existingWeight = await prisma.personaSignalWeight.findFirst({
                where: {
                  personaId: createdPersona.id,
                  signalId: signal.id,
                  direction: signalWeight.direction,
                },
              });

              if (!existingWeight) {
                await prisma.personaSignalWeight.create({
                  data: {
                    personaId: createdPersona.id,
                    signalId: signal.id,
                    direction: signalWeight.direction,
                    weight: signalWeight.weight,
                  },
                });
              }
            } else {
              console.log(
                `   ⚠️  Signal "${signalWeight.signalName}" (${signalWeight.signalId}) not found - skipping weight`
              );
            }
          }
        }

        importedCount++;
        if (importedCount % 10 === 0) {
          console.log(`   ✅ Imported ${importedCount}/${exportData.totalPersonas} personas...`);
        }
      } catch (error: any) {
        errorCount++;
        const errorMsg = `Failed to import ${persona.name}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Import Summary:');
    console.log(`   ✅ Imported: ${importedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach((err) => console.log(`   - ${err}`));
    }

    // Show final count
    const finalCount = await prisma.persona.count({
      where: {
        version: 2,
        isActive: true,
      },
    });

    console.log(`\n📈 Final V2 Persona Count: ${finalCount}`);
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('\n❌ Error importing personas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importV2Personas()
  .then(() => {
    console.log('\n✨ Import complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  });
