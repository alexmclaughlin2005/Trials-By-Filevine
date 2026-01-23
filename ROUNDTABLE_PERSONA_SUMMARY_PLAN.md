# Roundtable Persona Summary Plan

## Overview

Currently, the roundtable conversation displays all statements chronologically and provides an overall conversation synthesis at the end. This plan outlines how to add **per-persona summaries** that show each participant's journey through the conversation, followed by the overall analysis.

---

## Current State

### Existing Data Flow

1. **Conversation Generation** (`ConversationOrchestrator`)
   - Phase 1: Initial reactions (all personas speak once)
   - Phase 2: Dynamic deliberation (turn-based speaking)
   - Phase 3: Overall synthesis (consensus, fractures, key debates)

2. **Statement Analysis** (`StatementAnalyzer`)
   - Analyzes each statement for: sentiment, emotional intensity, key points, social signals
   - Stores analysis in `FocusGroupStatement` table

3. **Current Output Structure**
   ```typescript
   {
     conversationId: string,
     statements: Statement[],          // All statements chronologically
     consensusAreas: string[],         // Overall consensus
     fracturePoints: string[],         // Overall disagreements
     keyDebatePoints: string[],        // Main topics discussed
     influentialPersonas: any[],       // Who dominated
     statistics: {...}                 // Aggregated stats
   }
   ```

### What's Missing

- **Per-persona journey tracking**: How did each persona's position evolve?
- **Individual contribution summary**: What were each persona's main points?
- **Persona-specific insights**: What made them change their mind (if they did)?
- **Display format**: UI structure to show personas → conversation → overall

---

## Proposed Solution

### 1. Data Model Changes

#### Add `FocusGroupPersonaSummary` Table

```prisma
// Per-persona summary of their participation in a conversation
model FocusGroupPersonaSummary {
  id              String   @id @default(uuid())
  conversationId  String   @map("conversation_id")
  personaId       String   @map("persona_id")
  personaName     String   @map("persona_name")

  // Participation stats
  totalStatements Int      @map("total_statements")
  firstStatement  String   @db.Text @map("first_statement")
  lastStatement   String   @db.Text @map("last_statement")

  // Position tracking
  initialPosition   String   @map("initial_position") // favorable | neutral | unfavorable | mixed
  finalPosition     String   @map("final_position")
  positionShifted   Boolean  @map("position_shifted")
  shiftDescription  String?  @db.Text @map("shift_description") // AI-generated explanation of change

  // Content summary
  mainPoints        Json     @map("main_points")           // Array of key points they made
  concernsRaised    Json     @map("concerns_raised")       // Array of concerns they voiced
  questionsAsked    Json     @map("questions_asked")       // Array of questions they posed

  // Social dynamics
  influenceLevel    String   @map("influence_level")       // high | medium | low
  agreedWithMost    String[] @map("agreed_with_most")      // Persona names they agreed with
  disagreedWithMost String[] @map("disagreed_with_most")   // Persona names they disagreed with
  influencedBy      String[] @map("influenced_by")         // Who changed their mind

  // Sentiment analysis
  averageSentiment      String  @map("average_sentiment")  // Overall lean
  averageEmotionalIntensity Decimal @map("average_emotional_intensity") @db.Decimal(3, 2)
  mostEmotionalStatement String? @db.Text @map("most_emotional_statement")

  // AI-generated narrative summary
  summary           String   @db.Text                      // 2-3 paragraph summary of persona's journey

  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  conversation FocusGroupConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@unique([conversationId, personaId])
  @@index([conversationId])
  @@index([personaId])
  @@map("focus_group_persona_summaries")
}
```

#### Update `FocusGroupConversation` Table

Add reference to persona summaries:

```prisma
model FocusGroupConversation {
  // ... existing fields ...

  personaSummaries FocusGroupPersonaSummary[]
}
```

---

### 2. Service Implementation

#### New Service: `PersonaSummarizer`

**Location**: `services/api-gateway/src/services/roundtable/persona-summarizer.ts`

```typescript
export class PersonaSummarizer {
  private prisma: PrismaClient;
  private promptClient: PromptClient;

  /**
   * Generate summaries for all personas in a conversation
   */
  async summarizePersonas(conversationId: string): Promise<PersonaSummary[]> {
    // 1. Get all statements grouped by persona
    // 2. For each persona, generate summary
    // 3. Store in database
  }

  /**
   * Generate summary for a single persona
   */
  private async summarizePersona(
    personaId: string,
    personaName: string,
    statements: Statement[],
    conversationContext: ConversationContext
  ): Promise<PersonaSummary> {
    // Call LLM with persona-specific prompt
    // Analyze: initial vs final position, key points, influence, shifts
  }
}
```

