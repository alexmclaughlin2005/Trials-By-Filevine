# Product Requirements Document

# Juror-Persona Matching System

**TrialForge AI Feature Specification**

| **Version:** | 1.0 |
| --- | --- |
| **Status:** | Ready for Engineering Design |
| **Last Updated:** | January 30, 2026 |
| **Parent Document:** | TrialForge AI PRD v1.0 |

---

## 1. Executive Summary

The Juror-Persona Matching System is a core feature of TrialForge AI that enables attorneys to map individual jurors from the jury panel to pre-defined psychological personas. This mapping informs jury selection strategy (who to strike, who to keep) and trial presentation strategy (how to persuade the seated jury).

The system operates across three phases of a trial:
1. **Pre-Voir Dire:** Initial persona probability assignment based on questionnaire data and public research
2. **During Voir Dire:** Real-time refinement of persona matches based on Q&A responses
3. **Post-Selection:** Final persona assignments for seated jurors to inform argument strategy

The matching system combines multiple algorithmic approaches: signal-based scoring for explainability, Bayesian updating for confidence tracking, embedding similarity for nuanced matching, and discriminative question generation to maximize information gain from limited voir dire time.

---

## 2. Problem Statement & Goals

### 2.1 Problem Statement

Jury selection requires attorneys to make high-stakes decisions about which jurors to strike or keep, often with limited information and under severe time pressure. Traditional approaches rely on attorney intuition, basic demographic assumptions, and manual review of juror questionnaires.

Current challenges:
- Questionnaire data is voluminous but unstructured
- Attorneys lack systematic methods to connect juror characteristics to predictable behaviors
- Voir dire time is limited; attorneys need to know which questions will be most revealing
- No feedback loop connects jury selection decisions to outcomes

### 2.2 Goals

| Goal | Success Metric |
| --- | --- |
| Reduce time to review and categorize juror questionnaires | 80% reduction in manual review time |
| Increase persona assignment confidence before voir dire begins | >60% of jurors have a primary persona match with >50% confidence from questionnaire alone |
| Maximize information gain from voir dire questions | System-suggested questions change persona probability by >15% on average |
| Provide explainable, defensible recommendations | 100% of persona matches include source citations and rationale |
| Enable real-time updates during voir dire | Persona probabilities update within 5 seconds of response entry |

### 2.3 Non-Goals (Out of Scope)

- Automated strike/keep decisions (human-in-the-loop required)
- Real-time speech-to-text during voir dire (Phase 2)
- Outcome tracking and model improvement based on verdict data (Future)
- Integration with external jury consulting services

---

## 3. Core Concepts & Definitions

### 3.1 Personas

A **Persona** is a reusable archetype representing a cluster of psychological traits, attitudes, values, and behavioral tendencies relevant to jury decision-making. Personas are defined independently of any specific case and stored in a shared library.

**Persona Attributes:**
- Name and description (human-readable)
- Core psychological traits (e.g., authority deference, risk tolerance, empathy orientation)
- Attitude dimensions relevant to litigation (e.g., corporate trust, plaintiff sympathy, damages sensitivity)
- Demographic correlations (probabilistic, not deterministic)
- Persuasion levers (what arguments resonate)
- Risk factors (what arguments backfire)
- Source type: Pre-seeded, AI-generated, or User-created

### 3.2 Signals

A **Signal** is an observable indicator extracted from juror data that correlates with persona membership. Signals are the atomic units of evidence used in persona matching.

**Signal Categories:**
- **Demographic Signals:** Age, occupation, education, marital status, geography
- **Behavioral Signals:** Prior jury service, litigation history, voting patterns
- **Attitudinal Signals:** Expressed opinions in questionnaire responses or voir dire
- **Linguistic Signals:** Word choice, hedging patterns, certainty markers
- **Social Signals:** Organizational memberships, social media activity, donation history

### 3.3 Confidence Score

A **Confidence Score** represents the system's certainty that a juror matches a given persona. Expressed as a percentage (0-100%), it incorporates:
- Number of signals observed
- Strength (weight) of each signal
- Consistency vs. contradiction among signals
- Information completeness (what data is missing)

### 3.4 Counterfactual Reasoning

For each persona match, the system provides **Counterfactual Reasoning**: what new information would most change the confidence score. This guides attorneys toward the most valuable voir dire questions.

---

## 4. User Workflows

