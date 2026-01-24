/**
 * Script to add roundtable conversation prompts to the Prompt Management Service
 *
 * Run with: npx tsx scripts/add-roundtable-prompts.ts
 */

import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🎭 Adding roundtable conversation prompts...\n');

  // 1. Persona System Prompt Template
  const personaSystemPrompt = await prisma.prompt.upsert({
    where: { serviceId: 'roundtable-persona-system' },
    update: {},
    create: {
      serviceId: 'roundtable-persona-system',
      name: 'Roundtable Persona System Prompt',
      description: 'System prompt that establishes persona identity for roundtable conversations',
      category: 'focus-group',
      versions: {
        create: {
          version: 'v1.0.0',
          systemPrompt: `You are {{name}}, participating in a jury deliberation.

ABOUT YOU:
{{demographics}}

YOUR WORLDVIEW:
{{worldview}}

WHAT YOU VALUE:
{{values}}

YOUR TENDENCIES:
{{biases}}
{{communicationStyle}}

RELEVANT LIFE EXPERIENCE:
{{lifeExperiences}}

HOW YOU PARTICIPATE:
You are a {{leadershipLevel}} in group discussions. {{leadershipGuidance}}

YOUR TASK:
Based on the case facts presented and what other jurors have said, share your perspective.
Stay in character. Your response should reflect your values, experiences, and natural speaking style.

CRITICAL FORMAT REQUIREMENTS:
- Give ONE brief conversational statement (2-5 sentences maximum)
- NO markdown formatting (no ##, **, bullets, or structure)
- NO analytical headers like "What Works" or "Concerns"
- NO essay-style organization or numbered points
- Speak as if you're talking out loud in a jury room
- Use plain text only - just your natural speaking voice
- Reference other jurors' comments when relevant
- Show appropriate emotional reactions based on your personality

BAD EXAMPLE (DO NOT DO THIS):
"## What I Think
**Positive aspects:** The argument is strong...
**Concerns:** However, I worry about..."

GOOD EXAMPLE (DO THIS):
"I think the attorney makes a compelling point about the hospital's negligence. The timeline they laid out really shows how things went wrong. But I'm wondering if the damages are too high - that's a lot of money."`,
          userPromptTemplate: '', // This is a system-only prompt
          config: {
            model: 'claude-sonnet-4-20250514',
            maxTokens: 500,
            temperature: 0.7
          },
          variables: {
            name: 'string',
            demographics: 'string',
            worldview: 'string',
            values: 'string',
            biases: 'string',
            communicationStyle: 'string',
            lifeExperiences: 'string',
            leadershipLevel: 'enum:LEADER|INFLUENCER|FOLLOWER|PASSIVE',
            leadershipGuidance: 'string'
          },
          isDraft: false
        }
      }
    }
  });

  console.log('✅ Created persona system prompt:', personaSystemPrompt.serviceId);

  // 2. Initial Reaction Prompt (First turn for each persona)
  const initialReactionPrompt = await prisma.prompt.upsert({
    where: { serviceId: 'roundtable-initial-reaction' },
    update: {},
    create: {
      serviceId: 'roundtable-initial-reaction',
      name: 'Roundtable Initial Reaction',
      description: 'Prompt for persona first reaction to an argument',
      category: 'focus-group',
      versions: {
        create: {
          version: 'v1.0.0',
          systemPrompt: '', // Uses persona system prompt
          userPromptTemplate: `THE CASE BEFORE YOU:
{{caseContext}}

THE ARGUMENT BEING DISCUSSED:
"{{argumentContent}}"

{{#if previousSpeakers}}
WHAT OTHERS HAVE ALREADY SAID:
{{previousSpeakers}}
{{/if}}

{{#if customQuestions}}
SPECIFIC QUESTIONS TO CONSIDER:
{{customQuestions}}
{{/if}}

Now it's your turn. {{lengthGuidance}}

Share your initial reaction to this argument. What do you think about it?{{#if customQuestions}} Feel free to address any of the questions above that resonate with you.{{/if}}

IMPORTANT: Respond with ONLY your plain-text conversational statement (2-5 sentences). NO markdown, NO headers, NO formatting. Just talk naturally as if speaking out loud in a jury room.`,
          config: {
            model: 'claude-sonnet-4-20250514',
            maxTokens: 300,
            temperature: 0.7
          },
          variables: {
            caseContext: 'string',
            argumentContent: 'string',
            previousSpeakers: 'string?',
            lengthGuidance: 'string',
            customQuestions: 'string?'
          },
          outputSchema: {
            type: 'object',
            properties: {
              statement: {
                type: 'string',
                description: 'The persona\'s conversational statement'
              }
            }
          },
          isDraft: false
        }
      }
    }
  });

  console.log('✅ Created initial reaction prompt:', initialReactionPrompt.serviceId);

  // 3. Conversation Turn Prompt (Subsequent turns)
  const conversationTurnPrompt = await prisma.prompt.upsert({
    where: { serviceId: 'roundtable-conversation-turn' },
    update: {},
    create: {
      serviceId: 'roundtable-conversation-turn',
      name: 'Roundtable Conversation Turn',
      description: 'Prompt for persona to respond during ongoing conversation',
      category: 'focus-group',
      versions: {
        create: {
          version: 'v1.0.0',
          systemPrompt: '', // Uses persona system prompt
          userPromptTemplate: `THE CASE BEFORE YOU:
{{caseContext}}

THE ARGUMENT BEING DISCUSSED:
"{{argumentContent}}"

DISCUSSION SO FAR:
{{conversationTranscript}}

{{#if lastSpeaker}}
{{lastSpeaker.name}} just said:
"{{lastSpeaker.statement}}"
{{/if}}

{{#if addressedToYou}}
NOTE: {{addressedToYou.speaker}} mentioned you or directed a comment at you: "{{addressedToYou.content}}"
{{/if}}

{{#if customQuestions}}
QUESTIONS TO CONSIDER:
{{customQuestions}}
{{/if}}

Now it's your turn. {{lengthGuidance}}

As {{personaName}}, respond to the discussion. What do you want to add?{{#if customQuestions}} You may also address any relevant questions that haven't been fully explored yet.{{/if}}

IMPORTANT: Respond with ONLY your plain-text conversational statement (2-5 sentences). NO markdown, NO headers, NO formatting. Just talk naturally as if speaking out loud in a jury room.`,
          config: {
            model: 'claude-sonnet-4-20250514',
            maxTokens: 400,
            temperature: 0.7
          },
          variables: {
            caseContext: 'string',
            argumentContent: 'string',
            conversationTranscript: 'string',
            lastSpeaker: 'object?',
            addressedToYou: 'object?',
            lengthGuidance: 'string',
            personaName: 'string',
            customQuestions: 'string?'
          },
          outputSchema: {
            type: 'object',
            properties: {
              statement: {
                type: 'string',
                description: 'The persona\'s conversational response'
              }
            }
          },
          isDraft: false
        }
      }
    }
  });

  console.log('✅ Created conversation turn prompt:', conversationTurnPrompt.serviceId);

  // 4. Statement Analysis Prompt (Post-generation analysis)
  const statementAnalysisPrompt = await prisma.prompt.upsert({
    where: { serviceId: 'roundtable-statement-analysis' },
    update: {},
    create: {
      serviceId: 'roundtable-statement-analysis',
      name: 'Roundtable Statement Analysis',
      description: 'Analyze a statement for sentiment, key points, and social signals',
      category: 'focus-group',
      versions: {
        create: {
          version: 'v1.0.0',
          systemPrompt: `You are an expert at analyzing jury deliberation dynamics.`,
          userPromptTemplate: `Analyze this statement from a juror in a deliberation:

PERSONA: {{personaName}}
STATEMENT: "{{statement}}"

CONTEXT:
The argument being discussed: {{argumentContent}}
{{#if conversationContext}}
Prior discussion points: {{conversationContext}}
{{/if}}

Provide analysis in the following JSON format:
{
  "sentiment": "plaintiff_leaning" | "defense_leaning" | "neutral" | "conflicted",
  "emotionalIntensity": 0.0 to 1.0,
  "keyPoints": ["point 1", "point 2", ...],
  "addressedTo": ["PersonaName1", "PersonaName2", ...],
  "agreementSignals": ["PersonaName1", "PersonaName2", ...],
  "disagreementSignals": ["PersonaName1", "PersonaName2", ...]
}

Rules:
- sentiment: Determine if statement leans toward plaintiff, defense, is neutral, or shows conflict
- emotionalIntensity: 0.0 (very calm/rational) to 1.0 (highly emotional/passionate)
- keyPoints: Extract the main arguments or points made
- addressedTo: Names of other personas explicitly mentioned or responded to
- agreementSignals: Names of personas this speaker agreed with or built upon
- disagreementSignals: Names of personas this speaker challenged or disagreed with`,
          config: {
            model: 'claude-sonnet-4-20250514',
            maxTokens: 800,
            temperature: 0.3
          },
          variables: {
            personaName: 'string',
            statement: 'string',
            argumentContent: 'string',
            conversationContext: 'string?'
          },
          outputSchema: {
            type: 'object',
            properties: {
              sentiment: {
                type: 'string',
                enum: ['plaintiff_leaning', 'defense_leaning', 'neutral', 'conflicted']
              },
              emotionalIntensity: {
                type: 'number',
                minimum: 0,
                maximum: 1
              },
              keyPoints: {
                type: 'array',
                items: { type: 'string' }
              },
              addressedTo: {
                type: 'array',
                items: { type: 'string' }
              },
              agreementSignals: {
                type: 'array',
                items: { type: 'string' }
              },
              disagreementSignals: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          },
          isDraft: false
        }
      }
    }
  });

  console.log('✅ Created statement analysis prompt:', statementAnalysisPrompt.serviceId);

  // 5. Conversation Synthesis Prompt (After conversation completes)
  const conversationSynthesisPrompt = await prisma.prompt.upsert({
    where: { serviceId: 'roundtable-conversation-synthesis' },
    update: {},
    create: {
      serviceId: 'roundtable-conversation-synthesis',
      name: 'Roundtable Conversation Synthesis',
      description: 'Synthesize conversation into consensus areas, fracture points, and influence patterns',
      category: 'focus-group',
      versions: {
        create: {
          version: 'v1.0.0',
          systemPrompt: `You are an expert at analyzing jury deliberation patterns and group dynamics.`,
          userPromptTemplate: `Analyze the following jury deliberation conversation and provide a synthesis.

ARGUMENT DISCUSSED:
"{{argumentContent}}"

FULL CONVERSATION TRANSCRIPT:
{{conversationTranscript}}

PERSONAS INVOLVED:
{{#each personas}}
- {{name}} ({{leadershipLevel}}): {{description}}
{{/each}}

Provide analysis in the following JSON format:
{
  "consensusAreas": ["point 1", "point 2", ...],
  "fracturePoints": ["disagreement 1", "disagreement 2", ...],
  "keyDebatePoints": ["debate topic 1", "debate topic 2", ...],
  "influentialPersonas": [
    {
      "personaId": "id",
      "personaName": "name",
      "influenceType": "dominant" | "persuasive" | "mediating" | "disruptive",
      "influenceReason": "explanation"
    }
  ],
  "overallReception": "strong_support" | "mild_support" | "divided" | "mild_opposition" | "strong_opposition",
  "convergenceReason": "explanation of why conversation ended"
}

Rules:
- consensusAreas: Points where most/all personas agreed
- fracturePoints: Issues where personas remained divided
- keyDebatePoints: Main topics that generated significant discussion
- influentialPersonas: Who had the most impact (limit to top 3)
- overallReception: Overall group sentiment about the argument
- convergenceReason: Why the conversation naturally concluded`,
          config: {
            model: 'claude-sonnet-4-20250514',
            maxTokens: 2000,
            temperature: 0.4
          },
          variables: {
            argumentContent: 'string',
            conversationTranscript: 'string',
            personas: 'array'
          },
          outputSchema: {
            type: 'object',
            properties: {
              consensusAreas: {
                type: 'array',
                items: { type: 'string' }
              },
              fracturePoints: {
                type: 'array',
                items: { type: 'string' }
              },
              keyDebatePoints: {
                type: 'array',
                items: { type: 'string' }
              },
              influentialPersonas: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    personaId: { type: 'string' },
                    personaName: { type: 'string' },
                    influenceType: {
                      type: 'string',
                      enum: ['dominant', 'persuasive', 'mediating', 'disruptive']
                    },
                    influenceReason: { type: 'string' }
                  }
                }
              },
              overallReception: {
                type: 'string',
                enum: ['strong_support', 'mild_support', 'divided', 'mild_opposition', 'strong_opposition']
              },
              convergenceReason: { type: 'string' }
            }
          },
          isDraft: false
        }
      }
    }
  });

  console.log('✅ Created conversation synthesis prompt:', conversationSynthesisPrompt.serviceId);

  // 6. Persona Summary Prompt (Per-persona journey analysis)
  const personaSummaryPrompt = await prisma.prompt.upsert({
    where: { serviceId: 'roundtable-persona-summary' },
    update: {},
    create: {
      serviceId: 'roundtable-persona-summary',
      name: 'Roundtable Persona Summary',
      description: 'Generate a comprehensive summary of one persona\'s participation and journey through the conversation',
      category: 'focus-group',
      versions: {
        create: {
          version: 'v1.0.0',
          systemPrompt: `You are an expert at analyzing jury deliberation dynamics and tracking individual juror journeys through complex discussions.`,
          userPromptTemplate: `Analyze one participant's journey through a jury deliberation discussion.

ARGUMENT BEING DISCUSSED:
"{{argumentContent}}"

OUR SIDE: {{ourSide}}

PERSONA: {{personaName}}
TOTAL STATEMENTS: {{totalStatements}}

THEIR STATEMENTS (in order):
{{personaStatements}}

FULL CONVERSATION CONTEXT (what everyone said):
{{conversationTranscript}}

Provide a comprehensive analysis in the following JSON format:
{
  "initialPosition": "favorable" | "neutral" | "unfavorable" | "mixed",
  "finalPosition": "favorable" | "neutral" | "unfavorable" | "mixed",
  "positionShifted": true | false,
  "shiftDescription": "Explanation of why/how position changed (only if shifted)",
  "mainPoints": ["Key point 1 they made", "Key point 2", ...],
  "concernsRaised": ["Concern 1", "Concern 2", ...],
  "questionsAsked": ["Question 1", "Question 2", ...],
  "influenceLevel": "high" | "medium" | "low",
  "agreedWithMost": ["PersonaName1", "PersonaName2", ...],
  "disagreedWithMost": ["PersonaName1", "PersonaName2", ...],
  "influencedBy": ["PersonaName1 who changed their mind", ...],
  "summary": "2-3 paragraph narrative summary of their journey"
}

Rules:
- initialPosition: Their stance in first 1-2 statements (favorable = supports argument, unfavorable = opposes)
- finalPosition: Their stance in last 1-2 statements
- positionShifted: true if they changed from initial to final (e.g., neutral→favorable, unfavorable→neutral)
- shiftDescription: Only if shifted; explain what caused the change (which points, which person's argument)
- mainPoints: Key arguments THEY made (not what others said)
- concernsRaised: Specific doubts or worries THEY voiced
- questionsAsked: Actual questions THEY posed (even rhetorical)
- influenceLevel: high = others responded to their points often; medium = moderate engagement; low = minimal impact
- agreedWithMost: Names of personas whose points they explicitly agreed with or built upon
- disagreedWithMost: Names of personas they challenged or pushed back against
- influencedBy: Names of personas whose arguments seemed to change their mind (only if position shifted)
- summary: Write 2-3 paragraphs describing their arc through the conversation. Include:
  * How they started (initial reaction and tone)
  * Key moments (statements that reveal their thinking)
  * How they ended (final position and confidence level)
  * What influenced them (if position shifted)`,
          config: {
            model: 'claude-sonnet-4-20250514',
            maxTokens: 2000,
            temperature: 0.4
          },
          variables: {
            personaName: 'string',
            argumentContent: 'string',
            ourSide: 'string',
            totalStatements: 'number',
            personaStatements: 'string',
            conversationTranscript: 'string'
          },
          outputSchema: {
            type: 'object',
            properties: {
              initialPosition: {
                type: 'string',
                enum: ['favorable', 'neutral', 'unfavorable', 'mixed']
              },
              finalPosition: {
                type: 'string',
                enum: ['favorable', 'neutral', 'unfavorable', 'mixed']
              },
              positionShifted: {
                type: 'boolean'
              },
              shiftDescription: {
                type: 'string'
              },
              mainPoints: {
                type: 'array',
                items: { type: 'string' }
              },
              concernsRaised: {
                type: 'array',
                items: { type: 'string' }
              },
              questionsAsked: {
                type: 'array',
                items: { type: 'string' }
              },
              influenceLevel: {
                type: 'string',
                enum: ['high', 'medium', 'low']
              },
              agreedWithMost: {
                type: 'array',
                items: { type: 'string' }
              },
              disagreedWithMost: {
                type: 'array',
                items: { type: 'string' }
              },
              influencedBy: {
                type: 'array',
                items: { type: 'string' }
              },
              summary: {
                type: 'string'
              }
            },
            required: ['initialPosition', 'finalPosition', 'positionShifted', 'mainPoints', 'influenceLevel', 'summary']
          },
          isDraft: false
        }
      }
    }
  });

  console.log('✅ Created persona summary prompt:', personaSummaryPrompt.serviceId);

  // Set current versions for all prompts
  await prisma.prompt.update({
    where: { serviceId: 'roundtable-persona-system' },
    data: {
      currentVersionId: (await prisma.promptVersion.findFirst({
        where: { prompt: { serviceId: 'roundtable-persona-system' } }
      }))!.id
    }
  });

  await prisma.prompt.update({
    where: { serviceId: 'roundtable-initial-reaction' },
    data: {
      currentVersionId: (await prisma.promptVersion.findFirst({
        where: { prompt: { serviceId: 'roundtable-initial-reaction' } }
      }))!.id
    }
  });

  await prisma.prompt.update({
    where: { serviceId: 'roundtable-conversation-turn' },
    data: {
      currentVersionId: (await prisma.promptVersion.findFirst({
        where: { prompt: { serviceId: 'roundtable-conversation-turn' } }
      }))!.id
    }
  });

  await prisma.prompt.update({
    where: { serviceId: 'roundtable-statement-analysis' },
    data: {
      currentVersionId: (await prisma.promptVersion.findFirst({
        where: { prompt: { serviceId: 'roundtable-statement-analysis' } }
      }))!.id
    }
  });

  await prisma.prompt.update({
    where: { serviceId: 'roundtable-conversation-synthesis' },
    data: {
      currentVersionId: (await prisma.promptVersion.findFirst({
        where: { prompt: { serviceId: 'roundtable-conversation-synthesis' } }
      }))!.id
    }
  });

  await prisma.prompt.update({
    where: { serviceId: 'roundtable-persona-summary' },
    data: {
      currentVersionId: (await prisma.promptVersion.findFirst({
        where: { prompt: { serviceId: 'roundtable-persona-summary' } }
      }))!.id
    }
  });

  console.log('\n✨ All roundtable conversation prompts created successfully!');
  console.log('\nPrompts created:');
  console.log('  1. roundtable-persona-system - Persona identity system prompt');
  console.log('  2. roundtable-initial-reaction - First reaction to argument');
  console.log('  3. roundtable-conversation-turn - Ongoing conversation responses');
  console.log('  4. roundtable-statement-analysis - Post-generation statement analysis');
  console.log('  5. roundtable-conversation-synthesis - Final conversation synthesis');
  console.log('  6. roundtable-persona-summary - Per-persona journey analysis');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
