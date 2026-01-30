# Juror-Persona Matching System - Implementation Plan

**Created:** January 30, 2026  
**Last Updated:** January 30, 2026  
**Status:** Phase 2 In Progress (Embedding & Ensemble Complete)  
**PRD Reference:** TrialForge_Juror_Persona_Matching_PRD.md

## Recent Updates (January 30, 2026)

### ✅ Completed Implementations

1. **Voyage AI Embedding Scorer**
   - Replaced placeholder hash-based embedding with Voyage AI `voyage-law-2` model
   - 1024-dimensional embeddings optimized for legal content
   - Preload function (`preloadPersonaEmbeddings()`) runs at server startup
   - Batch processing (10 personas at a time) for efficient preloading
   - Fallback embedding method when Voyage AI unavailable
   - **File:** `services/api-gateway/src/services/matching/embedding-scorer.ts`

2. **Updated Ensemble Weights**
   - Changed from: signal=0.35, embedding=0.30, bayesian=0.35
   - Changed to: **signal=0.15, embedding=0.55, bayesian=0.30**
   - Embedding similarity is now the primary matching method (55% weight)
   - Dynamic weight adjustment based on data availability maintained
   - **File:** `services/api-gateway/src/services/matching/ensemble-matcher.ts`

3. **Startup Integration**
   - `preloadPersonaEmbeddings()` called automatically in `index.ts`
   - Non-blocking background execution
   - Comprehensive error handling and logging
   - **File:** `services/api-gateway/src/index.ts`

### 📦 Sample Data Available
- **60 Personas** ready for testing (see `personas-v2-export.json`)
- All personas will be preloaded with Voyage AI embeddings at startup
- Distribution across 10 archetypes provides comprehensive test coverage

### 🔧 Environment Setup Required
- Add `VOYAGE_API_KEY` to environment variables
- Get API key from: https://dash.voyageai.com
- Embedding scorer will use fallback if key not set (with warning)

## Executive Summary

This document analyzes the gap between the comprehensive Juror-Persona Matching PRD and the current implementation, then provides a phased implementation plan to build the full matching system.

**Current State:** 
- ✅ Embedding similarity matching (Voyage AI voyage-law-2) - **COMPLETE**
- ✅ Ensemble combination with updated weights - **COMPLETE**
- ⚠️ Basic LLM-based persona suggestion exists
- ⚠️ Basic signal extraction exists (needs enhancement)
- ⚠️ Basic Bayesian updating exists (needs enhancement)
- ❌ Discriminative question generation (not yet implemented)
- ❌ Real-time voir dire integration (not yet implemented)

**Target State:** Full implementation of signal-based scoring, embedding similarity, Bayesian updating, ensemble combination, discriminative question generation, and real-time voir dire response tracking.

---

## 1. Current Implementation Analysis

### 1.1 What Exists Today

#### ✅ Persona V2 Library (60 Personas)
- **Location:** `personas-v2-export.json`
- **Status:** ✅ Complete - 60 personas across 10 archetypes ready for matching
- **Distribution:**
  - Bootstrapper: 10 personas
  - Crusader: 10 personas
  - Scale-Balancer: 6 personas
  - Captain: 6 personas
  - Heart: 6 personas
  - Chameleon: 5 personas
  - Calculator: 5 personas
  - Scarred: 5 personas
  - Maverick: 4 personas
  - Trojan Horse: 3 personas
- **Features:** Each persona includes demographics, danger levels, phrases, verdict predictions, strike/keep guidance
- **Usage:** All 60 personas will be preloaded with embeddings at server startup

#### ✅ Persona Suggestion Service
- **Location:** `services/api-gateway/src/services/persona-suggester.ts`
- **Capability:** Uses Claude AI to suggest top 3 personas with confidence scores
- **Features:**
  - Analyzes juror demographics, occupation, research artifacts
  - Returns confidence, reasoning, key matches, concerns
  - Includes danger assessment and strike recommendations (V2)
- **Limitation:** Single LLM-based approach, no multi-algorithm ensemble

#### ✅ Persona Mapping Storage
- **Model:** `JurorPersonaMapping` in Prisma schema
- **Fields:** `confidence`, `rationale`, `counterfactual`, `isConfirmed`, `source`
- **Capability:** Stores AI suggestions and user overrides
- **Limitation:** Counterfactual field exists but not actively generated

