# Voir Dire Questions & Notes Implementation Plan

**Date:** January 30, 2026  
**Status:** Planning Phase  
**Priority:** High

---

## 1. Executive Summary

This plan outlines the implementation of voir dire question and response tracking, along with enhanced notes functionality for jurors. This feature enables attorneys to:

1. **Record voir dire questions and responses** during jury selection
2. **Link responses to suggested questions** from the discriminative question generator
3. **Track response history** chronologically for each juror
4. **Extract signals automatically** from voir dire responses
5. **Update persona matches** in real-time based on responses
6. **Manage general notes** separate from voir dire responses

---

## 2. Current State Analysis

### 2.1 Existing Infrastructure

✅ **Database Schema:**
- `VoirDireResponse` model exists with fields:
  - `jurorId`, `questionId` (optional), `questionText`, `responseSummary`
  - `responseTimestamp`, `enteredBy`, `entryMethod` (TYPED | VOICE_TO_TEXT | QUICK_SELECT)
  - Relations to `JurorSignal` (extracted signals) and `PersonaMatchUpdate`
- `Juror.notes` field exists for general notes
- `SuggestedQuestion` model exists for AI-generated questions

✅ **Backend Services:**
- Signal extraction service can extract from voir dire responses (`extractFromVoirDireResponse`)
- Discriminative question generator creates suggested questions
- Persona matching system can update based on new signals

✅ **Frontend Components:**
- `JurorEditSidebar` has basic notes editing
- `DiscriminativeQuestions` component displays suggested questions
- No UI for recording voir dire responses yet

### 2.2 Gaps

❌ **Missing API Endpoints:**
- No endpoint to create voir dire responses
- No endpoint to list voir dire responses for a juror
- No endpoint to update/delete voir dire responses

❌ **Missing UI Components:**
- No voir dire response entry form
- No voir dire response history display
- No integration between suggested questions and response recording
- Notes UI is basic (just a textarea in edit mode)

---

## 3. Requirements

### 3.1 Functional Requirements

#### FR1: Record Voir Dire Responses
- Users can record a voir dire question and response for a juror
- Can select from suggested questions or enter custom question
- Can enter response summary (free text)
- Can specify entry method (typed, voice-to-text, quick-select)
- Response timestamp is automatically recorded
- User ID is automatically recorded as `enteredBy`

#### FR2: View Voir Dire History
- Display all voir dire responses for a juror in chronological order
- Show question text, response summary, timestamp, and entry method
- Indicate if response came from a suggested question
- Show extracted signals from each response
- Show persona match updates triggered by each response

#### FR3: Link to Suggested Questions
- When viewing suggested questions, can click to "Ask This Question"
- Pre-populates question text in response entry form
- Marks response as linked to the suggested question
- Tracks which suggested questions have been asked

#### FR4: Automatic Signal Extraction
- When a voir dire response is saved, automatically extract signals
- Extract signals using existing `SignalExtractorService`
- Link extracted signals to the voir dire response as source
- Update persona matches based on new signals

#### FR5: Enhanced Notes Management
- Separate general notes from voir dire responses
- Notes are always editable (not just in edit mode)
- Rich text support (optional, Phase 2)
- Notes history/versioning (optional, Phase 2)

### 3.2 Non-Functional Requirements

#### NFR1: Performance
- Response entry should be instant (<100ms)
- Signal extraction should happen async (<5s)
- Persona match updates should happen async (<5s)

#### NFR2: UX
- Quick entry workflow for fast voir dire sessions
- Keyboard shortcuts for common actions
- Mobile-friendly for tablet use in courtroom

#### NFR3: Data Integrity
- All responses must be timestamped
- Cannot delete responses (soft delete only, optional)
- Audit trail of who entered what and when

---

## 4. Technical Design

### 4.1 API Endpoints

#### 4.1.1 Create Voir Dire Response

```
POST /api/jurors/:jurorId/voir-dire-responses

Request Body:
{
  questionId?: string;              // Optional: ID of suggested question
  questionText: string;              // Required: The question asked
  responseSummary: string;           // Required: Summary of juror's response
  entryMethod: 'TYPED' | 'VOICE_TO_TEXT' | 'QUICK_SELECT';
  responseTimestamp?: string;         // Optional: ISO datetime (defaults to now)
}

Response:
{
  success: boolean;
  response: {
    id: string;
    jurorId: string;
    questionId: string | null;
    questionText: string;
    responseSummary: string;
    responseTimestamp: string;
    enteredBy: string;
    entryMethod: string;
    createdAt: string;
    extractedSignals: Array<{
      id: string;
      signalId: string;
      signalName: string;
      value: any;
      confidence: number;
    }>;
    personaImpacts: Array<{
      personaId: string;
      personaName: string;
      probabilityDelta: number;
      previousProbability: number;
      newProbability: number;
    }>;
  };
}
```

