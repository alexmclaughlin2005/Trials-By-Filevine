# Phase 5B: "So What?" Results Tab - Design Document

**Created:** January 27, 2026
**Status:** Design Phase
**Priority:** CRITICAL - Makes the tool valuable

---

## Executive Summary

The current roundtable conversation results show **what happened** (transcript, consensus, fractures), but attorneys need to know **"So what?"** - what should I do next?

This design adds a new **"Key Takeaways"** tab that provides:
1. Auto-generated strategic insights (what landed, what confused, what backfired)
2. Top questions to prepare for (ranked by importance)
3. Recommended edits to the argument (diff-style suggestions)
4. Single CTA: "Apply Recommendations" to create improved v2 draft

**User Value:** Saves attorneys 10-15 minutes of analysis per focus group, provides concrete next steps.

---

## Current State Analysis

### What We Have Now
**File:** [roundtable-conversation-viewer.tsx](apps/web/components/roundtable-conversation-viewer.tsx)

**Current Tabs/Sections:**
1. **Header Card** - Stats (statement count, status, duration)
2. **Consensus Areas** - What the panel agreed on
3. **Fracture Points** - What divided the panel
4. **Key Debate Points** - Major topics discussed
5. **Conversation Transcript** - Full chronological statements with sentiment

### What's Missing
- **No actionable recommendations** - Just raw analysis
- **No prioritized next steps** - Attorneys must derive their own action items
- **No concrete edits** - "This confused them" but not "Change X to Y"
- **No workflow closure** - Results don't lead to improvement cycle

---

## Proposed Solution: "Key Takeaways" Tab

### Tab Structure

Add a new primary tab (appears first, before "Full Transcript"):

```
┌─────────────────────────────────────────────────────┐
│  [Key Takeaways]  [Full Transcript]  [By Persona]  │
└─────────────────────────────────────────────────────┘
```

### Section 1: Strategic Summary (Top of Page)

**Auto-generated three-column layout:**

```
┌───────────────────┬───────────────────┬───────────────────┐
│  ✅ What Landed   │  ⚠️ What Confused │  ❌ What Backfired│
├───────────────────┼───────────────────┼───────────────────┤
│ • [Point 1]       │ • [Point 1]       │ • [Point 1]       │
│ • [Point 2]       │ • [Point 2]       │ • [Point 2]       │
│ • [Point 3]       │ • [Point 3]       │ • [Point 3]       │
│                   │                   │                   │
│ [View Details]    │ [View Details]    │ [View Details]    │
└───────────────────┴───────────────────┴───────────────────┘
```

**Data Source:** AI synthesis of conversation using new prompt

**Example Output:**
- **What Landed:** "Medical expert testimony resonated with all personas", "Timeline was clear and persuasive"
- **What Confused:** "Damages calculation methodology unclear to 4/6 personas", "Conflicting witness statements raised doubts"
- **What Backfired:** "Emotional appeal dismissed as manipulative by Calculators", "Legal jargon alienated 3 personas"

---

### Section 2: Top Questions to Prepare For

**Ranked list of questions the jury will ask during deliberation:**

```
┌─────────────────────────────────────────────────────┐
│  🎯 Top Questions Jurors Will Ask                   │
├─────────────────────────────────────────────────────┤
│  1. [HIGH PRIORITY] "Why didn't the plaintiff seek  │
│     medical treatment immediately?"                  │
│     └─ Asked by 4/6 personas, severity: CRITICAL    │
│                                                      │
│  2. [HIGH PRIORITY] "How do we calculate pain and   │
│     suffering damages?"                              │
│     └─ Asked by 5/6 personas, severity: HIGH        │
│                                                      │
│  3. [MEDIUM PRIORITY] "What was the defendant's     │
│     response to the complaint?"                      │
│     └─ Asked by 2/6 personas, severity: MEDIUM      │
│                                                      │
│  [+ 3 more questions]                                │
└─────────────────────────────────────────────────────┘
```

