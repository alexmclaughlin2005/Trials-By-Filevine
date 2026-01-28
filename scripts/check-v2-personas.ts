import { PrismaClient } from '@juries/database';

async function checkV2Personas() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking V2 persona data in database...\n');

    // Count total personas
    const totalPersonas = await prisma.persona.count();
    console.log(`Total personas: ${totalPersonas}`);

    // Count personas with V2 fields
    const personasWithInstantRead = await prisma.persona.count({
      where: {
        instantRead: { not: null },
      },
    });

    const personasWithDangerLevels = await prisma.persona.count({
      where: {
        AND: [
          { plaintiffDangerLevel: { not: null } },
          { defenseDangerLevel: { not: null } },
        ],
      },
    });

    const personasWithPhrases = await prisma.persona.count({
      where: {
        phrasesYoullHear: { isEmpty: false },
      },
    });

    console.log(`\nV2 Data Coverage:`);
    console.log(`- Personas with Instant Reads: ${personasWithInstantRead}`);
    console.log(`- Personas with Danger Levels: ${personasWithDangerLevels}`);
    console.log(`- Personas with "Phrases You'll Hear": ${personasWithPhrases}`);

    // Sample one persona with V2 data
    const samplePersona = await prisma.persona.findFirst({
      where: {
        instantRead: { not: null },
      },
      select: {
        name: true,
        archetype: true,
        instantRead: true,
        plaintiffDangerLevel: true,
        defenseDangerLevel: true,
        phrasesYoullHear: true,
      },
    });

    if (samplePersona) {
      console.log(`\n✅ Sample V2 Persona: ${samplePersona.name}`);
      console.log(`Archetype: ${samplePersona.archetype}`);
      console.log(`Instant Read: ${samplePersona.instantRead?.substring(0, 100)}...`);
      console.log(`Danger Levels: P${samplePersona.plaintiffDangerLevel}/D${samplePersona.defenseDangerLevel}`);
      console.log(`Phrases: ${samplePersona.phrasesYoullHear?.length || 0} phrases`);
    }

    console.log('\n✅ V2 persona data is present in database!');
  } catch (error) {
    console.error('❌ Error checking V2 personas:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkV2Personas();
