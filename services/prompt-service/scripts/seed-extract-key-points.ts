#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedExtractKeyPoints() {
  console.log('Seeding Extract Key Points prompt...');

  // Check if already exists
  const existing = await prisma.prompt.findUnique({
    where: { serviceId: 'extract-key-points' },
  });

  if (existing) {
    console.log('Extract Key Points prompt already exists. Deleting to recreate...');

    // Delete existing prompt version first (if any)
    if (existing.currentVersionId) {
      await prisma.promptVersion.deleteMany({
        where: { promptId: existing.id }
      });
    }

    // Delete the prompt itself
    await prisma.prompt.delete({
      where: { id: existing.id }
    });

    console.log('✓ Deleted existing prompt');
  }

  // Create prompt
  const prompt = await prisma.prompt.create({
    data: {
      serviceId: 'extract-key-points',
      name: 'Extract Key Points from Statement',
      description: 'Extracts the main points and claims from a focus group participant statement for tracking conversation progress',
      category: 'analysis',
    },
  });

  console.log(`✓ Created prompt: ${prompt.name} (${prompt.id})`);

  // Create initial version
  const version = await prisma.promptVersion.create({
    data: {
      promptId: prompt.id,
      version: 'v1.0.0',
      systemPrompt: SYSTEM_PROMPT,
      userPromptTemplate: USER_PROMPT_TEMPLATE,
      config: {
        model: 'claude-sonnet-4-20250514',
        temperature: 0.3,
        maxTokens: 500,
      },
      variables: {
        statement: { type: 'string', required: true },
      },
    },
  });

  console.log(`✓ Created version: ${version.version}`);

  // CRITICAL: Set this version as the current version
  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { currentVersionId: version.id },
  });

  console.log(`✓ Set v${version.version} as current version`);
  console.log('✅ Extract Key Points prompt seeded successfully!');
}

const SYSTEM_PROMPT = `You are an expert at analyzing statements from focus group conversations and extracting the core points being made.

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

const USER_PROMPT_TEMPLATE = `Extract the key points from this focus group participant's statement:

Statement:
{{statement}}

Return only a JSON array of key point strings. Example:
["First key point", "Second key point"]`;

seedExtractKeyPoints()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding prompt:', error);
    process.exit(1);
  });
