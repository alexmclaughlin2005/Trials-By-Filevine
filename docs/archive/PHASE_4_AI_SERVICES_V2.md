# Phase 4: AI Services Integration with V2 Persona Data

**Status:** ✅ **COMPLETE** (Backend Services & Frontend Components)
**Date:** 2026-01-28
**Phase:** Phase 4 - AI Services Enhancement

---

## Overview

Phase 4 enhances all AI services to leverage the new V2 persona data fields including:
- **Instant Reads** - One-sentence persona summaries for quick identification
- **Danger Levels** - Plaintiff/Defense danger ratings (1-5 scale)
- **Phrases You'll Hear** - Behavioral recognition patterns for voir dire
- **Verdict Predictions** - Liability probability and deliberation role
- **Strike/Keep Strategies** - Attorney-specific guidance for jury selection

---

## What Was Built

### 1. Enhanced Persona Suggester Service ✅

**File:** `services/api-gateway/src/services/persona-suggester.ts`

**Enhancements:**
- Updated Persona interface to include all V2 fields
- Enhanced prompt to leverage instant reads and danger levels
- Added danger assessment in response (low/medium/high/critical)
- Added strike recommendations based on attorney side
- Updated persona description formatting to prioritize V2 data

**New Response Fields:**
```typescript
interface PersonaSuggestion {
  persona: Persona;
  confidence: number;
  reasoning: string;
  keyMatches: string[];
  potentialConcerns: string[];
  // NEW V2 Fields
  dangerAssessment?: {
    level: 'low' | 'medium' | 'high' | 'critical';
    plaintiffDanger: number;
    defenseDanger: number;
    recommendation: string;
  };
  strikeRecommendation?: {
    action: 'MUST STRIKE' | 'STRIKE IF POSSIBLE' | 'NEUTRAL' | 'CONSIDER KEEPING' | 'KEEP';
    reasoning: string;
  };
}
```

**API Updates:**
- `POST /api/personas/suggest` now accepts `attorneySide` parameter
- Returns V2-enhanced suggestions with danger assessments

---

### 2. Voir Dire Generator V2 Service ✅

**File:** `services/api-gateway/src/services/voir-dire-generator-v2.ts`

**Purpose:**
Generate strategic voir dire questions using "Phrases You'll Hear" data to help attorneys identify archetypes during jury selection.

**Features:**
- Generates 4 categories of questions:
  - **Opening Questions** - Rapport building and initial assessment
  - **Archetype Identification** - Questions to reveal behavioral patterns
  - **Case-Specific** - Questions tied to key issues
  - **Strike Justification** - Questions to document cause for strike

**Question Structure:**
```typescript
interface VoirDireQuestion {
  question: string;
  purpose: string;
  targetArchetypes: string[];
  expectedResponses: {
    archetype: string;
    likelyResponse: string; // References specific "Phrases You'll Hear"
    redFlags: string[];
  }[];
  followUpPrompts: string[];
}
```

**Key Capabilities:**
- References specific "Phrases You'll Hear" in expected responses
- Provides archetype-specific response predictions
- Includes red flags for attorney awareness
- Tailored to plaintiff or defense attorney perspective
- Uses strike/keep guidance to inform question strategy

**API Endpoint:**
- `POST /api/cases/:id/generate-questions-v2`
- Accepts: `targetPersonaIds`, `attorneySide`, `plaintiffTheory`, `defenseTheory`, `questionCategories`
- Returns: Complete question set across all categories

---

### 3. Case Strategy V2 Service ✅

**File:** `services/api-gateway/src/services/case-strategy-v2.ts`

**Purpose:**
Generate comprehensive jury selection strategy using V2 persona data, specifically danger levels and strike/keep guidance.

**Features:**
- **Panel Composition Analysis**
  - Favorable/unfavorable/neutral counts
  - Archetype distribution
  - Verdict lean summary (strong plaintiff → strong defense)

- **Strike Recommendations**
  - Prioritized by danger level and persona match
  - Action levels: MUST STRIKE, STRIKE IF POSSIBLE, NEUTRAL, CONSIDER KEEPING, KEEP
  - Reasoning based on instant reads and danger assessments
  - Key factors from V2 data

- **Keep Recommendations**
  - Identifies favorable jurors to protect
  - Explains value to case strategy
  - Deliberation role predictions

- **Deliberation Forecast**
  - Predicted outcome with confidence level
  - Key influencers and potential leaders
  - Risk factors based on panel composition

