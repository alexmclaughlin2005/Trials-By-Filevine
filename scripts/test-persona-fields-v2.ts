/**
 * Test Persona V2 Fields in Database
 *
 * Verifies that V2 personas have all the new fields populated
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function testPersonaFields() {
  console.log('\n🧪 Testing Persona V2 Fields\n');
  console.log('='.repeat(70));

  // Get a sample persona from each archetype
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

  for (const archetype of archetypes) {
    console.log(`\n📌 Testing ${archetype.toUpperCase()}`);

    const persona = await prisma.persona.findFirst({
      where: {
        archetype,
        version: 2,
        isActive: true
      },
      select: {
        name: true,
        archetype: true,
        instantRead: true,
        archetypeVerdictLean: true,
        archetypeWhatTheyBelieve: true,
        archetypeDeliberationBehavior: true,
        archetypeHowToSpot: true,
        phrasesYoullHear: true,
        verdictPrediction: true,
        strikeOrKeep: true,
        plaintiffDangerLevel: true,
        defenseDangerLevel: true,
      }
    });

    if (!persona) {
      console.log('   ❌ No persona found');
      continue;
    }

    console.log(`   👤 ${persona.name}`);
    console.log(`   ✓ instantRead: ${!!persona.instantRead}`);
    console.log(`   ✓ archetypeVerdictLean: ${!!persona.archetypeVerdictLean}`);
    console.log(`   ✓ archetypeWhatTheyBelieve: ${!!persona.archetypeWhatTheyBelieve}`);
    console.log(`   ✓ archetypeDeliberationBehavior: ${!!persona.archetypeDeliberationBehavior}`);
    console.log(`   ✓ archetypeHowToSpot: ${!!persona.archetypeHowToSpot}`);
    console.log(`   ✓ phrasesYoullHear: ${!!persona.phrasesYoullHear}`);
    console.log(`   ✓ verdictPrediction: ${!!persona.verdictPrediction}`);
    console.log(`   ✓ strikeOrKeep: ${!!persona.strikeOrKeep}`);

    // Show sample data
    if (persona.instantRead) {
      console.log(`\n   💬 Instant Read: "${persona.instantRead.substring(0, 80)}..."`);
    }

    if (persona.phrasesYoullHear) {
      const phrases = persona.phrasesYoullHear as string[];
      if (phrases.length > 0) {
        console.log(`   💬 Sample Phrase: "${phrases[0]}"`);
      }
    }

    if (persona.verdictPrediction) {
      const vp = persona.verdictPrediction as any;
      console.log(`   ⚖️  Liability Probability: ${vp.liability_finding_probability || 'N/A'}`);
    }

    console.log(`   🎯 Danger Levels: Plaintiff=${persona.plaintiffDangerLevel || 'N/A'} / Defense=${persona.defenseDangerLevel || 'N/A'}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Field Testing Complete!\n');
}

testPersonaFields()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
