# AI Services V2 Testing Guide

**Created:** 2026-01-28
**Purpose:** Guide for testing Phase 4 AI services with production V2 persona data

---

## Quick Start

### Access the Testing Dashboard

1. Navigate to: `http://localhost:3000/admin/ai-testing` (or your production URL)
2. You'll see three tabs:
   - **Persona Suggester** - Test juror-persona matching
   - **Voir Dire Generator** - Test question generation
   - **Case Strategy** - Test strategic recommendations

### Prerequisites

- ✅ V2 personas imported to production database (60 personas across 10 archetypes)
- ✅ `ANTHROPIC_API_KEY` environment variable set
- ✅ Backend API services running (port 3001)
- ✅ Frontend running (port 3000)

---

## Test 1: Persona Suggester

### What It Tests
- V2 persona matching with danger assessments
- Strike/keep recommendations based on attorney side
- Instant read summaries
- Confidence scoring

### How to Test

1. **Select Attorney Side:** Choose "Plaintiff" or "Defense"

2. **Enter Juror Data:** Modify the JSON with test juror information:
   ```json
   {
     "firstName": "Sarah",
     "lastName": "Johnson",
     "age": 52,
     "occupation": "CEO",
     "employer": "Tech Startup",
     "city": "Austin",
     "notes": "Self-made entrepreneur, very driven"
   }
   ```

3. **Click "Test Persona Suggester"**

4. **Review Results:** Check for:
   - ✅ Top 3 persona matches with confidence scores
   - ✅ Instant Read summaries
   - ✅ Danger Assessment (level, plaintiff/defense danger scores)
   - ✅ Strike Recommendation (action + reasoning)
   - ✅ Key matches referencing V2 data

### Expected Output

```json
{
  "suggestions": [
    {
      "persona": {
        "name": "Bootstrap Bob",
        "archetype": "bootstrapper",
        "instantRead": "Classic self-made man. Will blame plaintiff..."
      },
      "confidence": 0.87,
      "reasoning": "Strong match based on CEO occupation and self-made narrative...",
      "dangerAssessment": {
        "level": "high",
        "plaintiffDanger": 5,
        "defenseDanger": 1,
        "recommendation": "This juror poses critical risk to plaintiff's case..."
      },
      "strikeRecommendation": {
        "action": "MUST STRIKE",
        "reasoning": "As plaintiff attorney, this bootstrapper archetype..."
      }
    }
  ]
}
```

### Test Cases

**Test Case 1: Bootstrapper Match**
```json
{
  "firstName": "Mike",
  "lastName": "Thompson",
  "age": 58,
  "occupation": "Regional Sales Manager",
  "notes": "Talks about personal responsibility a lot"
}
```
Expected: High plaintiff danger, MUST STRIKE for plaintiff

**Test Case 2: Crusader Match**
```json
{
  "firstName": "Lisa",
  "lastName": "Martinez",
  "age": 34,
  "occupation": "Social Worker",
  "notes": "Very empathetic, talks about systemic issues"
}
```
Expected: High defense danger, KEEP for plaintiff

**Test Case 3: Scale-Balancer Match**
```json
{
  "firstName": "David",
  "lastName": "Chen",
  "age": 45,
  "occupation": "Accountant",
  "notes": "Very analytical, wants to see all evidence"
}
```
Expected: Neutral danger levels, may go either way

---

## Test 2: Voir Dire Generator

### What It Tests
- Question generation using "Phrases You'll Hear" data
- Expected responses by archetype
- Red flag identification
- Follow-up prompts

### How to Test

1. **Select Case Type:** Choose from dropdown (e.g., "Personal Injury")

2. **Select Attorney Side:** Choose "Plaintiff" or "Defense"

3. **Enter Key Issues:** One per line:
   ```
   Defendant negligence
   Causation of injuries
   Damages calculation
   ```

4. **Click "Generate Voir Dire Questions"**

5. **Review Results:** Check for:
   - ✅ Questions across 4 categories (Opening, Identification, Case-Specific, Strike)
   - ✅ Expected responses reference "Phrases You'll Hear"
   - ✅ Red flags for each archetype
   - ✅ Follow-up prompts (3-4 per question)

### Expected Output

```json
{
  "openingQuestions": [
    {
      "question": "Can you tell me about a time when someone's carelessness affected you?",
      "purpose": "Identify empathy vs. personal responsibility archetypes",
      "targetArchetypes": ["bootstrapper", "heart", "crusader"],
      "expectedResponses": [
        {
          "archetype": "bootstrapper",
          "likelyResponse": "At the end of the day, you're responsible for yourself",
          "redFlags": ["Blames victims", "Personal responsibility focus"]
        }
      ],
      "followUpPrompts": [
        "What did you learn from that experience?",
        "Do you think they should be held accountable?"
      ]
    }
  ]
}
```

### Test Categories

**Opening Questions:**
- Should be broad, rapport-building
- Reveal general attitudes

**Archetype Identification:**
- Should elicit specific "Phrases You'll Hear"
- Target 2-3 archetypes per question

**Case-Specific:**
- Tied to key issues you entered
- Reveal bias toward case facts

**Strike Justification:**
- Help document cause for strike
- Reveal extreme bias

### UI Features to Test

- ✅ Category tabs with question counts
- ✅ Expand/collapse question cards
- ✅ Copy question to clipboard
- ✅ Expected responses by archetype
- ✅ Red flags clearly displayed
- ✅ Follow-up prompts easily accessible

---

## Test 3: Case Strategy

### What It Tests
- Panel composition analysis
- Strike recommendations with prioritization
- Keep recommendations
- Deliberation forecast
- Strategic priorities