### 4.1 Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JUROR-PERSONA MATCHING WORKFLOW                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: PRE-VOIR DIRE                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ Import Jury │───▶│ Upload      │───▶│ AI Research │───▶│ Initial     │  │
│  │ Panel List  │    │ Question-   │    │ Enrichment  │    │ Persona     │  │
│  │             │    │ naires      │    │             │    │ Matching    │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                             │
│  PHASE 2: VOIR DIRE PREPARATION                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │ Review      │───▶│ Generate    │───▶│ Prioritize  │                     │
│  │ Initial     │    │ Discrimin-  │    │ Jurors &    │                     │
│  │ Matches     │    │ ative Q's   │    │ Questions   │                     │
│  └─────────────┘    └─────────────┘    └─────────────┘                     │
│                                                                             │
│  PHASE 3: LIVE VOIR DIRE                                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ Record      │───▶│ Extract     │───▶│ Update      │───▶│ Surface     │  │
│  │ Responses   │    │ Signals     │    │ Persona     │    │ Recommenda- │  │
│  │             │    │             │    │ Confidence  │    │ tions       │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                             │
│  PHASE 4: JURY SELECTION                                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │ Final       │───▶│ Strike/Keep │───▶│ Seated Jury │                     │
│  │ Persona     │    │ Recommenda- │    │ Composition │                     │
│  │ Assignments │    │ tions       │    │ Analysis    │                     │
│  └─────────────┘    └─────────────┘    └─────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Workflow 1: Questionnaire Import & Initial Matching

**Trigger:** Attorney uploads juror questionnaires (PDF, scanned images, or structured data export from court system)

**Steps:**

1. **Document Ingestion**
   - System accepts bulk upload of questionnaire files
   - OCR processing for scanned/image-based documents
   - Automatic mapping of questionnaire fields to Juror Object schema

2. **Field Extraction**
   - Parse standard fields: name, age, occupation, employer, education, marital status, children, address
   - Parse litigation history: prior jury service, lawsuits as party or witness
   - Parse open-ended responses: preserve full text with field labels

3. **Signal Extraction**
   - Convert structured fields to signals (e.g., "Occupation: Nurse" → Signal: Healthcare_Professional)
   - Run NLP on open-ended responses to extract attitudinal signals
   - Flag ambiguous or missing data

4. **Research Enrichment** (if enabled)
   - Cross-reference juror identity with public records search
   - Append Research Artifacts to Juror Object
   - User confirms/rejects identity matches

5. **Initial Persona Matching**
   - Run matching algorithm against full Persona Library
   - Generate probability distribution across all personas
   - Identify top 3 persona candidates with confidence scores
   - Generate rationale and counterfactual for each match

**Output:** Each juror has:
- Structured profile from questionnaire
- Signal inventory
- Persona probability distribution
- Top 3 persona matches with confidence, rationale, and counterfactual

### 4.3 Workflow 2: Discriminative Question Generation

**Trigger:** Attorney requests voir dire question suggestions for a specific juror or the entire panel

**Steps:**

1. **Identify Ambiguous Matches**
   - Find jurors where top 2+ personas are within 20% confidence of each other
   - These are high-value targets for discriminative questioning

2. **Generate Discriminative Questions**
   - For each ambiguous juror, identify which signals would most change the probability distribution
   - Generate natural-language questions designed to elicit those signals
   - Provide "what to listen for" guidance for each possible answer type

3. **Prioritize Questions**
   - Rank questions by information gain (expected reduction in entropy)
   - Consider court/jurisdiction constraints on question types
   - Group questions by theme for efficient panel-wide questioning

**Output:**
- Prioritized question list per juror
- Panel-wide question suggestions (questions that discriminate for multiple jurors)
- For each question: expected information gain, what-to-listen-for, follow-up branches

### 4.4 Workflow 3: Live Voir Dire Response Capture

**Trigger:** Attorney records juror response during voir dire

**Steps:**

1. **Response Entry**
   - Quick-entry interface: tap juror, tap question (or free-form), enter response summary
   - Support for voice-to-text entry (device microphone, not courtroom recording)
   - Timestamp and link to juror and question

2. **Signal Extraction**
   - Real-time NLP on response text
   - Extract attitudinal, linguistic, and behavioral signals
   - Compare to expected signals for pending questions

3. **Persona Update**
   - Recalculate persona probability distribution
   - Highlight significant shifts (>10% change in any persona)
   - Update counterfactuals based on new information

4. **Alert Generation**
   - Surface "red flag" signals that indicate strong persona match
   - Highlight contradictions with prior data
   - Suggest follow-up questions if response was ambiguous

**Output:**
- Updated persona probability distribution
- Change indicators (↑↓ arrows with magnitude)
- New counterfactuals
- Optional follow-up question suggestions

### 4.5 Workflow 4: Final Persona Assignment & Strike Recommendations

**Trigger:** Voir dire concludes; attorney reviews panel before exercising strikes

**Steps:**