**Ranking Logic:**
- **HIGH PRIORITY:** Asked by 4+ personas OR severity = CRITICAL
- **MEDIUM PRIORITY:** Asked by 2-3 personas OR severity = HIGH
- **LOW PRIORITY:** Asked by 1 persona OR severity = MEDIUM

**Data Source:** AI extracts questions/concerns from conversation statements

---

### Section 3: Recommended Edits to Argument

**Diff-style recommendations showing before/after:**

```
┌─────────────────────────────────────────────────────┐
│  📝 Recommended Edits to Your Opening Statement     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Edit 1: Clarify Timeline (Lines 12-15)             │
│  ┌──────────────────────────────────────────────┐  │
│  │ - The incident occurred in June 2023.        │  │
│  │ + The incident occurred on June 15, 2023,    │  │
│  │ + at approximately 3:45 PM, as confirmed by  │  │
│  │ + surveillance footage.                      │  │
│  └──────────────────────────────────────────────┘  │
│  Why: 3 personas questioned timeline precision     │
│                                                      │
│  Edit 2: Add Medical Evidence (After Line 25)       │
│  ┌──────────────────────────────────────────────┐  │
│  │ + Dr. Smith's examination on June 16th       │  │
│  │ + documented severe whiplash and spinal      │  │
│  │ + compression, requiring 6 months of PT.     │  │
│  └──────────────────────────────────────────────┘  │
│  Why: All personas wanted concrete medical proof   │
│                                                      │
│  Edit 3: Soften Emotional Appeal (Lines 45-48)      │
│  ┌──────────────────────────────────────────────┐  │
│  │ - My client's life has been destroyed by     │  │
│  │ - this negligence. She can't work, can't     │  │
│  │ - sleep, can't even play with her children.  │  │
│  │ + Medical records show my client can no      │  │
│  │ + longer perform her job duties due to       │  │
│  │ + chronic pain, impacting her family income. │  │
│  └──────────────────────────────────────────────┘  │
│  Why: Calculator/Scale-Balancer personas found     │
│       original wording "too emotional"              │
│                                                      │
│  [View All 5 Recommendations]                        │
└─────────────────────────────────────────────────────┘
```

**Format:**
- Show exact line numbers (if possible) or sections
- Red text for removed content
- Green text for added content
- Brief explanation: "Why this edit?" with persona references

**Data Source:** AI analyzes argument + conversation to suggest concrete improvements

---

### Section 4: Call to Action

**Single prominent button at bottom:**

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│  [Apply Recommendations to Create v2 Draft] ──→     │
│                                                      │
│  This will create a new argument draft with the     │
│  recommended edits applied. You can review and      │
│  modify before saving.                               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Workflow:**
1. Click "Apply Recommendations"
2. Opens argument editor with new draft pre-populated
3. All recommended edits are applied (with highlights)
4. User can accept/reject/modify each edit
5. Save as new version or overwrite existing argument

---

## Technical Implementation

### New API Endpoint

**Endpoint:** `POST /api/focus-groups/conversations/:conversationId/generate-takeaways`

**Purpose:** Generate strategic takeaways using AI synthesis

**Request:**
```json
{
  "conversationId": "conv-123"
}
```

**Response:**
```json
{
  "takeaways": {
    "whatLanded": [
      {
        "point": "Medical expert testimony resonated",
        "personaSupport": ["Scale-Balancer", "Heart", "Calculator"],
        "evidence": ["Statement #5: 'The doctor's testimony was clear'"]
      }
    ],
    "whatConfused": [
      {
        "point": "Damages calculation methodology unclear",
        "personasConfused": ["Bootstrapper", "Calculator", "Captain", "Chameleon"],
        "severity": "HIGH",
        "evidence": ["Statement #12: 'How did they arrive at $500k?'"]
      }
    ],
    "whatBackfired": [
      {
        "point": "Emotional appeal dismissed as manipulative",
        "personasCritical": ["Calculator", "Scale-Balancer"],
        "severity": "CRITICAL",
        "evidence": ["Statement #18: 'This feels like manipulation'"]
      }
    ],
    "topQuestions": [
      {
        "question": "Why didn't the plaintiff seek medical treatment immediately?",
        "askedByCount": 4,
        "personaNames": ["Bootstrapper", "Calculator", "Scarred", "Maverick"],
        "severity": "CRITICAL",
        "priority": "HIGH"
      }
    ],
    "recommendedEdits": [
      {
        "editNumber": 1,
        "section": "Timeline (Lines 12-15)",
        "type": "CLARIFY",
        "originalText": "The incident occurred in June 2023.",
        "suggestedText": "The incident occurred on June 15, 2023, at approximately 3:45 PM, as confirmed by surveillance footage.",
        "reason": "3 personas questioned timeline precision",
        "affectedPersonas": ["Calculator", "Scale-Balancer", "Captain"],
        "priority": "HIGH"
      }
    ]
  },
  "generatedAt": "2026-01-27T10:30:00Z",
  "promptVersion": "takeaways-v1.0.0"
}
```

