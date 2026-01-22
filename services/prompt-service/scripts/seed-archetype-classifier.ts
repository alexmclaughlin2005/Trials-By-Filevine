#!/usr/bin/env tsx

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function seedArchetypeClassifier() {
  console.log('Seeding Archetype Classifier prompt...');

  // Check if already exists
  const existing = await prisma.prompt.findUnique({
    where: { serviceId: 'archetype-classifier' },
  });

  if (existing) {
    console.log('Archetype Classifier prompt already exists. Skipping...');
    return;
  }

  // Create prompt
  const prompt = await prisma.prompt.create({
    data: {
      serviceId: 'archetype-classifier',
      name: 'Archetype Classification',
      description: 'Classifies jurors into 10 behavioral archetypes based on psychological dimensions',
      category: 'classification',
    },
  });

  console.log(`✓ Created prompt: ${prompt.name} (${prompt.id})`);

  // Create initial version
  const version = await prisma.promptVersion.create({
    data: {
      promptId: prompt.id,
      version: 'v1.0.0',
      systemPrompt: null,
      userPromptTemplate: `You are an expert jury consultant specializing in juror behavioral psychology. Your task is to classify jurors into behavioral archetypes that predict verdict preferences and deliberation styles.

## INPUT DATA

{{jurorData}}

## ARCHETYPE DEFINITIONS

{{archetypeDefinitions}}

## TASK

Analyze the juror data and classify them into their PRIMARY archetype and optionally a SECONDARY archetype if they show strong characteristics of multiple types.

For each classification:
1. Assess confidence score (0.0-1.0)
2. Provide reasoning based on evidence
3. Calculate 8 psychological dimension scores (1-5 scale)
4. Determine plaintiff/defense danger levels (1-5)
5. Suggest voir dire questions
6. Identify cause challenge vulnerabilities

## OUTPUT FORMAT

Return ONLY valid JSON matching this exact schema:

\`\`\`json
{
  "primaryArchetype": {
    "archetypeId": "string",
    "archetypeName": "string",
    "confidence": 0.0-1.0,
    "reasoning": "string"
  },
  "secondaryArchetype": {
    "archetypeId": "string",
    "archetypeName": "string",
    "confidence": 0.0-1.0,
    "reasoning": "string"
  },
  "psychologicalDimensions": {
    "empathyVsSkepticism": 1-5,
    "rulesVsEquity": 1-5,
    "authorityTrust": 1-5,
    "corporateTrust": 1-5,
    "plaintiffSympathy": 1-5,
    "defenseSympathy": 1-5,
    "riskTolerance": 1-5,
    "changeOrientation": 1-5
  },
  "strategicAssessment": {
    "plaintiffDangerLevel": 1-5,
    "defenseDangerLevel": 1-5,
    "influencePotential": "low | medium | high",
    "deliberationStyle": "string"
  },
  "voirDireRecommendations": {
    "probeQuestions": ["string"],
    "redFlags": ["string"],
    "idealAnswers": ["string"]
  },
  "causeChallenge": {
    "vulnerability": "low | medium | high",
    "potentialGrounds": ["string"]
  }
}
\`\`\`

Be specific, evidence-based, and strategic in your analysis.`,
      config: {
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 4000,
        temperature: 0.3,
      },
      variables: {
        jurorData: {
          type: 'string',
          description: 'Formatted juror information (demographics, questionnaire, research)',
          required: true,
        },
        archetypeDefinitions: {
          type: 'string',
          description: '10 archetype definitions with dimension mappings',
          required: true,
        },
      },
      outputSchema: {
        type: 'object',
        required: ['primaryArchetype', 'psychologicalDimensions', 'strategicAssessment'],
        properties: {
          primaryArchetype: {
            type: 'object',
            required: ['archetypeId', 'archetypeName', 'confidence', 'reasoning'],
          },
          secondaryArchetype: {
            type: 'object',
            nullable: true,
          },
          psychologicalDimensions: {
            type: 'object',
            required: [
              'empathyVsSkepticism',
              'rulesVsEquity',
              'authorityTrust',
              'corporateTrust',
              'plaintiffSympathy',
              'defenseSympathy',
              'riskTolerance',
              'changeOrientation',
            ],
          },
          strategicAssessment: {
            type: 'object',
            required: ['plaintiffDangerLevel', 'defenseDangerLevel', 'influencePotential'],
          },
        },
      },
      notes: 'Initial version - extracted from API Gateway archetype classifier service',
      isDraft: false,
    },
  });

  console.log(`✓ Created version: ${version.version} (${version.id})`);

  // Set as current version
  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { currentVersionId: version.id },
  });

  console.log(`✓ Set v${version.version} as current version`);
  console.log('');
  console.log('✅ Archetype Classifier prompt seeded successfully!');
  console.log('');
  console.log('Test it:');
  console.log(`  curl -X POST http://localhost:3002/api/v1/prompts/archetype-classifier/render \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"variables":{"jurorData":"Name: John Doe","archetypeDefinitions":"..."}}'`);
}

async function main() {
  try {
    await seedArchetypeClassifier();
  } catch (error) {
    console.error('Error seeding prompts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
