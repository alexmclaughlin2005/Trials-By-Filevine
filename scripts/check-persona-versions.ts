/**
 * Check Persona Versions in Database
 *
 * Quick script to verify persona version field values
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function checkVersions() {
  console.log('\n========================================');
  console.log('🔍 Checking Persona Versions');
  console.log('========================================\n');

  // Get sample personas
  const personas = await prisma.persona.findMany({
    where: { sourceType: 'system' },
    select: {
      id: true,
      name: true,
      archetype: true,
      version: true,
      isActive: true
    },
    take: 10,
    orderBy: { name: 'asc' }
  });

  console.log('📋 Sample personas (first 10):');
  personas.forEach(p => {
    console.log(`  - ${p.name.padEnd(30)} | archetype: ${(p.archetype || 'null').padEnd(15)} | version: ${p.version} | active: ${p.isActive}`);
  });

  // Get version distribution
  const versionCounts = await prisma.persona.groupBy({
    by: ['version'],
    where: { sourceType: 'system', isActive: true },
    _count: { version: true }
  });

  console.log('\n📊 Version distribution (active system personas):');
  versionCounts.forEach(v => {
    console.log(`  Version ${v.version === null ? 'NULL' : v.version}: ${v._count.version} personas`);
  });

  // Check total counts
  const totalSystem = await prisma.persona.count({
    where: { sourceType: 'system', isActive: true }
  });

  const v2Count = await prisma.persona.count({
    where: { sourceType: 'system', isActive: true, version: 2 }
  });

  console.log('\n📈 Totals:');
  console.log(`  Total active system personas: ${totalSystem}`);
  console.log(`  Version 2 personas: ${v2Count}`);
  console.log(`  Missing version field: ${totalSystem - v2Count}`);

  // Check archetype distribution for V2
  const archetypeCounts = await prisma.persona.groupBy({
    by: ['archetype'],
    where: { sourceType: 'system', isActive: true, version: 2 },
    _count: { archetype: true }
  });

  console.log('\n🏛️ V2 Archetype distribution:');
  archetypeCounts
    .sort((a, b) => (a.archetype || '').localeCompare(b.archetype || ''))
    .forEach(a => {
      console.log(`  ${(a.archetype || 'null').padEnd(20)}: ${a._count.archetype} personas`);
    });

  console.log('\n========================================\n');

  await prisma.$disconnect();
}

checkVersions().catch(console.error);