### How to Test

1. **Select Attorney Side:** Choose "Plaintiff" or "Defense"

2. **Select Available Strikes:** Choose from 3, 6, 10, or 12

3. **Click "Generate Case Strategy"**

4. **Review Results:** Check for:
   - ✅ Overall panel assessment
   - ✅ Panel composition breakdown (favorable/unfavorable/neutral)
   - ✅ Archetype distribution
   - ✅ Verdict lean visualization
   - ✅ Prioritized strike recommendations with danger levels
   - ✅ Keep recommendations with reasoning
   - ✅ Deliberation forecast with confidence
   - ✅ Strategic priorities (top 3-5)

### Expected Output

```json
{
  "overallAssessment": "Panel leans defense with 3 bootstrapper archetypes...",
  "panelComposition": {
    "totalJurors": 12,
    "favorableCount": 4,
    "unfavorableCount": 5,
    "neutralCount": 3,
    "archetypeBreakdown": {
      "bootstrapper": 3,
      "crusader": 2,
      "scale_balancer": 2
    },
    "verdictLeanSummary": {
      "strongPlaintiff": 2,
      "leanPlaintiff": 2,
      "neutral": 3,
      "leanDefense": 2,
      "strongDefense": 3
    }
  },
  "strikeRecommendations": [
    {
      "jurorNumber": "7",
      "jurorName": "John Smith",
      "action": "MUST STRIKE",
      "priority": 10,
      "reasoning": "Classic bootstrapper. Plaintiff danger 5/5...",
      "dangerLevel": "critical",
      "archetypeMatch": "bootstrapper",
      "keyFactors": [
        "Personal responsibility focus",
        "Anti-plaintiff language patterns",
        "Will dominate deliberation"
      ]
    }
  ],
  "deliberationForecast": {
    "predictedOutcome": "Defense verdict likely...",
    "confidenceLevel": 0.75,
    "keyInfluencers": ["Juror 7", "Juror 12"],
    "potentialLeaders": ["Juror 7"],
    "riskFactors": ["Multiple bootstrappers will reinforce each other"]
  }
}
```

### Visual Elements to Verify

- ✅ Panel composition stats (4 boxes with counts)
- ✅ Archetype distribution (grid layout)
- ✅ Verdict lean bars (color-coded: green → red)
- ✅ Strike cards (color-coded by danger level)
- ✅ Keep cards (green background)
- ✅ Deliberation forecast (confidence meter)
- ✅ Strategic priorities (numbered list)

---

## Known Limitations (Testing Mode)

### Mock Data Requirements

Since this is a testing page, some features require mock data:

1. **Persona Suggester:**
   - ❌ Cannot actually save suggestions to database
   - ✅ Can test matching algorithm and V2 data display

2. **Voir Dire Generator:**
   - ❌ Requires mock case ID (not saved to database)
   - ✅ Can test question generation with V2 personas

3. **Case Strategy:**
   - ❌ Requires case with jurors who have persona mappings
   - ❌ May fail if no test data in database
   - ✅ Can test strategy generation logic

### Testing with Real Data

To test with real production data:

1. **Create a real case** in the app
2. **Add jurors** to a panel
3. **Map personas** to jurors (using Persona Suggester)
4. **Use the real case/panel IDs** in API calls

---

## Troubleshooting

### Error: "ANTHROPIC_API_KEY not configured"
**Solution:** Set `ANTHROPIC_API_KEY` in your environment variables

### Error: "Persona not found"
**Solution:** Ensure V2 personas are imported (run import script)

### Error: "Failed to generate..."
**Solution:** Check backend logs for API errors

### No questions generated
**Solution:**
- Verify personas have `phrasesYoullHear` data
- Check if personas are active (`isActive: true`)
- Ensure `version: 2` field is set

### Case Strategy fails
**Solution:**
- Verify case has jurors with persona mappings
- Check that personas have V2 fields populated
- Ensure panel ID is valid

---

## Success Criteria

### Phase 4 AI Services are working correctly if:

✅ **Persona Suggester:**
- Returns 3 persona suggestions
- Each has instant read summary
- Danger assessment present with correct levels
- Strike recommendation aligned with attorney side
- Key matches reference V2 data

✅ **Voir Dire Generator:**
- Generates questions across all 4 categories
- Expected responses reference "Phrases You'll Hear"
- Red flags are specific and actionable
- Follow-up prompts are relevant
- Questions make sense for case type

✅ **Case Strategy:**
- Panel composition accurately reflects jurors
- Strike recommendations prioritized by danger
- Keep recommendations make strategic sense
- Deliberation forecast considers archetype mix
- Strategic priorities are actionable

---

## Performance Benchmarks

| Service | Expected Response Time | Token Usage |
|---------|----------------------|-------------|
| Persona Suggester | 3-5 seconds | ~2000 tokens |
| Voir Dire Generator | 5-8 seconds | ~6000 tokens |
| Case Strategy | 4-6 seconds | ~4000 tokens |

---

## Next Steps After Testing

1. ✅ Verify all services work with V2 data
2. ⏳ Test error handling and edge cases
3. ⏳ Performance testing with large datasets
4. ⏳ User acceptance testing with attorneys
5. ⏳ Deploy to staging environment
6. ⏳ Production deployment

---

## Support

If you encounter issues:

1. Check backend logs: `services/api-gateway/logs`
2. Verify V2 personas: `npm run check-persona-versions`
3. Review API responses in browser DevTools
4. Check documentation: `docs/PHASE_4_AI_SERVICES_V2.md`

---

**Happy Testing!** 🚀