**Implementation Notes:**
- Extract signals immediately after saving response
- Trigger persona match updates asynchronously
- Return enriched response with signals and impacts

#### 4.1.2 List Voir Dire Responses

```
GET /api/jurors/:jurorId/voir-dire-responses

Query Params:
- limit?: number (default: 50)
- offset?: number (default: 0)
- orderBy?: 'timestamp' | 'created' (default: 'timestamp')
- order?: 'asc' | 'desc' (default: 'desc')

Response:
{
  success: boolean;
  responses: Array<{
    id: string;
    questionId: string | null;
    questionText: string;
    responseSummary: string;
    responseTimestamp: string;
    enteredBy: string;
    entryMethod: string;
    createdAt: string;
    extractedSignals: Array<{
      id: string;
      signalId: string;
      signalName: string;
      value: any;
      confidence: number;
    }>;
    personaImpacts: Array<{
      personaId: string;
      personaName: string;
      probabilityDelta: number;
    }>;
  }>;
  count: number;
}
```

#### 4.1.3 Update Voir Dire Response

```
PATCH /api/jurors/:jurorId/voir-dire-responses/:responseId

Request Body:
{
  questionText?: string;
  responseSummary?: string;
  entryMethod?: 'TYPED' | 'VOICE_TO_TEXT' | 'QUICK_SELECT';
  responseTimestamp?: string;
}

Response:
{
  success: boolean;
  response: { ... } // Same as create response
}
```

**Note:** Updating a response will re-extract signals and update persona matches.

#### 4.1.4 Delete Voir Dire Response (Soft Delete)

```
DELETE /api/jurors/:jurorId/voir-dire-responses/:responseId

Response:
{
  success: boolean;
}
```

**Note:** For Phase 1, we'll use hard delete. Soft delete can be added later if needed.

### 4.2 Database Changes

**No schema changes needed** - `VoirDireResponse` model already exists.

**Optional Enhancements (Phase 2):**
- Add `updatedAt` field (if not already present)
- Add `deletedAt` field for soft deletes
- Add `version` field for response history

### 4.3 Frontend Components

#### 4.3.1 VoirDireResponseEntry Component

**Location:** `apps/web/components/voir-dire/voir-dire-response-entry.tsx`

**Props:**
```typescript
interface VoirDireResponseEntryProps {
  jurorId: string;
  suggestedQuestionId?: string;  // Pre-populate from suggested question
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

**Features:**
- Form with question text (pre-populated if from suggested question)
- Textarea for response summary
- Entry method selector (TYPED, VOICE_TO_TEXT, QUICK_SELECT)
- Timestamp picker (defaults to now)
- "Save Response" button
- Loading state during save
- Error handling

**UI Design:**
- Modal or inline form
- Large text areas for easy entry
- Quick-select buttons for common entry methods
- Keyboard shortcut: Cmd/Ctrl+Enter to save

#### 4.3.2 VoirDireResponseHistory Component

**Location:** `apps/web/components/voir-dire/voir-dire-response-history.tsx`

**Props:**
```typescript
interface VoirDireResponseHistoryProps {
  jurorId: string;
}
```

**Features:**
- List of all voir dire responses (chronological)
- Expandable cards showing:
  - Question and response
  - Timestamp and entry method
  - Extracted signals (if any)
  - Persona impacts (if any)
- Link to suggested question (if applicable)
- Edit/delete actions (if user has permission)
- Empty state when no responses

**UI Design:**
- Timeline-style layout
- Color-coded by entry method
- Collapsible sections for signals/impacts
- Inline editing capability

#### 4.3.3 Enhanced Notes Component

**Location:** `apps/web/components/juror/juror-notes.tsx`

**Props:**
```typescript
interface JurorNotesProps {
  jurorId: string;
  initialNotes?: string;
}
```

**Features:**
- Always-editable textarea (not just in edit mode)
- Auto-save on blur (debounced)
- Character count
- Formatting toolbar (optional, Phase 2)
- Notes history (optional, Phase 2)

**UI Design:**
- Inline editing with save indicator
- Auto-save feedback
- Simple, clean interface

#### 4.3.4 Integration Points

**Update `JurorEditSidebar`:**
- Add "Voir Dire" section with:
  - Quick entry button
  - Response history component
- Replace basic notes textarea with `JurorNotes` component
- Add "Ask Suggested Question" buttons in `DiscriminativeQuestions` component

**Update `DiscriminativeQuestions`:**
- Add "Ask This Question" button to each suggested question
- Opens `VoirDireResponseEntry` with question pre-populated
- Mark question as "asked" after response is saved

### 4.4 Backend Service Updates

#### 4.4.1 Voir Dire Response Service

**Location:** `services/api-gateway/src/services/voir-dire-response-service.ts`

**Responsibilities:**
- Create voir dire responses
- Extract signals from responses
- Trigger persona match updates
- Handle response updates and deletions

**Key Methods:**
```typescript
class VoirDireResponseService {
  async createResponse(
    jurorId: string,
    data: CreateVoirDireResponseInput,
    userId: string
  ): Promise<VoirDireResponseWithExtras>
  