1. **Final Persona Assignment**
   - System proposes primary persona for each juror (highest confidence)
   - Attorney can confirm, override, or mark as uncertain
   - System records human decision with rationale

2. **Strike/Keep Analysis**
   - For each juror, show: persona, confidence, key supporting signals, key risk factors
   - Cross-reference persona with case-specific desirability (from Case setup)
   - Generate strike priority ranking

3. **Jury Composition Modeling**
   - Simulate different strike scenarios
   - Show projected jury composition by persona mix
   - Highlight potential dynamics (e.g., "3 Authority Deferrers may create strong foreperson effect")

**Output:**
- Confirmed persona assignments for all jurors
- Strike priority ranking with rationale
- Jury composition projections

---

## 5. Data Models

### 5.1 Persona Object (Extended)

```
Persona {
  // Identity
  id: UUID
  name: String
  description: String (rich text)
  source_type: Enum [PRE_SEEDED, AI_GENERATED, USER_CREATED]
  
  // Psychological Profile
  traits: [
    {
      trait_name: String
      trait_dimension: String (e.g., "Authority Orientation")
      pole: Enum [HIGH, LOW]
      weight: Float (0-1)
    }
  ]
  
  // Signal Definitions
  positive_signals: [
    {
      signal_id: String
      signal_category: Enum [DEMOGRAPHIC, BEHAVIORAL, ATTITUDINAL, LINGUISTIC, SOCIAL]
      description: String
      detection_patterns: [String] (regex or keyword patterns)
      weight: Float (0-1, contribution to persona match)
      confidence_modifier: Float (how much this signal alone affects confidence)
    }
  ]
  negative_signals: [...] (same structure, decrease match probability)
  neutral_signals: [...] (require follow-up to interpret)
  
  // Persuasion Guide
  persuasion_levers: [
    {
      lever_name: String
      description: String
      example_arguments: [String]
    }
  ]
  risk_factors: [
    {
      risk_name: String
      description: String
      warning_signs: [String]
    }
  ]
  
  // Case-Type Affinities (optional, for case-specific recommendations)
  case_type_affinities: [
    {
      case_type: String (e.g., "Medical Malpractice - Plaintiff")
      affinity: Enum [FAVORABLE, NEUTRAL, UNFAVORABLE]
      rationale: String
    }
  ]
  
  // Metadata
  version: Integer
  created_at: Timestamp
  updated_at: Timestamp
  created_by: User ID
  notes: String
}
```

### 5.2 Signal Object

```
Signal {
  id: String (unique identifier, e.g., "OCCUPATION_HEALTHCARE")
  name: String
  category: Enum [DEMOGRAPHIC, BEHAVIORAL, ATTITUDINAL, LINGUISTIC, SOCIAL]
  
  // Detection
  extraction_method: Enum [FIELD_MAPPING, PATTERN_MATCH, NLP_CLASSIFICATION, MANUAL]
  source_field: String (if FIELD_MAPPING, which questionnaire field)
  patterns: [String] (if PATTERN_MATCH, regex patterns)
  nlp_classifier_id: String (if NLP_CLASSIFICATION, reference to trained model)
  
  // Value
  value_type: Enum [BOOLEAN, CATEGORICAL, NUMERIC, TEXT]
  possible_values: [String] (if CATEGORICAL)
  
  // Persona Associations
  persona_weights: [
    {
      persona_id: UUID
      direction: Enum [POSITIVE, NEGATIVE]
      weight: Float (0-1)
    }
  ]
}
```

### 5.3 Juror Object (Extended for Matching)

```
Juror {
  // ... existing fields from parent PRD ...
  
  // Signal Inventory
  extracted_signals: [
    {
      signal_id: String
      value: Any (based on value_type)
      source: Enum [QUESTIONNAIRE, RESEARCH, VOIR_DIRE, MANUAL]
      source_reference: String (field name, artifact ID, or response ID)
      extracted_at: Timestamp
      confidence: Float (0-1, extraction confidence)
    }
  ]
  
  // Persona Matching
  persona_matches: [
    {
      persona_id: UUID
      probability: Float (0-1)
      confidence: Float (0-1, how certain we are about the probability)
      supporting_signals: [String] (signal IDs)
      contradicting_signals: [String] (signal IDs)
      rationale: String (generated explanation)
      counterfactual: String (what would change this match)
      last_updated: Timestamp
      update_source: Enum [INITIAL, QUESTIONNAIRE, RESEARCH, VOIR_DIRE, MANUAL]
    }
  ]
  
  primary_persona: {
    persona_id: UUID
    assignment_type: Enum [AI_SUGGESTED, USER_CONFIRMED, USER_OVERRIDE]
    assigned_at: Timestamp
    assigned_by: User ID (if manual)
    override_rationale: String (if USER_OVERRIDE)
  }
  
  // Voir Dire Tracking
  voir_dire_responses: [
    {
      id: UUID
      question_id: UUID (optional, if from suggested question)
      question_text: String
      response_summary: String
      response_timestamp: Timestamp
      extracted_signals: [String] (signal IDs extracted from this response)
      persona_impact: [
        {
          persona_id: UUID
          probability_delta: Float
        }
      ]
      entered_by: User ID
      entry_method: Enum [TYPED, VOICE_TO_TEXT, QUICK_SELECT]
    }
  ]
}
```

