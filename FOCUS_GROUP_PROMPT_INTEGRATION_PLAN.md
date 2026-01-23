# Focus Group - Prompt Service Integration Plan

**Status:** Ready to implement after Phase 1 testing
**Estimated Time:** 2-3 hours
**Dependencies:** Prompt Service running on port 3002

---

## Overview

Integrate the focus group simulation with the centralized Prompt Management Service to execute initial reactions from selected archetypes.

---

## Step 1: Create Prompt Templates

### Prompt 1: `focus-group-initial-reactions`

**Purpose:** Get initial reactions from each archetype to the selected arguments

**Variables Required:**
```typescript
{
  archetypes: string,           // JSON array of selected archetypes
  arguments: string,            // JSON array of arguments with order
  caseContext: string,          // Case name, type, facts summary
  customQuestions: string,      // JSON array of custom questions (if any)
}
```

**System Prompt:**
```
You are an expert jury consultant simulating focus group reactions. Your task is to predict how different juror archetypes will react to legal arguments presented in a trial.

Each archetype represents a distinct behavioral and psychological profile commonly found in juries. You must simulate authentic reactions based on their established characteristics, values, and decision-making styles.
```

**User Prompt Template:**
```handlebars
# Case Context
{{caseContext}}

# Archetypes Panel
{{archetypes}}

# Arguments to Evaluate
{{arguments}}

{{#if customQuestions}}
# Custom Questions
{{customQuestions}}
{{/if}}

# Your Task

For each archetype in the panel, provide:

1. **Initial Reaction** - First impression of the arguments (2-3 sentences)
2. **Sentiment Score** - Overall reaction from -1.0 (very negative) to 1.0 (very positive)
3. **Persuasive Elements** - What worked well for this archetype
4. **Weaknesses** - What fell flat or raised doubts
5. **Concerns** - Specific concerns this archetype has
6. **Questions** - Questions this archetype would ask
7. **Verdict Lean** - How this archetype leans: "favorable", "neutral", or "unfavorable"
8. **Confidence** - How confident this prediction is (0.0 to 1.0)

{{#if customQuestions}}
9. **Custom Question Responses** - Answer each custom question from this archetype's perspective
{{/if}}

Return your response as JSON following this exact structure:

```json
{
  "overallReception": "Summary of how the panel received the arguments as a whole",
  "averageSentiment": 0.5,
  "archetypeReactions": [
    {
      "archetypeName": "Bootstrapper",
      "initialReaction": "The emphasis on personal responsibility resonates strongly...",
      "sentimentScore": 0.7,
      "persuasiveElements": [
        "Clear cause-and-effect narrative",
        "Emphasis on accountability"
      ],
      "weaknesses": [
        "May see emotional appeals as manipulative"
      ],
      "concerns": [
        "Not enough focus on plaintiff's own actions"
      ],
      "questions": [
        "What steps did the plaintiff take to prevent this?"
      ],
      "verdictLean": "favorable",
      "confidence": 0.85,
      "customQuestionResponses": [
        {
          "questionId": "q-1",
          "response": "From this archetype's perspective..."
        }
      ]
    }
  ]
}
```

IMPORTANT:
- Stay true to each archetype's established characteristics
- Be realistic about what persuades and what backfires
- Consider group dynamics in your sentiment scores
- Provide actionable insights in your analysis
```

**Model Config:**
```json
{
  "model": "claude-sonnet-4-5-20250929",
  "maxTokens": 8000,
  "temperature": 0.6,
  "topP": 0.9
}
```

---

## Step 2: Create Prompt Service Client

**File:** `services/api-gateway/src/lib/prompt-client.ts`

```typescript
import axios from 'axios';

const PROMPT_SERVICE_URL = process.env.PROMPT_SERVICE_URL || 'http://localhost:3002';

interface RenderPromptResponse {
  promptId: string;
  versionId: string;
  version: string;
  systemPrompt: string | null;
  userPrompt: string;
  config: {
    model: string;
    maxTokens: number;
    temperature?: number;
    topP?: number;
  };
  abTestId?: string;
}

export async function renderPrompt(
  serviceId: string,
  variables: Record<string, any>
): Promise<RenderPromptResponse> {
  try {
    const response = await axios.post(
      `${PROMPT_SERVICE_URL}/api/v1/prompts/${serviceId}/render`,
      { variables, version: 'latest' },
      { timeout: 5000 }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to render prompt ${serviceId}:`, error);
    throw error;
  }
}

export async function trackResult(
  serviceId: string,
  data: {
    versionId: string;
    abTestId?: string;
    success: boolean;
    tokensUsed?: number;
    latencyMs?: number;
    confidence?: number;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    await axios.post(
      `${PROMPT_SERVICE_URL}/api/v1/prompts/${serviceId}/results`,
      data,
      { timeout: 3000 }
    );
  } catch (error) {
    // Log but don't throw - tracking failures shouldn't break service
    console.error('Failed to track prompt result:', error);
  }
}
```

---

## Step 3: Create Focus Group Service V2

**File:** `services/api-gateway/src/services/focus-group-v2-service.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { renderPrompt, trackResult } from '../lib/prompt-client';

