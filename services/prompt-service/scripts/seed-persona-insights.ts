import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SYSTEM_PROMPT = `You are an expert trial consultant analyzing individual juror psychology. Your task is to provide deep insights into how a specific persona interprets a legal case based on their responses during a focus group discussion.

You will analyze:
1. How this persona uniquely interprets the case through their personal lens
2. What biases and cognitive frameworks drive their thinking
3. What ultimately drives their decision-making
4. Specific persuasion strategies tailored to this persona
5. Their vulnerabilities (concerns to address) and strengths (values to leverage)

Be specific and actionable. Reference their actual statements to support your analysis.

CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON. Do not use markdown formatting. Return raw JSON only.`;

const USER_PROMPT_TEMPLATE = `# Persona Case Interpretation Analysis

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

async function seedPersonaInsights() {
  console.log('🌱 Seeding persona-case-insights prompt...');

  // Check if prompt already exists
  const existing = await prisma.prompt.findUnique({
    where: { serviceId: 'persona-case-insights' },
  });

  if (existing) {
    console.log(`  Prompt already exists (ID: ${existing.id})`);

    // Create new version
    const latestVersion = await prisma.promptVersion.findFirst({
      where: { promptId: existing.id },
      orderBy: { createdAt: 'desc' },
    });

    const versionMatch = latestVersion?.version.match(/v(\d+)\.(\d+)\.(\d+)/);
    const newVersion = versionMatch
      ? `v${versionMatch[1]}.${parseInt(versionMatch[2]) + 1}.0`
      : 'v1.0.0';

    const version = await prisma.promptVersion.create({
      data: {
        promptId: existing.id,
        version: newVersion,
        systemPrompt: SYSTEM_PROMPT,
        userPromptTemplate: USER_PROMPT_TEMPLATE,
        config: {
          model: 'claude-sonnet-4-20250514',
          temperature: 0.6,
          maxTokens: 2000,
        },
        variables: {
          personaName: { type: 'string', required: true },
          personaProfile: { type: 'string', required: true },
          archetype: { type: 'string', required: true },
          argumentTitle: { type: 'string', required: true },
          argumentContent: { type: 'string', required: true },
          personaStatements: { type: 'string', required: true },
          existingSummary: { type: 'string', required: true },
        },
      },
    });

    await prisma.prompt.update({
      where: { id: existing.id },
      data: { currentVersionId: version.id },
    });

    console.log(`  ✅ Created and deployed version: ${version.version}`);
    return;
  }

  // Create new prompt
  const prompt = await prisma.prompt.create({
    data: {
      serviceId: 'persona-case-insights',
      name: 'Persona Case Interpretation Insights',
      description: 'Analyzes how each persona interprets the case through their unique psychological lens and provides targeted persuasion strategies',
      category: 'analysis',
    },
  });

  console.log(`  Created prompt (ID: ${prompt.id})`);

  // Create initial version
  const version = await prisma.promptVersion.create({
    data: {
      promptId: prompt.id,
      version: 'v1.0.0',
      systemPrompt: SYSTEM_PROMPT,
      userPromptTemplate: USER_PROMPT_TEMPLATE,
      config: {
        model: 'claude-sonnet-4-20250514',
        temperature: 0.6,
        maxTokens: 2000,
      },
      variables: {
        personaName: { type: 'string', required: true },
        personaProfile: { type: 'string', required: true },
        archetype: { type: 'string', required: true },
        argumentTitle: { type: 'string', required: true },
        argumentContent: { type: 'string', required: true },
        personaStatements: { type: 'string', required: true },
        existingSummary: { type: 'string', required: true },
      },
    },
  });

  console.log(`  Created version: ${version.version}`);

  // Set as current version
  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { currentVersionId: version.id },
  });

  console.log(`  ✅ Set v${version.version} as current version`);
}

// Run the seed
seedPersonaInsights()
  .then(() => {
    console.log('✅ Persona insights prompt seeded successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error seeding prompt:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
