#!/usr/bin/env tsx
/**
 * List all personas in the database
 *
 * Usage: npm run list-personas
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Listing all personas in database\n');
  console.log('='.repeat(80));

  // Get all personas grouped by archetype
  const personas = await prisma.persona.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      { archetype: 'asc' },
      { name: 'asc' },
    ],
    select: {
      id: true,
      name: true,
      nickname: true,
      archetype: true,
      archetypeStrength: true,
      sourceType: true,
      plaintiffDangerLevel: true,
      defenseDangerLevel: true,
      createdAt: true,
    },
  });

  // Group by archetype
  const grouped = personas.reduce((acc, persona) => {
    const archetype = persona.archetype || 'null';
    if (!acc[archetype]) {
      acc[archetype] = [];
    }
    acc[archetype].push(persona);
    return acc;
  }, {} as Record<string, typeof personas>);

  // Display by archetype
  for (const [archetype, personaList] of Object.entries(grouped)) {
    console.log(`\n📁 ${archetype.toUpperCase()} (${personaList.length} personas)`);
    console.log('-'.repeat(80));

    for (const persona of personaList) {
      const strength = persona.archetypeStrength
        ? ` (${(Number(persona.archetypeStrength) * 100).toFixed(0)}%)`
        : '';
      const danger = persona.plaintiffDangerLevel || persona.defenseDangerLevel
        ? ` [P:${persona.plaintiffDangerLevel || '?'} D:${persona.defenseDangerLevel || '?'}]`
        : '';

      console.log(
        `  ${persona.nickname || persona.name}${strength}${danger}` +
        ` - ${persona.sourceType}`
      );
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Total: ${personas.length} active personas`);

  // Show archetype config count
  const configCount = await prisma.archetypeConfig.count({
    where: { isActive: true },
  });
  console.log(`Archetype configs: ${configCount} active configurations`);
  console.log('='.repeat(80) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
