/**
 * Quick verification script for roundtable conversation setup
 *
 * Run with: npx tsx scripts/test-roundtable-setup.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from packages/database/.env
config({ path: resolve(__dirname, '../packages/database/.env') });

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Roundtable Conversation Setup...\n');

  let passed = 0;
  let failed = 0;

  // Check 1: Conversation table exists
  try {
    await prisma.$queryRaw`SELECT 1 FROM focus_group_conversations LIMIT 1`;
    console.log('✅ focus_group_conversations table exists');
    passed++;
  } catch (error) {
    console.log('❌ focus_group_conversations table missing');
    failed++;
  }

  // Check 2: Statement table exists
  try {
    await prisma.$queryRaw`SELECT 1 FROM focus_group_statements LIMIT 1`;
    console.log('✅ focus_group_statements table exists');
    passed++;
  } catch (error) {
    console.log('❌ focus_group_statements table missing');
    failed++;
  }

  // Check 3: Persona leadership fields exist
  try {
    const persona = await prisma.persona.findFirst({
      select: { leadershipLevel: true, communicationStyle: true }
    });
    console.log('✅ Persona leadership fields exist');
    passed++;
  } catch (error) {
    console.log('❌ Persona leadership fields missing');
    failed++;
  }

  // Check 4: Personas have leadership levels assigned
  const personasWithLeadership = await prisma.persona.count({
    where: { leadershipLevel: { not: null } }
  });
  if (personasWithLeadership > 0) {
    console.log(`✅ ${personasWithLeadership} personas have leadership levels assigned`);
    passed++;
  } else {
    console.log('❌ No personas have leadership levels assigned');
    console.log('   Run: npx tsx scripts/assign-persona-leadership.ts');
    failed++;
  }

  // Check 5: Roundtable prompts exist
  const prompts = await prisma.prompt.count({
    where: {
      serviceId: {
        in: [
          'roundtable-persona-system',
          'roundtable-initial-reaction',
          'roundtable-conversation-turn',
          'roundtable-statement-analysis',
          'roundtable-conversation-synthesis'
        ]
      }
    }
  });
  if (prompts === 5) {
    console.log(`✅ All 5 roundtable prompts are seeded`);
    passed++;
  } else {
    console.log(`⚠️ Only ${prompts}/5 roundtable prompts found`);
    console.log('   Run: npx tsx scripts/add-roundtable-prompts.ts');
    failed++;
  }

  // Check 6: Environment variable
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('✅ ANTHROPIC_API_KEY is set');
    passed++;
  } else {
    console.log('⚠️ ANTHROPIC_API_KEY not found (will use mock mode)');
    passed++; // Not critical for testing
  }

  // Check 7: Focus group sessions exist
  const sessions = await prisma.focusGroupSession.count();
  if (sessions > 0) {
    console.log(`✅ ${sessions} focus group session(s) exist for testing`);
    passed++;
  } else {
    console.log('ℹ️  No focus group sessions yet (create one via UI)');
    passed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(50) + '\n');

  if (failed === 0) {
    console.log('🎉 Setup is complete! Ready to test roundtable conversations.\n');
    console.log('Next steps:');
    console.log('1. Start services:');
    console.log('   - Terminal 1: cd services/prompt-service && npm run dev');
    console.log('   - Terminal 2: cd services/api-gateway && npm run dev');
    console.log('   - Terminal 3: cd apps/web && npm run dev');
    console.log('2. Navigate to a case → Focus Groups');
    console.log('3. Create a session and click "Start Roundtable Discussion"');
  } else {
    console.log('⚠️ Setup incomplete. Please fix the issues above.\n');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