---

### New Prompt Template

**Prompt Name:** `roundtable-takeaways-synthesis`
**Version:** 1.0.0
**Model:** Claude Sonnet 4.5

**Variables:**
- `argumentTitle` - Title of the argument tested
- `argumentContent` - Full text of the argument
- `conversationTranscript` - Full conversation with all statements
- `personaSummaries` - Per-persona summaries (already generated)
- `consensusAreas` - Existing consensus analysis
- `fracturePoints` - Existing fracture analysis

**System Prompt:**
```
You are an expert trial consultant analyzing a focus group conversation
about a legal argument. Your goal is to provide actionable strategic
advice to attorneys.

Analyze the conversation and provide:

1. WHAT LANDED (3-5 points)
   - Which arguments/points resonated with the panel
   - Which personas found them persuasive and why
   - Evidence from specific statements

2. WHAT CONFUSED (3-5 points)
   - Which parts were unclear or raised questions
   - How many personas were confused
   - Severity: LOW, MEDIUM, HIGH, CRITICAL
   - Evidence from specific statements

3. WHAT BACKFIRED (2-4 points)
   - Which arguments/tactics had negative effects
   - Which personas reacted negatively and why
   - Severity: LOW, MEDIUM, HIGH, CRITICAL
   - Evidence from specific statements

4. TOP QUESTIONS TO PREPARE FOR (5-10 questions)
   - Ranked by importance (frequency + severity)
   - Who asked or implied each question
   - Priority: LOW, MEDIUM, HIGH

5. RECOMMENDED EDITS (3-7 specific edits)
   - Concrete before/after suggestions
   - Section/line references if possible
   - Reason for each edit (persona-specific)
   - Priority: LOW, MEDIUM, HIGH

Format your response as structured JSON.
```

**User Prompt:**
```
Argument Title: {{argumentTitle}}

Argument Content:
{{argumentContent}}

Conversation Transcript:
{{conversationTranscript}}

Persona Summaries:
{{personaSummaries}}

Consensus Areas:
{{consensusAreas}}

Fracture Points:
{{fracturePoints}}

Generate strategic takeaways and recommendations.
```

**Expected Token Usage:** 8,000-12,000 tokens (~$0.40-0.60 per analysis)

---

### Frontend Component Updates

**File:** `apps/web/components/roundtable-conversation-viewer.tsx`

