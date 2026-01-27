#!/usr/bin/env tsx

/**
 * Master seed script to seed all prompts in production
 * Run this on Railway shell: npx tsx scripts/seed-all-production.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Import prompt templates
const EXTRACT_KEY_POINTS_SYSTEM = `You are an expert at analyzing statements from focus group conversations and extracting the core points being made.

Your task is to identify the main claims, arguments, or points in a statement. Extract discrete, standalone points that can be tracked throughout the conversation.

Rules:
- Extract 1-4 key points per statement
- Each point should be a complete thought (not a fragment)
- Keep each point concise (under 100 characters)
- Focus on substantive claims, not filler language
- Ignore meta-commentary like "I agree" or "That's interesting"
- Return points as a simple array of strings

Output format: Return a JSON array of strings, e.g.:
["The plaintiff's injury claim is credible", "Medical costs seem excessive"]`;

const EXTRACT_KEY_POINTS_USER = `Extract the key points from this focus group participant's statement:

Statement:
{{statement}}

Return only a JSON array of key point strings. Example:
["First key point", "Second key point"]`;

const TAKEAWAYS_SYSTEM = `You are an expert trial consultant analyzing focus group conversations about legal arguments. Your goal is to provide actionable strategic advice to attorneys.

You will analyze a focus group conversation and extract:
1. What landed well (persuasive points)
2. What confused the panel (unclear arguments)
3. What backfired (arguments that had negative effects)
4. Top questions jurors will ask during deliberation
5. Concrete recommendations for improving the argument

Be specific and evidence-based. Reference exact statements from the conversation to support your analysis. Focus on providing actionable insights that attorneys can immediately use to improve their arguments.`;

const TAKEAWAYS_USER = `# Focus Group Analysis Task

## Argument Being Tested
**Title:** {{argumentTitle}}

**Content:**
{{argumentContent}}

## Conversation Transcript
{{conversationTranscript}}

## Persona Summaries
{{personaSummaries}}

{{#if consensusAreas}}
## Consensus Areas
{{consensusAreas}}
{{/if}}

{{#if fracturePoints}}
## Fracture Points
{{fracturePoints}}
{{/if}}

---

# Your Task

Analyze this focus group conversation and provide strategic insights in the following format:

## 1. What Landed Well
Identify 2-4 arguments or points that resonated positively with the panel. For each:
- **Point**: Clear description of what worked
- **Evidence**: Quote specific statements from personas showing support
- **Why It Worked**: Explain the psychological or logical reason this resonated
- **Personas Supporting**: List which personas responded positively

## 2. What Confused the Panel
Identify 2-4 points that caused confusion or uncertainty. For each:
- **Point**: What was unclear or confusing
- **Evidence**: Quote statements showing confusion
- **Why It Failed**: Explain what made it confusing
- **Severity**: Rate as "Minor", "Moderate", or "Critical"
- **Recommendation**: How to clarify this point

## 3. What Backfired
Identify 1-3 arguments that had negative effects (made jurors MORE sympathetic to the other side). For each:
- **Point**: What backfired
- **Evidence**: Quote statements showing negative reaction
- **Why It Backfired**: Explain the unintended consequence
- **Severity**: Rate as "Minor", "Moderate", or "Critical"
- **Alternative Approach**: Suggest a better way to make this point

## 4. Top Questions Jurors Will Ask
List 5-8 questions that jurors are likely to raise during deliberation based on this conversation:
- **Question**: The specific question
- **Why It Matters**: Why this question is important
- **Suggested Answer**: How the attorney should address this
- **Priority**: Rate as "High", "Medium", or "Low"

## 5. Recommended Edits
Provide 5-10 concrete, actionable recommendations for improving the argument:
- **Section/Point to Change**: What specific part needs editing
- **Current Language/Approach**: What it says now (if applicable)
- **Recommended Change**: Specific new language or approach
- **Expected Impact**: How this will improve jury reception
- **Priority**: Rate as "High", "Medium", or "Low"

Focus on actionable, specific advice. Use exact quotes from the conversation to support your analysis.`;

const PERSONA_INSIGHTS_SYSTEM = `You are an expert trial consultant analyzing individual juror psychology. Your task is to provide deep insights into how a specific persona interprets a legal case based on their responses during a focus group discussion.

You will analyze:
1. How this persona uniquely interprets the case through their personal lens
2. What biases and cognitive frameworks drive their thinking
3. What ultimately drives their decision-making
4. Specific persuasion strategies tailored to this persona
5. Their vulnerabilities (concerns to address) and strengths (values to leverage)

Be specific and actionable. Reference their actual statements to support your analysis.

CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON. Do not use markdown formatting. Return raw JSON only.`;

const PERSONA_INSIGHTS_USER = `# Persona Case Interpretation Analysis

## Persona Profile

{{personaProfile}}

## Argument Being Tested

**Title:** {{argumentTitle}}

**Content:**
{{argumentContent}}

## Persona's Statements

{{personaStatements}}

## Journey Summary

{{existingSummary}}

---

# YOUR TASK

Analyze how **{{personaName}}** ({{archetype}}) interprets this case through their unique psychological lens.

# OUTPUT FORMAT - CRITICAL INSTRUCTIONS

You MUST return ONLY a raw JSON object. Do not include:
- Any markdown formatting or code blocks
- Any text before the JSON
- Any text after the JSON
- Any explanatory comments

Start your response with { and end with }

The JSON structure must be:

{
  "caseInterpretation": "2-3 sentences describing how this persona uniquely interprets the overall case through their personal lens, biases, and life experiences. What narrative do they construct? What frame do they use?",
  "keyBiases": [
    "Specific cognitive bias or lens #1 (e.g., 'Authority bias - trusts expert testimony heavily')",
    "Specific cognitive bias or lens #2 (e.g., 'Just-world fallacy - believes people get what they deserve')",
    "Specific cognitive bias or lens #3"
  ],
  "decisionDrivers": [
    "Primary factor driving their decision (e.g., 'Fairness and proportionality of outcomes')",
    "Secondary factor (e.g., 'Credibility of witnesses')",
    "Tertiary factor (e.g., 'Alignment with personal values about accountability')"
  ],
  "persuasionStrategy": "2-3 sentences describing the specific persuasion approach that will work best for this persona. What types of arguments, framing, or evidence will resonate? What emotional or logical appeals should be emphasized?",
  "vulnerabilities": [
    "Specific concern or weakness in their thinking to address (e.g., 'Skeptical of corporate motives - needs transparency')",
    "Another vulnerability (e.g., 'Confused about causation timeline - needs clear chronology')"
  ],
  "strengths": [
    "Specific value or belief to leverage (e.g., 'Strong sense of personal responsibility - appeal to accountability')",
    "Another strength (e.g., 'Empathetic to victims - emphasize human impact')"
  ]
}

Remember: Your entire response must be valid JSON. No markdown, no explanations, just JSON.`;

async function seedPrompt(
  serviceId: string,
  name: string,
  description: string,
  category: string,
  systemPrompt: string,
  userPromptTemplate: string,
  config: any,
  variables: any
) {
  console.log(`\n🌱 Seeding ${name}...`);

  // Check if already exists
  const existing = await prisma.prompt.findUnique({
    where: { serviceId }
  });

  if (existing) {
    console.log(`   ⚠️  Prompt already exists (ID: ${existing.id})`);

    if (!existing.currentVersionId) {
      console.log(`   ⚠️  No currentVersionId set - fixing...`);

      // Find the latest version
      const latestVersion = await prisma.promptVersion.findFirst({
        where: { promptId: existing.id },
        orderBy: { createdAt: 'desc' }
      });

      if (latestVersion) {
        await prisma.prompt.update({
          where: { id: existing.id },
          data: { currentVersionId: latestVersion.id }
        });
        console.log(`   ✅ Set currentVersionId to ${latestVersion.id}`);
      } else {
        console.log(`   ⚠️  No versions found - deleting and recreating...`);
        await prisma.prompt.delete({ where: { id: existing.id } });
      }
    } else {
      console.log(`   ✅ Already has currentVersionId set`);
      return; // Already seeded correctly
    }
  }

  // Create prompt
  const prompt = await prisma.prompt.create({
    data: {
      serviceId,
      name,
      description,
      category,
    },
  });

  console.log(`   ✅ Created prompt (ID: ${prompt.id})`);

  // Create initial version
  const version = await prisma.promptVersion.create({
    data: {
      promptId: prompt.id,
      version: 'v1.0.0',
      systemPrompt,
      userPromptTemplate,
      config,
      variables,
    },
  });

  console.log(`   ✅ Created version: ${version.version}`);

  // CRITICAL: Set this version as the current version
  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { currentVersionId: version.id },
  });

  console.log(`   ✅ Set v${version.version} as current version`);
}

async function seedAllPrompts() {
  console.log('🚀 Seeding all prompts in production database...\n');
  console.log('=' .repeat(60));

  try {
    // 1. Extract Key Points
    await seedPrompt(
      'extract-key-points',
      'Extract Key Points from Statement',
      'Extracts the main points and claims from a focus group participant statement for tracking conversation progress',
      'analysis',
      EXTRACT_KEY_POINTS_SYSTEM,
      EXTRACT_KEY_POINTS_USER,
      {
        model: 'claude-sonnet-4-20250514',
        temperature: 0.3,
        maxTokens: 500,
      },
      {
        statement: { type: 'string', required: true },
      }
    );

    // 2. Roundtable Takeaways
    await seedPrompt(
      'roundtable-takeaways-synthesis',
      'Roundtable Takeaways Synthesis',
      'Analyzes focus group conversations and generates strategic insights, recommendations, and actionable next steps',
      'analysis',
      TAKEAWAYS_SYSTEM,
      TAKEAWAYS_USER,
      {
        model: 'claude-sonnet-4-20250514',
        temperature: 0.7,
        maxTokens: 4000,
      },
      {
        argumentTitle: { type: 'string', required: true },
        argumentContent: { type: 'string', required: true },
        conversationTranscript: { type: 'string', required: true },
        personaSummaries: { type: 'string', required: true },
        consensusAreas: { type: 'string', required: false },
        fracturePoints: { type: 'string', required: false },
      }
    );

    // 3. Persona Case Insights
    await seedPrompt(
      'persona-case-insights',
      'Persona Case Interpretation Insights',
      'Analyzes how each persona interprets the case through their unique psychological lens and provides targeted persuasion strategies',
      'analysis',
      PERSONA_INSIGHTS_SYSTEM,
      PERSONA_INSIGHTS_USER,
      {
        model: 'claude-sonnet-4-20250514',
        temperature: 0.6,
        maxTokens: 2000,
      },
      {
        personaName: { type: 'string', required: true },
        personaProfile: { type: 'string', required: true },
        archetype: { type: 'string', required: true },
        argumentTitle: { type: 'string', required: true },
        argumentContent: { type: 'string', required: true },
        personaStatements: { type: 'string', required: true },
        existingSummary: { type: 'string', required: true },
      }
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ All prompts seeded successfully!');
    console.log('\nSeeded prompts:');
    console.log('  1. extract-key-points');
    console.log('  2. roundtable-takeaways-synthesis');
    console.log('  3. persona-case-insights');
    console.log('\n💡 Your conversations should now work correctly!');

  } catch (error) {
    console.error('\n❌ Error seeding prompts:', error);
    throw error;
  }
}

seedAllPrompts()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