interface ArchetypeReaction {
  archetypeName: string;
  initialReaction: string;
  sentimentScore: number;
  persuasiveElements: string[];
  weaknesses: string[];
  concerns: string[];
  questions: string[];
  verdictLean: 'favorable' | 'neutral' | 'unfavorable';
  confidence: number;
  customQuestionResponses?: Array<{
    questionId: string;
    response: string;
  }>;
}

interface FocusGroupResult {
  overallReception: string;
  averageSentiment: number;
  archetypeReactions: ArchetypeReaction[];
}

export class FocusGroupV2Service {
  private anthropicClient: Anthropic;

  constructor(apiKey: string) {
    this.anthropicClient = new Anthropic({ apiKey });
  }

  async runInitialReactions(sessionConfig: {
    archetypes: any[];
    arguments: any[];
    caseContext: any;
    customQuestions?: any[];
  }): Promise<FocusGroupResult> {
    const startTime = Date.now();

    try {
      // 1. Render prompt from Prompt Service
      const prompt = await renderPrompt('focus-group-initial-reactions', {
        archetypes: JSON.stringify(sessionConfig.archetypes, null, 2),
        arguments: JSON.stringify(sessionConfig.arguments, null, 2),
        caseContext: this.formatCaseContext(sessionConfig.caseContext),
        customQuestions: sessionConfig.customQuestions
          ? JSON.stringify(sessionConfig.customQuestions, null, 2)
          : '',
      });

      // 2. Execute with Claude
      const message = await this.anthropicClient.messages.create({
        model: prompt.config.model,
        max_tokens: prompt.config.maxTokens,
        temperature: prompt.config.temperature,
        top_p: prompt.config.topP,
        messages: [{ role: 'user', content: prompt.userPrompt }],
        ...(prompt.systemPrompt && { system: prompt.systemPrompt }),
      });

      const latencyMs = Date.now() - startTime;
      const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

      // 3. Parse response
      const result = this.parseResponse(message.content[0].text);

      // 4. Track success
      await trackResult('focus-group-initial-reactions', {
        versionId: prompt.versionId,
        abTestId: prompt.abTestId,
        success: true,
        tokensUsed,
        latencyMs,
        confidence: this.calculateAverageConfidence(result.archetypeReactions),
        metadata: {
          archetypeCount: sessionConfig.archetypes.length,
          argumentCount: sessionConfig.arguments.length,
          hasCustomQuestions: (sessionConfig.customQuestions?.length || 0) > 0,
        },
      });

      return result;
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      // Track failure
      await trackResult('focus-group-initial-reactions', {
        versionId: 'unknown',
        success: false,
        latencyMs,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  private formatCaseContext(caseContext: any): string {
    return `
**Case Name:** ${caseContext.caseName}
**Case Type:** ${caseContext.caseType}
**Our Side:** ${caseContext.ourSide}

**Key Facts:**
${caseContext.facts.map((f: any) => `- [${f.factType}] ${f.content}`).join('\n')}
    `.trim();
  }

  private parseResponse(content: string): FocusGroupResult {
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : content;

      const parsed = JSON.parse(jsonContent.trim());

      return {
        overallReception: parsed.overallReception || 'No overall assessment provided',
        averageSentiment: Math.max(-1, Math.min(1, parsed.averageSentiment || 0)),
        archetypeReactions: (parsed.archetypeReactions || []).map((reaction: any) => ({
          archetypeName: reaction.archetypeName || '',
          initialReaction: reaction.initialReaction || '',
          sentimentScore: Math.max(-1, Math.min(1, reaction.sentimentScore || 0)),
          persuasiveElements: Array.isArray(reaction.persuasiveElements)
            ? reaction.persuasiveElements
            : [],
          weaknesses: Array.isArray(reaction.weaknesses) ? reaction.weaknesses : [],
          concerns: Array.isArray(reaction.concerns) ? reaction.concerns : [],
          questions: Array.isArray(reaction.questions) ? reaction.questions : [],
          verdictLean: ['favorable', 'neutral', 'unfavorable'].includes(reaction.verdictLean)
            ? reaction.verdictLean
            : 'neutral',
          confidence: Math.max(0, Math.min(1, reaction.confidence || 0.5)),
          customQuestionResponses: reaction.customQuestionResponses || [],
        })),
      };
    } catch (error) {
      console.error('Failed to parse focus group response:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response - invalid JSON format');
    }
  }

  private calculateAverageConfidence(reactions: ArchetypeReaction[]): number {
    if (reactions.length === 0) return 0;
    const sum = reactions.reduce((acc, r) => acc + r.confidence, 0);
    return sum / reactions.length;
  }
}
```

---

## Step 4: Update Start Endpoint

**File:** `services/api-gateway/src/routes/focus-groups.ts`

Update the `/sessions/:sessionId/start` endpoint:

```typescript
server.post('/sessions/:sessionId/start', {
  onRequest: [server.authenticate],
  handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
    const { organizationId } = request.user as any;
    const { sessionId } = request.params as any;

    // Get session with full details
    const session = await server.prisma.focusGroupSession.findFirst({
      where: {
        id: sessionId,
        case: { organizationId },
      },
      include: {
        case: {
          include: {
            facts: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!session) {
      reply.code(404);
      return { error: 'Focus group session not found' };
    }

    if (session.status !== 'draft') {
      reply.code(400);
      return { error: 'Session has already been started' };
    }

    // Validate configuration
    if (!session.selectedArguments || (session.selectedArguments as any[]).length === 0) {
      reply.code(400);
      return { error: 'No arguments selected for focus group' };
    }

    // Update session status
    await server.prisma.focusGroupSession.update({
      where: { id: sessionId },
      data: {
        status: 'running',
        startedAt: new Date(),
        configurationStep: 'ready',
      },
    });

    // Start async simulation
    runSimulationAsync(server, session);

    return {
      message: 'Focus group simulation started',
      sessionId: session.id,
      status: 'running',
    };
  },
});

// Async simulation function
async function runSimulationAsync(server: any, session: any) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const service = new FocusGroupV2Service(apiKey);

    // Prepare archetypes
    const archetypes = await prepareArchetypes(server, session);

    // Run simulation
    const result = await service.runInitialReactions({
      archetypes,
      arguments: session.selectedArguments,
      caseContext: {
        caseName: session.case.name,
        caseType: session.case.caseType,
        ourSide: session.case.ourSide,
        facts: session.case.facts,
      },
      customQuestions: session.customQuestions || [],
    });

    // Save results to database
    await saveSimulationResults(server, session.id, result);

    // Update session status
    await server.prisma.focusGroupSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Focus group simulation failed:', error);

    // Update session with error
    await server.prisma.focusGroupSession.update({
      where: { id: session.id },
      data: {
        status: 'draft', // Reset to draft so user can retry
        configurationStep: 'review',
      },
    });
  }
}

async function prepareArchetypes(server: any, session: any) {
  // Implementation depends on selection mode
  // Return array of archetype objects with name, description, characteristics
}

async function saveSimulationResults(server: any, sessionId: string, result: any) {
  // Save archetypeReactions to FocusGroupResult table
  // Generate recommendations from reactions
  // Save recommendations to FocusGroupRecommendation table
}
```

---

## Step 5: Add Status Polling

**Frontend:** `apps/web/hooks/use-focus-group-status.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useFocusGroupStatus(sessionId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['focus-group-status', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('No session ID');
      return apiClient.get(`/focus-groups/${sessionId}`);
    },
    enabled: enabled && !!sessionId,
    refetchInterval: (data) => {
      // Poll every 2 seconds if running, otherwise stop
      return data?.session?.status === 'running' ? 2000 : false;
    },
  });
}
```

---

## Step 6: Environment Variables

Add to `services/api-gateway/.env`:

```env
PROMPT_SERVICE_URL=http://localhost:3002
```

For production (Railway):
```env
PROMPT_SERVICE_URL=http://prompt-service.railway.internal:3002
```

---

## Testing Checklist

### Prompt Service
- [ ] Prompt service running on port 3002
- [ ] `focus-group-initial-reactions` prompt created
- [ ] Prompt has all required variables defined
- [ ] Test render endpoint with sample variables

### Integration
- [ ] Prompt client can connect to service
- [ ] Focus Group V2 service instantiates
- [ ] Start endpoint triggers simulation
- [ ] Session status updates to "running"
- [ ] Async simulation completes
- [ ] Results saved to database
- [ ] Session status updates to "completed"

### Error Handling
- [ ] Handles prompt service unavailable
- [ ] Handles invalid Claude API key
- [ ] Handles JSON parsing errors
- [ ] Handles timeout (>60 seconds)
- [ ] Session resets to draft on error

---

## Success Criteria

✅ Focus group simulation executes using Prompt Service
✅ Results display in UI
✅ Status polling works correctly
✅ Error handling is robust
✅ Performance is acceptable (<60 seconds)
✅ Analytics tracked in Prompt Service

---

## Next: Phase 3 - Deliberation Logic

After initial reactions are working, we'll design the deliberation simulation logic. This requires careful prompt engineering to create realistic back-and-forth discussions between archetypes.

**Key considerations:**
- How many exchanges?
- How to maintain conversation coherence?
- How to show influence between archetypes?
- How to reach consensus or deadlock?
- Cost vs. quality tradeoffs

We'll prototype different approaches and test with real cases before finalizing the design.

---

**Ready to integrate!** 🚀
