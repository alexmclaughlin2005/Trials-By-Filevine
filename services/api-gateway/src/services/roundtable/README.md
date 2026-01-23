# Roundtable Conversation Services

This directory contains the services that power roundtable focus group conversations - AI-driven simulations of jury deliberations where personas discuss case arguments.

## Overview

The roundtable system simulates realistic jury deliberations by:
- Managing turn-taking based on leadership personality types
- Generating natural conversation between AI personas
- Analyzing statements for sentiment and social patterns
- Synthesizing conversations into actionable insights

## Architecture

```
ConversationOrchestrator
├── TurnManager (manages speaking turns)
├── PromptClient (generates statements)
└── StatementAnalyzer (analyzes statements)
```

## Services

### TurnManager

**File:** `turn-manager.ts`

**Purpose:** Manages speaking turns and ensures natural conversation flow

**Key Features:**
- Leadership-based speaking probability
  - LEADER: 40% weight (dominates discussion)
  - INFLUENCER: 30% weight (regular contributor)
  - FOLLOWER: 20% weight (occasional input)
  - PASSIVE: 10% weight (rarely speaks)
- Enforces constraints (min 1, max 5 statements per persona)
- Detects convergence (stagnation, consensus, max turns)
- Tracks conversation history

**Usage:**
```typescript
import { TurnManager, LeadershipLevel, PersonaTurnInfo } from './turn-manager';

const turnManager = new TurnManager([
  { personaId: '1', personaName: 'Alice', leadershipLevel: LeadershipLevel.LEADER, speakCount: 0 },
  { personaId: '2', personaName: 'Bob', leadershipLevel: LeadershipLevel.FOLLOWER, speakCount: 0 }
]);

// Determine next speaker
const nextSpeaker = turnManager.determineNextSpeaker();

// Record statement
turnManager.recordStatement({
  personaId: nextSpeaker.personaId,
  personaName: nextSpeaker.personaName,
  content: 'I think...',
  sequenceNumber: 1
});

// Check if should continue
if (turnManager.shouldContinue()) {
  // Continue conversation
}

// Get statistics
const stats = turnManager.getStatistics();
```

### ConversationOrchestrator

**File:** `conversation-orchestrator.ts`

**Purpose:** Orchestrates complete conversations from start to finish

**Key Features:**
- Two-phase conversation flow:
  1. **Initial Reactions** - Everyone speaks once, ordered by leadership
  2. **Dynamic Deliberation** - Natural turn-taking until convergence
- Generates statements via Prompt Management Service
- Saves statements to database in real-time
- Synthesizes conversation into insights
- Manages persona context accumulation

**Usage:**
```typescript
import { ConversationOrchestrator } from './conversation-orchestrator';
import { PrismaClient } from '@juries/database';
import { PromptClient } from '@juries/prompt-client';

const prisma = new PrismaClient();
const promptClient = new PromptClient({
  serviceUrl: 'http://localhost:3002',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY
});

const orchestrator = new ConversationOrchestrator(prisma, promptClient);

const result = await orchestrator.runConversation({
  sessionId: 'session-123',
  argument: {
    id: 'arg-1',
    title: 'Argument Title',
    content: 'Argument content...'
  },
  caseContext: {
    caseName: 'Case Name',
    caseType: 'Personal Injury',
    ourSide: 'plaintiff',
    facts: ['Fact 1', 'Fact 2']
  },
  personas: [
    {
      id: '1',
      name: 'Alice',
      description: 'Description...',
      leadershipLevel: 'LEADER',
      // ... other persona fields
    }
  ]
});

console.log(`Conversation complete: ${result.conversationId}`);
console.log(`Statements: ${result.statements.length}`);
console.log(`Consensus: ${result.consensusAreas.join(', ')}`);
```

### StatementAnalyzer

**File:** `statement-analyzer.ts`

**Purpose:** Analyzes conversation statements for metadata and patterns

**Key Features:**
- Sentiment analysis (plaintiff/defense/neutral/conflicted)
- Emotional intensity scoring (0.0-1.0)
- Key point extraction
- Social signal detection (addressed to, agreements, disagreements)
- Conversation statistics aggregation

**Usage:**
```typescript
import { StatementAnalyzer } from './statement-analyzer';
import { PrismaClient } from '@juries/database';
import { PromptClient } from '@juries/prompt-client';

const prisma = new PrismaClient();
const promptClient = new PromptClient({
  serviceUrl: 'http://localhost:3002',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY
});

const analyzer = new StatementAnalyzer(prisma, promptClient);

// Analyze all statements in a conversation
await analyzer.analyzeConversation('conversation-123');

// Get statistics
const stats = await analyzer.getConversationStatistics('conversation-123');
console.log(`Total statements: ${stats.totalStatements}`);
console.log(`Average emotional intensity: ${stats.averageEmotionalIntensity}`);
console.log(`Sentiment breakdown:`, stats.sentimentCounts);
```

## Data Models

### PersonaTurnInfo
```typescript
{
  personaId: string;
  personaName: string;
  leadershipLevel: 'LEADER' | 'INFLUENCER' | 'FOLLOWER' | 'PASSIVE';
  speakCount: number;
}
```

### Statement
```typescript
{
  personaId: string;
  personaName: string;
  content: string;
  sequenceNumber: number;
  sentiment?: 'plaintiff_leaning' | 'defense_leaning' | 'neutral' | 'conflicted';
  keyPoints?: string[];
}
```

