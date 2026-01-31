# Feature: Attorney Reviewer Mode

**Status:** 📋 Backlog - Future Enhancement
**Priority:** Medium
**Estimated Effort:** 2-3 days
**Created:** January 27, 2026

---

## Overview

Add an "attorney reviewer" observer that analyzes roundtable conversations from a legal strategy perspective. The attorney reviewer watches the focus group deliberation (like observing through one-way glass) and provides professional legal analysis of what the juror conversation revealed and how to improve case strategy.

**Key Design Principle:** The attorney reviewer is an **OBSERVER, NOT A PARTICIPANT**. It does not speak or interact with the juror personas. It watches the conversation and provides post-deliberation analysis.

---

## Observer Model

The attorney reviewer uses a **one-way glass observation model**:

### **During Deliberation:**
```
┌─────────────────────────────────────────┐
│  JURY DELIBERATION ROOM                 │
│                                         │
│  👤 Juror 1: "I'm confused about..."   │
│  👤 Juror 2: "This makes me angry..."  │
│  👤 Juror 3: "What were his injuries?" │
│  👤 Juror 4: "I agree with Sarah..."   │
│  👤 Juror 5: "But wait, the timeline..." │
│  👤 Juror 6: "That's a good point..."  │
│                                         │
└─────────────────────────────────────────┘
               ║ (one-way glass)
               ║
┌──────────────▼──────────────────────────┐
│  OBSERVATION ROOM                       │
│                                         │
│  👨‍⚖️ Attorney Observer                  │
│  📝 Taking notes silently               │
│  🤔 Analyzing reactions                 │
│  📊 Identifying patterns                │
│                                         │
└─────────────────────────────────────────┘
```

### **After Deliberation:**
The attorney observer provides a strategic debrief document analyzing:
- What they observed jurors struggling with
- Which arguments resonated vs. fell flat
- Evidence gaps revealed by juror questions
- Strategic recommendations for trial prep

### **Why This Model?**
1. **Maintains Authentic Juror Behavior:** Jurors deliberate naturally without attorney presence affecting their candor
2. **Provides Professional Analysis:** Attorney lens interprets what juror reactions mean for trial strategy
3. **Mirrors Real Focus Groups:** This is how actual jury consultants run focus groups (lawyers watch behind glass)
4. **Clean Separation of Concerns:** Jurors react emotionally, attorneys analyze strategically

---

## Problem Statement

Currently, the roundtable system simulates juror deliberations authentically (v5.0.0 juror framing). However, attorneys need:
1. **Legal interpretation** of what jurors' emotional reactions mean
2. **Strategic recommendations** based on deliberation patterns
3. **Evidence gaps** identified by juror questions
4. **Argument weaknesses** revealed through dissent and fractures
5. **Witness preparation** insights from what jurors wanted to know

**Example Scenario:**
- **What Jurors Say** (during deliberation): "I'm confused about the timeline - when exactly did he see the defendant?"
- **What Attorney Observer Sees** (post-deliberation analysis): "This reveals a credibility gap. Recommend: (1) Timeline exhibit, (2) Prep witness on specific times, (3) Address in opening/closing."

**Think of it as:** The attorney reviewer sits behind one-way glass during the focus group, takes notes on juror reactions, and then provides a strategic debrief after the session ends.

---

## Proposed Solution

### **Attorney Reviewer Mode**

After a roundtable conversation completes, add a new tab/section:

```
[Juror Transcript] [Takeaways] [Attorney Review] ⭐ NEW
```

The Attorney Review provides:
1. **Legal Analysis Summary**
2. **Strategic Recommendations**
3. **Evidence Gaps Identified**
4. **Argument Strengths & Weaknesses**
5. **Witness Preparation Notes**
6. **Voir Dire Implications**

---

## User Experience

### **Trigger Options:**