**Key Functions**:

1. **`summarizePersonas(conversationId)`**
   - Called after conversation completes
   - Groups statements by persona
   - Generates individual summaries via LLM
   - Stores in database

2. **`summarizePersona(personaId, statements, context)`**
   - Analyzes all statements from one persona
   - Detects position shifts (initial → final)
   - Identifies key contributions
   - Tracks social dynamics (who they agreed/disagreed with)
   - Generates narrative summary (2-3 paragraphs)

---

### 3. Orchestration Flow Update

#### Current Flow (conversation-orchestrator.ts)

```typescript
async runConversation(input: ConversationInput): Promise<ConversationResult> {
  // Phase 1: Initial reactions
  await this.runInitialReactions(conversationId, input);

  // Phase 2: Dynamic deliberation
  await this.runDynamicDeliberation(conversationId, input);

  // Phase 3: Analyze and synthesize conversation
  const synthesis = await this.synthesizeConversation(conversationId, input);

  // ✅ Update conversation record

  return result;
}
```

#### New Flow (with persona summaries)

```typescript
async runConversation(input: ConversationInput): Promise<ConversationResult> {
  // Phase 1: Initial reactions
  await this.runInitialReactions(conversationId, input);

  // Phase 2: Dynamic deliberation
  await this.runDynamicDeliberation(conversationId, input);

  // Phase 3: Analyze statements (EXISTING)
  await this.analyzer.analyzeConversation(conversationId);

  // Phase 4: Generate per-persona summaries (NEW)
  const personaSummaries = await this.personaSummarizer.summarizePersonas(conversationId);

  // Phase 5: Generate overall synthesis (EXISTING)
  const synthesis = await this.synthesizeConversation(conversationId, input);

  // ✅ Update conversation record

  return {
    ...result,
    personaSummaries  // NEW
  };
}
```

---

### 4. Prompt Design

#### Prompt: `roundtable-persona-summary`

**Purpose**: Generate a comprehensive summary of one persona's participation

**Inputs**:
- `personaName`: The persona's name
- `personaDescription`: Brief background
- `allStatements`: All statements from this persona (chronological)
- `conversationTranscript`: Full conversation for context
- `argumentContent`: The argument being discussed

**Output Structure**:
```json
{
  "initialPosition": "favorable|neutral|unfavorable|mixed",
  "finalPosition": "favorable|neutral|unfavorable|mixed",
  "positionShifted": true|false,
  "shiftDescription": "Explanation of why/how position changed",
  "mainPoints": [
    "Key point 1 they made",
    "Key point 2 they made"
  ],
  "concernsRaised": [
    "Concern 1",
    "Concern 2"
  ],
  "questionsAsked": [
    "Question 1",
    "Question 2"
  ],
  "influenceLevel": "high|medium|low",
  "agreedWithMost": ["Persona names"],
  "disagreedWithMost": ["Persona names"],
  "influencedBy": ["Persona names who changed their mind"],
  "averageSentiment": "plaintiff_leaning|defense_leaning|neutral|conflicted",
  "summary": "2-3 paragraph narrative summary of their journey through the conversation"
}
```

**Prompt Template**:
```
You are analyzing a focus group conversation about a legal argument. Your task is to summarize
one participant's journey through the discussion.

# ARGUMENT BEING DISCUSSED:
{{argumentContent}}

# PERSONA:
{{personaName}}
{{personaDescription}}

# THEIR STATEMENTS (in order):
{{allStatements}}

# FULL CONVERSATION CONTEXT:
{{conversationTranscript}}

# YOUR TASK:

Analyze {{personaName}}'s participation and generate a comprehensive summary:

1. **Position Tracking**:
   - What was their initial stance? (favorable/neutral/unfavorable/mixed)
   - What was their final stance?
   - Did their position shift? If so, what caused the shift?

2. **Key Contributions**:
   - What were the main points they made?
   - What concerns did they raise?
   - What questions did they ask?

3. **Social Dynamics**:
   - How influential were they? (high/medium/low based on whether others responded to their points)
   - Who did they agree with most?
   - Who did they disagree with?
   - Who influenced them (if their position shifted)?

4. **Narrative Summary**:
   - Write 2-3 paragraphs describing their journey through the conversation
   - Include: initial reaction → key moments → final position
   - Highlight any pivot points or particularly emotional statements

Return JSON in the specified format.
```

