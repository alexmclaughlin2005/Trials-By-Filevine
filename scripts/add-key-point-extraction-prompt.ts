/**
 * Script to add key point extraction prompt for novelty tracking
 *
 * Run with: npx tsx scripts/add-key-point-extraction-prompt.ts
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function main() {
  console.log('📝 Adding key point extraction prompt...\n');

  const keyPointPrompt = await prisma.prompt.upsert({
    where: { serviceId: 'extract-key-points' },
    update: {},
    create: {
      serviceId: 'extract-key-points',
      name: 'Extract Key Points from Statement',
      description: 'Extracts key factual claims and arguments from a juror statement to track what has been said',
      category: 'focus-group',
      versions: {
        create: {
          version: 'v1.0.0',
          systemPrompt: 'You are a precise analyst extracting key points from jury deliberation statements.',
          userPromptTemplate: `Extract the key factual claims, arguments, and observations from this statement.

STATEMENT:
{{statement}}

INSTRUCTIONS:
- Return ONLY the distinct factual claims and arguments as a bullet list
- Each point should be a short phrase (5-15 words maximum)
- Focus on WHAT is being said, not HOW it's said
- Combine similar points into one
- Omit filler, agreement phrases, or meta-commentary
- Maximum 5 key points per statement

EXAMPLE INPUT:
"Look, I hear what Sarah's saying about the timeline, but I just don't buy it. The hospital had a duty to check that equipment, plain and simple. They knew it was faulty for weeks and did nothing. That's negligence in my book."

EXAMPLE OUTPUT:
- Hospital had duty to check equipment
- Equipment was known to be faulty for weeks
- Hospital took no action despite knowledge
- This constitutes negligence

Now extract key points from the statement above. Return as a JSON array of strings.`,
          config: {
            model: 'claude-sonnet-4-20250514',
            maxTokens: 300,
            temperature: 0.3
          },
          variables: {
            statement: 'string'
          },
          outputSchema: {
            type: 'object',
            properties: {
              keyPoints: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Array of key points extracted from the statement'
              }
            }
          },
          isDraft: false
        }
      }
    }
  });

  console.log('✅ Created key point extraction prompt:', keyPointPrompt.serviceId);

  // Get the created version and set it as current
  const version = await prisma.promptVersion.findFirst({
    where: { promptId: keyPointPrompt.id },
    orderBy: { createdAt: 'desc' }
  });

  if (version) {
    await prisma.prompt.update({
      where: { id: keyPointPrompt.id },
      data: { currentVersionId: version.id }
    });
    console.log('✅ Set version', version.version, 'as current for', keyPointPrompt.serviceId);
  }

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