### 5.4 Suggested Question Object

```
SuggestedQuestion {
  id: UUID
  case_id: UUID
  
  // Targeting
  target_type: Enum [SPECIFIC_JUROR, PANEL_WIDE]
  target_juror_id: UUID (if SPECIFIC_JUROR)
  
  // Question Content
  question_text: String
  question_category: String (e.g., "Litigation Experience", "Authority Views")
  jurisdiction_compliant: Boolean
  
  // Discrimination Power
  discriminates_between: [
    {
      persona_a_id: UUID
      persona_b_id: UUID
      expected_information_gain: Float
    }
  ]
  
  // Response Guidance
  response_interpretations: [
    {
      response_pattern: String (what to listen for)
      signals_to_extract: [String]
      persona_implications: [
        {
          persona_id: UUID
          probability_delta: Float
          direction: Enum [INCREASE, DECREASE]
        }
      ]
    }
  ]
  
  follow_up_questions: [UUID] (IDs of follow-up questions if response is ambiguous)
  
  // Prioritization
  priority_score: Float
  priority_rationale: String
  
  // Usage Tracking
  times_asked: Integer
  average_information_gain_actual: Float (computed from actual usage)
}
```

---

## 6. Matching Algorithm Architecture

### 6.1 Algorithm Overview

The matching system uses a hybrid approach combining four complementary methods:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MATCHING ALGORITHM ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        INPUT: JUROR DATA                             │   │
│  │  Questionnaire + Research Artifacts + Voir Dire Responses            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SIGNAL EXTRACTION LAYER                          │   │
│  │  Field Mapping │ Pattern Matching │ NLP Classification │ Manual      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                    ┌───────────────┼───────────────┐                       │
│                    ▼               ▼               ▼                       │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐        │
│  │  SIGNAL-BASED     │ │  EMBEDDING        │ │  BAYESIAN         │        │
│  │  SCORING          │ │  SIMILARITY       │ │  UPDATING         │        │
│  │                   │ │                   │ │                   │        │
│  │  Weighted sum of  │ │  Semantic match   │ │  Prior + evidence │        │
│  │  signal matches   │ │  between juror    │ │  = posterior      │        │
│  │  per persona      │ │  narrative and    │ │  probability      │        │
│  │                   │ │  persona profile  │ │                   │        │
│  │  Output: Scores   │ │  Output: Scores   │ │  Output: Probs    │        │
│  └───────────────────┘ └───────────────────┘ └───────────────────┘        │
│           │                     │                     │                    │
│           └─────────────────────┼─────────────────────┘                    │
│                                 ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      ENSEMBLE COMBINATION                            │   │
│  │  Weighted average with method-specific confidence adjustments        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                 │                                          │
│                                 ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      OUTPUT: PERSONA MATCHES                         │   │
│  │  Per persona: probability, confidence, rationale, counterfactual     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Method 1: Signal-Based Scoring

**Purpose:** Explainable, auditable matching based on discrete evidence

**Algorithm:**

```
For each Persona P:
  score = 0
  max_possible_score = 0
  
  For each Signal S in juror's extracted_signals:
    If S is in P.positive_signals:
      score += S.weight * P.positive_signals[S].weight
    If S is in P.negative_signals:
      score -= S.weight * P.negative_signals[S].weight
    
  For each Signal S in P.positive_signals:
    max_possible_score += S.weight
    
  normalized_score = score / max_possible_score (clamped to 0-1)
  
  Return normalized_score
```

**Confidence Calculation:**
- Base confidence = (signals_observed / signals_expected) for this persona
- Reduce confidence if contradicting signals present
- Reduce confidence if key discriminating signals are missing

### 6.3 Method 2: Embedding Similarity

**Purpose:** Capture nuanced, holistic similarity that discrete signals might miss

**Algorithm:**

```
1. Generate Juror Narrative:
   - Synthesize all known information into a coherent text description
   - Include: demographics, questionnaire responses, research findings, voir dire responses
   - Use LLM to generate natural language summary

2. Generate Persona Embedding:
   - Each persona has a pre-computed embedding of its full description
   - Embedding includes traits, typical behaviors, attitudes, etc.

3. Compute Similarity:
   - Generate embedding of juror narrative
   - Compute cosine similarity with each persona embedding
   - Normalize across all personas to get probability distribution

4. Return similarity scores
```

