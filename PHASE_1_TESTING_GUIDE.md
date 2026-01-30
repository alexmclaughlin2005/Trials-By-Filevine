# Phase 1: Signal System - Testing Guide

**Date:** January 30, 2026  
**Purpose:** Comprehensive testing guide for Phase 1 Signal System implementation

## Prerequisites

1. Database is running and accessible
2. API Gateway service is running
3. Authentication token available (for API testing)
4. At least one test case with jurors exists

## Testing Checklist

### 1. Database Migration Testing

**Step 1: Run Migration**
```bash
cd packages/database
npx prisma migrate dev --name add_signal_system
```

**Expected Result:**
- Migration runs without errors
- All 6 new tables are created: `signals`, `signal_persona_weights`, `juror_signals`, `voir_dire_responses`, `persona_match_updates`, `suggested_questions`
- All indexes and foreign keys are created

**Step 2: Verify Schema**
```bash
cd packages/database
npx prisma db pull  # Should not show any differences
npx prisma generate # Regenerate Prisma client
```

**Step 3: Check Tables Exist**
```sql
-- Connect to your database and run:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'signals',
  'signal_persona_weights',
  'juror_signals',
  'voir_dire_responses',
  'persona_match_updates',
  'suggested_questions'
);
```

**Expected:** All 6 tables should exist

---

### 2. Signal Seed Data Testing

**Step 1: Run Seed Script**
```bash
cd packages/database
npx ts-node prisma/seed-signals.ts
```

**Expected Output:**
```
Seeding signals...
Seeded 40+ signals
```

**Step 2: Verify Signals in Database**
```sql
-- Check signal count
SELECT COUNT(*) FROM signals;
-- Expected: ~40+ signals

-- Check by category
SELECT category, COUNT(*) 
FROM signals 
GROUP BY category 
ORDER BY category;
-- Expected: DEMOGRAPHIC (~15), BEHAVIORAL (~4), ATTITUDINAL (~8), LINGUISTIC (~3), SOCIAL (~5)

-- Check extraction methods
SELECT extraction_method, COUNT(*) 
FROM signals 
GROUP BY extraction_method;
-- Expected: FIELD_MAPPING, PATTERN_MATCH, NLP_CLASSIFICATION
```

**Step 3: Verify Signal Structure**
```sql
-- Check a sample signal
SELECT 
  signal_id,
  name,
  category,
  extraction_method,
  value_type,
  description
FROM signals 
WHERE signal_id = 'OCCUPATION_HEALTHCARE';
-- Expected: Returns healthcare occupation signal with all fields populated
```

---

### 3. API Endpoint Testing

**Prerequisites:** 
- API Gateway running on `http://localhost:3000` (or your port)
- Authentication token (get from login endpoint)

**Set up test variables:**
```bash
export API_URL="http://localhost:3000"
export AUTH_TOKEN="your-jwt-token-here"
```

#### Test 3.1: List All Signals

```bash
curl -X GET "${API_URL}/api/signals" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" | jq
```

**Expected Response:**
```json
{
  "signals": [
    {
      "id": "...",
      "signalId": "OCCUPATION_HEALTHCARE",
      "name": "Healthcare Professional",
      "category": "DEMOGRAPHIC",
      "extractionMethod": "FIELD_MAPPING",
      "valueType": "BOOLEAN",
      ...
    },
    ...
  ]
}
```

**Verify:**
- ✅ Returns array of signals
- ✅ All seeded signals are present
- ✅ Fields are correctly populated

#### Test 3.2: Filter Signals by Category

```bash
curl -X GET "${API_URL}/api/signals?category=DEMOGRAPHIC" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.signals | length'
```

**Expected:** Returns ~15 demographic signals

#### Test 3.3: Get Signal by ID

```bash
# First, get a signal ID
SIGNAL_ID=$(curl -X GET "${API_URL}/api/signals?category=DEMOGRAPHIC" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq -r '.signals[0].id')

curl -X GET "${API_URL}/api/signals/${SIGNAL_ID}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq
```

