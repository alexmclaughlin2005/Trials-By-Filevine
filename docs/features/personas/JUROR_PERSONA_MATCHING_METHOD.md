# Juror:Persona Matching Method - Technical Writeup

## Overview

The matching system uses an **ensemble approach** that combines three independent algorithms to produce robust, explainable persona matches. Each algorithm provides a score (0-1) and confidence (0-1), which are then combined using adaptive weights.

**Key Principle**: No single algorithm is perfect. By combining multiple approaches, we get more reliable matches and can identify when algorithms disagree (indicating uncertainty).

---

## Architecture

```
Juror Data → [Signal-Based Scorer] ──┐
         → [Embedding Scorer] ────────┼→ Ensemble Matcher → Final Match Scores
         → [Bayesian Updater] ────────┘
```

All three algorithms run **in parallel** for performance, then scores are combined.

---

## The Three Matching Algorithms

### 1. Signal-Based Scoring

**Purpose**: Explainable, auditable matching based on discrete evidence signals.

**How It Works**:
1. **Extract Signals**: Get all extracted signals for the juror (from questionnaire, research, voir dire)
2. **Get Persona Weights**: Each persona has positive/negative signal weights (e.g., "Healthcare Occupation" = +0.8 for "Empathetic Professional")
3. **Calculate Score**: 
   - Sum weights of matching positive signals
   - Subtract weights of matching negative signals
   - Normalize to 0-1 range
4. **Calculate Confidence**: Based on signal coverage (how many expected signals were observed)

**Formula**:
```
score = Σ(positive_signal_weights) - Σ(negative_signal_weights)
normalized_score = score / max_possible_score
confidence = (signals_observed / signals_expected) - contradiction_penalty - missing_penalty
```

**Strengths**:
- ✅ Highly explainable (can cite specific signals)
- ✅ Fast (no API calls)
- ✅ Works well with structured data

**Weaknesses**:
- ❌ Requires signal extraction to be comprehensive
- ❌ Misses nuanced patterns not captured in signals
- ❌ Can be brittle if signal definitions are incomplete

**Tweakable Parameters** (in `signal-based-scorer.ts`):
- `contradictionPenalty`: Currently `0.1` per contradicting signal, max `0.3`
- `missingPenalty`: Currently `0.05` per high-weight missing signal, max `0.2`
- Normalization method (currently linear, could use sigmoid)

---

### 2. Embedding Similarity Scoring

**Purpose**: Semantic matching using natural language understanding.

**How It Works**:
1. **Generate Juror Narrative**: Create comprehensive text description from all juror data
   - Demographics, occupation, location
   - Extracted signals (grouped by category)
   - Research findings (summaries)
   - Voir dire Q&A responses
   - Case context
2. **Generate Persona Description**: Build text from persona fields
   - Name, description, instantRead
   - Characteristic phrases
   - Attributes
3. **Generate Embeddings**: Convert both texts to vector embeddings
   - **Current Implementation**: Placeholder hash-based "embedding" (TODO: integrate real embedding API)
   - Should use OpenAI `text-embedding-3-large` or similar (1536 dimensions)
4. **Calculate Cosine Similarity**: Measure semantic similarity between vectors
5. **Normalize**: Convert from [-1, 1] to [0, 1]

**Formula**:
```
similarity = cosine_similarity(juror_embedding, persona_embedding)
normalized_score = (similarity + 1) / 2
confidence = f(narrative_length, word_count)  // 0.5-1.0 based on richness
```

**Strengths**:
- ✅ Captures nuanced patterns and context
- ✅ Works with unstructured text (research artifacts, voir dire)
- ✅ Good for rich juror profiles

**Weaknesses**:
- ❌ Requires API calls (costs money, latency)
- ❌ Less explainable (harder to cite specific reasons)
- ❌ Currently uses placeholder implementation (needs real embeddings)

**Tweakable Parameters** (in `embedding-scorer.ts`):
- `calculateConfidence()` thresholds:
  - Minimum: 200 chars or 30 words for `0.5` confidence
  - Maximum: 2000 chars for `1.0` confidence
- Cache timeout: Currently `1 hour` (60 * 60 * 1000 ms)
- Embedding dimension: Currently `1536` (OpenAI standard)

**TODO**: Replace placeholder `generateEmbedding()` with real API call.

---

### 3. Bayesian Updating

**Purpose**: Rigorous probabilistic reasoning that updates with each piece of evidence.

**How It Works**:
1. **Get Prior Probabilities**: 
   - If existing matches exist, use their confidence scores as priors
   - Otherwise, use uniform distribution (1/N for N personas)