**Option A: Manual Request (Recommended)**
```
┌─────────────────────────────────────────────┐
│ Roundtable Conversation Complete           │
│                                             │
│ 24 statements, 6 personas                  │
│ Verdict lean: 4 plaintiff, 2 defense       │
│                                             │
│ [View Transcript] [View Takeaways]         │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 🎯 Want Legal Strategy Analysis?    │   │
│ │                                      │   │
│ │ Get attorney-level review of what   │   │
│ │ this conversation revealed and how  │   │
│ │ to improve your case strategy.      │   │
│ │                                      │   │
│ │ [Request Attorney Review] (~30s)    │   │
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Option B: Automatic (Alternative)**
- Always generate attorney review alongside takeaways
- Show as separate tab

**Option C: Role-Based (Advanced)**
- Only show to users with "Attorney" role
- Paralegals/consultants see juror view only

---

## Attorney Review Output Structure

### **1. Executive Summary**
```
ATTORNEY OBSERVER DEBRIEF: Opening Statement Analysis
Verdict Prediction: 4-2 Plaintiff Lean (based on observed reactions)

KEY OBSERVATIONS FROM THE DELIBERATION:
• Timeline confusion is your biggest vulnerability
• Strong emotional response to drunk driving (use this)
• 17 children claim undermining credibility
• Need corroboration on injury severity

RECOMMENDED ACTIONS: 4 critical, 2 strategic
```

### **2. Legal Analysis**

**What the Jury Revealed:**
- Credibility gaps identified by jurors
- Evidence they wanted but didn't get
- Emotional triggers that worked
- Emotional triggers that backfired
- Logical inconsistencies they noticed
- Questions that weren't answered

**Liability Assessment:**
- Juror confidence in liability: High/Medium/Low
- Strongest liability factors (per jurors)
- Weakest liability factors (per jurors)
- Defense counterarguments that resonated

**Damages Assessment:**
- Juror comfort with damages amount: High/Medium/Low
- Specific damages concerns raised
- Damages anchors that worked/didn't work

### **3. Strategic Recommendations**

**CRITICAL (Must Address):**
1. **Timeline Clarification**
   - Issue: 3 jurors confused about when plaintiff saw defendant
   - Impact: Undermines witness credibility
   - Action: Create timeline exhibit, prep witness on specific times
   - Priority: Critical - address in opening and closing

2. **17 Children Credibility**
   - Issue: 5/6 jurors skeptical about family size claim
   - Impact: Jury may discount all testimony as exaggerated
   - Action: Either prove with documents or pivot to lost income only
   - Priority: Critical - decide strategy before trial

**STRATEGIC (Should Consider):**
3. **Injury Severity Gap**
   - Issue: Jurors asking "was he paralyzed or just hurt?"
   - Impact: Can't assess damages without knowing injuries
   - Action: Lead with injury description in opening, use medical visuals
   - Priority: Strategic - improves damages anchoring

### **4. Evidence Gaps**

**What Jurors Wanted to Know:**
- ❌ "What were the plaintiff's actual injuries?" (3 jurors)
- ❌ "When exactly did the accident happen?" (2 jurors)
- ❌ "Was anyone else hurt?" (1 juror)
- ❌ "How do we know she was texting while driving?" (2 jurors)

**Recommended Evidence to Add:**
1. Medical records with injury diagram
2. Phone records proving texting at time of impact
3. Police report with timeline
4. Photos of accident scene

**Evidence You Have That Worked:**
- ✅ Drunk driving + texting (strong liability)
- ✅ Surgeon occupation (sympathy for lost earning capacity)

### **5. Argument Analysis**

**Strengths (Leverage These):**
- Dual impairment (drunk + texting) = clear negligence
- High earning plaintiff = substantial damages potential
- Emotional response to recklessness very strong

**Weaknesses (Address These):**
- Timeline ambiguity creating credibility doubts
- 17 children claim appears fabricated
- Injury severity not clear enough for damages calculation

**Suggested Argument Adjustments:**

**Opening Statement:**
```
Before: "The plaintiff, a surgeon with 17 children..."