**Expected Response:**
```json
{
  "signal": {
    "id": "...",
    "signalId": "OCCUPATION_HEALTHCARE",
    "name": "Healthcare Professional",
    "personaWeights": [],
    ...
  }
}
```

#### Test 3.4: Get Signal Categories

```bash
curl -X GET "${API_URL}/api/signals/categories/list" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq
```

**Expected Response:**
```json
{
  "categories": [
    "BEHAVIORAL",
    "DEMOGRAPHIC",
    "ATTITUDINAL",
    "LINGUISTIC",
    "SOCIAL"
  ]
}
```

#### Test 3.5: Get Extraction Methods

```bash
curl -X GET "${API_URL}/api/signals/extraction-methods/list" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq
```

**Expected Response:**
```json
{
  "extractionMethods": [
    "FIELD_MAPPING",
    "NLP_CLASSIFICATION",
    "PATTERN_MATCH"
  ]
}
```

---

### 4. Signal Extraction Testing

**Prerequisites:**
- Test case exists with at least one juror
- Juror has questionnaire data or research artifacts

#### Test 4.1: Extract Signals from Questionnaire

**Step 1: Get a test juror ID**
```bash
JUROR_ID="your-juror-id-here"
CASE_ID="your-case-id-here"
```

**Step 2: Extract signals from questionnaire**
```bash
curl -X POST "${API_URL}/api/signals/jurors/${JUROR_ID}/extract/questionnaire" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "questionnaireData": {
      "occupation": "nurse",
      "education": "bachelor degree",
      "age": 35,
      "maritalStatus": "married",
      "children": true,
      "priorJuryService": false
    }
  }' | jq
```

**Expected Response:**
```json
{
  "success": true,
  "extractedSignals": [
    {
      "signalId": "OCCUPATION_HEALTHCARE",
      "value": true,
      "confidence": 0.9,
      "sourceReference": "occupation"
    },
    {
      "signalId": "EDUCATION_BACHELORS",
      "value": true,
      "confidence": 0.9,
      "sourceReference": "education"
    },
    {
      "signalId": "AGE_RANGE_31_50",
      "value": true,
      "confidence": 0.9,
      "sourceReference": "age"
    },
    {
      "signalId": "MARITAL_STATUS_MARRIED",
      "value": true,
      "confidence": 0.9,
      "sourceReference": "maritalStatus"
    },
    {
      "signalId": "HAS_CHILDREN",
      "value": true,
      "confidence": 0.9,
      "sourceReference": "children"
    }
  ],
  "count": 5
}
```

**Step 3: Verify signals stored in database**
```sql
SELECT 
  js.id,
  s.signal_id,
  s.name,
  js.value,
  js.source,
  js.source_reference,
  js.confidence
FROM juror_signals js
JOIN signals s ON js.signal_id = s.id
WHERE js.juror_id = 'your-juror-id-here'
ORDER BY js.extracted_at DESC;
```

**Expected:** Should see 5 signals extracted from questionnaire

#### Test 4.2: Get Juror Signals via API

```bash
curl -X GET "${API_URL}/api/signals/jurors/${JUROR_ID}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq
```

**Expected Response:**
```json
{
  "signals": [
    {
      "id": "...",
      "jurorId": "...",
      "signalId": "...",
      "value": true,
      "source": "QUESTIONNAIRE",
      "sourceReference": "occupation",
      "confidence": 0.9,
      "signal": {
        "signalId": "OCCUPATION_HEALTHCARE",
        "name": "Healthcare Professional",
        "category": "DEMOGRAPHIC",
        ...
      }
    },
    ...
  ]
}
```

#### Test 4.3: Filter Juror Signals by Category

```bash
curl -X GET "${API_URL}/api/signals/jurors/${JUROR_ID}?category=DEMOGRAPHIC" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.signals | length'
```

**Expected:** Returns only demographic signals for the juror

#### Test 4.4: Extract Signals from Research Artifact

**Prerequisites:** Juror must have a research artifact with content

```bash
# Get artifact ID
ARTIFACT_ID="your-artifact-id-here"

curl -X POST "${API_URL}/api/signals/jurors/${JUROR_ID}/extract/research/${ARTIFACT_ID}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq
```