---

### 5. API Response Structure

#### Current Response

```typescript
GET /api/focus-groups/conversations/:conversationId

{
  id: string,
  argumentId: string,
  argumentTitle: string,
  statements: Statement[],
  consensusAreas: string[],
  fracturePoints: string[],
  keyDebatePoints: string[],
  statistics: {...}
}
```

#### New Response (with persona summaries)

```typescript
GET /api/focus-groups/conversations/:conversationId

{
  id: string,
  argumentId: string,
  argumentTitle: string,

  // NEW: Organized by persona first
  personaSummaries: [
    {
      personaId: string,
      personaName: string,
      totalStatements: number,
      initialPosition: string,
      finalPosition: string,
      positionShifted: boolean,
      shiftDescription?: string,
      mainPoints: string[],
      concernsRaised: string[],
      questionsAsked: string[],
      influenceLevel: string,
      agreedWithMost: string[],
      disagreedWithMost: string[],
      influencedBy: string[],
      averageSentiment: string,
      averageEmotionalIntensity: number,
      mostEmotionalStatement?: string,
      summary: string,           // 2-3 paragraph narrative
      statements: Statement[]    // Their statements only
    }
  ],

  // EXISTING: Overall conversation analysis
  overallAnalysis: {
    consensusAreas: string[],
    fracturePoints: string[],
    keyDebatePoints: string[],
    influentialPersonas: string[],
    statistics: {...}
  },

  // EXISTING: All statements chronologically (for timeline view)
  allStatements: Statement[]
}
```

---

### 6. UI Display Structure

#### Proposed Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Roundtable Discussion: [Argument Title]                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Tab: By Persona] [Tab: Timeline] [Tab: Overall Analysis]   │
│                                                              │
│ ┌─ By Persona Tab ─────────────────────────────────────┐   │
│ │                                                        │   │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │   │
│ │ ┃ 👤 Robert Miller (Leader)                        ┃  │   │
│ │ ┃ Position: Neutral → Favorable (Shifted)         ┃  │   │
│ │ ┃ Influence: High | Statements: 5                 ┃  │   │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │   │
│ │                                                        │   │
│ │ Summary:                                               │   │
│ │ Robert began with a neutral stance, noting that...    │   │
│ │ His position shifted after Maria raised concerns...   │   │
│ │ By the end, he was convinced that...                  │   │
│ │                                                        │   │
│ │ Key Points:                                            │   │
│ │ • "The procedures were clearly documented"            │   │
│ │ • "Training was offered to all employees"             │   │
│ │ • "Personal responsibility matters"                   │   │
│ │                                                        │   │
│ │ Concerns Raised:                                       │   │
│ │ • "Was the training actually realistic?"              │   │
│ │                                                        │   │
│ │ Social Dynamics:                                       │   │
│ │ • Agreed with: Janet, Derek                           │   │
│ │ • Debated with: Maria                                 │   │
│ │ • Influenced by: Maria's real-world examples          │   │
│ │                                                        │   │
│ │ [Expand to see all statements ▼]                      │   │
│ │                                                        │   │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │   │
│ │ ┃ 👤 Maria Rodriguez (Influencer)                  ┃  │   │
│ │ ┃ Position: Unfavorable → Unfavorable (Consistent)┃  │   │
│ │ ┃ Influence: High | Statements: 4                 ┃  │   │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │   │
│ │ ... (similar structure for each persona)              │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌─ Overall Analysis Tab ──────────────────────────────┐   │
│ │                                                        │   │
│ │ Consensus Areas:                                       │   │
│ │ • Training requirements need clarification             │   │
│ │ • Documentation exists but implementation unclear      │   │
│ │                                                        │   │
│ │ Fracture Points:                                       │   │
│ │ • Whether procedures were realistic                    │   │
│ │ • Degree of employer responsibility                    │   │
│ │                                                        │   │
│ │ Key Debates:                                           │   │
│ │ • "Procedures on paper vs. in practice"                │   │
│ │ • "Training offered vs. training required"             │   │
│ │                                                        │   │
│ │ Most Influential: Robert, Maria                        │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 7. Implementation Steps

#### Backend Changes

1. **Database Migration**
   ```bash
   # Add FocusGroupPersonaSummary table
   npx prisma migrate dev --name add_persona_summaries
   ```

