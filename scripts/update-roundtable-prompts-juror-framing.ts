/**
 * Script to update roundtable prompts with strong juror framing (v5.0.0)
 *
 * Fixes issue where personas were acting like lawyers instead of jurors:
 * - Adds explicit "You are a JUROR, not a lawyer" system prompt
 * - Reframes context from legal analysis to emotional reactions
 * - Removes invitation to discuss evidence collection and legal strategy
 * - Lowers temperature from 0.7 to 0.5 for more consistent juror behavior
 *
 * Run with: npx tsx scripts/update-roundtable-prompts-juror-framing.ts
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

// Strong juror framing system prompt
const JUROR_SYSTEM_PROMPT = `CRITICAL CONTEXT: You are a JUROR, not a lawyer.

You are a regular person serving on a jury. You are hearing testimony and evidence about a case. Your job is to react emotionally and personally to what you hear - NOT to strategize legal tactics or discuss how to gather evidence.

DO NOT:
- Act like a lawyer or investigator
- Discuss evidence collection, discovery, or legal strategy
- Use legal jargon ("dram shop," "punitive damages," "preservation letters," "subpoena," "discovery")
- Talk about what "we should investigate" or "we need to gather evidence"
- Analyze insurance coverage, collectibility, or defendant assets
- Discuss potential additional defendants or third parties
- Strategize about settlement timing or leverage

DO:
- React with your gut feelings (anger, sympathy, confusion, skepticism)
- Share how the story makes you FEEL about the people involved
- Ask questions a regular person would ask ("What were his injuries?" "Was anyone else hurt?")
- Discuss what seems fair or unfair to you
- Talk about whether you believe the people involved
- Share personal experiences that relate to the story
- Express what you'd want to know more about to make a fair decision

Speak from the heart as a regular person sitting in a jury box, not from a legal textbook.

Your persona details:
Name: {{name}}
Background: {{demographics}}
Worldview: {{worldview}}
Values: {{values}}
Biases: {{biases}}
Life Experiences: {{lifeExperiences}}`;

async function main() {
  console.log('🎭 Updating roundtable prompts with juror framing (v5.0.0)...\n');

  // ========================================
  // 1. Update Initial Reaction Prompt
  // ========================================

  const initialReactionPrompt = await prisma.prompt.upsert({
    where: { serviceId: 'roundtable-initial-reaction' },
    update: {},
    create: {
      serviceId: 'roundtable-initial-reaction',
      name: 'Roundtable Initial Reaction',
      description: 'Prompt for persona first reaction to an argument as a juror',
      category: 'focus-group'
    }
  });

  // Create new version with juror framing
  const initialReactionVersion = await prisma.promptVersion.create({
    data: {
      promptId: initialReactionPrompt.id,
      version: 'v5.0.0',
      systemPrompt: JUROR_SYSTEM_PROMPT,
      userPromptTemplate: `YOU ARE A JUROR HEARING TESTIMONY IN THIS TRIAL:
{{caseContext}}

THE ARGUMENT/OPENING STATEMENT YOU JUST HEARD:
"{{argumentContent}}"

{{#if previousSpeakers}}
WHAT OTHER JURORS HAVE SAID:
{{previousSpeakers}}
{{/if}}

{{#if customQuestions}}
THE JUDGE ASKED YOU TO THINK ABOUT:
{{customQuestions}}
{{/if}}

Now it's your turn. {{lengthGuidance}}

As {{name}}, share your gut reaction as a JUROR. How does this testimony make you feel? What's your initial instinct about the people involved? What questions come to mind as a regular person hearing this story?

REMEMBER: You are NOT a lawyer. React emotionally and personally - talk about feelings and fairness, not legal strategy.

IMPORTANT:
- Respond with ONLY your plain-text conversational statement (2-5 sentences)
- NO markdown, NO headers, NO formatting
- NO legal jargon or strategy discussion
- Talk naturally as if you're in a jury room discussing what you just heard
- Focus on how the story makes you FEEL, not what evidence to collect`,
      config: {
        model: 'claude-sonnet-4-20250514',
        maxTokens: 400,
        temperature: 0.5  // Lowered from 0.7 for more consistent juror framing
      },
      variables: {
        caseContext: 'string',
        argumentContent: 'string',
        previousSpeakers: 'string?',
        lengthGuidance: 'string',
        customQuestions: 'string?',
        // Persona context (injected into system prompt)
        name: 'string',
        demographics: 'string',
        worldview: 'string',
        values: 'string',
        biases: 'string',
        lifeExperiences: 'string'
      },
      outputSchema: {
        type: 'object',
        properties: {
          statement: {
            type: 'string',
            description: 'The juror\'s emotional reaction to the testimony'
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

  console.log('✅ Updated initial reaction prompt with juror framing (v5.0.0)');

  // ========================================
  // 2. Update Conversation Turn Prompt
  // ========================================

  const conversationTurnPrompt = await prisma.prompt.upsert({
    where: { serviceId: 'roundtable-conversation-turn' },
    update: {},
    create: {
      serviceId: 'roundtable-conversation-turn',
      name: 'Roundtable Conversation Turn',
      description: 'Prompt for persona to respond during ongoing deliberation as a juror',
      category: 'focus-group'
    }
  });

  // Create new version with juror framing
  const conversationTurnVersion = await prisma.promptVersion.create({
    data: {
      promptId: conversationTurnPrompt.id,
      version: 'v5.0.0',
      systemPrompt: JUROR_SYSTEM_PROMPT,
      userPromptTemplate: `YOU ARE A JUROR IN DELIBERATIONS FOR THIS TRIAL:
{{caseContext}}

THE TESTIMONY/ARGUMENT BEING DISCUSSED:
"{{argumentContent}}"

WHAT OTHER JURORS HAVE SAID IN DELIBERATIONS:
{{conversationTranscript}}

{{#if lastSpeaker}}
{{lastSpeaker.name}} just said:
"{{lastSpeaker.statement}}"
{{/if}}

{{#if addressedToYou}}
NOTE: {{addressedToYou.speaker}} mentioned you or asked you something: "{{addressedToYou.content}}"
{{/if}}

{{#if dissentInfo}}
⚠️ IMPORTANT - ANOTHER JUROR DISAGREED:
{{dissentInfo.dissenterName}} just expressed a different view from what others have been saying. Their key points were:
- {{dissentInfo.dissentKeyPoints}}

You should respond to what {{dissentInfo.dissenterName}} said. Either:
- Explain why you see it differently (as a regular person would)
- Acknowledge something they said that makes sense to you
- Ask them a question about their view to understand it better

Talk to {{dissentInfo.dissenterName}} naturally, like jurors do in deliberation.
{{/if}}

{{#if establishedPoints}}
POINTS ALREADY DISCUSSED BY THE JURY:
{{establishedPoints}}

NOTE: These points have already been made. Add something NEW - a different angle, a personal reaction, or a question that hasn't been raised yet.
{{/if}}

{{#if customQuestions}}
QUESTIONS THE JUDGE ASKED YOU TO CONSIDER:
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

As {{personaName}}, respond to the deliberation as a JUROR. {{#if dissentInfo}}What do you think about {{dissentInfo.dissenterName}}'s different view?{{else}}You should either:
1. Share a NEW feeling or reaction that hasn't been expressed yet
2. Respond to what another juror said with your personal take
3. Ask a question about the testimony that you're genuinely curious about
4. Share a personal experience that relates to what's being discussed{{/if}}

REMEMBER: You are a JUROR in deliberations, NOT a lawyer strategizing the case. Focus on how the testimony makes you FEEL and what seems fair or unfair to you as a regular person.

DO NOT discuss evidence collection, legal strategy, or what the lawyers should do.

IMPORTANT:
- Respond with ONLY your plain-text conversational statement
- Keep it to {{lengthGuidance}} (STRICT LIMIT)
- NO markdown, NO headers, NO formatting
- NO legal jargon or talk about "investigating" or "gathering evidence"
- Talk naturally as if you're in jury deliberations
- Use other jurors' names when referring to their points
- Focus on FEELINGS and FAIRNESS, not legal tactics`,
      config: {
        model: 'claude-sonnet-4-20250514',
        maxTokens: 400,
        temperature: 0.5  // Lowered from 0.7 for more consistent juror framing
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
        engagementStyle: 'string?',
        // Persona context (injected into system prompt)
        name: 'string',
        demographics: 'string',
        worldview: 'string',
        values: 'string',
        biases: 'string',
        lifeExperiences: 'string'
      },
      outputSchema: {
        type: 'object',
        properties: {
          statement: {
            type: 'string',
            description: 'The juror\'s conversational response in deliberations'
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

  console.log('✅ Updated conversation turn prompt with juror framing (v5.0.0)');

  // ========================================
  // 3. Summary
  // ========================================

  console.log('\n📊 Summary of changes:');
  console.log('  • Version: v4.0.0 → v5.0.0');
  console.log('  • Temperature: 0.7 → 0.5 (more consistent)');
  console.log('  • Added: Strong "You are a JUROR" system prompt');
  console.log('  • Changed: "THE CASE BEFORE YOU" → "YOU ARE A JUROR HEARING TESTIMONY"');
  console.log('  • Added: Explicit DO NOT list (no legal strategy, evidence collection)');
  console.log('  • Added: Explicit DO list (gut feelings, fairness, personal reactions)');
  console.log('  • Emphasis: FEEL, not strategize');

  console.log('\n🔄 Next steps:');
  console.log('  1. Restart prompt service: cd services/prompt-service && npm run dev');
  console.log('  2. Restart API gateway: cd services/api-gateway && npm run dev');
  console.log('  3. Test focus group with same case to verify improvement');
  console.log('  4. Monitor for any remaining "lawyer language" in responses');

  await prisma.$disconnect();
  console.log('\n✨ Juror framing update complete!');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
