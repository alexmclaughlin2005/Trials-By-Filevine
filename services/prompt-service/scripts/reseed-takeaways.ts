#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reseedRoundtableTakeaways() {
  console.log('Re-seeding Roundtable Takeaways Synthesis prompt...');

  // Delete existing prompt (cascades to versions)
  const existing = await prisma.prompt.findUnique({
    where: { serviceId: 'roundtable-takeaways-synthesis' },
  });

  if (existing) {
    console.log('Deleting existing prompt...');
    await prisma.prompt.delete({
      where: { id: existing.id },
    });
  }

  // Create prompt
  const prompt = await prisma.prompt.create({
    data: {
      serviceId: 'roundtable-takeaways-synthesis',
      name: 'Roundtable Takeaways Synthesis',
      description: 'Analyzes focus group conversations and generates strategic insights, recommendations, and actionable next steps',
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
        temperature: 0.7,
        maxTokens: 4000,
      },
      variables: {
        argumentTitle: { type: 'string', required: true },
        argumentContent: { type: 'string', required: true },
        conversationTranscript: { type: 'string', required: true },
        personaSummaries: { type: 'string', required: true },
        consensusAreas: { type: 'string', required: false },
        fracturePoints: { type: 'string', required: false },
      },
    },
  });

  console.log(`✓ Created version: ${version.version}`);

  // Set this version as the current version
  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { currentVersionId: version.id },
  });

  console.log(`✓ Set v${version.version} as current version`);
}

const SYSTEM_PROMPT = `You are an expert trial consultant analyzing focus group conversations about legal arguments. Your goal is to provide actionable strategic advice to attorneys.

You will analyze a focus group conversation and extract:
1. What landed well (persuasive points)
2. What confused the panel (unclear arguments)
3. What backfired (arguments that had negative effects)
4. Top questions jurors will ask during deliberation
5. Concrete recommendations for improving the argument

Be specific and evidence-based. Reference exact statements from the conversation to support your analysis. Focus on providing actionable insights that attorneys can immediately use to improve their arguments.`;

