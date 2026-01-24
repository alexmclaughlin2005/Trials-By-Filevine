/**
 * Force update roundtable prompts (delete and recreate)
 * Use this when you need to update existing prompts
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Force updating roundtable conversation prompts...\n');

  // Delete all existing roundtable prompts
  console.log('Deleting existing prompts...');
  const deleted = await prisma.prompt.deleteMany({
    where: {
      serviceId: {
        in: [
          'roundtable-persona-system',
          'roundtable-initial-reaction',
          'roundtable-conversation-turn'
        ]
      }
    }
  });
  console.log(`✅ Deleted ${deleted.count} existing prompts\n`);

  // Now run the regular seed script logic
  console.log('Creating updated prompts...\n');

  // Import and run the add script
  const { exec } = require('child_process');
  exec('npx tsx scripts/add-roundtable-prompts.ts', (error: any, stdout: string, stderr: string) => {
    if (error) {
      console.error(`Error: ${error}`);
      return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