2. **Update with Each Signal**: Apply Bayes' rule sequentially
   ```
   P(Persona | Signal) = P(Signal | Persona) × P(Persona) / P(Signal)
   ```
3. **Calculate Likelihood**: For each signal-persona pair:
   - If signal is POSITIVE for persona: `P(Signal|Persona) = weight` if present, `1-weight` if absent
   - If signal is NEGATIVE for persona: `P(Signal|Persona) = 1-weight` if present, `weight` if absent
4. **Normalize**: Ensure probabilities sum to 1
5. **Calculate Confidence**: Based on entropy (lower entropy = higher confidence)

**Formula**:
```
posterior = (likelihood × prior) / marginal_probability
entropy = -Σ(p × log2(p))
confidence = 1 - (entropy / max_entropy)
```

**Strengths**:
- ✅ Mathematically rigorous
- ✅ Handles uncertainty well
- ✅ Updates incrementally as new evidence arrives
- ✅ Good for sparse data

**Weaknesses**:
- ❌ Assumes independence of signals (not always true)
- ❌ Can be slow with many signals (sequential updates)
- ❌ Requires well-calibrated signal weights

**Tweakable Parameters** (in `bayesian-updater.ts`):
- Prior probability for missing personas: Currently `0.01` minimum
- Likelihood for missing weights: Currently `0.5` (neutral)
- Entropy calculation: Uses `log2`, could use natural log

---

## Ensemble Combination

### Weight Determination

Weights are **adaptive** based on data availability:

**Default Weights**:
```javascript
{
  signalBased: 0.35,
  embedding: 0.30,
  bayesian: 0.35
}
```

**Adjustments**:
- **Rich narrative data** (research + voir dire + >5 signals):
  - `embedding += 0.10`
  - `signalBased -= 0.05`
  - `bayesian -= 0.05`
- **Sparse data** (<3 signals, no research):
  - `bayesian += 0.10`
  - `embedding -= 0.10`
- **Many signals** (>10 signals):
  - `signalBased += 0.05`
  - `bayesian -= 0.05`

**Final Combination**:
```javascript
combined_score = (w_signal × score_signal) + (w_embedding × score_embedding) + (w_bayesian × score_bayesian)
combined_confidence = (w_signal × conf_signal) + (w_embedding × conf_embedding) + (w_bayesian × conf_bayesian)
```

**Tweakable Parameters** (in `ensemble-matcher.ts`):
- Default weights (lines 218-221, 230-234)
- Adjustment thresholds:
  - Rich narrative: `signalCount > 5` (line 237)
  - Sparse data: `signalCount < 3` (line 244)
  - Many signals: `signalCount > 10` (line 250)
- Adjustment amounts: `+0.10`, `-0.05`, etc.

---

## Rationale & Counterfactual Generation

### Rationale Generator

**Purpose**: Generate human-readable explanations for matches.

**How It Works**:
1. Build prompt with:
   - Match score and confidence
   - Supporting signals (top 5)
   - Contradicting signals (top 3)
   - Method scores breakdown
2. Call Claude API with `temperature: 0.3` (low for consistency)
3. Fallback to simple template if API fails

**Tweakable Parameters** (in `rationale-generator.ts`):
- `maxTokens`: Currently `500`
- `temperature`: Currently `0.3` (lower = more consistent)
- Number of signals shown: Currently `5` supporting, `3` contradicting

---

### Counterfactual Generator

**Purpose**: Identify what signals would most change the assessment.

**How It Works**:
1. Find second-highest scoring persona (for discrimination)
2. Identify signals that discriminate between top 2 personas
3. Filter to signals NOT yet observed
4. Calculate "information gain" (discrimination power)
5. Return top 3 signals with highest gain

**Tweakable Parameters** (in `counterfactual-generator.ts`):
- Discrimination threshold: Currently `> 0.3` (line 141)
- Number of signals returned: Currently `3` (line 160)

---

## Juror Narrative Generation

**Purpose**: Create comprehensive text description for embedding matching.

**Includes**:
- Demographics (age, occupation, employer, location)
- Questionnaire data (education, marital status, children, prior jury service)
- Extracted signals (grouped by category: DEMOGRAPHIC, BEHAVIORAL, ATTITUDINAL, etc.)
- Research findings (top 3 artifacts, summaries or truncated raw content)
- Voir dire responses (Q&A pairs, only responses with answers)
- Case context (case type)

**Tweakable Parameters** (in `juror-narrative-generator.ts`):
- Research artifacts: Currently `take: 10`, shows top `3` (lines 29, 104)
- Voir dire responses: Currently `take: 20`, filters to those with answers (line 43)
- Content truncation: Research `200 chars`, voir dire `100-150 chars` (lines 108, 124-133)