**Confidence Calculation:**
- Higher confidence if juror narrative is longer/richer
- Lower confidence if narrative contains contradictions or hedging
- Lower confidence if similarity scores are clustered (no clear winner)

### 6.4 Method 3: Bayesian Updating

**Purpose:** Rigorous probabilistic reasoning that updates with each new piece of evidence

**Algorithm:**

```
Initialize:
  For each Persona P:
    prior[P] = base_rate[P]  # Could be uniform or informed by demographics

For each new Signal S observed:
  For each Persona P:
    # P(P|S) = P(S|P) * P(P) / P(S)
    likelihood = P(S | P)  # From signal-persona weight tables
    posterior[P] = likelihood * prior[P]
  
  Normalize posteriors to sum to 1
  prior = posterior  # For next iteration

Return posterior distribution
```

**Confidence Calculation:**
- Confidence increases with more signals observed
- Confidence is entropy-based: lower entropy = higher confidence
- Flag if updating causes dramatic swings (might indicate data quality issues)

### 6.5 Ensemble Combination

**Purpose:** Combine methods to leverage strengths of each

**Algorithm:**

```
weights = {
  signal_based: 0.35,
  embedding: 0.30,
  bayesian: 0.35
}

# Adjust weights based on data availability
If juror has rich narrative data:
  weights.embedding += 0.10
  weights.signal_based -= 0.05
  weights.bayesian -= 0.05

If juror has sparse data:
  weights.bayesian += 0.10  # Bayesian handles uncertainty better
  weights.embedding -= 0.10

For each Persona P:
  combined_score[P] = (
    weights.signal_based * signal_scores[P] +
    weights.embedding * embedding_scores[P] +
    weights.bayesian * bayesian_posteriors[P]
  )
  
  # Confidence is weighted average of method confidences
  combined_confidence[P] = (
    weights.signal_based * signal_confidence[P] +
    weights.embedding * embedding_confidence[P] +
    weights.bayesian * bayesian_confidence[P]
  )

Normalize combined_scores to sum to 1
Return {score, confidence} for each persona
```

### 6.6 Rationale Generation

For each persona match, generate human-readable explanation:

```
Inputs:
  - Persona P
  - Juror J
  - Match probability
  - Supporting signals
  - Contradicting signals

Prompt to LLM:
  "Generate a 2-3 sentence explanation for why Juror {J.name} matches 
   the {P.name} persona with {probability}% confidence.
   
   Supporting evidence: {supporting_signals}
   Contradicting evidence: {contradicting_signals}
   
   Be specific about which evidence is most compelling."

Output: Rationale string
```

### 6.7 Counterfactual Generation

For each persona match, identify what would most change the assessment:

```
Algorithm:
  1. Identify the "decision boundary" signals:
     - Signals not yet observed that have highest weight for this persona
     - Signals not yet observed that would most differentiate from #2 persona
  
  2. For each candidate signal:
     - Simulate: "If we observed this signal positively, how would probability change?"
     - Simulate: "If we observed this signal negatively, how would probability change?"
     - Compute expected information gain
  
  3. Rank by information gain
  
  4. Generate natural language:
     "The confidence in {persona} would increase significantly if {juror} 
      expressed {signal_description}. Conversely, it would decrease if 
      {opposite_signal_description}."

Output: Counterfactual string
```

---

## 7. Question Generation Engine

### 7.1 Purpose

Generate voir dire questions that maximize information gain about persona membership, enabling attorneys to efficiently discriminate between candidate personas.

### 7.2 Question Generation Algorithm

```
Input: 
  - Juror J with current persona_matches
  - Persona Library
  - Jurisdiction constraints (optional)

Algorithm:

1. Identify Ambiguous Matches:
   top_personas = J.persona_matches sorted by probability, top 3
   
   For each pair (P1, P2) in top_personas:
     If |P1.probability - P2.probability| < 0.20:
       Add (P1, P2) to ambiguous_pairs

2. Find Discriminating Signals:
   For each ambiguous_pair (P1, P2):
     discriminating_signals = signals where:
       - Signal is POSITIVE for P1 and NEGATIVE for P2, or vice versa
       - Signal has high weight in both personas
       - Signal has NOT been observed for this juror
     
     Sort by discrimination_power = |weight_P1 - weight_P2| * avg_weight

3. Generate Questions:
   For each top discriminating_signal:
     question = LLM_generate_question(
       signal_to_elicit = discriminating_signal,
       juror_context = J.profile,
       jurisdiction = case.jurisdiction,
       question_style = "open-ended" or "yes-no" based on signal type
     )
     
     response_interpretations = generate_response_guide(
       signal = discriminating_signal,
       personas = (P1, P2)
     )

4. Score and Rank Questions:
   For each question Q:
     Q.information_gain = expected_entropy_reduction(Q, J.persona_matches)
     Q.practicality = jurisdiction_compliance(Q) * naturalness_score(Q)
     Q.priority = Q.information_gain * Q.practicality

5. Return questions sorted by priority
```

