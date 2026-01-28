# Testing Phase 2: Backend API Updates

## Quick Test (5 minutes)

### 1. Verify Database Import ✅ Easiest

```bash
# Test 1: Verify all 60 personas imported
npm run verify-personas-v2
```

**Expected Output:**
```
✅ Total V2 Personas: 60

📊 Personas by Archetype:
   bootstrapper         10
   crusader             10
   scale_balancer       6
   captain              6
   chameleon            5
   heart                6
   calculator           5
   scarred              5
   trojan_horse         3
   maverick             4
```

---

```bash
# Test 2: Verify all new fields are populated
npm run test:persona-fields-v2
```

**Expected Output:**
```
📌 Testing BOOTSTRAPPER
   👤 MAGA Mike
   ✓ instantRead: true
   ✓ archetypeVerdictLean: true
   ✓ phrasesYoullHear: true
   ✓ verdictPrediction: true
   ✓ strikeOrKeep: true
   💬 Sample Phrase: "Trial lawyers are destroying this country"
   🎯 Danger Levels: Plaintiff=5 / Defense=1
```

**If these pass, Phase 2 is working!** ✅

---

## Visual Inspection (Prisma Studio)

The easiest way to see your data:

```bash
cd packages/database
npx prisma studio
```

This opens at http://localhost:5555

**What to check:**
1. Click "Persona" table
2. Add filter: `version` equals `2`
3. You should see 60 rows
4. Click any persona to see all fields populated

**Key Fields to Check:**
- `instantRead` - Should have text
- `phrasesYoullHear` - Should have JSON array
- `verdictPrediction` - Should have JSON object
- `strikeOrKeep` - Should have JSON object
- `archetypeVerdictLean` - Should have text like "STRONG DEFENSE"

---

## API Endpoint Testing (Advanced)

### Prerequisites

1. **Start API Gateway:**
   ```bash
   cd services/api-gateway
   npm run dev
   ```

   Should see:
   ```
   Server listening at http://localhost:3001
   ```

2. **Check Health:**
   ```bash
   curl http://localhost:3001/health
   ```

   Should return:
   ```json
   {"status":"ok","database":"connected"}
   ```

### Testing Without Authentication

Some endpoints require authentication. Here's what you can test without auth:

```bash
# Test health endpoint
curl http://localhost:3001/health
```

### Testing With Authentication

**Option A: Use Existing Token (if you have one)**

```bash
# Set your token
export TOKEN="your-jwt-token-here"

# Test GET /api/personas
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/personas?version=2

# Test GET /api/personas/archetypes (NEW)
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/personas/archetypes

# Test GET /api/personas/archetypes/:archetype/personas (NEW)
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/personas/archetypes/bootstrapper/personas
```

**Option B: Get Test User (if database seeded)**

```bash
npm run get-test-token
```

This will show you the test user email and instructions for logging in.

**Option C: Use Postman/Thunder Client**

1. Import these endpoints:
   - `GET http://localhost:3001/api/personas?version=2`
   - `GET http://localhost:3001/api/personas/archetypes`
   - `GET http://localhost:3001/api/personas/archetypes/bootstrapper/personas`

2. Add Authorization header:
   ```
   Authorization: Bearer your-token-here
   ```

3. Send requests and verify responses

---

## What to Look For in API Responses

### GET `/api/personas?version=2`

Should return array with these new fields:

```json
{
  "personas": [
    {
      "id": "uuid",
      "name": "Bootstrap Bob",
      "archetype": "bootstrapper",

      // NEW V2 Fields
      "instantRead": "Classic self-made man...",
      "archetypeVerdictLean": "STRONG DEFENSE",
      "phrasesYoullHear": ["Nobody put a gun to their head", ...],
      "verdictPrediction": {
        "liability_finding_probability": 0.25,
        "damages_if_liability": "...",
        "role_in_deliberation": "..."
      },
      "strikeOrKeep": {
        "plaintiff_strategy": "MUST STRIKE...",
        "defense_strategy": "KEEP..."
      },

      "plaintiffDangerLevel": 5,
      "defenseDangerLevel": 1
    }
  ]
}
```

### GET `/api/personas/archetypes` (NEW)

Should return archetype list:

```json
{
  "archetypes": [
    {
      "id": "bootstrapper",
      "display_name": "The Bootstrapper",
      "verdict_lean": "STRONG DEFENSE",
      "what_they_believe": "People are responsible...",
      "how_they_behave_in_deliberation": "Will argue plaintiff...",
      "how_to_spot_them": ["Stories about overcoming hardship", ...],
      "persona_count": 10
    }
  ]
}
```

### GET `/api/personas/archetypes/bootstrapper/personas` (NEW)

Should return archetype info + personas:

```json
{
  "archetype": {
    "id": "bootstrapper",
    "display_name": "The Bootstrapper",
    "verdict_lean": "STRONG DEFENSE",
    "what_they_believe": "...",
    "how_they_behave_in_deliberation": "...",
    "how_to_spot_them": [...]
  },
  "personas": [
    {
      "id": "uuid",
      "name": "Bootstrap Bob",
      "instantRead": "...",
      "phrasesYoullHear": [...],
      "verdictPrediction": {...},
      "strikeOrKeep": {...}
    }
  ]
}
```

---

## Troubleshooting

### Issue: "Authentication required"

**Solution:** Most API endpoints require authentication. Use one of these:

1. **Easiest:** Use Prisma Studio (no auth needed)
   ```bash
   cd packages/database && npx prisma studio
   ```

2. **For API:** Get a test token or use the database verification scripts instead:
   ```bash
   npm run verify-personas-v2
   npm run test:persona-fields-v2
   ```

### Issue: "No personas found"

**Check:**
```bash
# Verify import happened
npm run verify-personas-v2
```

If it shows 0 personas, re-run import:
```bash
npm run import-personas-v2
```

### Issue: "New fields are null"

**Check:**
```bash
# Test field population
npm run test:persona-fields-v2
```

If fields show false (✗), the import may have failed. Check:
1. Migration was applied: `cd packages/database && npx prisma migrate status`
2. Re-run import: `npm run import-personas-v2`

### Issue: "API not responding"

**Check:**
```bash
# Is API running?
curl http://localhost:3001/health

# If not, start it:
cd services/api-gateway
npm run dev
```

---

## Complete Test Checklist

Use this checklist to verify Phase 2 is complete:

### Database Tests
- [ ] Run `npm run verify-personas-v2`
- [ ] Verify: 60 total personas
- [ ] Verify: All 10 archetypes have correct counts
- [ ] Run `npm run test:persona-fields-v2`
- [ ] Verify: All new fields show ✓ (true)
- [ ] Verify: Sample data looks correct

### Visual Inspection
- [ ] Open Prisma Studio
- [ ] Filter Persona table: `version = 2`
- [ ] Check: 60 rows visible
- [ ] Click any persona
- [ ] Check: `instantRead` has text
- [ ] Check: `phrasesYoullHear` has array
- [ ] Check: `verdictPrediction` has object
- [ ] Check: `strikeOrKeep` has object

### API Tests (Optional)
- [ ] Start API gateway
- [ ] Check: `curl http://localhost:3001/health` returns ok
- [ ] Test: GET `/api/personas?version=2` (with auth)
- [ ] Test: GET `/api/personas/archetypes` (with auth)
- [ ] Test: GET `/api/personas/archetypes/bootstrapper/personas` (with auth)
- [ ] Verify: Responses include new V2 fields

---

## Quick Command Reference

```bash
# Database verification (no auth needed)
npm run verify-personas-v2           # Check counts
npm run test:persona-fields-v2       # Check fields

# Visual inspection (no auth needed)
cd packages/database && npx prisma studio

# API testing (auth needed)
cd services/api-gateway && npm run dev
npm run test:persona-api-v2

# Get test credentials
npm run get-test-token
```

---

## Success Criteria

✅ **Phase 2 is complete when:**

1. `npm run verify-personas-v2` shows 60 personas
2. `npm run test:persona-fields-v2` shows all ✓ (no ✗)
3. Prisma Studio shows all new fields populated
4. (Optional) API endpoints return new fields correctly

**If all database tests pass, you're ready for Phase 3!** 🎉

---

## Next Steps

Once Phase 2 is verified:

1. **Phase 3: Frontend UI** - Create components to display the new data
2. **Update AI Services** - Update prompts to use new fields
3. **User Testing** - Get attorney feedback on new persona data

---

**Document Version:** 1.0
**Last Updated:** January 28, 2026
