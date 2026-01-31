# Phase 3 UI Implementation Complete

## Overview
The UI for the Juror-Persona Matching System has been successfully implemented and integrated into the juror detail page. This provides a complete interface for attorneys to view persona matches, extracted signals, and generate discriminative questions.

## Components Created

### 1. React Query Hooks

#### `use-juror-matching.ts`
- **`useJurorMatches`**: Fetches and displays ensemble matches for a juror
- **`useMatchJuror`**: Triggers the matching process
- **`useConfirmPersonaMatch`**: Confirms or overrides persona assignments
- **`useMatchBreakdown`**: Fetches detailed breakdown for a specific juror-persona match

#### `use-juror-signals.ts`
- **`useJurorSignals`**: Fetches all extracted signals for a juror
- **`useJurorSignalsByCategory`**: Fetches signals filtered by category

#### `use-discriminative-questions.ts`
- **`useSuggestedQuestionsForJuror`**: Fetches suggested questions for a specific juror
- **`useSuggestedQuestionsForCase`**: Fetches panel-wide questions for a case
- **`useGenerateJurorQuestions`**: Triggers question generation for a juror
- **`useGeneratePanelQuestions`**: Triggers panel-wide question generation
- **`useRecordQuestionUsage`**: Records when a question is used

### 2. UI Components

#### `persona-match-dashboard.tsx`
**Features:**
- Displays ensemble matches ranked by probability
- Shows match scores and confidence levels with color coding
- Displays method scores breakdown (Signal-Based, Embedding, Bayesian)
- Shows rationale and counterfactual analysis
- Allows confirming matches
- Opens detailed breakdown modal

**Visual Elements:**
- Color-coded confidence badges (green ≥80%, yellow ≥60%, orange <60%)
- Method score cards showing individual algorithm contributions
- Expandable rationale and counterfactual sections

#### `match-breakdown-modal.tsx`
**Features:**
- Detailed view of a specific juror-persona match
- Shows overall score and confidence
- Displays method scores with individual confidences
- Lists supporting and contradicting signals
- Shows full rationale and counterfactual analysis

#### `signal-inventory.tsx`
**Features:**
- Displays all extracted signals grouped by category
- Expandable category sections
- Shows signal values, sources, and confidence levels
- Color-coded by category (Demographic, Behavioral, Attitudinal, Linguistic, Social)
- Source badges (Questionnaire, Research, Voir Dire, Manual)

**Visual Elements:**
- Category badges with distinct colors
- Source indicators
- Confidence percentages
- Extraction timestamps

#### `discriminative-questions.tsx`
**Features:**
- Generates strategic voir dire questions
- Displays questions ranked by priority score
- Shows information gain metrics
- Expandable question details with:
  - Priority rationale
  - Response interpretations
  - Expected signals
  - Follow-up questions
- Tracks question usage

**Visual Elements:**
- Priority score badges (color-coded by importance)
- Category tags
- Information gain indicators
- Usage statistics

## Integration

### Juror Detail Page (`apps/web/app/(auth)/jurors/[id]/page.tsx`)
The components have been integrated into the juror detail page in the following order:

1. **Signal Inventory** - Shows extracted signals first
2. **Persona Match Dashboard** - Displays persona matches
3. **Discriminative Questions** - Shows suggested questions
4. **Archetype Classifier** - Existing component (unchanged)

All components are wrapped in cards with consistent styling matching the existing design system.

## API Integration

### Endpoints Used
- `POST /api/matching/jurors/:jurorId/match` - Run matching
- `GET /api/matching/jurors/:jurorId/matches` - Get stored mappings (not currently used in UI)
- `GET /api/matching/jurors/:jurorId/personas/:personaId/breakdown` - Get detailed breakdown
- `POST /api/matching/jurors/:jurorId/matches/:mappingId/confirm` - Confirm matches
- `GET /api/signals/jurors/:jurorId` - Get juror signals
- `GET /api/questions/jurors/:jurorId/suggested-questions` - Get suggested questions
- `POST /api/questions/questions/:questionId/record-usage` - Record question usage
- `GET /api/personas/:personaId` - Get persona details (for enrichment)

## Data Flow

1. **Matching Flow:**
   - User clicks "Run Matching"
   - POST request triggers ensemble matching
   - Results are enriched with persona names/descriptions
   - Matches displayed with scores and rationale

2. **Signal Display:**
   - Signals automatically loaded when juror page opens
   - Grouped by category for easy navigation
   - Expandable sections for detailed view

3. **Question Generation:**
   - User clicks "Generate Questions"
   - Questions generated based on ambiguous matches
   - Questions ranked by information gain
   - Usage tracked when questions are expanded

## Styling

All components use the existing design system:
- Filevine color palette (`filevine-blue`, `filevine-gray-*`)
- Consistent card styling with borders and shadows
- Responsive grid layouts
- Hover states and transitions
- Loading and error states

## Next Steps

1. **Testing:**
   - Test with real juror data
   - Verify signal extraction displays correctly
   - Test question generation with various persona combinations
   - Verify match confirmation flow

2. **Enhancements:**
   - Add ability to manually extract signals
   - Add filters for signal display
   - Add export functionality for matches
   - Add comparison view for multiple jurors

3. **Phase 4 Integration:**
   - Live voir dire response capture
   - Real-time match updates
   - Follow-up question suggestions during voir dire

## Files Created/Modified

### New Files:
- `apps/web/hooks/use-juror-matching.ts`
- `apps/web/hooks/use-juror-signals.ts`
- `apps/web/hooks/use-discriminative-questions.ts`
- `apps/web/components/persona-match-dashboard.tsx`
- `apps/web/components/match-breakdown-modal.tsx`
- `apps/web/components/signal-inventory.tsx`
- `apps/web/components/discriminative-questions.tsx`

### Modified Files:
- `apps/web/app/(auth)/jurors/[id]/page.tsx` - Added new components

## Notes

- All components handle loading and error states gracefully
- Persona names are fetched separately to enrich match data
- The UI automatically refreshes when matches are confirmed
- Question usage is tracked when questions are expanded
- All API calls are authenticated using the user's token from auth context