### ConversationInput
```typescript
{
  sessionId: string;
  argument: {
    id: string;
    title: string;
    content: string;
  };
  caseContext: {
    caseName: string;
    caseType: string;
    ourSide: string;
    facts: string[];
  };
  personas: PersonaInfo[];
}
```

### ConversationResult
```typescript
{
  conversationId: string;
  statements: Statement[];
  consensusAreas: string[];
  fracturePoints: string[];
  keyDebatePoints: string[];
  influentialPersonas: any[];
  converged: boolean;
  convergenceReason: string;
}
```

## Conversation Flow

```
1. ConversationOrchestrator.runConversation()
   │
   ├─> Create FocusGroupConversation record
   │
   ├─> Phase 1: Initial Reactions
   │   ├─> Order personas by leadership
   │   ├─> For each persona:
   │   │   ├─> Generate statement (roundtable-initial-reaction prompt)
   │   │   ├─> Save to database
   │   │   └─> TurnManager.recordStatement()
   │   │
   │
   ├─> Phase 2: Dynamic Deliberation
   │   ├─> While shouldContinue():
   │   │   ├─> TurnManager.determineNextSpeaker()
   │   │   ├─> Generate statement (roundtable-conversation-turn prompt)
   │   │   ├─> Save to database
   │   │   └─> TurnManager.recordStatement()
   │   │
   │
   ├─> Phase 3: Analysis
   │   ├─> StatementAnalyzer.analyzeConversation()
   │   │   ├─> For each statement:
   │   │   │   ├─> Analyze via roundtable-statement-analysis prompt
   │   │   │   └─> Update database with analysis
   │   │
   │
   └─> Phase 4: Synthesis
       ├─> Generate synthesis (roundtable-conversation-synthesis prompt)
       ├─> Update conversation record
       └─> Return results
```

## Prompts Used

The roundtable system uses 5 prompts from the Prompt Management Service:

1. **`roundtable-persona-system`** - System prompt for persona identity
2. **`roundtable-initial-reaction`** - First reaction to argument
3. **`roundtable-conversation-turn`** - Ongoing conversation responses
4. **`roundtable-statement-analysis`** - Post-generation analysis
5. **`roundtable-conversation-synthesis`** - Final conversation synthesis

See `scripts/add-roundtable-prompts.ts` for prompt templates.

## Leadership Levels

### LEADER (40% speaking weight)
- Dominates discussion, sets tone
- Speaks first and often
- Responds to nearly every statement
- Attempts to build consensus
- Response length: 3-5 sentences

### INFLUENCER (30% speaking weight)
- Strong opinions, respected
- Speaks regularly
- Engages with 60-70% of discussion
- May challenge leader
- Response length: 2-4 sentences

### FOLLOWER (20% speaking weight)
- Has opinions but waits for cues
- Speaks when addressed or strongly moved
- Often agrees/disagrees with leaders
- Response length: 1-2 sentences

### PASSIVE (10% speaking weight)
- Rarely contributes
- Only speaks when necessary
- Very brief responses
- Internal processing
- Response length: 1 sentence

## Convergence Detection

Conversations end when:
1. **Everyone has spoken** - All personas have spoken at least once
2. **Leaders maxed out** - All leaders have reached 5 statements
3. **Stagnation detected** - Recent statements are very short or repetitive
4. **Consensus reached** - All recent sentiments align
5. **Max iterations** - Safety limit of 50 iterations

## Performance

### Token Usage (Estimated)
- Initial reaction: ~300 tokens/persona
- Conversation turn: ~400 tokens/persona
- Statement analysis: ~800 tokens/statement
- Synthesis: ~2000 tokens
- **Total (6 personas, 20 statements):** ~30,000 tokens

### Latency (Estimated)
- Statement generation: 2-3 seconds
- Statement analysis: 1-2 seconds
- Synthesis: 3-4 seconds
- **Total (20-statement conversation):** 60-100 seconds

## Error Handling

All services include fallback behavior:
- **Statement generation fails** → Use mock statement
- **Analysis fails** → Use default neutral analysis
- **Synthesis fails** → Use minimal synthesis
- **Prompt service unavailable** → Return mock data

## Testing

Run tests with:
```bash
npm test services/roundtable
```

### Unit Tests
- TurnManager constraints and convergence
- Statement analysis normalization
- Leadership weight distribution

### Integration Tests
- Full conversation flow
- Database persistence
- Prompt service integration

## Dependencies

- `@juries/database` - Prisma ORM
- `@juries/prompt-client` - Prompt Management Service client
- `fastify` - HTTP framework

## Environment Variables

```bash
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
PROMPT_SERVICE_URL=http://localhost:3002
```

## Future Enhancements

- [ ] Cross-argument memory
- [ ] Dynamic leadership adjustment
- [ ] Advanced stagnation detection
- [ ] Conversation interruptions
- [ ] Faction detection
- [ ] Live streaming

## See Also

- [Focus Group Simulation Design](../../../../../focus_group_simulation_design.md)
- [Session Summary](../../../../../SESSION_SUMMARY_2026-01-23_ROUNDTABLE_CONVERSATIONS.md)
- [Prompt Service Documentation](../../../../prompt-service/README.md)