- **Strategic Priorities**
  - Top 3-5 priorities for jury selection
  - Pattern recognition guidance
  - Strike allocation strategy

**API Endpoint:**
- `POST /api/cases/:id/strategy-v2`
- Accepts: `panelId`, `attorneySide`, `plaintiffTheory`, `defenseTheory`, `availableStrikes`
- Returns: Complete strategy recommendation

**Key Innovation:**
Uses juror-persona mappings to provide individualized recommendations for each juror based on their matched archetype's V2 data.

---

### 4. Frontend UI Components ✅

#### Voir Dire Questions Component

**File:** `apps/web/components/voir-dire-questions-v2.tsx`

**Features:**
- Category tabs (Opening, Identification, Case-Specific, Strike Justification)
- Expandable question cards with full details
- Expected responses by archetype with red flags
- Follow-up question prompts
- Copy-to-clipboard functionality
- Question counts per category

**Usage:**
```tsx
<VoirDireQuestionsV2
  questionSet={questionSet}
  caseType="personal injury"
  attorneySide="plaintiff"
/>
```

#### Case Strategy Component

**File:** `apps/web/components/case-strategy-v2.tsx`

**Features:**
- Overall panel assessment with visual metrics
- Panel composition breakdown (favorable/unfavorable/neutral)
- Archetype distribution visualization
- Verdict lean distribution chart
- Prioritized strike recommendations with danger levels
- Keep recommendations with reasoning
- Deliberation forecast with confidence
- Strategic priorities checklist

**Usage:**
```tsx
<CaseStrategyV2
  strategy={strategy}
  attorneySide="plaintiff"
  availableStrikes={10}
/>
```

**Visual Design:**
- Color-coded danger levels (green → yellow → orange → red)
- Action badges (MUST STRIKE, KEEP, etc.)
- Progress bars for verdict lean distribution
- Priority numbering for strategic recommendations

---

## API Endpoints Summary

### Enhanced Existing Endpoints

1. **POST /api/personas/suggest**
   - Now returns V2-enhanced suggestions
   - Accepts `attorneySide` parameter
   - Includes danger assessments and strike recommendations

### New V2 Endpoints

2. **POST /api/cases/:id/generate-questions-v2**
   - Generates voir dire questions using V2 persona data
   - Returns 4 categories of strategic questions
   - Includes expected responses with "Phrases You'll Hear" references

3. **POST /api/cases/:id/strategy-v2**
   - Generates comprehensive case strategy
   - Analyzes panel composition with V2 data
   - Provides strike/keep recommendations with reasoning
   - Forecasts deliberation outcome

---

## Integration with Existing Systems

### Persona Suggester Integration
- Called from juror profile pages
- Used during juror research to find matches
- Now provides danger-aware recommendations

### Voir Dire Generator Integration
- Triggered from case preparation workflow
- Can be filtered by target archetypes
- Questions saved to case for trial use

### Case Strategy Integration
- Accessed from jury panel management
- Requires jurors to have persona mappings
- Updates as panel composition changes
- Used during jury selection process

---

## Technical Implementation Details

### AI Model Usage
- **Model:** Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- **Token Limits:**
  - Persona Suggester: 2000 tokens
  - Voir Dire Generator: 6000 tokens
  - Case Strategy: 4000 tokens
- **Temperature:**
  - Persona Suggester: 0.3 (consistent analysis)
  - Voir Dire Generator: 0.4 (balanced creativity)
  - Case Strategy: 0.3 (consistent strategic advice)

### Error Handling
- All services use try-catch with detailed logging
- Fallback to error messages on API failure
- Graceful degradation if ANTHROPIC_API_KEY not set

### Response Parsing
- JSON responses with markdown code block removal
- Validation of required fields
- Type-safe interfaces for all responses

---

## Testing Recommendations

### Unit Testing
- [ ] Test persona suggester with V2 personas
- [ ] Test voir dire generator with various archetypes
- [ ] Test case strategy with different panel compositions

### Integration Testing
- [ ] Test API endpoints with real case data
- [ ] Verify persona mapping retrieval
- [ ] Test error handling and fallbacks

### UI Testing
- [ ] Test voir dire questions component rendering
- [ ] Test case strategy component with various strategies
- [ ] Test responsive design on mobile/tablet
- [ ] Test copy-to-clipboard functionality

### End-to-End Testing
1. Create case with V2 personas
2. Generate voir dire questions
3. Map jurors to personas
4. Generate case strategy
5. Verify all V2 fields displayed correctly

---

## Usage Examples

### Example 1: Generate Voir Dire Questions

