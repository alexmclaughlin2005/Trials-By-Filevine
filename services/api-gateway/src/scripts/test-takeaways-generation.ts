import { PrismaClient } from '@juries/database';
import { PromptClient } from '@juries/prompt-client';
import { TakeawaysGenerator } from '../services/roundtable/takeaways-generator';

const prisma = new PrismaClient();

async function test() {
  const conversationId = '138cefe6-e93b-46ec-a35e-631f8f48b34a';

  const promptServiceUrl = process.env.PROMPT_SERVICE_URL || 'http://localhost:3002';
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    console.error('❌ ANTHROPIC_API_KEY not set');
    return;
  }

  console.log('📝 Testing Takeaways Generation');
  console.log(`   Conversation ID: ${conversationId}`);
  console.log(`   Prompt Service: ${promptServiceUrl}`);
  console.log('');

  console.log('1️⃣  Creating PromptClient...');
  const promptClient = new PromptClient({
    serviceUrl: promptServiceUrl,
    anthropicApiKey,
  });

  console.log('2️⃣  Creating TakeawaysGenerator...');
  const generator = new TakeawaysGenerator(prisma, promptClient);

  console.log('3️⃣  Generating takeaways...');
  console.log('');

  try {
    const takeaways = await generator.generateTakeaways(conversationId, false);
    console.log('');
    console.log('✅ Success!');
    console.log('');
    console.log('What Landed:', takeaways.whatLanded.length, 'points');
    console.log('What Confused:', takeaways.whatConfused.length, 'points');
    console.log('What Backfired:', takeaways.whatBackfired.length, 'points');
    console.log('Top Questions:', takeaways.topQuestions.length, 'questions');
    console.log('Recommended Edits:', takeaways.recommendedEdits.length, 'edits');
  } catch (error) {
    console.error('');
    console.error('❌ Error generating takeaways:');
    console.error('');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('');
      console.error('Stack:', error.stack);
    } else {
      console.error(error);
    }
  }

  await prisma.$disconnect();
}

test();