**Expected Response:**
```json
{
  "success": true,
  "extractedSignals": [
    {
      "signalId": "CORPORATE_TRUST_LOW",
      "value": true,
      "confidence": 0.7,
      "sourceReference": "artifact-id"
    },
    ...
  ],
  "count": 1
}
```

**Note:** This will only extract signals if the artifact content matches signal patterns.

#### Test 4.5: Extract Signals from Voir Dire Response

**Prerequisites:** Must create a voir dire response first (see Test 5)

```bash
# Create voir dire response first
RESPONSE_ID="your-response-id-here"

curl -X POST "${API_URL}/api/signals/jurors/${JUROR_ID}/extract/voir-dire/${RESPONSE_ID}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq
```

---

### 5. Voir Dire Response Testing

#### Test 5.1: Create Voir Dire Response

**Note:** This endpoint doesn't exist yet - it will be created in Phase 4. For now, we can test by creating directly in database:

```sql
INSERT INTO voir_dire_responses (
  id,
  juror_id,
  question_text,
  response_summary,
  response_timestamp,
  entered_by,
  entry_method
) VALUES (
  gen_random_uuid(),
  'your-juror-id-here',
  'How do you feel about following rules?',
  'I generally trust experts and follow the rules that are in place. They must know what they are doing.',
  NOW(),
  'test-user-id',
  'TYPED'
) RETURNING id;
```

**Then extract signals:**
```bash
RESPONSE_ID="id-from-above"

curl -X POST "${API_URL}/api/signals/jurors/${JUROR_ID}/extract/voir-dire/${RESPONSE_ID}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq
```

**Expected:** Should extract `AUTHORITY_DEFERENCE_HIGH` signal from the response text

---

### 6. Integration Testing Script

Create a comprehensive test script:

```bash
#!/bin/bash
# test-phase1-signals.sh

set -e

API_URL="${API_URL:-http://localhost:3000}"
AUTH_TOKEN="${AUTH_TOKEN}"

if [ -z "$AUTH_TOKEN" ]; then
  echo "Error: AUTH_TOKEN environment variable not set"
  exit 1
fi

echo "🧪 Testing Phase 1: Signal System"
echo "================================"

# Test 1: List signals
echo ""
echo "Test 1: List all signals"
SIGNAL_COUNT=$(curl -s -X GET "${API_URL}/api/signals" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.signals | length')
echo "✅ Found ${SIGNAL_COUNT} signals"

# Test 2: Get categories
echo ""
echo "Test 2: Get signal categories"
CATEGORIES=$(curl -s -X GET "${API_URL}/api/signals/categories/list" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq -r '.categories[]')
echo "✅ Categories: ${CATEGORIES}"

# Test 3: Extract from questionnaire (if juror ID provided)
if [ ! -z "$JUROR_ID" ]; then
  echo ""
  echo "Test 3: Extract signals from questionnaire"
  EXTRACT_RESULT=$(curl -s -X POST "${API_URL}/api/signals/jurors/${JUROR_ID}/extract/questionnaire" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "questionnaireData": {
        "occupation": "nurse",
        "education": "bachelor degree",
        "age": 35,
        "maritalStatus": "married"
      }
    }')
  
  EXTRACTED_COUNT=$(echo $EXTRACT_RESULT | jq '.count')
  echo "✅ Extracted ${EXTRACTED_COUNT} signals"
  
  # Test 4: Get juror signals
  echo ""
  echo "Test 4: Get juror signals"
  JUROR_SIGNALS=$(curl -s -X GET "${API_URL}/api/signals/jurors/${JUROR_ID}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.signals | length')
  echo "✅ Juror has ${JUROR_SIGNALS} signals"
else
  echo ""
  echo "⚠️  Skipping juror tests (JUROR_ID not set)"
fi

echo ""
echo "✅ All tests passed!"
```

**Run the script:**
```bash
chmod +x test-phase1-signals.sh
export AUTH_TOKEN="your-token"
export JUROR_ID="your-juror-id"  # Optional
./test-phase1-signals.sh
```

