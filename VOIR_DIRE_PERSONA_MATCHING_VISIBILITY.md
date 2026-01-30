# Voir Dire → Persona Matching Visibility Guide

## Where to See Voir Dire Impact on Persona Matching

### 1. **Voir Dire Manager (Juror Sidebar)** ✅ **ENHANCED**

**Location**: Open a juror → "Voir Dire" section in the sidebar

**What You'll See**:
- Responses show badges indicating:
  - **Signal count**: Blue badge showing how many signals were extracted
  - **Persona impacts**: Purple badge showing how many personas were affected
- **Click any response to expand** and see:
  - **Extracted Signals**: Shows which signals were found, their values, and confidence scores
  - **Persona Match Updates**: Shows which personas changed probability and by how much

**Example**:
```
Q: Have you ever been involved in a lawsuit?
A: Yes - I was sued by my former employer

[1 signal] [2 persona impacts] ← Click to expand

Expanded view shows:
- Extracted Signals:
  - "Litigation Experience" = true (Confidence: 90%)
- Persona Match Updates:
  - "Skeptical Professional" +15% (45% → 60%)
  - "Defense-Friendly" -8% (52% → 44%)
```

### 2. **Persona Match Dashboard**

**Location**: Open a juror → "Persona Matching" section

**What You'll See**:
- Current match scores for all personas
- These scores **include** voir dire signals (they're used in the matching calculation)
- **Note**: This shows the current state, not the change from voir dire responses

**To see voir dire-specific impacts**: Use the Voir Dire Manager (above)

### 3. **Signal Inventory**

**Location**: Open a juror → "Signal Inventory" section

**What You'll See**:
- All extracted signals from all sources (questionnaire, research, voir dire, manual)
- Signals from voir dire are marked with source `VOIR_DIRE`
- Grouped by category (DEMOGRAPHIC, BEHAVIORAL, ATTITUDINAL, etc.)

## How It Works

### Flow When You Add a Voir Dire Response:

1. **Response Created** → You save a voir dire Q&A
2. **Signal Extraction** (automatic, ~1-2 seconds):
   - System analyzes question + answer text
   - Matches against signal patterns
   - Extracts relevant signals (e.g., "Litigation Experience", "Trust in Authority")
3. **Persona Matching** (automatic, ~2-5 seconds):
   - Re-runs matching algorithm with new signals
   - Calculates updated probabilities for all personas
   - Creates `PersonaMatchUpdate` records if change > 1%
4. **UI Updates**:
   - Voir Dire Manager shows signals and impacts
   - Persona Match Dashboard shows updated scores (refresh if needed)

### Why You Might Not See Impact

1. **No Signals Extracted**:
   - Question/answer doesn't match any signal patterns
   - Check Signal Inventory to see if signals exist for this juror
   - Signals are defined in the `Signal` table and matched via patterns

2. **Change Too Small**:
   - Only changes > 1% are recorded as "impacts"
   - Smaller changes still affect matching but aren't shown as separate updates

3. **Matching Not Triggered**:
   - Check backend logs for errors in `extractSignalsAndUpdateMatches`
   - Ensure `ANTHROPIC_API_KEY` is set (required for matching)

4. **UI Not Refreshing**:
   - Try refreshing the page
   - Check browser console for errors
   - Verify the response has `extractedSignals` and `personaImpacts` arrays populated

## Debugging Steps

### Check if Signals Were Extracted:

1. Open juror sidebar → Voir Dire section
2. Expand a voir dire response
3. Look for "Extracted Signals" section
4. If empty, check:
   - Does the question/answer contain keywords that match signal patterns?
   - Are there signals defined in the database for this case/organization?

### Check if Matching Ran:

1. Open juror sidebar → Voir Dire section  
2. Expand a voir dire response
3. Look for "Persona Match Updates" section
4. If empty but signals exist:
   - Check backend logs for matching errors
   - Verify `ANTHROPIC_API_KEY` is configured
   - Check if personas exist for this organization

### Check Current Match Scores:

1. Open juror sidebar → Persona Matching section
2. Click "Run Matching" to refresh scores
3. Compare scores before/after adding voir dire responses
4. Scores should reflect voir dire signals automatically

## Technical Details

### Signal Extraction Process:

- **Location**: `services/api-gateway/src/services/signal-extractor.ts`
- **Method**: `extractFromVoirDireResponse()`
- **Uses**: Pattern matching on question + answer text
- **For Yes/No answers**: Direct boolean assignment if question matches signal pattern

### Persona Matching Process:

- **Location**: `services/api-gateway/src/services/voir-dire-response-service.ts`
- **Method**: `extractSignalsAndUpdateMatches()`
- **Triggers**: Automatically after voir dire response create/update
- **Threshold**: Only records updates if probability change > 0.01 (1%)

### Database Tables:

- `voir_dire_responses`: Stores Q&A
- `juror_signals`: Stores extracted signals (source = 'VOIR_DIRE')
- `persona_match_updates`: Stores probability changes from voir dire
- `juror_persona_mappings`: Stores current match scores (updated by voir dire)

## Next Steps

If voir dire responses aren't impacting matching:

1. **Verify signals exist**: Check Signal Inventory
2. **Check signal patterns**: Ensure signal definitions match your questions
3. **Review backend logs**: Look for extraction/matching errors
4. **Test with explicit signals**: Try questions that clearly match signal patterns
5. **Check API key**: Ensure Claude API key is configured for matching