---

## Performance Optimizations

1. **Parallel Execution**: All three algorithms run simultaneously
2. **Caching**:
   - Embeddings cached in memory (per process)
   - Narratives cached for 1 hour
3. **Lazy Rationale Generation**: Only top 5 matches get full rationales
4. **Batch Processing**: Multiple personas scored together

---

## Key Areas for Tweaking

### 1. **Weight Adjustments** (Most Impact)
   - **Location**: `ensemble-matcher.ts`, `determineWeights()`
   - **What to change**: Default weights, adjustment thresholds, adjustment amounts
   - **Impact**: Changes which algorithm dominates in different scenarios

### 2. **Signal-Based Scoring** (Most Explainable)
   - **Location**: `signal-based-scorer.ts`
   - **What to change**: Penalty amounts, normalization method, confidence calculation
   - **Impact**: Affects how signals contribute to scores

### 3. **Embedding Implementation** (Most Needed)
   - **Location**: `embedding-scorer.ts`, `generateEmbedding()`
   - **What to change**: Replace placeholder with real embedding API
   - **Impact**: Currently using hash-based similarity (not semantic)

### 4. **Confidence Thresholds**
   - **Location**: Multiple files
   - **What to change**: Minimum narrative length, signal count thresholds
   - **Impact**: Affects confidence scores and weight adjustments

### 5. **Bayesian Priors**
   - **Location**: `bayesian-updater.ts`
   - **What to change**: Prior for missing personas, likelihood for missing weights
   - **Impact**: Affects how uncertainty is handled

### 6. **Rationale Quality**
   - **Location**: `rationale-generator.ts`
   - **What to change**: Prompt structure, temperature, token limit
   - **Impact**: Quality and consistency of explanations

---

## Current Limitations & TODOs

1. **Embedding API**: Using placeholder hash-based "embedding" - needs real API integration
2. **Signal Independence**: Bayesian assumes signals are independent (not always true)
3. **Weight Calibration**: Weights are heuristic - could be learned from labeled data
4. **Cold Start**: New jurors with no data get uniform priors (could use demographic priors)
5. **Signal Coverage**: Missing signals reduce confidence but don't affect score (could use imputation)

---

## Testing & Validation

To test changes:

1. **Unit Tests**: Test each scorer independently
2. **Integration Tests**: Test ensemble combination
3. **A/B Testing**: Compare old vs new weights on real cases
4. **Manual Review**: Check rationale quality and counterfactual usefulness

---

## Example: How a Match is Calculated

**Juror**: 45-year-old healthcare worker, has "Empathy" signal, voir dire shows trust in authority

**Persona**: "Empathetic Professional" (v2)

**Signal-Based**:
- "Healthcare Occupation" signal: +0.8 weight → score contribution
- "Empathy" signal: +0.6 weight → score contribution
- Missing "Advanced Education" signal: -0.05 confidence penalty
- **Result**: Score = 0.72, Confidence = 0.85

**Embedding**:
- Narrative: "Healthcare worker, age 45, shows empathy, trusts authority..."
- Persona description: "Empathetic professional who values authority..."
- Cosine similarity: 0.78
- **Result**: Score = 0.89, Confidence = 0.92 (rich narrative)

**Bayesian**:
- Prior: 0.15 (from previous match)
- Update with "Healthcare Occupation": likelihood = 0.8 → posterior = 0.42
- Update with "Empathy": likelihood = 0.6 → posterior = 0.58
- **Result**: Score = 0.58, Confidence = 0.75

**Ensemble** (rich data, so embedding weighted higher):
- Weights: signal=0.30, embedding=0.40, bayesian=0.30
- Combined: (0.30×0.72) + (0.40×0.89) + (0.30×0.58) = **0.75**
- Confidence: (0.30×0.85) + (0.40×0.92) + (0.30×0.75) = **0.85**

**Final**: 75% match probability, 85% confidence

---

## Quick Reference: File Locations

- **Ensemble Matcher**: `services/api-gateway/src/services/matching/ensemble-matcher.ts`
- **Signal Scorer**: `services/api-gateway/src/services/matching/signal-based-scorer.ts`
- **Embedding Scorer**: `services/api-gateway/src/services/matching/embedding-scorer.ts`
- **Bayesian Updater**: `services/api-gateway/src/services/matching/bayesian-updater.ts`
- **Narrative Generator**: `services/api-gateway/src/services/matching/juror-narrative-generator.ts`
- **Rationale Generator**: `services/api-gateway/src/services/matching/rationale-generator.ts`
- **Counterfactual Generator**: `services/api-gateway/src/services/matching/counterfactual-generator.ts`
