/**
 * Script to update roundtable prompts with dissent engagement instructions
 *
 * Run with: npx tsx scripts/update-roundtable-prompts-dissent.ts
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🎭 Updating roundtable prompts with dissent engagement...\\n');

  // Get or create conversation turn prompt
  const conversationTurnPrompt = await prisma.prompt.upsert({
    where: { serviceId: 'roundtable-conversation-turn' },
    update: {},
    create: {
      serviceId: 'roundtable-conversation-turn',
      name: 'Roundtable Conversation Turn',
      description: 'Prompt for persona to respond during ongoing conversation with dissent engagement',
      category: 'focus-group'
    }
  });

  // Delete old versions
  await prisma.promptVersion.deleteMany({
    where: { promptId: conversationTurnPrompt.id }
  });

  // Create new version with dissent engagement
  const conversationTurnVersion = await prisma.promptVersion.create({
    data: {
      promptId: conversationTurnPrompt.id,
      version: 'v4.0.0',
      systemPrompt: '', // Uses persona system prompt
      userPromptTemplate: `THE CASE BEFORE YOU:
{{caseContext}}

THE ARGUMENT BEING DISCUSSED:
"{{argumentContent}}"

DISCUSSION SO FAR:
{{conversationTranscript}}

{{#if lastSpeaker}}
{{lastSpeaker.name}} just said:
"{{lastSpeaker.statement}}"
{{/if}}

{{#if addressedToYou}}
NOTE: {{addressedToYou.speaker}} mentioned you or directed a comment at you: "{{addressedToYou.content}}"
{{/if}}

{{#if dissentInfo}}
⚠️ IMPORTANT - CONTRARIAN VIEW DETECTED:
{{dissentInfo.dissenterName}} just raised a contrarian position that goes against the emerging consensus. Their key points were:
- {{dissentInfo.dissentKeyPoints}}

You MUST directly engage with what {{dissentInfo.dissenterName}} said. Either:
- Explain specifically why you disagree with their reasoning
- Acknowledge a valid point they made before explaining your view
- Ask them a clarifying question about their position

DO NOT ignore their argument and just restate your own position. Address {{dissentInfo.dissenterName}} by name and engage with their specific points.
{{/if}}

{{#if establishedPoints}}
KEY POINTS ALREADY MADE (DO NOT REPEAT THESE):
{{establishedPoints}}

CRITICAL: The points above have already been established in the discussion. You must NOT simply restate them.
{{/if}}

{{#if customQuestions}}
QUESTIONS TO CONSIDER:
{{customQuestions}}
{{/if}}

HOW YOU COMMUNICATE:
{{#if vocabularyLevel}}
- You use {{vocabularyLevel}} vocabulary
{{/if}}
{{#if sentenceStyle}}
- Your sentences tend to be {{sentenceStyle}}
{{/if}}
{{#if speechPatterns}}
- You often say things like: {{speechPatterns}}
{{/if}}
{{#if engagementStyle}}
- When others speak, you tend to {{engagementStyle}}
{{/if}}

Now it's your turn. {{lengthGuidance}}

As {{personaName}}, respond to the discussion. {{#if dissentInfo}}Focus on engaging with {{dissentInfo.dissenterName}}'s contrarian view.{{else}}You MUST either:
1. Add a NEW point, observation, or argument not yet raised
2. Directly challenge or question something a specific person said
3. Share a personal reaction or experience that adds new perspective
4. Ask a clarifying question that moves the discussion forward{{/if}}

DO NOT simply restate what others have said in different words.{{#if customQuestions}} You may address relevant questions that haven't been fully explored.{{/if}}

IMPORTANT:
- Respond with ONLY your plain-text conversational statement
- Keep it to {{lengthGuidance}} (STRICT LIMIT)
- NO markdown, NO headers, NO formatting
- Talk naturally as if speaking out loud in a jury room
- Use your characteristic speech patterns and vocabulary level
- Use other jurors' names when referring to their points`,
      config: {
        model: 'claude-sonnet-4-20250514',
        maxTokens: 400,
        temperature: 0.7
      },
      variables: {
        caseContext: 'string',
        argumentContent: 'string',
        conversationTranscript: 'string',
        lastSpeaker: 'object?',
        addressedToYou: 'object?',
        dissentInfo: 'object?',
        lengthGuidance: 'string',
        personaName: 'string',
        customQuestions: 'string?',
        establishedPoints: 'string?',
        vocabularyLevel: 'string?',
        sentenceStyle: 'string?',
        speechPatterns: 'string?',
        engagementStyle: 'string?'
      },
      outputSchema: {
        type: 'object',
        properties: {
          statement: {
            type: 'string',
            description: 'The persona\'s conversational response'
          }
        }
      },
      isDraft: false
    }
  });

  // Set as current version
  await prisma.prompt.update({
    where: { id: conversationTurnPrompt.id },
    data: { currentVersionId: conversationTurnVersion.id }
  });

  console.log('✅ Updated conversation turn prompt with dissent engagement (v4.0.0)');

  await prisma.$disconnect();
  console.log('\\n✨ Prompt update complete!');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
