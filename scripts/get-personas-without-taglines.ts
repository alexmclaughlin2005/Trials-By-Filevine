import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getPersonasWithoutTaglines() {
  const personas = await prisma.persona.findMany({
    where: {
      isActive: true,
      OR: [
        { tagline: null },
        { tagline: '' }
      ]
    },
    select: {
      id: true,
      name: true,
      nickname: true,
      description: true,
      archetype: true,
      variant: true,
      demographics: true,
      dimensions: true,
      lifeExperiences: true,
      characteristicPhrases: true,
      deliberationBehavior: true,
      plaintiffDangerLevel: true,
      defenseDangerLevel: true
    }
  });

  console.log(`Found ${personas.length} personas without taglines:\n`);
  personas.forEach((p, idx) => {
    console.log(`\n=== ${idx + 1}. ${p.name} ===`);
    console.log(`Nickname: ${p.nickname || 'N/A'}`);
    console.log(`Archetype: ${p.archetype}${p.variant ? ` (${p.variant})` : ''}`);
    console.log(`Description: ${p.description}`);

    if (p.demographics) {
      const demo = p.demographics as any;
      console.log(`Demographics: Age ${demo.age}, ${demo.gender}, ${demo.occupation || 'Unknown occupation'}`);
    }

    if (p.dimensions) {
      console.log(`Key Dimensions: ${JSON.stringify(p.dimensions, null, 2)}`);
    }

    if (p.characteristicPhrases && Array.isArray(p.characteristicPhrases) && p.characteristicPhrases.length > 0) {
      console.log(`Characteristic Phrases: ${(p.characteristicPhrases as string[]).join('; ')}`);
    }

    console.log(`Plaintiff Danger: ${p.plaintiffDangerLevel}/5, Defense Danger: ${p.defenseDangerLevel}/5`);
  });

  await prisma.$disconnect();
}

getPersonasWithoutTaglines();