2. **Create PersonaSummarizer Service**
   - File: `services/api-gateway/src/services/roundtable/persona-summarizer.ts`
   - Implement `summarizePersonas()` and `summarizePersona()`

3. **Create Prompt Template**
   - File: `services/prompt-service/prompts/roundtable-persona-summary.yaml`
   - Define system prompt and user prompt template

4. **Update ConversationOrchestrator**
   - Add Phase 4: Generate persona summaries
   - Import and initialize `PersonaSummarizer`
   - Call after statement analysis, before overall synthesis

5. **Update API Endpoints**
   - File: `services/api-gateway/src/routes/focus-groups.ts`
   - Modify `GET /conversations/:conversationId` to include persona summaries
   - Ensure proper data structure transformation

6. **Export PersonaSummarizer**
   - File: `services/api-gateway/src/services/roundtable/index.ts`
   - Add: `export { PersonaSummarizer } from './persona-summarizer';`

#### Frontend Changes

7. **Update Type Definitions**
   - File: `apps/web/types/focus-group.ts`
   - Add `PersonaSummary` interface
   - Update `ConversationDetail` interface

8. **Create PersonaSummaryCard Component**
   - File: `apps/web/components/focus-groups/PersonaSummaryCard.tsx`
   - Display persona summary with expandable statements

9. **Create ConversationTabs Component**
   - File: `apps/web/components/focus-groups/ConversationTabs.tsx`
   - Tabs: "By Persona" | "Timeline" | "Overall Analysis"

10. **Update Conversation Detail Page**
    - File: `apps/web/app/(authenticated)/cases/[caseId]/focus-groups/conversations/[conversationId]/page.tsx`
    - Use new tabbed layout
    - Fetch and display persona summaries

---

### 8. Testing Strategy

#### Unit Tests

1. **PersonaSummarizer Service**
   - Test: Groups statements correctly by persona
   - Test: Handles personas with 1 vs. multiple statements
   - Test: Detects position shifts correctly
   - Test: Fallback handling when LLM fails

2. **Prompt Execution**
   - Test: Prompt renders with all variables
   - Test: Response parsing handles all fields
   - Test: Validation of enum values (position, influence, sentiment)

#### Integration Tests

3. **Full Conversation Flow**
   - Run complete roundtable conversation
   - Verify persona summaries are created
   - Verify data is stored correctly in database
   - Verify API response includes summaries

#### Manual Testing

4. **UI/UX Testing**
   - Verify persona cards display correctly
   - Test expand/collapse of statements
   - Test tab switching (Persona/Timeline/Overall)
   - Test with different screen sizes

---

### 9. Benefits of This Approach

#### For Attorneys

1. **Quick Persona Assessment**: See at a glance how each persona type reacted
2. **Position Tracking**: Identify which personas shifted and why
3. **Influence Mapping**: Understand who sways whom
4. **Key Points Extraction**: Get bullet points of main contributions

#### For Strategy

1. **Persona Targeting**: Know which personas need more persuasion
2. **Argument Refinement**: Identify which points resonated with which personas
3. **Risk Assessment**: See persistent fracture points by persona type
4. **Narrative Building**: Use persona journeys to craft persuasive stories

#### For UI/UX

1. **Progressive Disclosure**: Start with summaries, drill down to statements
2. **Multiple Views**: Timeline view for flow, persona view for analysis
3. **Scannable Format**: Bullet points and structured data
4. **Narrative Context**: AI-generated summaries provide interpretation

---

### 10. Future Enhancements

#### Phase 2 (Future)

1. **Comparative Analysis**: Compare persona reactions across multiple arguments
2. **Archetype Patterns**: Aggregate data to show how archetypes typically react
3. **Influence Network Graph**: Visualize who influenced whom
4. **Export Reports**: PDF/Word export of persona summaries
5. **Position Timeline**: Visual timeline showing when positions shifted
6. **Cross-Argument Memory**: Track persona consistency across conversations

---

## Summary

This plan adds **per-persona summaries** to the roundtable conversation system:

- ✅ **New database table**: `FocusGroupPersonaSummary`
- ✅ **New service**: `PersonaSummarizer`
- ✅ **New prompt**: `roundtable-persona-summary`
- ✅ **Updated flow**: Add Phase 4 (persona summarization) to orchestrator
- ✅ **Enhanced API**: Include persona summaries in conversation response
- ✅ **New UI structure**: Tabbed view with persona-first display

**Key Principle**: Organize by persona → then show overall, rather than mixing everything chronologically. This gives attorneys actionable insights about how different juror types will react.