After: "The plaintiff, a successful surgeon earning $500K/year,
can no longer operate due to permanent hand injuries caused by
a drunk driver who was texting..."

Rationale: Lead with earning capacity (believable) and injuries
(concrete), not family size (suspicious to jurors).
```

**Closing Argument:**
```
Add: "You heard confusion about the timeline. Let me clarify:
[timeline exhibit]. The medical records show [injury severity].
The phone records prove [texting at impact]."

Rationale: Address specific juror concerns proactively.
```

### **6. Witness Preparation**

**Plaintiff/Witness Prep Notes:**
- Be prepared for timeline questions (when, where, how long)
- Don't volunteer information about 17 children unless asked
- Lead with injury description and impact on career
- Have specific medical terminology ready (jurors respect expertise)

**Expert Witness Recommendations:**
- Consider medical expert to explain injury severity and prognosis
- Consider accident reconstruction expert for timeline clarity
- Economic damages expert to calculate lost earning capacity

### **7. Voir Dire Implications**

**Red Flag Jurors (Based on This Conversation):**
- Skeptical of large damage claims
- Focus on "personal responsibility" (may favor defense)
- Highly analytical, questioning credibility details

**Ideal Jurors (Based on This Conversation):**
- Emotional response to drunk driving
- Sympathetic to injured professionals
- Accept expert testimony without excessive questioning

**Recommended Voir Dire Questions:**
1. "Have you or someone close to you been injured by a drunk driver?"
   → Identifies emotional resonance with your case

2. "Do you think people who drink and drive should be held accountable?"
   → Filters out personal responsibility extremists

3. "Are you comfortable with large damage awards for lost income?"
   → Identifies damages anchoring issues

### **8. Trial Strategy Recommendations**

**Pre-Trial Motions:**
- Motion in limine to exclude speculation about family size
- Motion to admit medical records and phone records

**Opening Strategy:**
- Lead with injury impact, not family background
- Show timeline exhibit immediately to prevent confusion
- Use phrase "permanent injuries" to anchor damages

**Closing Strategy:**
- Address timeline and credibility concerns head-on
- Revisit emotional drunk driving + texting combination
- Provide damages calculation worksheet for jury

---

## Technical Implementation

### **Architecture**

```
User clicks "Request Attorney Review"
  ↓
Frontend: POST /api/focus-groups/conversations/:id/attorney-review
  ↓
Backend: ConversationOrchestrator.generateAttorneyReview()
  ↓
PromptClient.execute('attorney-reviewer-analysis')
  ↓
Claude analyzes full conversation with legal expertise
  ↓
Returns structured attorney review
  ↓
Save to database: FocusGroupAttorneyReview table
  ↓