const USER_PROMPT_TEMPLATE = `# Focus Group Analysis Task

## Argument Being Tested

**Title:** {{argumentTitle}}

**Content:**
{{argumentContent}}

## Conversation Transcript

{{conversationTranscript}}

## Persona Summaries

{{personaSummaries}}

## Existing Analysis

**Consensus Areas:**
{{consensusAreas}}

**Fracture Points:**
{{fracturePoints}}

---

# Your Task

Analyze this focus group conversation and provide strategic takeaways in the following structured format:

## 1. WHAT LANDED (3-5 points)

For each point that resonated with the panel:
- **Point:** [What argument/theme landed well]
- **Persona Support:** [List of persona names who responded positively]
- **Evidence:** [Quote(s) from specific statements that prove this]

Example:
{
  "point": "Medical expert testimony was clear and credible",
  "personaSupport": ["Scale-Balancer", "Calculator", "Heart"],
  "evidence": [
    "Statement #5: 'The doctor's testimony was very clear about the timeline'",
    "Statement #12: 'I trust medical experts when they have documented evidence'"
  ]
}

## 2. WHAT CONFUSED (3-5 points)

For each point that confused or raised questions:
- **Point:** [What was unclear or confusing]
- **Personas Confused:** [List of persona names who expressed confusion]
- **Severity:** [LOW, MEDIUM, HIGH, or CRITICAL]
- **Evidence:** [Quote(s) from specific statements]

Example:
{
  "point": "Damages calculation methodology unclear",
  "personasConfused": ["Bootstrapper", "Calculator", "Captain", "Chameleon"],
  "severity": "HIGH",
  "evidence": [
    "Statement #12: 'How did they arrive at $500k? I don't see the breakdown'",
    "Statement #18: 'The damages seem arbitrary to me'"
  ]
}

## 3. WHAT BACKFIRED (2-4 points)

For arguments that had negative effects:
- **Point:** [What backfired]
- **Personas Critical:** [List of persona names who reacted negatively]
- **Severity:** [LOW, MEDIUM, HIGH, or CRITICAL]
- **Evidence:** [Quote(s) from specific statements]

Example:
{
  "point": "Emotional appeal dismissed as manipulative",
  "personasCritical": ["Calculator", "Scale-Balancer"],
  "severity": "CRITICAL",
  "evidence": [
    "Statement #18: 'This feels like manipulation, not facts'",
    "Statement #22: 'I don't like being told how to feel'"
  ]
}

## 4. TOP QUESTIONS TO PREPARE FOR (5-10 questions)

Questions jurors will likely ask during deliberation:
- **Question:** [The question they'll ask]
- **Asked By Count:** [Number of personas who asked or implied this]
- **Persona Names:** [List of who asked]
- **Severity:** [LOW, MEDIUM, HIGH, or CRITICAL]
- **Priority:** [LOW, MEDIUM, or HIGH]

Priority calculation:
- HIGH: Asked by 4+ personas OR severity = CRITICAL
- MEDIUM: Asked by 2-3 personas OR severity = HIGH
- LOW: Asked by 1 persona OR severity = MEDIUM

Example:
{
  "question": "Why didn't the plaintiff seek medical treatment immediately?",
  "askedByCount": 4,
  "personaNames": ["Bootstrapper", "Calculator", "Scarred", "Maverick"],
  "severity": "CRITICAL",
  "priority": "HIGH"
}

## 5. RECOMMENDED EDITS (3-7 edits)

Concrete before/after recommendations:
- **Edit Number:** [1, 2, 3...]
- **Section:** [Which part of the argument - be specific]
- **Type:** [CLARIFY, ADD, REMOVE, SOFTEN, STRENGTHEN]
- **Original Text:** [Current text, if applicable]
- **Suggested Text:** [Improved version]
- **Reason:** [Why this edit, referencing specific personas]
- **Affected Personas:** [Who will benefit from this change]
- **Priority:** [LOW, MEDIUM, or HIGH]

Example:
{
  "editNumber": 1,
  "section": "Timeline (Opening paragraphs)",
  "type": "CLARIFY",
  "originalText": "The incident occurred in June 2023.",
  "suggestedText": "The incident occurred on June 15, 2023, at approximately 3:45 PM, as confirmed by surveillance footage from the building's security system.",
  "reason": "3 personas questioned timeline precision and wanted more specificity",
  "affectedPersonas": ["Calculator", "Scale-Balancer", "Captain"],
  "priority": "HIGH"
}

---

# OUTPUT FORMAT

Return your analysis as a JSON object with this exact structure:

\`\`\`json
{
  "whatLanded": [
    {
      "point": "string",
      "personaSupport": ["string"],
      "evidence": ["string"]
    }
  ],
  "whatConfused": [
    {
      "point": "string",
      "personasConfused": ["string"],
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "evidence": ["string"]
    }
  ],
  "whatBackfired": [
    {
      "point": "string",
      "personasCritical": ["string"],
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "evidence": ["string"]
    }
  ],
  "topQuestions": [
    {
      "question": "string",
      "askedByCount": number,
      "personaNames": ["string"],
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "priority": "LOW" | "MEDIUM" | "HIGH"
    }
  ],
  "recommendedEdits": [
    {
      "editNumber": number,
      "section": "string",
      "type": "CLARIFY" | "ADD" | "REMOVE" | "SOFTEN" | "STRENGTHEN",
      "originalText": "string" | null,
      "suggestedText": "string",
      "reason": "string",
      "affectedPersonas": ["string"],
      "priority": "LOW" | "MEDIUM" | "HIGH"
    }
  ]
}
\`\`\`

**IMPORTANT:**
- Only return the JSON object, no additional text
- Be specific and evidence-based
- Reference exact statement numbers when citing evidence
- Prioritize actionable recommendations over general observations`;

// Run the seed function
reseedRoundtableTakeaways()
  .then(() => {
    console.log('✅ Roundtable Takeaways prompt re-seeded successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error seeding prompt:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