### 7.3 Question Templates by Signal Category

**Attitudinal Signals (Authority Orientation):**
- "How do you feel about following rules that you personally disagree with?"
- "If a manager gave you instructions you thought were wrong, what would you do?"
- Listen for: Deference language vs. questioning language

**Attitudinal Signals (Corporate Trust):**
- "Have you or anyone close to you had an experience with a large company that affected your view of corporations?"
- "When you hear about a lawsuit against a company, what's your initial reaction?"
- Listen for: Sympathy indicators, blame attribution patterns

**Behavioral Signals (Litigation Experience):**
- "Have you ever been involved in a lawsuit, either as a party or a witness?"
- "How did that experience affect your views about the legal system?"
- Listen for: Positive vs. negative framing, system trust indicators

**Behavioral Signals (Decision-Making Style):**
- "When you make an important decision, do you tend to go with your gut or do you prefer to gather a lot of information first?"
- "How do you typically approach disagreements with others?"
- Listen for: Analytical vs. intuitive language, consensus vs. conviction orientation

### 7.4 Panel-Wide Question Optimization

For efficient use of limited voir dire time, identify questions that discriminate for multiple jurors:

```
Algorithm:

1. For each candidate question Q:
   Q.panel_value = 0
   
   For each Juror J in panel:
     If Q.discriminating_signal is relevant to J's ambiguous_pairs:
       Q.panel_value += Q.information_gain for J

2. Sort questions by panel_value

3. Return top questions with annotation:
   "This question is particularly valuable for Jurors #3, #7, and #12, 
    who all have ambiguity between {persona_A} and {persona_B}."
```

---

## 8. UI/UX Requirements

### 8.1 Questionnaire Import Interface

**Bulk Upload:**
- Drag-and-drop zone for multiple files
- Support: PDF, JPEG, PNG, TIFF (for scans), CSV/XLSX (for structured exports)
- Progress indicator for OCR processing
- Automatic juror record creation

**Field Mapping Review:**
- Show extracted fields per juror in editable form
- Highlight low-confidence extractions for manual review
- "Approve All" / "Review Flagged" workflow options

**Research Linking:**
- Show candidate research matches alongside questionnaire data
- Clear confirm/reject actions for identity resolution
- Audit trail of confirmation decisions

### 8.2 Persona Match Dashboard

**Panel Overview:**
- Grid or list view of all jurors
- For each juror: photo placeholder, name, top persona, confidence indicator
- Color coding by confidence level (green >70%, yellow 50-70%, red <50%)
- Sort/filter by persona, confidence, priority

**Juror Detail View:**
- Full questionnaire data
- Signal inventory with source citations
- Persona probability distribution (bar chart or ranked list)
- Top 3 matches with expandable rationale and counterfactual
- "Override Persona" action with rationale capture

**Comparison View:**
- Side-by-side comparison of 2-4 jurors
- Highlight signal differences
- Show where personas differ and agree

### 8.3 Voir Dire Mode Interface

**Trial Mode UX Principles Apply:**
- Large touch targets
- Minimal typing
- Quick response entry

**Juror Quick-Select:**
- Seat chart layout matching courtroom
- Tap juror to select for response entry

**Response Entry:**
- Pre-populated suggested questions (tap to select)
- Free-form text entry
- Voice-to-text button
- Quick signal tagging (checkbox list of likely signals)

**Real-Time Updates:**
- Persona probability changes animate on entry
- Significant shifts trigger visual alert
- "Suggested follow-up" appears if response is ambiguous

### 8.4 Strike Decision Interface

**Strike Worksheet:**
- All jurors ranked by strike priority
- For each: persona, confidence, key risk factors
- Strike/Keep/Undecided toggle
- Drag-to-reorder for priority adjustment

**Jury Composition Simulator:**
- Select hypothetical strikes
- See projected seated jury composition
- Persona mix visualization (pie chart or icon array)
- Dynamic warnings (e.g., "This combination creates 4 Skeptical Professionals - may lead to hung jury")

---

## 9. Technical Requirements

### 9.1 AI Services

