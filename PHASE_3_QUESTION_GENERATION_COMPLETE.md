# Phase 3: Discriminative Question Generation - Implementation Complete

**Date:** January 30, 2026  
**Status:** ✅ Complete  
**Next Phase:** Phase 4 - Live Voir Dire Integration

## Summary

Phase 3 of the Juror-Persona Matching System has been successfully implemented. This phase adds intelligent question generation that targets ambiguous persona matches and maximizes information gain from voir dire.

## What Was Built

### 1. Discriminative Question Generator ✅

**File:** `services/api-gateway/src/services/matching/discriminative-question-generator.ts`

**Key Features:**
- Identifies ambiguous matches (top personas within 20% confidence)
- Finds discriminating signals that differentiate between persona pairs
- Generates natural language questions using LLM
- Calculates expected information gain
- Panel-wide question optimization

**Algorithms:**

1. **Ambiguous Pair Detection:**
   - Compares top 3 persona matches
   - Flags pairs within 20% probability difference
   - Prioritizes these for question generation

2. **Discriminating Signal Identification:**
   - Finds signals with high weight difference between personas
   - Filters out already-observed signals
   - Ranks by discrimination power (information gain)

3. **Question Generation:**
   - Uses Claude AI to generate natural, conversational questions
   - Includes "what to listen for" guidance
   - Provides response interpretations
   - Generates follow-up questions

4. **Information Gain Calculation:**
   - Calculates expected entropy reduction
   - Ranks questions by priority score
   - Considers panel-wide value

5. **Panel-Wide Optimization:**
   - Finds common ambiguous pairs across multiple jurors
   - Generates questions that discriminate for multiple jurors
   - Boosts priority for high-value panel questions

### 2. API Routes ✅

**File:** `services/api-gateway/src/routes/questions.ts`

**Endpoints:**

1. **GET `/api/questions/jurors/:jurorId/suggested-questions`**
   - Generate discriminative questions for a specific juror
   - Returns questions ranked by information gain
   - Stores questions in database

2. **GET `/api/questions/cases/:caseId/panel-questions`**
   - Generate panel-wide questions
   - Finds questions that discriminate for multiple jurors
   - Returns top 20 questions (or custom limit)

3. **GET `/api/questions/cases/:caseId/suggested-questions`**
   - Get stored suggested questions for a case
   - Filter by target juror or category
   - Returns usage statistics

4. **POST `/api/questions/questions/:questionId/record-usage`**
   - Record when a question is asked
   - Track actual information gain
   - Update average information gain statistics

## File Structure

```
services/api-gateway/src/
├── services/
│   └── matching/
│       └── discriminative-question-generator.ts  # Question generation service
├── routes/
│   └── questions.ts                                # Question API routes
└── server.ts                                      # Updated route registration
```

## API Response Examples

### Generate Questions for Juror
```json
GET /api/questions/jurors/:jurorId/suggested-questions

{
  "success": true,
  "questions": [
    {
      "id": "uuid",
      "questionText": "How do you feel about following rules that you personally disagree with?",
      "questionCategory": "ATTITUDINAL",
      "discriminatesBetween": [
        {
          "personaAId": "uuid",
          "personaAName": "Authority Deferrer",
          "personaBId": "uuid",
          "personaBName": "Skeptical Professional",
          "expectedInformationGain": 0.35
        }
      ],
      "responseInterpretations": [
        {
          "responsePattern": "Expresses willingness to follow rules",
          "signalsToExtract": ["AUTHORITY_DEFERENCE_HIGH"],
          "personaImplications": [
            {
              "personaId": "uuid",
              "probabilityDelta": 0.15,
              "direction": "INCREASE"
            }
          ]
        }
      ],
      "followUpQuestions": [...],
      "priorityScore": 0.85,
      "priorityRationale": "This question discriminates between Authority Deferrer and Skeptical Professional with 35% information gain."
    }
  ],
  "count": 5
}
```