Frontend: Display in "Attorney Review" tab
```

### **New Database Schema**

```prisma
model FocusGroupAttorneyReview {
  id                    String   @id @default(uuid())
  conversationId        String   @unique
  conversation          FocusGroupConversation @relation(fields: [conversationId], references: [id])

  // Summary
  executiveSummary      String
  verdictPrediction     String
  keyFindings           String[]
  recommendedActions    String[]

  // Legal Analysis
  credibilityGaps       Json     // [{issue, impact, jurorCount}]
  evidenceRequested     Json     // [{question, jurorCount}]
  emotionalTriggers     Json     // [{trigger, worked: boolean, impact}]
  liabilityAssessment   Json     // {confidence, strongest, weakest}
  damagesAssessment     Json     // {confidence, concerns, anchors}

  // Strategic Recommendations
  criticalActions       Json[]   // [{priority, issue, impact, action}]
  strategicActions      Json[]   // [{priority, issue, impact, action}]

  // Evidence Analysis
  evidenceGaps          Json[]   // [{question, priority, jurorCount}]
  evidenceStrengths     Json[]   // [{evidence, effectiveness}]

  // Argument Analysis
  argumentStrengths     String[]
  argumentWeaknesses    String[]
  suggestedAdjustments  Json[]   // [{before, after, rationale}]

  // Witness & Voir Dire
  witnessPrep           Json     // {plaintiff, experts, redFlags}
  voirDireInsights      Json     // {redFlags, idealJurors, questions}
  trialStrategy         Json     // {preTrialMotions, opening, closing}

  generatedAt           DateTime @default(now())
  generatedBy           String   // "attorney-reviewer-v1.0.0"
}
```

### **New Prompt: `attorney-reviewer-analysis`**

```typescript
{
  serviceId: 'attorney-reviewer-analysis',
  name: 'Attorney Reviewer Analysis',
  description: 'Legal strategy analysis of roundtable conversation',
  version: 'v1.0.0',
  systemPrompt: `You are an experienced trial attorney observing a jury focus group through one-way glass.

CRITICAL: You are an OBSERVER watching the deliberation, NOT a participant in the conversation.
You did NOT speak during the focus group. You were silently watching and taking notes.

Your role is to provide LEGAL STRATEGY ANALYSIS based on what you observed, not emotional reactions.
You are analyzing what the simulated juror conversation revealed about:
- Case strengths and weaknesses
- Evidence gaps
- Credibility issues
- Strategic opportunities
- What resonated with jurors vs. what failed

Think of yourself as the attorney who brought the client to the focus group facility, watched through the glass, and now provides a strategic debrief.

DO provide:
- Legal interpretation of juror concerns you observed
- Strategic recommendations for trial preparation based on juror reactions
- Evidence that should be added or emphasized based on gaps you noticed
- Argument adjustments based on what worked/didn't work with this jury
- Witness preparation guidance based on juror questions and skepticism
- Voir dire implications based on the types of jurors who leaned which way

DO NOT:
- Simply summarize what jurors said (that's already in the transcript)
- Speak as if you participated in the deliberation
- Make moral judgments about the case
- Guarantee trial outcomes
- Provide generic advice that could apply to any case`,

  userPromptTemplate: `
CASE CONTEXT:
{{caseContext}}

ARGUMENT TESTED:
{{argumentContent}}

COMPLETE JUROR DELIBERATION:
{{conversationTranscript}}

CONVERSATION METADATA:
- Total statements: {{statementCount}}
- Personas: {{personaCount}}
- Verdict lean: {{verdictLean}}
- Consensus areas: {{consensusAreas}}
- Fracture points: {{fracturePoints}}

YOUR TASK:
As an experienced trial attorney who just watched this jury deliberation through one-way glass, provide your strategic debrief:

1. EXECUTIVE SUMMARY (3-4 sentences)
   - Verdict prediction with confidence
   - Top 2-3 key findings
   - Number of critical vs strategic recommendations

2. LEGAL ANALYSIS
   - What credibility gaps did jurors identify?
   - What evidence did they request but not receive?
   - Which emotional triggers worked/didn't work?
   - Liability assessment based on juror confidence
   - Damages assessment based on juror concerns

3. STRATEGIC RECOMMENDATIONS
   - CRITICAL actions (must address before trial)
   - STRATEGIC actions (should consider)
   - Specific, actionable steps with rationale

4. EVIDENCE GAPS
   - List exact questions jurors asked
   - Recommend specific evidence to add
   - Identify what worked from existing evidence

5. ARGUMENT ANALYSIS
   - Strengths to leverage
   - Weaknesses to address
   - Specific before/after argument adjustments

6. WITNESS PREPARATION
   - What should witnesses be ready to address?
   - What expert witnesses would help?
   - Red flags to avoid

7. VOIR DIRE IMPLICATIONS
   - Red flag juror profiles based on this conversation
   - Ideal juror profiles based on this conversation
   - Recommended voir dire questions (2-3)

8. TRIAL STRATEGY
   - Pre-trial motions to consider
   - Opening statement adjustments
   - Closing argument recommendations

Format your response as structured JSON matching the schema.
Be specific, actionable, and attorney-focused.`,

  config: {
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4000,  // Longer for detailed analysis
    temperature: 0.3  // Lower for consistent, professional analysis
  }
}
```

### **Backend Service Implementation**

```typescript
// services/api-gateway/src/services/roundtable/attorney-reviewer.ts

