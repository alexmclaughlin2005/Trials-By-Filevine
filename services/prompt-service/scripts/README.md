# Prompt Service Seed Scripts

This directory contains scripts for seeding prompts into the database.

## Available Seed Scripts

### Individual Prompts

- **`seed-extract-key-points.ts`** - Seeds the "extract-key-points" prompt for conversation orchestrator
- **`seed-roundtable-takeaways.ts`** - Seeds the "roundtable-takeaways-synthesis" prompt for generating strategic insights
- **`seed-archetype-classifier.ts`** - Seeds the "archetype-classifier" prompt for juror personality analysis

### Utility Scripts

- **`reseed-takeaways.ts`** - Deletes and recreates the roundtable-takeaways prompt (useful for fixing broken prompts)
- **`fix-current-version.ts`** - Utility to set currentVersionId for any prompt

## Running Seed Scripts

### Local Development

```bash
# From the prompt-service directory
npm run seed:key-points
npm run seed:takeaways
npm run seed:archetype

# Or seed all prompts at once
npm run seed:all
```

### Production (Railway)

#### Option 1: Using the seed-production.sh script (Recommended)

```bash
# From the prompt-service directory
./scripts/seed-production.sh
```

This will seed all prompts in production. Make sure you have the Railway CLI installed:
```bash
npm i -g @railway/cli
railway login
```

#### Option 2: Individual prompts via Railway CLI

```bash
# Seed individual prompts
railway run --service prompt-service npm run seed:key-points
railway run --service prompt-service npm run seed:takeaways
railway run --service prompt-service npm run seed:archetype
```

#### Option 3: Via Railway Dashboard

1. Go to Railway dashboard → prompt-service
2. Open the Shell/Terminal
3. Run:
```bash
npm run seed:key-points
# or
npm run seed:all
```

## Creating New Seed Scripts

When creating a new seed script, follow this pattern:

```typescript
#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedYourPrompt() {
  console.log('Seeding Your Prompt...');

  // Check if already exists
  const existing = await prisma.prompt.findUnique({
    where: { serviceId: 'your-prompt-id' },
  });

  if (existing) {
    console.log('Your Prompt already exists. Skipping...');
    return;
  }

  // Create prompt
  const prompt = await prisma.prompt.create({
    data: {
      serviceId: 'your-prompt-id',
      name: 'Your Prompt Name',
      description: 'What this prompt does',
      category: 'analysis', // or 'generation', 'classification', etc.
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
        temperature: 0.7,
        maxTokens: 4000,
      },
      variables: {
        yourVariable: { type: 'string', required: true },
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
}

const SYSTEM_PROMPT = `Your system prompt here...`;

const USER_PROMPT_TEMPLATE = `Your user prompt template with {{variables}} here...`;

seedYourPrompt()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding prompt:', error);
    process.exit(1);
  });
```

### Key Points

1. **Always set `currentVersionId`** - This is critical! The prompt won't work without it.
2. **Use correct model names** - `claude-sonnet-4-20250514` (not `claude-sonnet-4.5`)
3. **Make scripts idempotent** - Check if prompt exists before creating
4. **Add npm script** - Add to `package.json` scripts for easy execution

### After Creating a Seed Script

1. Add npm script to `package.json`:
```json
"seed:your-prompt": "tsx scripts/seed-your-prompt.ts"
```

2. Update `seed:all` script:
```json
"seed:all": "npm run seed:key-points && npm run seed:takeaways && npm run seed:your-prompt"
```

3. Update `seed-production.sh` to include the new prompt

4. Commit and run in production:
```bash
git add .
git commit -m "feat: Add your-prompt seed script"
git push
railway run --service prompt-service npm run seed:your-prompt
```

## Troubleshooting

### Error: "Failed to fetch prompt: Failed to render prompt"

This means the prompt exists but doesn't have a `currentVersionId` set. Fix it with:

```bash
# Local
npx tsx scripts/fix-current-version.ts your-prompt-id

# Production
railway run --service prompt-service npx tsx scripts/fix-current-version.ts your-prompt-id
```

### Error: "Prompt not found"

The prompt doesn't exist in the database. Run the appropriate seed script.

### Error: Model name incorrect

Make sure you're using the exact Anthropic API model name:
- ✅ `claude-sonnet-4-20250514`
- ❌ `claude-sonnet-4.5`
- ❌ `claude-4.5-sonnet`

## Regular Maintenance

After deploying new prompt versions:

1. Run seed scripts in production
2. Test the prompt execution
3. Monitor logs for errors
4. Update documentation if prompt behavior changes