---

### 7. Manual Testing Checklist

**Database Level:**
- [ ] Migration runs successfully
- [ ] All tables created with correct structure
- [ ] Foreign keys and indexes created
- [ ] Seed data loads correctly
- [ ] Signals can be queried by category
- [ ] Signals can be queried by extraction method

**API Level:**
- [ ] GET /api/signals returns all signals
- [ ] GET /api/signals?category=X filters correctly
- [ ] GET /api/signals/:id returns single signal
- [ ] GET /api/signals/jurors/:jurorId returns juror signals
- [ ] POST /api/signals/jurors/:jurorId/extract/questionnaire extracts signals
- [ ] POST /api/signals/jurors/:jurorId/extract/research/:artifactId extracts signals
- [ ] POST /api/signals/jurors/:jurorId/extract/voir-dire/:responseId extracts signals
- [ ] GET /api/signals/categories/list returns all categories
- [ ] GET /api/signals/extraction-methods/list returns all methods

**Signal Extraction:**
- [ ] Questionnaire field mapping works
- [ ] Research artifact pattern matching works
- [ ] Voir dire response pattern matching works
- [ ] Signals stored with correct source tracking
- [ ] Confidence scores are reasonable (0.7-0.9)
- [ ] Duplicate signals are handled (upsert)

**Error Handling:**
- [ ] 404 returned for non-existent juror
- [ ] 404 returned for non-existent signal
- [ ] 400 returned for invalid questionnaire data
- [ ] 401 returned for unauthenticated requests
- [ ] Organization isolation works (can't access other org's jurors)

---

### 8. Common Issues & Solutions

**Issue: Migration fails**
- **Solution:** Check database connection, ensure previous migrations are applied
- **Check:** `npx prisma migrate status`

**Issue: Seed script fails**
- **Solution:** Ensure Prisma client is generated: `npx prisma generate`
- **Check:** Database connection string is correct

**Issue: No signals extracted**
- **Solution:** Check questionnaire field names match signal sourceField values
- **Check:** Verify patterns match the content (case-insensitive)

**Issue: API returns 401**
- **Solution:** Get fresh auth token from login endpoint
- **Check:** Token hasn't expired

**Issue: Signals not linked to juror**
- **Solution:** Verify juror belongs to your organization
- **Check:** Organization ID matches in database

---

### 9. Performance Testing

**Test signal extraction speed:**
```bash
time curl -X POST "${API_URL}/api/signals/jurors/${JUROR_ID}/extract/questionnaire" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"questionnaireData": {...}}'
```

**Expected:** < 1 second for questionnaire extraction

**Test bulk extraction:**
```bash
# Extract signals for multiple jurors
for JUROR_ID in juror1 juror2 juror3; do
  curl -X POST "${API_URL}/api/signals/jurors/${JUROR_ID}/extract/questionnaire" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"questionnaireData": {...}}' &
done
wait
```

---

### 10. Next Steps After Testing

Once Phase 1 testing is complete:

1. **Document any issues found**
2. **Fix bugs before proceeding to Phase 2**
3. **Create signal-persona weight mappings** (needed for Phase 2)
4. **Plan Phase 2 implementation** (Matching Algorithms)

---

## Quick Test Commands

```bash
# 1. Run migration
cd packages/database && npx prisma migrate dev --name add_signal_system

# 2. Seed signals
cd packages/database && npx ts-node prisma/seed-signals.ts

# 3. Test API (replace with your values)
export API_URL="http://localhost:3000"
export AUTH_TOKEN="your-token"
export JUROR_ID="your-juror-id"

# List signals
curl -X GET "${API_URL}/api/signals" -H "Authorization: Bearer ${AUTH_TOKEN}" | jq

# Extract from questionnaire
curl -X POST "${API_URL}/api/signals/jurors/${JUROR_ID}/extract/questionnaire" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"questionnaireData": {"occupation": "nurse", "age": 35}}' | jq
```

---

**Testing Status:** Ready for execution  
**Estimated Time:** 30-60 minutes for full test suite