| Service | Input | Output | Latency Target |
| --- | --- | --- | --- |
| Signal Extraction (Questionnaire) | Questionnaire text | Structured signals | <30s per juror |
| Signal Extraction (Voir Dire) | Response text | Signals + persona delta | <5s |
| Persona Matching | Signal inventory | Probability distribution | <10s |
| Rationale Generation | Match data | Natural language explanation | <5s |
| Question Generation | Juror + Personas | Prioritized question list | <15s |
| Embedding Generation | Text narrative | Vector embedding | <2s |

### 9.2 Model Requirements

**Signal Extraction:**
- NLP classification model for attitudinal signal extraction
- Fine-tuned on legal/jury research corpus
- Must handle informal language from voir dire

**Embedding Model:**
- Semantic embedding model for narrative similarity
- Pre-compute persona embeddings at persona creation time
- Real-time embedding for juror narratives

**LLM for Generation:**
- Rationale, counterfactual, and question generation
- Prompt engineering with legal context
- Output validation for factual accuracy (no hallucinated signals)

### 9.3 Performance Requirements

- **Questionnaire batch processing:** 50 jurors in <10 minutes
- **Voir dire response update:** <5 seconds end-to-end
- **Question generation:** <15 seconds for full recommendation set
- **Offline capability:** Cached juror data and pre-generated questions available without network

### 9.4 Data Storage

- All matching computations must be logged for audit trail
- Signal extractions must reference source document/field
- Persona match history must be versioned (point-in-time reconstruction)
- User overrides must capture rationale and timestamp

### 9.5 Integration Points

| Integration | Direction | Data |
| --- | --- | --- |
| Document Processing Service | Inbound | OCR'd questionnaire text |
| Research Engine | Inbound | Research artifacts for signal extraction |
| Persona Library | Bidirectional | Persona definitions, usage analytics |
| Focus Group Simulation | Outbound | Persona assignments for simulation |
| Trial Session | Bidirectional | Live updates during voir dire |

---

## 10. Edge Cases & Error Handling

### 10.1 Data Quality Issues

**Sparse Questionnaire Data:**
- If questionnaire has <5 extractable signals, flag for attorney review
- Increase reliance on research enrichment
- Lower overall confidence scores
- Prompt: "Limited questionnaire data - voir dire questions will be especially important for this juror"

**Conflicting Signals:**
- If positive and negative signals for same persona, highlight conflict
- Do not average away the conflict; surface it explicitly
- Prompt: "Conflicting indicators detected - {signal_A} suggests {persona_A}, but {signal_B} suggests otherwise"

**OCR Failures:**
- If OCR confidence <80% for a field, flag for manual review
- Do not extract signals from low-confidence text
- Provide manual entry fallback

### 10.2 Matching Edge Cases

**No Clear Persona Match:**
- If no persona exceeds 30% probability, flag as "Uncertain"
- Provide top 3 with explicit "low confidence" warning
- Prioritize this juror for voir dire questioning

**Uniform Distribution:**
- If all personas within 10% of each other, flag as "Insufficient Data"
- Explicitly state which signals are needed to discriminate
- Generate targeted question set

**Persona Library Gaps:**
- If juror signals don't match any persona well, suggest "Custom Persona" creation
- Provide signal profile as starting point for new persona definition

### 10.3 Voir Dire Edge Cases

**Rapid Response Entry:**
- Queue multiple responses for processing
- Show "processing" indicator without blocking entry
- Update display when processing completes

**Contradictory Voir Dire Response:**
- If response contradicts questionnaire, highlight conflict
- Do not automatically discard either data point
- Prompt attorney to assess credibility

**Non-Responsive Answer:**
- If juror's response doesn't address the question, mark as "Non-responsive"
- Do not extract signals
- Suggest follow-up question

### 10.4 System Failures

**AI Service Unavailable:**
- Cache last-known persona matches
- Allow manual signal tagging and persona assignment
- Queue for reprocessing when service recovers

**Network Failure During Voir Dire:**
- Local-first architecture: all data entry works offline
- Sync when connectivity returns
- No data loss from network interruption

---

## 11. Success Metrics

### 11.1 Quantitative Metrics

| Metric | Target | Measurement |
| --- | --- | --- |
| Time to initial persona assignment | <2 min per juror | System timing from upload to match display |
| Persona match confidence (pre-voir dire) | >50% average | Mean confidence of primary persona |
| Persona match confidence (post-voir dire) | >75% average | Mean confidence after voir dire |
| Question information gain | >15% probability shift | Average absolute change in top persona probability |
| Attorney override rate | <20% | % of AI suggestions overridden by attorney |
| Signal extraction accuracy | >90% | Manual audit of extracted vs. expected signals |

### 11.2 Qualitative Metrics

