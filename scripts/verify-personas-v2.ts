/**
 * Verify Persona V2.0 Import
 *
 * Quick script to verify the personas were imported correctly
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function verifyImport() {
  console.log('\n🔍 Verifying Persona V2.0 Import...\n');

  // Count total V2 personas
  const totalV2 = await prisma.persona.count({
    where: {
      version: 2,
      isActive: true
    }
  });

  console.log(`✅ Total V2 Personas: ${totalV2}`);

  // Count by archetype
  const archetypes = [
    'bootstrapper',
    'crusader',
    'scale_balancer',
    'captain',
    'chameleon',
    'heart',
    'calculator',
    'scarred',
    'trojan_horse',
    'maverick'
  ];

  console.log('\n📊 Personas by Archetype:');
  for (const archetype of archetypes) {
    const count = await prisma.persona.count({
      where: {
        version: 2,
        archetype,
        isActive: true
      }
    });
    console.log(`   ${archetype.padEnd(20)} ${count}`);
  }

  // Check for new fields
  console.log('\n🔬 Checking New Fields...');

  const samplePersona = await prisma.persona.findFirst({
    where: {
      version: 2,
      archetype: 'bootstrapper'
    },
    select: {
      name: true,
      archetype: true,
      instantRead: true,
      archetypeVerdictLean: true,
      phrasesYoullHear: true,
      verdictPrediction: true,
      strikeOrKeep: true
    }
  });

  if (samplePersona) {
    console.log(`\n✅ Sample Persona: ${samplePersona.name}`);
    console.log(`   Archetype: ${samplePersona.archetype}`);
    console.log(`   Instant Read: ${samplePersona.instantRead ? '✓' : '✗'}`);
    console.log(`   Verdict Lean: ${samplePersona.archetypeVerdictLean ? '✓' : '✗'}`);
    console.log(`   Phrases: ${samplePersona.phrasesYoullHear ? '✓' : '✗'}`);
    console.log(`   Verdict Prediction: ${samplePersona.verdictPrediction ? '✓' : '✗'}`);
    console.log(`   Strike/Keep: ${samplePersona.strikeOrKeep ? '✓' : '✗'}`);
  }

  // Show a few examples
  console.log('\n📋 Sample Personas:');
  const samples = await prisma.persona.findMany({
    where: {
      version: 2,
      isActive: true
    },
    select: {
      name: true,
      archetype: true,
      instantRead: true,
      plaintiffDangerLevel: true,
      defenseDangerLevel: true
    },
    take: 5,
    orderBy: {
      archetype: 'asc'
    }
  });

  for (const persona of samples) {
    console.log(`\n   ${persona.name} (${persona.archetype})`);
    console.log(`   "${persona.instantRead}"`);
    console.log(`   Danger: P=${persona.plaintiffDangerLevel ?? 'N/A'} / D=${persona.defenseDangerLevel ?? 'N/A'}`);
  }

  console.log('\n✅ Verification Complete!\n');
}

verifyImport()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
