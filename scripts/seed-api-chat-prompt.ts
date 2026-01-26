import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

const API_CHAT_SYSTEM_PROMPT = `You are an API assistant for the Trials by Filevine application. You help users interact with the application through natural language by:

1. Understanding user intent (e.g., "create a case", "add a juror", "run a simulation")
2. Explaining what actions will be taken
3. Asking for required information if needed
4. Providing clear responses about what happened

The API has these main capabilities:

**Cases:**
- Create new cases with details like name, case number, type, parties
- Update existing cases
- List all cases
- Get case details

**Jurors:**
- Add jurors to cases with demographic and background info
- Update juror information
- Search jurors
- Classify juror archetypes (using AI)

**Jury Panels:**
- Create jury panels for cases
- Add jurors to panels
- Manage panel composition

**Archetypes:**
- Classify jurors into 10 psychological archetypes
- Get archetype insights and predictions

**Focus Groups:**
- Create roundtable simulations with AI personas
- Test arguments with different archetype panels
- Get predictions on jury responses

**Research:**
- Deep research on legal topics
- Document analysis
- Case law research

**Personas:**
- Create and manage juror personas
- Generate AI-driven personality profiles

When users ask you to do something:
1. Confirm what you understand they want to do
2. Ask for any missing required information
3. Explain what you'll do (but note: you can't actually execute API calls - you can only guide the user)
4. Provide the information they need to complete the action

**IMPORTANT - Linking to Resources:**
When you create or reference a case, ALWAYS include a clickable markdown link to view it:
- Format: [Case Name](/cases/{caseId})
- Example: "I've created the case [Smith v. Jones](/cases/abc123) for you."

When listing cases or other resources, always make them clickable links so users can easily navigate to them.

Be conversational, helpful, and concise. Format responses with clear structure when listing information.`;

const API_CHAT_USER_PROMPT = `{{message}}`;

async function seedPrompt() {
  try {
    console.log('🌱 Seeding API Chat prompt...');

    // Check if prompt already exists
    const existing = await prisma.prompt.findUnique({
      where: { serviceId: 'api-chat-assistant' },
    });

    if (existing) {
      console.log('⚠️  Prompt already exists, updating...');

      // Update existing prompt
      await prisma.prompt.update({
        where: { id: existing.id },
        data: {
          name: 'API Chat Assistant',
          description:
            'Conversational AI assistant for helping users interact with the Trials by Filevine API',
          category: 'chat',
        },
      });

      // Check if version 1.1.0 exists (with link formatting)
      let targetVersion = await prisma.promptVersion.findFirst({
        where: {
          promptId: existing.id,
          version: '1.1.0',
        },
      });

      if (targetVersion) {
        console.log('✅ Prompt version 1.1.0 already exists');
      } else {
        // Create new version 1.1.0
        targetVersion = await prisma.promptVersion.create({
          data: {
            promptId: existing.id,
            version: '1.1.0',
            systemPrompt: API_CHAT_SYSTEM_PROMPT,
            userPromptTemplate: API_CHAT_USER_PROMPT,
            config: {
              model: 'claude-sonnet-4-5-20250929',
              maxTokens: 1024,
              temperature: 0.7,
            },
            variables: {},
          },
        });

        console.log('✅ Created new version 1.1.0');
      }

      // Set 1.1.0 as current version
      await prisma.prompt.update({
        where: { id: existing.id },
        data: { currentVersionId: targetVersion.id },
      });
      console.log('✅ Set version 1.1.0 as current');
    } else {
      // Create new prompt with version
      const prompt = await prisma.prompt.create({
        data: {
          serviceId: 'api-chat-assistant',
          name: 'API Chat Assistant',
          description:
            'Conversational AI assistant for helping users interact with the Trials by Filevine API',
          category: 'chat',
          versions: {
            create: {
              version: '1.0.0',
              systemPrompt: API_CHAT_SYSTEM_PROMPT,
              userPromptTemplate: API_CHAT_USER_PROMPT,
              config: {
                model: 'claude-sonnet-4-5-20250929',
                maxTokens: 1024,
                temperature: 0.7,
              },
              variables: {},
            },
          },
        },
        include: {
          versions: true,
        },
      });

      // Set the current version
      await prisma.prompt.update({
        where: { id: prompt.id },
        data: {
          currentVersionId: prompt.versions[0].id,
        },
      });

      console.log('✅ Created prompt:', prompt.serviceId);
      console.log('✅ Set current version to:', prompt.versions[0].version);
    }

    console.log('🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding prompt:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPrompt();
