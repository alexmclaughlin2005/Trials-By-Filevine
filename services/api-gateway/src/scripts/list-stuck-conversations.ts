/**
 * List all stuck conversations (have statements but no completedAt)
 *
 * Usage:
 *   npx tsx src/scripts/list-stuck-conversations.ts
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function listStuckConversations() {
  console.log('🔍 Finding stuck conversations...\n');

  const conversations = await prisma.focusGroupConversation.findMany({
    where: {
      completedAt: null
    },
    include: {
      _count: {
        select: {
          statements: true
        }
      }
    },
    orderBy: {
      startedAt: 'desc'
    }
  });

  if (conversations.length === 0) {
    console.log('✅ No stuck conversations found!');
    return;
  }

  const stuck = conversations.filter(c => c._count.statements > 0);

  if (stuck.length === 0) {
    console.log('✅ No stuck conversations found!');
    console.log(`   (${conversations.length} conversations are in progress with no statements yet)`);
    return;
  }

  console.log(`⚠️  Found ${stuck.length} stuck conversation(s):\n`);

  for (const conversation of stuck) {
    console.log(`  ID: ${conversation.id}`);
    console.log(`  Argument ID: ${conversation.argumentId}`);
    console.log(`  Statements: ${conversation._count.statements}`);
    console.log(`  Started: ${conversation.startedAt}`);
    console.log(`  Age: ${Math.round((Date.now() - new Date(conversation.startedAt).getTime()) / 1000 / 60)} minutes`);
    console.log('');
  }

  console.log(`\n💡 To fix a stuck conversation, run:`);
  console.log(`   npx tsx src/scripts/fix-stuck-conversation.ts <conversationId>`);
}

listStuckConversations()
  .catch(error => {
    console.error('Error listing conversations:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
