#!/usr/bin/env tsx

/**
 * Seed Script: Focus Group Question Generation Prompt
 *
 * This script seeds the Prompt Management Service database with the
 * "focus-group-questions" prompt used to generate AI-suggested questions
 * for virtual focus group simulations.
 *
 * Run with: npx tsx scripts/seed-focus-group-questions-prompt.ts
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding focus-group-questions prompt...');

  // Check if prompt already exists
  const existing = await prisma.prompt.findFirst({
    where: { serviceId: 'focus-group-questions' },
  });

  if (existing) {
    console.log('⚠️  Prompt already exists. Skipping creation.');
    console.log(`   Prompt ID: ${existing.id}`);
    console.log(`   Current Version ID: ${existing.currentVersionId || 'none'}`);
    return;
  }

  // Create prompt
  const prompt = await prisma.prompt.create({
    data: {
      serviceId: 'focus-group-questions',
      name: 'Focus Group Question Generator',
      description: 'Generates strategic questions for virtual focus group simulations based on trial arguments',
      category: 'generation',
    },
  });

  console.log(`✅ Created prompt: ${prompt.name}`);
  console.log(`   Prompt ID: ${prompt.id}`);

  // Create initial version
  const version = await prisma.promptVersion.create({
    data: {
      promptId: prompt.id,
      version: 'v1.0.0',
      systemPrompt: null, // Using user prompt only
      userPromptTemplate: `You are an expert trial consultant preparing questions for a virtual focus group simulation.

# Case Context
{{caseContext}}

# Arguments Being Tested
{{#each arguments}}
## Argument {{add @index 1}}
- **Title:** {{this.title}}
- **Type:** {{this.argumentType}}
- **Content:**
{{this.content}}

{{/each}}

# Your Task

Generate 4-6 strategic questions for each argument that will help assess how the focus group responds to the argument. These questions will be asked to virtual personas representing different juror archetypes.

**Question Goals:**
1. Gauge how well the argument resonates with different personality types
2. Identify concerns, doubts, or confusion the argument raises
3. Probe which specific elements are persuasive or weak
4. Understand emotional and logical reactions
5. Discover potential weaknesses before trial

**Question Guidelines:**
- Make questions open-ended and exploratory
- Encourage detailed reactions and reasoning
- Probe both emotional and logical responses
- Help identify what needs refinement
- Consider different personality types (analytical, empathetic, skeptical, etc.)

**Return JSON Format:**
\`\`\`json
{
  "questionsByArgument": [
    {
      "argumentId": "string",
      "argumentTitle": "string",
      "questions": [
        {
          "question": "What is your initial reaction to this argument?",
          "purpose": "Gauge overall first impression and emotional response",
          "targetArchetypes": ["all"]
        },
        {
          "question": "What specific parts of this argument do you find most convincing? Least convincing?",
          "purpose": "Identify strengths and weaknesses in argument structure",
          "targetArchetypes": ["Calculator", "Scale Balancer"]
        },
        {
          "question": "Does this argument raise any concerns or red flags for you?",
          "purpose": "Uncover potential objections or skepticism",
          "targetArchetypes": ["Scarred", "Trojan Horse"]
        }
      ]
    }
  ]
}
\`\`\`

**IMPORTANT:**
- Generate 4-6 questions per argument (not more, not less)
- Each question must have: question, purpose, targetArchetypes
- targetArchetypes can be specific archetype names or ["all"]
- Questions should feel natural and conversational
- Focus on uncovering actionable insights for refining arguments`,
      config: {
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 4000,
        temperature: 0.7, // Slightly higher for creative question generation
      },
      variables: {
        caseContext: 'string',
        arguments: 'array',
      },
      outputSchema: {
        type: 'object',
        properties: {
          questionsByArgument: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                argumentId: { type: 'string' },
                argumentTitle: { type: 'string' },
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      purpose: { type: 'string' },
                      targetArchetypes: {
                        type: 'array',
                        items: { type: 'string' },
                      },
                    },
                    required: ['question', 'purpose', 'targetArchetypes'],
                  },
                },
              },
              required: ['argumentId', 'argumentTitle', 'questions'],
            },
          },
        },
        required: ['questionsByArgument'],
      },
      notes: 'Initial version - generates strategic questions for focus group simulations',
      isDraft: false,
    },
  });

  console.log(`✅ Created version: ${version.version}`);
  console.log(`   Version ID: ${version.id}`);

  // Set as current version
  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { currentVersionId: version.id },
  });

  console.log(`✅ Set v${version.version} as current version`);
  console.log('\n✨ Focus group questions prompt seeded successfully!');
  console.log('\nNext steps:');
  console.log('1. Verify prompt service is running: curl http://localhost:3002/health');
  console.log('2. Test prompt rendering: curl -X POST http://localhost:3002/api/v1/prompts/focus-group-questions/render');
  console.log('3. Implement FocusGroupQuestionGeneratorService in API Gateway');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding prompt:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