- Attorney satisfaction with match explanations (survey)
- Perceived usefulness of suggested questions (survey)
- Time saved vs. manual questionnaire review (interview)
- Confidence in jury selection decisions (interview)

### 11.3 Future Metrics (Requires Outcome Tracking)

- Correlation between predicted persona and actual juror behavior (post-trial)
- Verdict prediction accuracy based on jury composition
- Model improvement over time with feedback loop

---

## 12. Implementation Phases

### 12.1 Phase 1: Core Matching (MVP)

**Scope:**
- Questionnaire import and field extraction
- Signal-based scoring algorithm
- Basic persona probability display
- Manual persona override

**Deliverables:**
- Questionnaire upload interface
- Field extraction service (OCR + parsing)
- Signal extraction for demographic and basic attitudinal signals
- Persona match calculation (signal-based only)
- Juror detail view with match display

### 12.2 Phase 2: Advanced Matching

**Scope:**
- Embedding similarity method
- Bayesian updating method
- Ensemble combination
- Rationale and counterfactual generation

**Deliverables:**
- Embedding service integration
- Bayesian update engine
- Ensemble scorer
- LLM-generated rationale and counterfactual
- Enhanced juror detail view

### 12.3 Phase 3: Question Generation

**Scope:**
- Discriminative question generation
- Panel-wide question optimization
- Response interpretation guidance

**Deliverables:**
- Question generation service
- Voir dire prep interface with question suggestions
- "What to listen for" display

### 12.4 Phase 4: Live Voir Dire Integration

**Scope:**
- Real-time response capture
- Live persona updating
- Follow-up question suggestions
- Strike recommendation interface

**Deliverables:**
- Voir dire mode UI (trial UX principles)
- Real-time signal extraction and matching
- Strike worksheet and jury composition simulator

---

## 13. Appendix: Example Persona Definition

### 13.1 "The Skeptical Professional"

**Description:**
A juror who approaches decisions analytically, questions authority claims, values evidence over emotion, and has likely experienced institutional disappointment. Often found in technical, scientific, or managerial occupations. May be harder to persuade initially but highly committed once convinced.

**Core Traits:**
- Authority Orientation: LOW (questions rather than defers)
- Evidence Orientation: HIGH (demands proof)
- Emotional Responsiveness: LOW (unmoved by pure emotional appeals)
- Risk Tolerance: MODERATE (willing to find liability if evidence supports)

**Positive Signals:**
| Signal | Weight | Detection |
| --- | --- | --- |
| Technical/scientific occupation | 0.8 | Occupation field contains: engineer, scientist, analyst, accountant, IT, programmer |
| Advanced degree | 0.6 | Education field contains: MBA, MS, PhD, JD, MD |
| Expresses evidence requirements | 0.9 | Response contains: "need to see proof", "show me the data", "depends on the evidence" |
| Questions process/rules | 0.7 | Response challenges or seeks clarification on procedures |
| Negative institutional experience | 0.8 | Mentions fighting with insurance, disputing bills, challenging employer |

**Negative Signals:**
| Signal | Weight | Detection |
| --- | --- | --- |
| Defers to authority | 0.8 | Response contains: "trust the experts", "follow the rules", "they must know" |
| Emotional decision language | 0.6 | Response emphasizes feelings over facts |
| Quick agreement | 0.5 | Responds with immediate agreement without asking questions |

**Persuasion Levers:**
- Lead with data and documentation
- Acknowledge complexity and nuance
- Respect their expertise and intelligence
- Allow them to reach conclusions rather than telling them what to think

**Risk Factors:**
- Will scrutinize plaintiff's evidence rigorously
- May be skeptical of damage calculations without clear methodology
- Could become foreperson and apply analytical framework to deliberations

**Case Type Affinities:**
- Medical Malpractice (Plaintiff): NEUTRAL - Will require strong evidence but capable of finding liability
- Product Liability (Plaintiff): FAVORABLE - Appreciates technical evidence of defects
- Employment (Plaintiff): FAVORABLE - May relate to institutional conflicts
- Personal Injury (Plaintiff): UNFAVORABLE - May be skeptical of subjective damage claims

---

## 14. Engineering Handoff Checklist

- [ ] Data model schemas finalized and reviewed
- [ ] API contracts for all AI services defined
- [ ] Signal library seed data prepared
- [ ] Persona library seed data prepared (minimum 10 personas)
- [ ] OCR/document processing service selected
- [ ] Embedding model selected and tested
- [ ] LLM prompt templates drafted and tested
- [ ] UI wireframes/mockups for all interfaces
- [ ] Performance benchmarks established
- [ ] Test data set prepared (sample questionnaires)
- [ ] Audit logging requirements specified
