#!/usr/bin/env tsx
/**
 * Remove duplicate personas from database
 * Keeps the most recently created version of each persona
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up duplicate personas\n');
  console.log('='.repeat(60));

  // Find duplicates: same name + archetype
  const personas = await prisma.persona.findMany({
    where: {
      isActive: true,
      sourceType: 'system',
    },
    orderBy: {
      createdAt: 'desc', // Most recent first
    },
  });

  const seen = new Map<string, string>(); // key -> persona id to keep
  const toDelete: string[] = [];

  for (const persona of personas) {
    const key = `${persona.name}_${persona.archetype || 'null'}`;

    if (seen.has(key)) {
      // This is a duplicate, mark for deletion
      toDelete.push(persona.id);
      console.log(`   🗑️  Duplicate: ${persona.nickname || persona.name} (${persona.archetype || 'null'})`);
    } else {
      // First occurrence, keep it
      seen.set(key, persona.id);
    }
  }

  if (toDelete.length === 0) {
    console.log('\n✨ No duplicates found!');
    return;
  }

  console.log(`\n📊 Found ${toDelete.length} duplicates to remove`);
  console.log(`   Keeping ${seen.size} unique personas`);

  // Delete duplicates
  const result = await prisma.persona.deleteMany({
    where: {
      id: {
        in: toDelete,
      },
    },
  });

  console.log(`\n✅ Deleted ${result.count} duplicate personas`);
  console.log('='.repeat(60));

  // Show final count
  const finalCount = await prisma.persona.count({
    where: { isActive: true },
  });
  console.log(`\n📈 Final persona count: ${finalCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