  async extractSignalsAndUpdateMatches(
    responseId: string
  ): Promise<{ signals: JurorSignal[]; updates: PersonaMatchUpdate[] }>
  
  async listResponses(
    jurorId: string,
    options: ListOptions
  ): Promise<VoirDireResponse[]>
  
  async updateResponse(
    responseId: string,
    data: UpdateVoirDireResponseInput
  ): Promise<VoirDireResponse>
  
  async deleteResponse(responseId: string): Promise<void>
}
```

#### 4.4.2 Signal Extraction Integration

**Update `SignalExtractorService`:**
- Ensure `extractFromVoirDireResponse` is working correctly
- Handle async extraction with proper error handling
- Link extracted signals to response ID

#### 4.4.3 Persona Match Update Integration

**Update `EnsembleMatcher` or create `PersonaMatchUpdater`:**
- When new signals are extracted, update persona matches
- Use Bayesian updating for incremental updates
- Create `PersonaMatchUpdate` records
- Emit events for real-time UI updates (optional, Phase 2)

---

## 5. Implementation Phases

### Phase 1: Core Functionality (MVP)

**Goal:** Basic voir dire response recording and viewing

**Tasks:**
1. ✅ Create API endpoint: `POST /api/jurors/:jurorId/voir-dire-responses`
2. ✅ Create API endpoint: `GET /api/jurors/:jurorId/voir-dire-responses`
3. ✅ Create API endpoint: `PATCH /api/jurors/:jurorId/voir-dire-responses/:responseId`
4. ✅ Create API endpoint: `DELETE /api/jurors/:jurorId/voir-dire-responses/:responseId`
5. ✅ Create `VoirDireResponseService` backend service
6. ✅ Create `VoirDireResponseEntry` component
7. ✅ Create `VoirDireResponseHistory` component
8. ✅ Integrate into `JurorEditSidebar`
9. ✅ Add "Ask This Question" to `DiscriminativeQuestions`
10. ✅ Test signal extraction on response save
11. ✅ Test persona match updates on response save

**Deliverables:**
- Users can record voir dire responses
- Users can view response history
- Responses trigger signal extraction
- Responses trigger persona match updates

### Phase 2: Enhanced Features

**Goal:** Improved UX and additional features

**Tasks:**
1. Add voice-to-text integration (browser API)
2. Add quick-select templates for common responses
3. Add response editing/deletion
4. Add notes auto-save
5. Add keyboard shortcuts
6. Add response search/filter
7. Add export functionality
8. Add response templates
9. Add bulk response entry
10. Add response analytics

**Deliverables:**
- Enhanced UX for fast entry
- Advanced features for power users
- Better data management

### Phase 3: Real-Time Updates (Future)

**Goal:** Live updates during voir dire sessions

**Tasks:**
1. WebSocket integration for real-time updates
2. Multi-user collaboration
3. Live persona probability updates
4. Real-time signal extraction feedback
5. Voir dire session management

---

## 6. File Structure

### 6.1 Backend Files

```
services/api-gateway/src/
├── routes/
│   └── voir-dire.ts                    # NEW: Voir dire response routes
├── services/
│   ├── voir-dire-response-service.ts   # NEW: Response service
│   └── signal-extractor.ts             # UPDATE: Ensure voir dire extraction works
└── server.ts                           # UPDATE: Register voir dire routes
```

### 6.2 Frontend Files

```
apps/web/
├── components/
│   ├── voir-dire/
│   │   ├── voir-dire-response-entry.tsx      # NEW: Entry form
│   │   ├── voir-dire-response-history.tsx    # NEW: History display
│   │   └── voir-dire-response-card.tsx       # NEW: Individual response card
│   └── juror/
│       └── juror-notes.tsx                    # NEW: Enhanced notes component
├── hooks/
│   └── use-voir-dire-responses.ts             # NEW: React Query hooks
└── lib/
    └── api-client.ts                          # UPDATE: Add voir dire methods
