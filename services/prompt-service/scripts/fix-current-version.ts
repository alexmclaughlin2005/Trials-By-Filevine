#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCurrentVersion() {
  console.log('Fixing current version for roundtable-takeaways-synthesis...');

  // Find the prompt
  const prompt = await prisma.prompt.findUnique({
    where: { serviceId: 'roundtable-takeaways-synthesis' },
    include: {
      versions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!prompt) {
    console.error('❌ Prompt not found');
    return;
  }

  console.log(`Found prompt: ${prompt.name}`);
  console.log(`  Current version ID: ${prompt.currentVersionId}`);
  console.log(`  Available versions: ${prompt.versions.length}`);

  if (prompt.versions.length === 0) {
    console.error('❌ No versions found');
    return;
  }

  // Get the latest version
  const latestVersion = prompt.versions[0];
  console.log(`  Latest version: ${latestVersion.version} (ID: ${latestVersion.id})`);

  if (prompt.currentVersionId === latestVersion.id) {
    console.log('✅ Current version is already set correctly');
    return;
  }

  // Update the prompt to set current version
  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { currentVersionId: latestVersion.id },
  });

  console.log(`✅ Set ${latestVersion.version} as current version`);
}

fixCurrentVersion()
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