**Changes:**
1. Add tabs: "Key Takeaways" (default), "Full Transcript", "By Persona"
2. Create new `<TakeawaysTab>` component
3. Fetch takeaways on mount: `GET /api/focus-groups/conversations/:id/takeaways`
4. Show loading state while AI generates takeaways (~5-10 seconds)
5. Cache takeaways (don't regenerate on every view)

**New Components:**

```typescript
// apps/web/components/focus-groups/TakeawaysTab.tsx
export function TakeawaysTab({ conversationId }: { conversationId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['conversation-takeaways', conversationId],
    queryFn: () => apiClient.post(`/focus-groups/conversations/${conversationId}/generate-takeaways`)
  });

  return (
    <div className="space-y-6">
      <StrategicSummaryCards takeaways={data?.takeaways} />
      <TopQuestionsSection questions={data?.takeaways.topQuestions} />
      <RecommendedEditsSection edits={data?.takeaways.recommendedEdits} />
      <ApplyRecommendationsCTA conversationId={conversationId} argumentId={data?.argumentId} />
    </div>
  );
}

// apps/web/components/focus-groups/StrategicSummaryCards.tsx
export function StrategicSummaryCards({ takeaways }: { takeaways: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            What Landed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {takeaways.whatLanded.map((item, i) => (
              <li key={i} className="text-sm text-green-900">
                • {item.point}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {/* Similar cards for What Confused, What Backfired */}
    </div>
  );
}

// apps/web/components/focus-groups/RecommendedEditsSection.tsx
export function RecommendedEditsSection({ edits }: { edits: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>📝 Recommended Edits to Your Argument</CardTitle>
        <CardDescription>
          Concrete suggestions based on panel reactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {edits.map((edit, i) => (
            <div key={i} className="border-l-4 border-filevine-blue pl-4">
              <div className="font-medium text-filevine-gray-900 mb-2">
                Edit {edit.editNumber}: {edit.section}
              </div>
              <div className="bg-gray-50 rounded-md p-3 space-y-2">
                {edit.originalText && (
                  <div className="text-sm text-red-700 line-through">
                    {edit.originalText}
                  </div>
                )}
                <div className="text-sm text-green-700 font-medium">
                  {edit.suggestedText}
                </div>
              </div>
              <div className="mt-2 text-xs text-filevine-gray-600">
                <span className="font-medium">Why:</span> {edit.reason}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// apps/web/components/focus-groups/ApplyRecommendationsCTA.tsx
export function ApplyRecommendationsCTA({ conversationId, argumentId }: any) {
  const router = useRouter();

  const applyRecommendations = () => {
    // Navigate to argument editor with recommendations pre-applied
    router.push(`/arguments/${argumentId}/edit?applyRecommendations=${conversationId}`);
  };

  return (
    <Card className="bg-filevine-blue text-white">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <h3 className="font-semibold text-lg">Apply Recommendations to Create v2 Draft</h3>
          <p className="text-sm text-blue-100 mt-1">
            Create a new argument draft with the recommended edits applied.
            You can review and modify before saving.
          </p>
        </div>
        <Button variant="secondary" onClick={applyRecommendations}>
          Apply Now →
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

### Backend Service Implementation

**File:** `services/api-gateway/src/services/roundtable/takeaways-generator.ts`

```typescript
import { PrismaClient } from '@juries/database';
import { PromptClient } from '@juries/prompt-client';

export interface TakeawaysResult {
  whatLanded: Array<{
    point: string;
    personaSupport: string[];
    evidence: string[];
  }>;
  whatConfused: Array<{
    point: string;
    personasConfused: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    evidence: string[];
  }>;
  whatBackfired: Array<{
    point: string;
    personasCritical: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    evidence: string[];
  }>;
  topQuestions: Array<{
    question: string;
    askedByCount: number;
    personaNames: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  recommendedEdits: Array<{
    editNumber: number;
    section: string;
    type: 'CLARIFY' | 'ADD' | 'REMOVE' | 'SOFTEN' | 'STRENGTHEN';
    originalText?: string;
    suggestedText: string;
    reason: string;
    affectedPersonas: string[];
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

export class TakeawaysGenerator {
  constructor(
    private prisma: PrismaClient,
    private promptClient: PromptClient
  ) {}

  async generateTakeaways(conversationId: string): Promise<TakeawaysResult> {
    // 1. Fetch conversation with all statements, argument, and persona summaries
    const conversation = await this.prisma.focusGroupConversation.findUnique({
      where: { id: conversationId },
      include: {
        statements: { orderBy: { sequenceNumber: 'asc' } },
        argument: true,
        personaSummaries: true
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // 2. Format data for prompt
    const transcript = this.formatTranscript(conversation.statements);
    const summaries = this.formatPersonaSummaries(conversation.personaSummaries);

    // 3. Execute prompt
    const { result } = await this.promptClient.execute('roundtable-takeaways-synthesis', {
      variables: {
        argumentTitle: conversation.argument.title,
        argumentContent: conversation.argument.content,
        conversationTranscript: transcript,
        personaSummaries: summaries,
        consensusAreas: JSON.stringify(conversation.consensusAreas || []),
        fracturePoints: JSON.stringify(conversation.fracturePoints || [])
      }
    });

    // 4. Parse and validate result
    return this.parseAndValidate(result);
  }

  private formatTranscript(statements: any[]): string {
    return statements
      .map(s => `${s.personaName} (#${s.sequenceNumber}): "${s.content}"`)
      .join('\n\n');
  }

  private formatPersonaSummaries(summaries: any[]): string {
    return summaries
      .map(s => `${s.personaName}: ${s.summary}`)
      .join('\n\n');
  }

  private parseAndValidate(result: any): TakeawaysResult {
    // Parse AI response and ensure it matches expected structure
    // Add validation, defaults, etc.
    return result as TakeawaysResult;
  }
}
```

**File:** `services/api-gateway/src/routes/focus-groups.ts`

```typescript
// Add new route
fastify.post<{ Params: { conversationId: string } }>(
  '/focus-groups/conversations/:conversationId/generate-takeaways',
  async (request, reply) => {
    const { conversationId } = request.params;

    const generator = new TakeawaysGenerator(prisma, promptClient);
    const takeaways = await generator.generateTakeaways(conversationId);

    return {
      conversationId,
      takeaways,
      generatedAt: new Date().toISOString(),
      promptVersion: 'takeaways-v1.0.0'
    };
  }
);
```

---

## Database Schema Changes

### Option 1: Store Takeaways in Database (Recommended)

**New Model:**
```prisma
model FocusGroupTakeaways {
  id                String   @id @default(cuid())
  conversationId    String   @unique
  conversation      FocusGroupConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  whatLanded        Json     // Array of { point, personaSupport, evidence }
  whatConfused      Json     // Array of { point, personasConfused, severity, evidence }
  whatBackfired     Json     // Array of { point, personasCritical, severity, evidence }
  topQuestions      Json     // Array of { question, askedByCount, personaNames, severity, priority }
  recommendedEdits  Json     // Array of edit objects

  promptVersion     String   // e.g., "takeaways-v1.0.0"
  generatedAt       DateTime @default(now())

  @@map("focus_group_takeaways")
}
```

**Why store in DB:**
- Avoids regenerating expensive AI call (~$0.50) on every view
- Allows version tracking (can regenerate with new prompt versions)
- Enables analytics (most common confusion points, etc.)

### Option 2: Generate on Demand (Not Recommended)

**Pros:** No DB changes
**Cons:** Slow (5-10 seconds per view), expensive (repeated AI calls)

**Recommendation:** Use Option 1 with lazy generation:
- First view: Generate and store
- Subsequent views: Return cached version
- Add "Regenerate Takeaways" button for updates

---

## User Experience Flow

### Attorney Workflow

1. **Complete focus group simulation** (60-90 seconds)
2. **View results** - automatically lands on "Key Takeaways" tab
3. **Loading state** - "Analyzing conversation..." (5-10 seconds)
4. **Review strategic summary:**
   - Quickly scan: What landed, what confused, what backfired
   - Read top questions jurors will ask
   - Review recommended edits
5. **Click "Apply Recommendations"**
6. **Edit argument draft:**
   - All edits pre-applied with highlights
   - Accept/reject/modify each edit
   - Save as new version or overwrite
7. **Run new focus group** (optional) to test improvements
8. **Compare results** between v1 and v2

---

## Success Metrics

### User Metrics
- **Time to Action:** From viewing results to editing argument: <2 minutes (vs. 10-15 minutes manual analysis)
- **Recommendation Acceptance Rate:** >70% of edits accepted/partially accepted
- **Iteration Rate:** >50% of users run second focus group after applying recommendations

### Technical Metrics
- **Generation Time:** <10 seconds for takeaways generation
- **Cost per Takeaway:** <$0.60 per conversation
- **Cache Hit Rate:** >80% (most users view takeaways only once)

### Business Metrics
- **Feature Adoption:** >90% of users view "Key Takeaways" tab first
- **User Feedback:** 4.5+ stars on "usefulness of recommendations"
- **Workflow Completion:** >60% of users complete full cycle (focus group → recommendations → edit → re-test)

---

## Implementation Timeline

### Phase 1: Backend Infrastructure (Day 1)
- [ ] Create `TakeawaysGenerator` service
- [ ] Add `roundtable-takeaways-synthesis` prompt to prompt service
- [ ] Add API route: `POST /focus-groups/conversations/:id/generate-takeaways`
- [ ] Add database migration for `FocusGroupTakeaways` model
- [ ] Test prompt with sample conversations

**Estimated Time:** 4-5 hours

### Phase 2: Frontend Components (Day 2)
- [ ] Add tab navigation to conversation viewer
- [ ] Create `TakeawaysTab` component
- [ ] Create `StrategicSummaryCards` component
- [ ] Create `TopQuestionsSection` component
- [ ] Create `RecommendedEditsSection` component
- [ ] Create `ApplyRecommendationsCTA` component
- [ ] Add loading states and error handling

**Estimated Time:** 4-5 hours

### Phase 3: "Apply Recommendations" Workflow (Day 3)
- [ ] Update argument editor to accept `applyRecommendations` param
- [ ] Pre-populate editor with recommended edits
- [ ] Add accept/reject UI for each edit
- [ ] Implement diff highlighting
- [ ] Test end-to-end workflow

**Estimated Time:** 3-4 hours

### Phase 4: Testing & Polish (Day 4)
- [ ] Test with real conversations
- [ ] Verify AI recommendations quality
- [ ] Add "Regenerate Takeaways" button
- [ ] Optimize prompt for better results
- [ ] Add analytics tracking
- [ ] Update documentation

**Estimated Time:** 2-3 hours

**Total Estimated Time:** 13-17 hours (2-3 days)

---

## Open Questions

1. **Should we allow editing/overriding AI recommendations?**
   - Pro: Users can customize before applying
   - Con: Adds complexity
   - **Recommendation:** Not for MVP, add later if requested

2. **Should we show confidence scores for recommendations?**
   - Pro: Users know which edits are most important
   - Con: May reduce trust in AI
   - **Recommendation:** Use priority levels (HIGH/MEDIUM/LOW) instead

3. **Should we track which recommendations are accepted?**
   - Pro: Improves future recommendations via ML
   - Con: Requires additional tracking infrastructure
   - **Recommendation:** Yes, simple acceptance logging (Phase 2 enhancement)

4. **Should we support comparing v1 vs v2 results side-by-side?**
   - Pro: Clear ROI demonstration
   - Con: Significant UI work
   - **Recommendation:** Future enhancement, not MVP

---

## Future Enhancements (Post-MVP)

1. **Comparative Analysis**
   - Compare results across multiple focus group runs
   - Show improvement metrics (confusion decreased 40%, etc.)

2. **Recommendation Learning**
   - Track which recommendations are accepted/rejected
   - Improve AI recommendations over time

3. **Custom Recommendation Types**
   - Allow attorneys to request specific types of edits
   - "Make more emotional", "Add more facts", etc.

4. **Export to PDF**
   - Generate polished report with takeaways
   - Include before/after comparisons

5. **Collaboration Features**
   - Share takeaways with team
   - Comment on specific recommendations

---

## Related Documentation

- [CURRENT_STATE.md](./CURRENT_STATE.md) - Current system status
- [ROUNDTABLE_CONVERSATIONS.md](./ROUNDTABLE_CONVERSATIONS.md) - Focus group system
- [PHASE_5_UX_ENHANCEMENTS_PLAN.md](./PHASE_5_UX_ENHANCEMENTS_PLAN.md) - Overall UX plan

---

## Approval & Sign-off

**Created By:** Claude Code Assistant
**Date:** January 27, 2026
**Status:** ⏳ Awaiting User Approval

**User Approval:** [ ] Approved  [ ] Needs Changes  [ ] Rejected

**Comments:**
_[User feedback goes here]_

---

**End of Design Document**