```typescript
// API Call
POST /api/cases/case-123/generate-questions-v2
{
  "attorneySide": "plaintiff",
  "plaintiffTheory": "Defendant's negligence caused severe injuries",
  "defenseTheory": "Plaintiff assumed the risk",
  "questionCategories": ["opening", "identification", "case-specific"]
}

// Response
{
  "questionSet": {
    "openingQuestions": [
      {
        "question": "Can you tell me about a time when someone's carelessness affected you?",
        "purpose": "Identify empathy vs. personal responsibility archetypes",
        "targetArchetypes": ["bootstrapper", "heart", "crusader"],
        "expectedResponses": [
          {
            "archetype": "bootstrapper",
            "likelyResponse": "Well, at the end of the day, you're responsible for yourself...",
            "redFlags": ["Blames victims", "Personal responsibility focus"]
          }
        ],
        "followUpPrompts": [
          "What did you learn from that experience?",
          "Do you think the other person should be held accountable?"
        ]
      }
    ]
  }
}
```

### Example 2: Generate Case Strategy

```typescript
// API Call
POST /api/cases/case-123/strategy-v2
{
  "panelId": "panel-456",
  "attorneySide": "plaintiff",
  "availableStrikes": 6
}

// Response
{
  "strategy": {
    "overallAssessment": "Panel leans defense with 3 bootstrapper archetypes...",
    "panelComposition": {
      "totalJurors": 12,
      "favorableCount": 4,
      "unfavorableCount": 5,
      "neutralCount": 3
    },
    "strikeRecommendations": [
      {
        "jurorNumber": "7",
        "jurorName": "John Smith",
        "action": "MUST STRIKE",
        "priority": 10,
        "reasoning": "Classic bootstrapper archetype. Plaintiff danger level 5/5...",
        "dangerLevel": "critical",
        "archetypeMatch": "bootstrapper"
      }
    ]
  }
}
```

---

## Next Steps

### Immediate Tasks
1. ✅ Complete backend AI services
2. ✅ Create frontend UI components
3. ⏳ Test with production V2 persona data
4. ⏳ Deploy to staging environment

### Future Enhancements
1. **Real-time Voir Dire Assistant**
   - Live archetype detection during voir dire
   - Real-time question suggestions
   - Transcription integration

2. **Panel Simulation**
   - Run multiple panel scenarios
   - Compare strike strategies
   - Optimize strike allocation

3. **Historical Analysis**
   - Track which questions work best
   - Analyze archetype prediction accuracy
   - Improve prompts based on outcomes

4. **Mobile Voir Dire App**
   - Tablet-optimized interface for courtroom
   - Offline access to questions
   - Quick strike recommendations

---

## Files Created/Modified

### New Files Created
1. `services/api-gateway/src/services/voir-dire-generator-v2.ts` - Voir dire question generation
2. `services/api-gateway/src/services/case-strategy-v2.ts` - Case strategy recommendations
3. `apps/web/components/voir-dire-questions-v2.tsx` - Frontend questions component
4. `apps/web/components/case-strategy-v2.tsx` - Frontend strategy component
5. `docs/PHASE_4_AI_SERVICES_V2.md` - This documentation

### Files Modified
1. `services/api-gateway/src/services/persona-suggester.ts` - Enhanced with V2 fields
2. `services/api-gateway/src/routes/personas.ts` - Updated to fetch V2 fields
3. `services/api-gateway/src/routes/cases.ts` - Added two new V2 endpoints

---

## Success Metrics

### Technical Metrics
- ✅ All AI services leverage V2 persona data
- ✅ API endpoints return V2-enhanced responses
- ✅ Frontend components display V2 fields
- ⏳ Response times under 5 seconds
- ⏳ Error rate below 1%

### User Experience Metrics
- Questions accurately reference "Phrases You'll Hear"
- Strike recommendations align with danger levels
- Strategy provides actionable guidance
- UI components are intuitive and fast

### Business Metrics
- Improved jury selection outcomes
- Faster voir dire preparation
- More confident strike decisions
- Better deliberation predictions

---

## Documentation References

- [Persona V2 Integration Summary](./PERSONA_V2_INTEGRATION_SUMMARY.md)
- [API Updates for Persona V2](./API_UPDATES_PERSONA_V2.md)
- [Phase 3 Complete](./PERSONA_V2_PHASE_3_PROGRESS.md)
- [Current State](../CURRENT_STATE.md)

---

**Phase 4 Status:** Backend complete, frontend components ready, awaiting testing and deployment.
