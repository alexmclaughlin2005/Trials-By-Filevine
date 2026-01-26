/**
 * Script to update roundtable prompts with novelty requirements and length caps
 *
 * Run with: npx tsx scripts/update-roundtable-prompts-novelty.ts
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating roundtable prompts with novelty requirements...\n');

  // Get or create conversation turn prompt
  const conversationTurnPrompt = await prisma.prompt.upsert({
    where: { serviceId: 'roundtable-conversation-turn' },
    update: {},
    create: {
      serviceId: 'roundtable-conversation-turn',
      name: 'Roundtable Conversation Turn',
      description: 'Prompt for persona to respond during ongoing conversation with novelty requirement',
      category: 'focus-group'
    }
  });

  // Delete old versions
  await prisma.promptVersion.deleteMany({
    where: { promptId: conversationTurnPrompt.id }
  });

  // Create new version
  const conversationTurnVersion = await prisma.promptVersion.create({
    data: {
      promptId: conversationTurnPrompt.id,
      version: 'v2.0.0',
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

{{#if establishedPoints}}
KEY POINTS ALREADY MADE (DO NOT REPEAT THESE):
{{establishedPoints}}

CRITICAL: The points above have already been established in the discussion. You must NOT simply restate them.
{{/if}}

{{#if customQuestions}}
QUESTIONS TO CONSIDER:
{{customQuestions}}
{{/if}}

Now it's your turn. {{lengthGuidance}}

As {{personaName}}, respond to the discussion. You MUST either:
1. Add a NEW point, observation, or argument not yet raised
2. Directly challenge or question something a specific person said
3. Share a personal reaction or experience that adds new perspective
4. Ask a clarifying question that moves the discussion forward

DO NOT simply restate what others have said in different words.{{#if customQuestions}} You may address relevant questions that haven't been fully explored.{{/if}}

IMPORTANT:
- Respond with ONLY your plain-text conversational statement
- Keep it to {{lengthGuidance}} (STRICT LIMIT)
- NO markdown, NO headers, NO formatting
- Talk naturally as if speaking out loud in a jury room
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
        lengthGuidance: 'string',
        personaName: 'string',
        customQuestions: 'string?',
        establishedPoints: 'string?'
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

  console.log('✅ Updated conversation turn prompt with novelty requirement (v2.0.0)');

  // Update initial reaction prompt with better length guidance
  const initialReactionPrompt = await prisma.prompt.upsert({
    where: { serviceId: 'roundtable-initial-reaction' },
    update: {},
    create: {
      serviceId: 'roundtable-initial-reaction',
      name: 'Roundtable Initial Reaction',
      description: 'Prompt for persona first reaction to an argument with length controls',
      category: 'focus-group'
    }
  });

  // Delete old versions
  await prisma.promptVersion.deleteMany({
    where: { promptId: initialReactionPrompt.id }
  });

  // Create new version
  const initialReactionVersion = await prisma.promptVersion.create({
    data: {
      promptId: initialReactionPrompt.id,
      version: 'v2.0.0',
      systemPrompt: '', // Uses persona system prompt
      userPromptTemplate: `THE CASE BEFORE YOU:
{{caseContext}}

THE ARGUMENT BEING DISCUSSED:
"{{argumentContent}}"

{{#if previousSpeakers}}
WHAT OTHERS HAVE ALREADY SAID:
{{previousSpeakers}}
{{/if}}

{{#if customQuestions}}
SPECIFIC QUESTIONS TO CONSIDER:
{{customQuestions}}
{{/if}}

Now it's your turn. {{lengthGuidance}}

Share your initial reaction to this argument. What do you think about it?{{#if customQuestions}} Feel free to address any of the questions above that resonate with you.{{/if}}

IMPORTANT:
- Respond with ONLY your plain-text conversational statement
- Keep it to {{lengthGuidance}} (STRICT LIMIT)
- NO markdown, NO headers, NO formatting
- Talk naturally as if speaking out loud in a jury room`,
      config: {
        model: 'claude-sonnet-4-20250514',
        maxTokens: 300,
        temperature: 0.7
      },
      variables: {
        caseContext: 'string',
        argumentContent: 'string',
        previousSpeakers: 'string?',
        lengthGuidance: 'string',
        customQuestions: 'string?'
      },
      outputSchema: {
        type: 'object',
        properties: {
          statement: {
            type: 'string',
            description: 'The persona\'s conversational statement'
          }
        }
      },
      isDraft: false
    }
  });

  // Set as current version
  await prisma.prompt.update({
    where: { id: initialReactionPrompt.id },
    data: { currentVersionId: initialReactionVersion.id }
  });

  console.log('✅ Updated initial reaction prompt with better length guidance (v2.0.0)');

  await prisma.$disconnect();
  console.log('\n✨ Prompt updates complete!');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