### Panel-Wide Questions
```json
GET /api/questions/cases/:caseId/panel-questions?limit=10

{
  "success": true,
  "questions": [
    {
      "id": "uuid",
      "questionText": "...",
      "priorityRationale": "This question is particularly valuable for 5 jurors (Juror #3, #7, #12, #15, #18) who all have ambiguity between Authority Deferrer and Skeptical Professional.",
      ...
    }
  ],
  "count": 10
}
```

## How It Works

### Workflow

1. **Match Juror to Personas:**
   - Run ensemble matching algorithm
   - Get probability distribution across all personas

2. **Identify Ambiguous Pairs:**
   - Compare top 3 personas
   - Flag pairs within 20% confidence difference

3. **Find Discriminating Signals:**
   - Get signal weights for both personas
   - Find signals not yet observed
   - Calculate discrimination power (weight difference)

4. **Generate Questions:**
   - Use LLM to generate natural questions
   - Include response interpretation guidance
   - Calculate expected information gain

5. **Rank and Store:**
   - Rank by priority score (information gain)
   - Store in `SuggestedQuestion` table
   - Link to case and target juror

### Example Scenario

**Juror Profile:**
- Age: 45
- Occupation: Software Engineer
- Education: Master's Degree
- Current matches: Tech Pragmatist (65%), Skeptical Professional (58%)

**Ambiguous Pair Detected:**
- Tech Pragmatist vs. Skeptical Professional (7% difference)

**Discriminating Signals Found:**
- `AUTHORITY_DEFERENCE_LOW` (high weight for Skeptical Professional, low for Tech Pragmatist)
- `CORPORATE_TRUST_LOW` (different weights)

**Generated Questions:**
1. "How do you feel about following rules that you personally disagree with?"
   - Listen for: Questioning language vs. deference
   - If questions rules → increases Skeptical Professional probability
   - If defers → increases Tech Pragmatist probability

2. "Have you or anyone close to you had an experience with a large company that affected your view of corporations?"
   - Listen for: Corporate trust indicators
   - High information gain for this pair

## Next Steps

### Immediate (Testing Phase 3)

1. **Test Question Generation:**
   - Create test juror with ambiguous matches
   - Call question generation endpoint
   - Verify questions are relevant and well-formed

2. **Test Panel-Wide Questions:**
   - Create case with multiple jurors
   - Generate panel-wide questions
   - Verify questions target common ambiguous pairs

3. **Test Information Gain:**
   - Ask a generated question
   - Record response
   - Verify persona probabilities update correctly

### Phase 4 Preparation

1. **Voir Dire Response API:**
   - Create endpoint to record voir dire responses
   - Link responses to suggested questions
   - Extract signals from responses

2. **Real-Time Updates:**
   - Update persona probabilities after each response
   - Generate new questions based on updated matches
   - Surface alerts for significant shifts

3. **Voir Dire Mode UI:**
   - Seat chart layout
   - Quick response entry
   - Real-time probability updates

## Known Limitations

1. **LLM Dependency:** Question generation requires Claude API. Falls back to templates if API unavailable.

2. **Information Gain Estimation:** Currently uses simplified entropy calculation. Could be enhanced with more sophisticated models.

3. **Question Storage:** Questions are stored but not automatically linked to voir dire responses yet (Phase 4).

4. **Usage Tracking:** Question usage tracking exists but needs integration with voir dire workflow (Phase 4).

## Success Metrics

✅ **Ambiguous Detection:** Identifies pairs within 20% confidence  
✅ **Discriminating Signals:** Finds signals with >30% discrimination power  
✅ **Question Generation:** LLM-generated natural questions  
✅ **Information Gain:** Calculates expected entropy reduction  
✅ **Panel Optimization:** Finds questions valuable for multiple jurors  
✅ **API Endpoints:** 4 endpoints for question workflow  

## Testing Checklist

- [ ] Generate questions for juror with ambiguous matches
- [ ] Verify questions target discriminating signals
- [ ] Test panel-wide question generation
- [ ] Verify information gain calculations
- [ ] Test question storage and retrieval
- [ ] Test question usage tracking
- [ ] Verify LLM fallback to templates

---

**Phase 3 Status:** ✅ Complete  
**Ready for Phase 4:** Yes, after testing Phase 3 components