#### ✅ Research Artifact Signal Extraction
- **Service:** `ResearchSummarizerService`
- **Capability:** Extracts persona signals from research artifacts
- **Output:** Structured signals with categories (decision_style, values, communication, etc.)
- **Limitation:** Signals stored as JSON, not structured Signal objects

#### ✅ Embedding-Based Matching (Voyage AI)
- **Service:** `EmbeddingScorer` in `services/api-gateway/src/services/matching/embedding-scorer.ts`
- **Status:** ✅ **COMPLETE** - Production-ready implementation
- **Model:** Voyage AI `voyage-law-2` (1024 dimensions, legal-optimized)
- **Features:**
  - Pre-computed persona embeddings (preloaded at startup)
  - Juror narrative generation with caching
  - Cosine similarity calculation
  - Fallback embedding for when Voyage AI unavailable
- **Performance:** Batch processing, in-memory caching, non-blocking startup preload

#### ✅ Question Generation
- **Services:** `QuestionGeneratorService`, `VoirDireGeneratorV2Service`
- **Capability:** Generates voir dire questions by category
- **Features:** Opening, persona identification, case-specific, strike justification
- **Limitation:** Not discriminative (doesn't target ambiguous matches specifically)

#### ✅ Ensemble Matching System
- **Service:** `EnsembleMatcher` in `services/api-gateway/src/services/matching/ensemble-matcher.ts`
- **Status:** ✅ **COMPLETE** - Production-ready with updated weights
- **Weights:** Signal=0.15, Embedding=0.55, Bayesian=0.30
- **Features:**
  - Parallel execution of all three algorithms
  - Dynamic weight adjustment based on data availability
  - Rationale and counterfactual generation for top matches
  - Confidence scoring per method

#### ✅ Database Schema Support
- **Juror Model:** Has `questionnaireData` JSON field
- **ResearchArtifact Model:** Has `signals` JSON field
- **Persona Model:** Has `signals` JSON field (legacy)
- **Limitation:** No structured Signal model, no voir dire response tracking

### 1.2 What's Missing

#### ❌ Structured Signal System
- No `Signal` model/table
- No signal extraction from questionnaire fields
- No signal-to-persona weight mappings
- Signals exist only as unstructured JSON

#### ⚠️ Multi-Algorithm Matching (Partially Implemented)
- ✅ Embedding similarity matching (Voyage AI voyage-law-2) - **IMPLEMENTED**
- ✅ Ensemble combination with updated weights - **IMPLEMENTED**
- ⚠️ Signal-based scoring algorithm - **IN PROGRESS** (basic implementation exists)
- ⚠️ Bayesian updating - **IN PROGRESS** (basic implementation exists)

#### ❌ Voir Dire Response Tracking
- No `voir_dire_responses` array in Juror model
- No real-time signal extraction from responses
- No persona probability updates during voir dire
- No response-to-signal mapping

#### ❌ Discriminative Question Generation
- Questions generated generically, not targeting ambiguous matches
- No information gain calculation
- No panel-wide question optimization

#### ❌ Counterfactual Generation
- Field exists in schema but not actively generated
- No algorithm to identify "what would change this match"

#### ❌ Real-Time Updates
- No live persona probability updates
- No signal extraction from voir dire responses
- No follow-up question suggestions based on responses

---

## 2. Gap Analysis: PRD vs Current Implementation

### 2.1 Data Models

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| Signal Object with categories, weights, detection patterns | Signals as JSON in ResearchArtifact | Need structured Signal model |
| Juror.extracted_signals array | No signal inventory | Need signal extraction and storage |
| Juror.voir_dire_responses array | Not in schema | Need voir dire response tracking |
| Persona.positive_signals / negative_signals | Persona.signals as JSON | Need structured signal definitions |
| SuggestedQuestion model | Question generation exists but no storage | Need question storage and tracking |

### 2.2 Matching Algorithms

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| Signal-based scoring | Basic implementation exists | Need enhancement and signal weight mappings |
| Embedding similarity | ✅ Implemented (Voyage AI) | Voyage AI voyage-law-2 with preload at startup |
| Bayesian updating | Basic implementation exists | Need enhancement with proper priors |
| Ensemble combination | ✅ Implemented | Weights: signal=0.15, embedding=0.55, bayesian=0.30 |
| Rationale generation | Basic LLM generation | Exists but could be enhanced |
| Counterfactual generation | Field exists, not generated | Need algorithm to identify decision boundaries |

### 2.3 Workflows

| PRD Workflow | Current State | Gap |
|--------------|---------------|-----|
| Questionnaire import & initial matching | OCR exists, matching is LLM-only | Need signal extraction + multi-algorithm matching |
| Discriminative question generation | Generic question generation | Need ambiguous match detection + information gain |
| Live voir dire response capture | No voir dire tracking | Need response entry UI + real-time updates |
| Final persona assignment & strike recommendations | Basic strike recommendations exist | Need jury composition modeling |

### 2.4 UI/UX Requirements

| PRD Requirement | Current State | Gap |
|----------------|---------------|-----|
| Persona match dashboard | Basic persona suggester component | Need full dashboard with probability distributions |
| Voir dire mode interface | No voir dire mode | Need trial-mode UI for response entry |
| Strike decision interface | Basic strike priority | Need jury composition simulator |

---

## 3. Implementation Phases

### Phase 1: Foundation - Signal System & Data Models (Weeks 1-2)

**Goal:** Build the foundational signal extraction and storage system.

#### 3.1.1 Database Schema Updates

**New Models:**

```prisma
model Signal {
  id                String   @id @default(uuid())
  signalId          String   @unique @map("signal_id") // e.g., "OCCUPATION_HEALTHCARE"
  name              String
  category          String   // DEMOGRAPHIC | BEHAVIORAL | ATTITUDINAL | LINGUISTIC | SOCIAL
  extractionMethod  String   @map("extraction_method") // FIELD_MAPPING | PATTERN_MATCH | NLP_CLASSIFICATION | MANUAL
  sourceField       String?  @map("source_field") // If FIELD_MAPPING
  patterns          Json?    // Regex patterns for PATTERN_MATCH
  nlpClassifierId   String?  @map("nlp_classifier_id")
  valueType         String   @map("value_type") // BOOLEAN | CATEGORICAL | NUMERIC | TEXT
  possibleValues    Json?    @map("possible_values") // If CATEGORICAL
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  // Relations
  personaWeights    SignalPersonaWeight[]
  jurorSignals      JurorSignal[]
  
  @@index([category])
  @@index([signalId])
  @@map("signals")
}

model SignalPersonaWeight {
  id         String   @id @default(uuid())
  signalId   String   @map("signal_id")
  personaId  String   @map("persona_id")
  direction  String   // POSITIVE | NEGATIVE
  weight     Decimal  @db.Decimal(3, 2) // 0.00 - 1.00
  createdAt  DateTime @default(now()) @map("created_at")
  
  // Relations
  signal  Signal  @relation(fields: [signalId], references: [id], onDelete: Cascade)
  persona Persona @relation(fields: [personaId], references: [id], onDelete: Cascade)
  
  @@unique([signalId, personaId, direction])
  @@index([signalId])
  @@index([personaId])
  @@map("signal_persona_weights")
}

model JurorSignal {
  id              String    @id @default(uuid())
  jurorId         String    @map("juror_id")
  signalId        String    @map("signal_id")
  value           Json      // Value based on signal's valueType
  source          String    // QUESTIONNAIRE | RESEARCH | VOIR_DIRE | MANUAL
  sourceReference String?   @map("source_reference") // Field name, artifact ID, or response ID
  confidence      Decimal   @db.Decimal(3, 2) // Extraction confidence 0-1
  extractedAt     DateTime  @default(now()) @map("extracted_at")
  
  // Relations
  juror  Juror  @relation(fields: [jurorId], references: [id], onDelete: Cascade)
  signal Signal @relation(fields: [signalId], references: [id])
  
  @@unique([jurorId, signalId, source, sourceReference])
  @@index([jurorId])
  @@index([signalId])
  @@index([source])
  @@map("juror_signals")
}

model VoirDireResponse {
  id                String   @id @default(uuid())
  jurorId           String   @map("juror_id")
  questionId        String?  @map("question_id") // If from suggested question
  questionText      String   @map("question_text") @db.Text
  responseSummary   String   @map("response_summary") @db.Text
  responseTimestamp DateTime @map("response_timestamp")
  enteredBy         String   @map("entered_by")
  entryMethod       String   @map("entry_method") // TYPED | VOICE_TO_TEXT | QUICK_SELECT
  createdAt         DateTime @default(now()) @map("created_at")
  
  // Relations
  juror           Juror              @relation(fields: [jurorId], references: [id], onDelete: Cascade)
  extractedSignals JurorSignal[]     @relation("VoirDireSource")
  personaImpacts   PersonaMatchUpdate[]
  
  @@index([jurorId])
  @@index([responseTimestamp])
  @@map("voir_dire_responses")
}

model PersonaMatchUpdate {
  id             String   @id @default(uuid())
  jurorId        String   @map("juror_id")
  personaId      String   @map("persona_id")
  voirDireResponseId String? @map("voir_dire_response_id")
  probabilityDelta Decimal @map("probability_delta") @db.Decimal(5, 4) // Change in probability
  previousProbability Decimal? @map("previous_probability") @db.Decimal(3, 2)
  newProbability Decimal  @map("new_probability") @db.Decimal(3, 2)
  updatedAt      DateTime @default(now()) @map("updated_at")
  
  // Relations
  juror           Juror            @relation(fields: [jurorId], references: [id], onDelete: Cascade)
  persona         Persona         @relation(fields: [personaId], references: [id])
  voirDireResponse VoirDireResponse? @relation(fields: [voirDireResponseId], references: [id])
  
  @@index([jurorId])
  @@index([personaId])
  @@index([updatedAt])
  @@map("persona_match_updates")
}

model SuggestedQuestion {
  id                      String   @id @default(uuid())
  caseId                  String   @map("case_id")
  targetType              String   @map("target_type") // SPECIFIC_JUROR | PANEL_WIDE
  targetJurorId           String?  @map("target_juror_id")
  questionText            String   @map("question_text") @db.Text
  questionCategory        String   @map("question_category")
  discriminatesBetween    Json     @map("discriminates_between") // Array of {persona_a_id, persona_b_id, expected_information_gain}
  responseInterpretations Json     @map("response_interpretations")
  followUpQuestions       Json?    @map("follow_up_questions")
  priorityScore           Decimal  @map("priority_score") @db.Decimal(5, 4)
  priorityRationale      String?  @map("priority_rationale") @db.Text
  timesAsked              Int      @default(0) @map("times_asked")
  averageInformationGain  Decimal? @map("average_information_gain") @db.Decimal(5, 4)
  createdAt               DateTime @default(now()) @map("created_at")
  
  // Relations
  case Case @relation(fields: [caseId], references: [id], onDelete: Cascade)
  
  @@index([caseId])
  @@index([targetJurorId])
  @@index([priorityScore])
  @@map("suggested_questions")
}
```

**Juror Model Updates:**

```prisma
model Juror {
  // ... existing fields ...
  
  // Add relations
  extractedSignals    JurorSignal[]
  voirDireResponses   VoirDireResponse[]
  personaMatchUpdates PersonaMatchUpdate[]
}
```

#### 3.1.2 Signal Extraction Service

**File:** `services/api-gateway/src/services/signal-extractor.ts`

**Responsibilities:**
- Extract signals from questionnaire data (field mapping)
- Extract signals from research artifacts (NLP classification)
- Extract signals from voir dire responses (pattern matching + NLP)
- Store signals in `JurorSignal` table with source references

**Key Methods:**
```typescript
class SignalExtractorService {
  async extractFromQuestionnaire(jurorId: string, questionnaireData: Json): Promise<JurorSignal[]>
  async extractFromResearchArtifact(jurorId: string, artifactId: string): Promise<JurorSignal[]>
  async extractFromVoirDireResponse(jurorId: string, responseId: string, responseText: string): Promise<JurorSignal[]>
  private matchFieldToSignal(fieldName: string, fieldValue: any): Signal | null
  private runNLPClassification(text: string): Promise<Signal[]>
}
```

#### 3.1.3 Signal Library Seed Data

**File:** `packages/database/prisma/seed-signals.ts`

**Initial Signals:**
- Demographic: Occupation categories, Education levels, Age ranges, Marital status
- Behavioral: Prior jury service, Litigation history, Voting patterns
- Attitudinal: Authority orientation, Corporate trust, Risk tolerance (from research)
- Linguistic: Hedging patterns, Certainty markers (from voir dire)
- Social: Organizational memberships, Donation patterns

**Deliverables:**
- ✅ Database migrations
- ✅ Signal extraction service
- ✅ Signal library seed data
- ✅ API endpoints for signal extraction

---

### Phase 2: Matching Algorithms (Weeks 3-5) ⚠️ **PARTIALLY COMPLETE**

**Goal:** Implement the three matching algorithms and ensemble combination.

**Status:**
- ✅ Embedding Similarity Algorithm - **COMPLETE** (Voyage AI voyage-law-2)
- ✅ Ensemble Combination - **COMPLETE** (Updated weights: signal=0.15, embedding=0.55, bayesian=0.30)
- ⚠️ Signal-Based Scoring - **IN PROGRESS** (basic implementation exists, needs enhancement)
- ⚠️ Bayesian Updating - **IN PROGRESS** (basic implementation exists, needs enhancement)

#### 3.2.1 Signal-Based Scoring Algorithm

**File:** `services/api-gateway/src/services/matching/signal-based-scorer.ts`

**Algorithm:**
```typescript
class SignalBasedScorer {
  async scoreJuror(jurorId: string, personaId: string): Promise<{
    score: number; // 0-1
    confidence: number; // 0-1
    supportingSignals: string[];
    contradictingSignals: string[];
  }> {
    // 1. Get all signals for juror
    // 2. Get persona's positive/negative signal weights
    // 3. Calculate weighted sum
    // 4. Normalize to 0-1
    // 5. Calculate confidence based on signal coverage
  }
}
```

#### 3.2.2 Embedding Similarity Algorithm ✅ **IMPLEMENTED**

**File:** `services/api-gateway/src/services/matching/embedding-scorer.ts`

**Status:** ✅ Complete - Using Voyage AI voyage-law-2 model

**Implementation Details:**
- **Embedding Model:** Voyage AI `voyage-law-2` (1024 dimensions, optimized for legal/legal-adjacent content)
- **Pre-computation:** Persona embeddings preloaded at server startup via `preloadPersonaEmbeddings()`
- **Caching:** In-memory cache for persona embeddings, narrative cache with 1-hour TTL
- **Juror Narratives:** Generated on-demand using `JurorNarrativeGenerator`
- **Similarity:** Cosine similarity with normalization to 0-1 range
- **Fallback:** Hash-based fallback embedding if Voyage AI unavailable

**Dependencies:**
- `voyageai` npm package
- `VOYAGE_API_KEY` environment variable
- Voyage AI API access (dash.voyageai.com)

**Key Methods:**
```typescript
class EmbeddingScorer {
  async scoreJuror(jurorId: string, personaId: string): Promise<EmbeddingScore>
  async scoreJurorAgainstPersonas(jurorId: string, personaIds: string[]): Promise<Map<string, EmbeddingScore>>
  async preloadPersonaEmbeddings(): Promise<void> // Called at startup
  private async generateEmbedding(text: string): Promise<number[]> // Voyage AI API call
  private cosineSimilarity(vecA: number[], vecB: number[]): number
}
```

**Startup Integration:**
- `preloadPersonaEmbeddings()` called automatically in `services/api-gateway/src/index.ts`
- Runs in background (non-blocking) after server starts
- Processes personas in batches of 10 to avoid rate limits
- Logs progress and errors without blocking server startup

#### 3.2.3 Bayesian Updating Algorithm

**File:** `services/api-gateway/src/services/matching/bayesian-updater.ts`

**Algorithm:**
```typescript
class BayesianUpdater {
  async updateProbabilities(
    jurorId: string,
    newSignals: JurorSignal[]
  ): Promise<{
    posteriors: Record<string, number>; // personaId -> probability
    confidence: number;
  }> {
    // 1. Get prior probabilities (from previous match or uniform)
    // 2. For each new signal, calculate likelihood P(S|P)
    // 3. Update posterior: P(P|S) = P(S|P) * P(P) / P(S)
    // 4. Normalize posteriors
    // 5. Calculate confidence (entropy-based)
  }
  
  private getLikelihood(signal: Signal, personaId: string): number {
    // Look up signal-persona weight from SignalPersonaWeight table
  }
}
```

#### 3.2.4 Ensemble Combination ✅ **IMPLEMENTED**

**File:** `services/api-gateway/src/services/matching/ensemble-matcher.ts`

**Status:** ✅ Complete - Updated weights implemented

**Base Weights (Updated):**
- **Signal-based:** 0.15 (15%)
- **Embedding:** 0.55 (55%) - **Primary method**
- **Bayesian:** 0.30 (30%)

**Rationale:** Embedding similarity is now the primary matching method due to:
- Voyage AI voyage-law-2 model optimized for legal content
- Better semantic understanding of juror narratives vs persona descriptions
- Pre-computed persona embeddings for fast matching

**Dynamic Weight Adjustment:**
- Rich narrative data (research + voir dire) → +0.05 embedding, -0.03 signal, -0.02 bayesian
- Sparse data (<3 signals, no narrative) → +0.10 bayesian, -0.10 embedding
- Many signals (>10) → +0.05 signal, -0.05 embedding
- Weights normalized to sum to 1.0

**Algorithm:**
```typescript
class EnsembleMatcher {
  async matchJuror(jurorId: string, personaIds: string[]): Promise<EnsembleMatch[]> {
    // 1. Run all three algorithms in parallel
    // 2. Determine weights based on data availability
    // 3. Weighted average: signal*0.15 + embedding*0.55 + bayesian*0.30
    // 4. Generate rationale and counterfactual for top 5 matches
    // 5. Return sorted by probability
  }
  
  private async determineWeights(jurorId: string): Promise<EnsembleWeights> {
    // Base: {signalBased: 0.15, embedding: 0.55, bayesian: 0.30}
    // Adjust based on signal count, research artifacts, voir dire responses
    // Normalize to ensure sum = 1.0
  }
}
```

**Performance Optimizations:**
- Parallel execution of all three algorithms
- Rationale generation only for top 5 matches (others generated on-demand)
- Cached persona embeddings (preloaded at startup)
- Cached juror narratives (1-hour TTL)

**Deliverables:**
- ✅ Signal-based scorer (basic implementation)
- ✅ Embedding scorer (Voyage AI voyage-law-2) - **COMPLETE**
- ✅ Bayesian updater (basic implementation)
- ✅ Ensemble matcher (updated weights) - **COMPLETE**
- ✅ Rationale generation (LLM-based with signal citations)
- ✅ Counterfactual generation algorithm (LLM-based)
- ✅ Persona embedding preload at startup - **COMPLETE**

---

### Phase 3: Discriminative Question Generation (Week 6)

**Goal:** Generate questions that maximize information gain for ambiguous matches.

#### 3.3.1 Question Generation Service Enhancement

**File:** `services/api-gateway/src/services/discriminative-question-generator.ts`

**Algorithm:**
```typescript
class DiscriminativeQuestionGenerator {
  async generateQuestions(jurorId: string): Promise<SuggestedQuestion[]> {
    // 1. Get current persona matches
    // 2. Identify ambiguous pairs (within 20% confidence)
    // 3. Find discriminating signals (positive for P1, negative for P2)
    // 4. Generate questions to elicit those signals
    // 5. Calculate expected information gain
    // 6. Rank by priority
  }
  
  private calculateInformationGain(
    question: SuggestedQuestion,
    currentMatches: PersonaMatch[]
  ): number {
    // Expected entropy reduction
    // = H(current) - E[H(after response)]
  }
  
  async generatePanelWideQuestions(
    caseId: string,
    jurorIds: string[]
  ): Promise<SuggestedQuestion[]> {
    // Find questions that discriminate for multiple jurors
  }
}
```

**Deliverables:**
- ✅ Discriminative question generator
- ✅ Information gain calculator
- ✅ Panel-wide question optimization
- ✅ API endpoint: `POST /api/jurors/:id/suggested-questions`

---

### Phase 4: Voir Dire Integration (Weeks 7-8)

**Goal:** Real-time voir dire response capture and persona updates.

#### 3.4.1 Voir Dire Response API

**File:** `services/api-gateway/src/routes/voir-dire.ts`

**Endpoints:**
```typescript
// Record voir dire response
POST /api/jurors/:jurorId/voir-dire-responses
Body: {
  questionId?: string;
  questionText: string;
  responseSummary: string;
  entryMethod: 'TYPED' | 'VOICE_TO_TEXT' | 'QUICK_SELECT';
}

// Get updated persona matches after response
GET /api/jurors/:jurorId/persona-matches?includeUpdates=true

// Get suggested follow-up questions
GET /api/jurors/:jurorId/suggested-follow-ups?responseId=xxx
```

#### 3.4.2 Real-Time Signal Extraction

**Enhancement to SignalExtractorService:**
- Extract signals from voir dire response text immediately
- Update persona probabilities using Bayesian updater
- Emit events for real-time UI updates

#### 3.4.3 Voir Dire Mode UI

**File:** `apps/web/components/voir-dire/voir-dire-mode.tsx`

**Features:**
- Seat chart layout matching courtroom
- Quick response entry (tap juror, select question, enter response)
- Voice-to-text support
- Real-time persona probability updates
- Visual alerts for significant shifts (>10%)
- Suggested follow-up questions

**Deliverables:**
- ✅ Voir dire response API
- ✅ Real-time signal extraction integration
- ✅ Voir dire mode UI component
- ✅ WebSocket events for live updates (optional)

---

### Phase 5: Strike Decision & Jury Composition (Week 9)

**Goal:** Final persona assignment and strike recommendation interface.

#### 3.5.1 Strike Recommendation Service

**File:** `services/api-gateway/src/services/strike-recommender.ts`

**Features:**
- Strike priority ranking based on persona + case context
- Jury composition modeling (simulate strike scenarios)
- Dynamic warnings (e.g., "4 Skeptical Professionals may lead to hung jury")

#### 3.5.2 Strike Decision UI

**File:** `apps/web/components/jury-selection/strike-worksheet.tsx`

**Features:**
- All jurors ranked by strike priority
- Strike/Keep/Undecided toggles
- Jury composition simulator
- Persona mix visualization
- Warnings for problematic combinations

**Deliverables:**
- ✅ Strike recommender service
- ✅ Strike worksheet UI
- ✅ Jury composition simulator
- ✅ API endpoint: `POST /api/cases/:id/simulate-composition`

---

## 4. Technical Considerations

### 4.1 Performance Requirements

| Operation | Target Latency | Implementation Strategy |
|-----------|---------------|------------------------|
| Signal extraction (questionnaire) | <30s per juror | Batch processing, parallel extraction |
| Signal extraction (voir dire) | <5s | Async processing, queue for NLP |
| Persona matching | <10s | Cache persona embeddings, parallel algorithm execution |
| Question generation | <15s | Pre-compute discriminating signals, cache results |
| Embedding generation | <2s | Pre-compute persona embeddings, cache juror narratives |

### 4.2 Caching Strategy ✅ **IMPLEMENTED**

- **Persona Embeddings:** ✅ Pre-computed at server startup, cached in-memory (Map<string, number[]>)
  - Preload via `preloadPersonaEmbeddings()` called in `index.ts`
  - Batch processing (10 personas at a time) to avoid rate limits
  - Persists for server lifetime (reloads on restart)
- **Juror Narratives:** ✅ Cache for 1 hour, invalidate on new signals
- **Persona Matches:** Cache for 5 minutes, invalidate on new voir dire response
- **Discriminating Signals:** Pre-compute for common persona pairs (planned)

### 4.3 AI Service Integration ✅ **UPDATED**

- **Signal Extraction (NLP):** Use Claude 4.5 for attitudinal signal classification
- **Embedding Generation:** ✅ **Voyage AI voyage-law-2** (1024 dimensions, legal-optimized)
  - API: `voyageai` npm package
  - Model: `voyage-law-2`
  - Context length: 16,000 tokens
  - Embedding dimension: 1024
  - Requires `VOYAGE_API_KEY` environment variable
- **Rationale Generation:** Enhance existing Claude prompt with signal citations
- **Counterfactual Generation:** Use Claude to identify decision boundaries

### 4.4 Database Optimization

- **Indexes:** Add indexes on `JurorSignal(jurorId, signalId)`, `SignalPersonaWeight(personaId, signalId)`
- **Partitioning:** Consider partitioning `VoirDireResponse` by date for large panels
- **Archiving:** Archive old voir dire responses after trial completion

---

## 5. Testing Strategy

### 5.1 Unit Tests

- Signal extraction from each source type
- Each matching algorithm independently
- Ensemble combination logic
- Information gain calculations

### 5.2 Integration Tests

- End-to-end matching workflow (questionnaire → signals → matching → questions)
- Voir dire response → signal extraction → persona update
- Discriminative question generation for ambiguous matches

### 5.3 Performance Tests

- Batch processing 50 jurors in <10 minutes
- Real-time voir dire response processing <5s
- Question generation <15s

### 5.4 User Acceptance Tests

- Attorney workflow: Import questionnaire → Review matches → Generate questions → Record responses → Final assignment
- Verify explainability: All matches have rationale and counterfactual
- Verify accuracy: Manual review of signal extraction and matching

---

## 6. Migration Path

### 6.1 Backward Compatibility

- Existing `JurorPersonaMapping` records remain valid
- Migrate existing mappings to new system gradually
- Support both old LLM-only matching and new multi-algorithm matching via feature flag

### 6.2 Data Migration

1. **Signal Library:** Seed initial signals from existing persona definitions
2. **Signal Extraction:** Backfill signals for existing jurors with research artifacts
3. **Persona Embeddings:** Pre-compute embeddings for all active personas
4. **Historical Data:** Keep existing mappings, start new matches with ensemble system

### 6.3 Feature Flags

- `juror_matching_v2`: Enable multi-algorithm matching
- `signal_extraction`: Enable structured signal system
- `discriminative_questions`: Enable discriminative question generation
- `voir_dire_tracking`: Enable voir dire response tracking

---

## 7. Success Metrics

### 7.1 Quantitative Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to initial persona assignment | <2 min per juror | System timing |
| Persona match confidence (pre-voir dire) | >50% average | Mean confidence |
| Persona match confidence (post-voir dire) | >75% average | Mean confidence after voir dire |
| Question information gain | >15% probability shift | Average absolute change |
| Signal extraction accuracy | >90% | Manual audit |

### 7.2 Qualitative Metrics

- Attorney satisfaction with match explanations
- Perceived usefulness of suggested questions
- Time saved vs. manual questionnaire review
- Confidence in jury selection decisions

---

## 8. Next Steps

1. **Review & Approve Plan** - Stakeholder review of implementation plan
2. **Phase 1 Kickoff** - Begin signal system and data model implementation
3. **Parallel Work** - UI team can start designing voir dire mode interface
4. **Weekly Check-ins** - Track progress against phases, adjust as needed

---

## Appendix A: File Structure

```
services/api-gateway/src/
├── services/
│   ├── signal-extractor.ts              # NEW: Signal extraction
│   ├── matching/
│   │   ├── signal-based-scorer.ts      # NEW: Signal-based algorithm
│   │   ├── embedding-scorer.ts         # NEW: Embedding similarity
│   │   ├── bayesian-updater.ts         # NEW: Bayesian updating
│   │   ├── ensemble-matcher.ts         # NEW: Ensemble combination
│   │   └── rationale-generator.ts      # NEW: Rationale & counterfactual
│   ├── discriminative-question-generator.ts  # NEW: Discriminative questions
│   ├── strike-recommender.ts           # NEW: Strike recommendations
│   └── persona-suggester.ts            # ENHANCE: Integrate ensemble matcher
├── routes/
│   ├── voir-dire.ts                    # NEW: Voir dire response API
│   ├── signals.ts                      # NEW: Signal management API
│   └── matching.ts                     # NEW: Matching API endpoints

apps/web/components/
├── voir-dire/
│   ├── voir-dire-mode.tsx              # NEW: Trial mode interface
│   └── response-entry.tsx             # NEW: Response entry component
├── jury-selection/
│   ├── strike-worksheet.tsx           # NEW: Strike decision interface
│   └── composition-simulator.tsx      # NEW: Jury composition tool
└── matching/
    ├── persona-match-dashboard.tsx    # NEW: Match dashboard
    └── signal-inventory.tsx           # NEW: Signal display component

packages/database/prisma/
├── migrations/
│   └── add_matching_system/           # NEW: Signal & matching models
└── seed-signals.ts                     # NEW: Signal library seed data
```

---

## Appendix B: API Endpoints Summary

### Signal Management
- `POST /api/signals` - Create signal definition
- `GET /api/signals` - List all signals
- `POST /api/jurors/:id/extract-signals` - Extract signals for juror

### Matching
- `POST /api/jurors/:id/match-personas` - Run matching algorithms
- `GET /api/jurors/:id/persona-matches` - Get current matches with updates
- `POST /api/jurors/:id/confirm-persona` - Confirm/override persona assignment

### Question Generation
- `GET /api/jurors/:id/suggested-questions` - Get discriminative questions
- `GET /api/cases/:id/panel-questions` - Get panel-wide questions
- `POST /api/questions/:id/record-usage` - Track question usage

### Voir Dire
- `POST /api/jurors/:id/voir-dire-responses` - Record response
- `GET /api/jurors/:id/voir-dire-responses` - List responses
- `GET /api/jurors/:id/suggested-follow-ups` - Get follow-up suggestions

### Strike Decisions
- `GET /api/cases/:id/strike-recommendations` - Get strike priority ranking
- `POST /api/cases/:id/simulate-composition` - Simulate jury composition
- `POST /api/jurors/:id/strike-decision` - Record strike/keep decision

---

**Document Status:** Ready for Engineering Review  
**Next Review Date:** After Phase 1 completion