```

---

## 7. User Workflows

### 7.1 Recording a Voir Dire Response

1. User opens juror sidebar
2. User navigates to "Voir Dire" section
3. User clicks "Add Response" button
4. Modal/form opens
5. User either:
   - Selects a suggested question (pre-populates question text)
   - Enters custom question text
6. User enters response summary
7. User selects entry method (optional, defaults to TYPED)
8. User clicks "Save Response"
9. Response is saved
10. Signals are extracted automatically (async)
11. Persona matches are updated automatically (async)
12. UI updates to show new response

### 7.2 Viewing Response History

1. User opens juror sidebar
2. User navigates to "Voir Dire" section
3. Response history is displayed automatically
4. User can expand responses to see:
   - Extracted signals
   - Persona impacts
   - Linked suggested question
5. User can edit or delete responses (if permitted)

### 7.3 Asking a Suggested Question

1. User views suggested questions in `DiscriminativeQuestions` component
2. User clicks "Ask This Question" button
3. `VoirDireResponseEntry` opens with question pre-populated
4. User enters response
5. User saves response
6. Suggested question is marked as "asked"
7. Response appears in history

---

## 8. Testing Strategy

### 8.1 Unit Tests

- `VoirDireResponseService` methods
- Signal extraction from voir dire responses
- Persona match update logic
- API endpoint handlers

### 8.2 Integration Tests

- End-to-end response creation flow
- Signal extraction integration
- Persona match update integration
- Suggested question linking

### 8.3 E2E Tests

- User can record voir dire response
- User can view response history
- User can link to suggested question
- Signals are extracted correctly
- Persona matches update correctly

---

## 9. Open Questions

1. **Permissions:** Who can edit/delete voir dire responses? Only creator? Any team member?
2. **Soft Delete:** Should we implement soft delete from the start, or add later?
3. **Voice-to-Text:** Use browser API or third-party service? (Phase 2)
4. **Real-Time:** Do we need WebSocket updates, or is polling sufficient? (Phase 3)
5. **Response Templates:** Should we support pre-defined response templates?
6. **Bulk Entry:** Should we support bulk response entry for multiple jurors?
7. **Export:** What format for exporting voir dire responses? PDF? CSV?
8. **Notes Formatting:** Should notes support rich text, or stay plain text?

---

## 10. Success Metrics

- **Adoption:** % of jurors with at least one voir dire response recorded
- **Usage:** Average number of responses per juror
- **Signal Extraction:** % of responses that successfully extract signals
- **Persona Updates:** % of responses that trigger persona match updates
- **Time to Entry:** Average time to record a response (<30 seconds target)

---

## 11. Dependencies

- ✅ Database schema (already exists)
- ✅ Signal extraction service (already exists)
- ✅ Persona matching service (already exists)
- ✅ Authentication/authorization (already exists)
- ⏳ Voice-to-text API (Phase 2)
- ⏳ WebSocket infrastructure (Phase 3)

---

## 12. Timeline Estimate

**Phase 1 (MVP):** 3-5 days
- Backend API: 1-2 days
- Frontend components: 2-3 days
- Integration & testing: 1 day

**Phase 2 (Enhanced):** 5-7 days
**Phase 3 (Real-Time):** 7-10 days

---

## 13. Next Steps

1. ✅ Review and approve this plan
2. ⏳ Create backend API endpoints
3. ⏳ Create frontend components
4. ⏳ Integrate into existing UI
5. ⏳ Test end-to-end workflow
6. ⏳ Deploy to staging
7. ⏳ User acceptance testing
8. ⏳ Deploy to production

---

**Document Status:** Ready for Review  
**Last Updated:** January 30, 2026  
**Owner:** Engineering Team
