import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTaglines() {
  const personas = await prisma.persona.findMany({
    where: { isActive: true },
    select: { name: true, tagline: true, archetype: true }
  });

  const withTaglines = personas.filter(p => p.tagline && p.tagline.trim() !== '');
  const withoutTaglines = personas.filter(p => !p.tagline || p.tagline.trim() === '');

  console.log(`Total personas: ${personas.length}`);
  console.log(`With taglines: ${withTaglines.length}`);
  console.log(`Without taglines: ${withoutTaglines.length}`);
  console.log('\nPersonas WITH taglines:');
  withTaglines.forEach(p => console.log(`  - ${p.name}: "${p.tagline}"`));
  console.log('\nPersonas WITHOUT taglines (first 10):');
  withoutTaglines.slice(0, 10).forEach(p => console.log(`  - ${p.name} (${p.archetype})`));

  await prisma.$disconnect();
}

checkTaglines();
