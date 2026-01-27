/**
 * Fix stuck conversations that have statements but are not marked as complete
 *
 * Usage:
 *   npx tsx src/scripts/fix-stuck-conversation.ts <conversationId>
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function fixStuckConversation(conversationId: string) {
  console.log(`🔧 Fixing stuck conversation: ${conversationId}`);

  // Check if conversation exists
  const conversation = await prisma.focusGroupConversation.findUnique({
    where: { id: conversationId },
    include: {
      statements: {
        select: {
          id: true
        }
      }
    }
  });

  if (!conversation) {
    console.error(`❌ Conversation not found: ${conversationId}`);
    process.exit(1);
  }

  console.log(`  Current state:`);
  console.log(`  - Statements: ${conversation.statements.length}`);
  console.log(`  - Started: ${conversation.startedAt}`);
  console.log(`  - Completed: ${conversation.completedAt}`);
  console.log(`  - Converged: ${conversation.converged}`);

  // Check if already complete
  if (conversation.completedAt) {
    console.log(`✅ Conversation already marked as complete`);
    process.exit(0);
  }

  // Check if has statements
  if (conversation.statements.length === 0) {
    console.error(`❌ Conversation has no statements, cannot mark as complete`);
    process.exit(1);
  }

  // Mark as complete
  const updated = await prisma.focusGroupConversation.update({
    where: { id: conversationId },
    data: {
      completedAt: new Date(),
      converged: false,
      convergenceReason: 'Manually marked as complete after being stuck. Conversation generated statements but did not complete naturally.'
    }
  });

  console.log(`✅ Conversation marked as complete:`);
  console.log(`  - Completed: ${updated.completedAt}`);
  console.log(`  - Converged: ${updated.converged}`);
  console.log(`  - Reason: ${updated.convergenceReason}`);
  console.log(`\n🎉 You can now generate takeaways for this conversation!`);
}

// Get conversation ID from command line args
const conversationId = process.argv[2];

if (!conversationId) {
  console.error('Usage: npx tsx src/scripts/fix-stuck-conversation.ts <conversationId>');
  process.exit(1);
}

fixStuckConversation(conversationId)
  .catch(error => {
    console.error('Error fixing conversation:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