export class AttorneyReviewService {
  constructor(
    private prisma: PrismaClient,
    private promptClient: PromptClient
  ) {}

  async generateAttorneyReview(conversationId: string): Promise<AttorneyReview> {
    // 1. Fetch conversation with all statements and metadata
    const conversation = await this.prisma.focusGroupConversation.findUnique({
      where: { id: conversationId },
      include: {
        statements: { orderBy: { sequenceNumber: 'asc' } },
        session: {
          include: {
            case: true,
            argument: true,
            personas: { include: { persona: true } }
          }
        }
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // 2. Check if review already exists
    const existing = await this.prisma.focusGroupAttorneyReview.findUnique({
      where: { conversationId }
    });

    if (existing) {
      return existing; // Return cached review
    }

    // 3. Prepare context
    const context = this.prepareReviewContext(conversation);

    // 4. Call attorney-reviewer prompt
    const { result } = await this.promptClient.execute('attorney-reviewer-analysis', {
      variables: context
    });

    // 5. Parse and validate result
    const review = this.parseAttorneyReview(result);

    // 6. Save to database
    const savedReview = await this.prisma.focusGroupAttorneyReview.create({
      data: {
        conversationId,
        ...review,
        generatedBy: 'attorney-reviewer-v1.0.0'
      }
    });

    return savedReview;
  }

  private prepareReviewContext(conversation: any) {
    // Format conversation for attorney analysis
    return {
      caseContext: this.formatCaseContext(conversation.session.case),
      argumentContent: conversation.session.argument.content,
      conversationTranscript: this.formatTranscript(conversation.statements),
      statementCount: conversation.statements.length,
      personaCount: conversation.session.personas.length,
      verdictLean: this.calculateVerdictLean(conversation.statements),
      consensusAreas: conversation.consensusAreas || [],
      fracturePoints: conversation.fracturePoints || []
    };
  }

  private parseAttorneyReview(result: any): AttorneyReviewData {
    // Parse and validate AI response
    // Return structured data matching database schema
  }
}
```

### **Frontend Components**

```typescript
// apps/web/components/focus-groups/AttorneyReviewTab.tsx

export function AttorneyReviewTab({ conversationId }: Props) {
  const { data: review, isLoading } = useAttorneyReview(conversationId);

  if (isLoading) {
    return <LoadingSpinner message="Generating attorney review..." />;
  }

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <ExecutiveSummaryCard summary={review.executiveSummary} />

      {/* Legal Analysis */}
      <LegalAnalysisSection analysis={review.legalAnalysis} />

      {/* Strategic Recommendations */}
      <RecommendationsSection
        critical={review.criticalActions}
        strategic={review.strategicActions}
      />

      {/* Evidence Gaps */}
      <EvidenceGapsSection gaps={review.evidenceGaps} />

      {/* Argument Analysis */}
      <ArgumentAnalysisSection
        strengths={review.argumentStrengths}
        weaknesses={review.argumentWeaknesses}
        adjustments={review.suggestedAdjustments}
      />

      {/* Witness & Voir Dire */}
      <WitnessVoirDireSection
        witnessPrep={review.witnessPrep}
        voirDire={review.voirDireInsights}
      />

      {/* Trial Strategy */}
      <TrialStrategySection strategy={review.trialStrategy} />

      {/* Export Options */}
      <ExportButtons conversationId={conversationId} />
    </div>
  );
}
```

---

## API Endpoints

```typescript
// Generate attorney review (creates if doesn't exist)
POST /api/focus-groups/conversations/:conversationId/attorney-review
Response: { reviewId, status: 'generating' | 'completed' }

// Get attorney review
GET /api/focus-groups/conversations/:conversationId/attorney-review
Response: { review: AttorneyReview }

// Export attorney review as PDF
GET /api/focus-groups/conversations/:conversationId/attorney-review/export
Response: PDF file download

// Regenerate attorney review (invalidates cache)
POST /api/focus-groups/conversations/:conversationId/attorney-review/regenerate
Response: { reviewId, status: 'generating' }
```

---

## Cost Estimation

**Per Attorney Review:**
- Prompt: `attorney-reviewer-analysis`
- Input tokens: ~3,000-5,000 (conversation + context)
- Output tokens: ~2,000-3,000 (detailed analysis)
- Model: Claude Sonnet 4
- **Cost per review: $0.15-0.30**

**Monthly cost (100 attorneys × 10 cases × 3 conversations):**
- 3,000 attorney reviews/month
- **Total: ~$450-900/month**

---

## Success Metrics

### **User Adoption:**
- % of conversations that request attorney review
- Time spent reading attorney review vs transcript
- Export/print rate of attorney reviews

### **Value Delivered:**
- User survey: "Was attorney review helpful?" (1-5 scale)
- Number of strategic recommendations acted upon
- User testimonials

### **Quality Metrics:**
- Consistency of analysis across similar conversations
- Accuracy of verdict predictions
- Actionability of recommendations (user feedback)

---

## Future Enhancements

### **Phase 2: Comparative Analysis**
- Compare attorney reviews across multiple conversations for same case
- "What changed when we adjusted the argument?"
- Track which recommendations were most effective

### **Phase 3: Attorney Coaching**
- "Ask the attorney reviewer" - follow-up questions
- "How should I respond to this specific juror concern?"
- Interactive Q&A with AI attorney

### **Phase 4: Jurisdiction-Specific Analysis**
- Tailor recommendations to specific court rules
- State-specific voir dire restrictions
- Local jury verdict trends

---

## Implementation Checklist

- [ ] Create `attorney-reviewer-analysis` prompt (v1.0.0)
- [ ] Add database migration for `FocusGroupAttorneyReview` table
- [ ] Implement `AttorneyReviewService` backend service
- [ ] Create API routes for attorney review
- [ ] Build frontend components (`AttorneyReviewTab`)
- [ ] Add "Request Attorney Review" button to conversation UI
- [ ] Implement PDF export for attorney reviews
- [ ] Add analytics tracking
- [ ] Write user documentation
- [ ] Test with real conversations
- [ ] Deploy to production
- [ ] Collect user feedback
- [ ] Iterate based on feedback

---

## Related Features

- **Juror Deliberation (v5.0.0):** Personas act as jurors in focus group ← Current
- **Attorney Observer:** Silent observer providing strategic analysis ← This feature
- **Expert Observer (Future):** Medical/technical expert watches and provides domain analysis
- **Judge Observer (Future):** Judicial perspective on evidentiary issues

---

## Questions to Answer Before Implementation

1. **Should this be a premium feature?**
   - Free for all users?
   - Paid add-on?
   - Limited number of reviews per month?

2. **When to generate?**
   - Always automatic?
   - Only on request?
   - Batch process overnight?

3. **Can users edit/annotate?**
   - Add their own notes to attorney review?
   - Mark recommendations as "done"?
   - Track implementation progress?

4. **How to handle disagreement?**
   - What if attorney disagrees with AI recommendations?
   - Allow "reject" or "not applicable" marking?
   - Learn from feedback?

---

## Notes & Ideas

- Could integrate with case management system to track which recommendations were implemented
- Could compare attorney review predictions with actual trial outcomes (post-trial)
- Could offer "second opinion" - regenerate with different analysis angle
- Could summarize multiple attorney reviews into "overall case strategy"
- Could create attorney review "themes" - what patterns emerge across cases?

---

**Status:** Ready for prioritization and scoping
**Owner:** TBD
**Stakeholders:** Product, Engineering, Legal Team
**Next Step:** Review with attorneys to validate use case

---

*Created by: Claude Sonnet 4.5*
*Date: January 27, 2026*
