# Persona V2.0 - Phase 2 Complete: Backend API Updates

**Date:** January 28, 2026
**Status:** ✅ Complete and Tested

---

## Summary

Phase 2 of the Persona V2.0 integration is complete! All API endpoints have been updated to return the new V2 fields, and two new archetype endpoints have been added.

---

## ✅ What Was Completed

### 1. Updated Existing Endpoints

#### GET `/api/personas`
**Changes:**
- Added query parameters: `?version=2` and `?archetype=bootstrapper`
- Returns all new V2 fields in response
- Optimized select to only fetch needed fields

**New Fields Returned:**
- `instantRead` - One-sentence summary
- `archetypeVerdictLean` - Verdict lean category
- `archetypeWhatTheyBelieve` - Core beliefs
- `archetypeDeliberationBehavior` - Deliberation behavior
- `archetypeHowToSpot` - Recognition indicators array
- `phrasesYoullHear` - Characteristic phrases array
- `verdictPrediction` - Liability probability + damages + role
- `strikeOrKeep` - Strategy by plaintiff/defense side

**Example:**
```bash
# Get all V2 personas
curl http://localhost:3001/api/personas?version=2

# Get all bootstrapper personas
curl http://localhost:3001/api/personas?archetype=bootstrapper

# Get V2 bootstrapper personas
curl http://localhost:3001/api/personas?version=2&archetype=bootstrapper
```

#### GET `/api/personas/:id`
**Changes:**
- Updated select to include all new V2 fields
- No breaking changes (backward compatible)

---

### 2. New Archetype Endpoints

#### GET `/api/personas/archetypes` (NEW)
**Purpose:** Returns list of all 10 archetypes with metadata

**Response:**
```json
{
  "archetypes": [
    {
      "id": "bootstrapper",
      "display_name": "The Bootstrapper",
      "verdict_lean": "STRONG DEFENSE",
      "what_they_believe": "People are responsible for their own outcomes...",
      "how_they_behave_in_deliberation": "Will argue plaintiff contributed...",
      "how_to_spot_them": [
        "Stories about overcoming hardship",
        "Skepticism about lawsuits"
      ],
      "persona_count": 10
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3001/api/personas/archetypes
```

#### GET `/api/personas/archetypes/:archetype/personas` (NEW)
**Purpose:** Returns all personas for a specific archetype

**Response:**
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
      "instantRead": "Classic self-made man. Will blame plaintiff...",
      "phrasesYoullHear": ["Nobody put a gun to their head"],
      "verdictPrediction": {...},
      "strikeOrKeep": {...},
      "plaintiffDangerLevel": 5,
      "defenseDangerLevel": 1
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3001/api/personas/archetypes/bootstrapper/personas
```

---

## 🧪 Testing & Verification

### Test Scripts Created

1. **`verify-personas-v2.ts`** - Database verification
   ```bash
   npm run verify-personas-v2
   ```
   - Counts V2 personas (60 expected)
   - Counts by archetype
   - Checks field population

2. **`test-persona-fields-v2.ts`** - Field testing
   ```bash
   npm run test:persona-fields-v2
   ```
   - Tests all 10 archetypes
   - Verifies all new fields populated
   - Shows sample data

3. **`test-persona-api-v2.ts`** - API endpoint testing
   ```bash
   npm run test:persona-api-v2
   ```
   - Tests all endpoints
   - Verifies response structure
   - Shows example data

### Test Results

✅ **All tests passing!**

```
🧪 Testing Persona V2 Fields

📌 Testing BOOTSTRAPPER
   👤 MAGA Mike
   ✓ instantRead: true
   ✓ archetypeVerdictLean: true
   ✓ phrasesYoullHear: true
   ✓ verdictPrediction: true
   ✓ strikeOrKeep: true
   💬 Sample Phrase: "Trial lawyers are destroying this country"
   🎯 Danger Levels: Plaintiff=5 / Defense=1

[... 9 more archetypes tested successfully ...]

✅ Field Testing Complete!
```

---

## 📁 Files Modified

### Backend API
- `services/api-gateway/src/routes/personas.ts` - Updated all endpoints

### Scripts
- `scripts/verify-personas-v2.ts` - NEW
- `scripts/test-persona-fields-v2.ts` - NEW
- `scripts/test-persona-api-v2.ts` - NEW
- `package.json` - Added test scripts

---

## 🔧 Code Changes

### Key Updates in `personas.ts`

**1. Enhanced GET /personas:**
```typescript
// Added query parameters
const { version, archetype } = request.query;

// Updated where clause
where: {
  OR: [{ organizationId }, { sourceType: 'system' }],
  ...(version && { version: parseInt(version) }),
  ...(archetype && { archetype }),
  isActive: true,
}

// Expanded select to include V2 fields
select: {
  // ... existing fields ...
  archetypeVerdictLean: true,
  instantRead: true,
  phrasesYoullHear: true,
  verdictPrediction: true,
  strikeOrKeep: true,
  // ... etc
}
```

**2. New Archetype Endpoints:**
```typescript
// Get all archetypes
server.get('/archetypes', { ... });

// Get personas by archetype
server.get('/archetypes/:archetype/personas', { ... });

// Helper function
function formatArchetypeName(archetype: string): string {
  const nameMap: Record<string, string> = {
    bootstrapper: 'The Bootstrapper',
    // ... etc
  };
  return nameMap[archetype] || archetype;
}
```

---

## 🎯 Usage Examples

### Frontend Integration

**1. Fetch All V2 Personas:**
```typescript
const response = await fetch('/api/personas?version=2', {
  headers: { Authorization: `Bearer ${token}` }
});
const { personas } = await response.json();

// Display in UI
personas.forEach(persona => {
  console.log(`${persona.name}: ${persona.instantRead}`);
  console.log(`Danger: P=${persona.plaintiffDangerLevel} D=${persona.defenseDangerLevel}`);
});
```

**2. Fetch Archetype List:**
```typescript
const response = await fetch('/api/personas/archetypes', {
  headers: { Authorization: `Bearer ${token}` }
});
const { archetypes } = await response.json();

// Display archetype cards
archetypes.forEach(archetype => {
  console.log(`${archetype.display_name} (${archetype.persona_count} personas)`);
  console.log(`Verdict Lean: ${archetype.verdict_lean}`);
});
```

**3. Fetch Personas by Archetype:**
```typescript
const response = await fetch('/api/personas/archetypes/bootstrapper/personas', {
  headers: { Authorization: `Bearer ${token}` }
});
const { archetype, personas } = await response.json();

// Display archetype info + persona cards
console.log(`${archetype.display_name}: ${archetype.verdict_lean}`);
personas.forEach(persona => {
  console.log(`- ${persona.name}: ${persona.instantRead}`);
});
```

---

## 🚀 Next Steps

### Phase 3: Frontend UI (Next)

Now that the API is updated, you can:

1. **Create PersonaCardV2 Component**
   - Display `instantRead` prominently
   - Show danger levels with visual meters
   - List `phrasesYoullHear` in expandable section
   - Display `strikeOrKeep` guidance by side

2. **Update Existing Components**
   - `JurorResearchPanel` - Show instant_read in persona suggestions
   - `ArchetypeClassifier` - Display new detection indicators
   - `PersonaSelector` - Filter by archetype with new endpoint

3. **Add New UI Features**
   - Archetype browser page (grid of 10 archetype cards)
   - Persona detail page with all V2 fields
   - Danger level visualizations
   - Voir dire phrase library

---

## 📊 API Endpoint Summary

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/personas` | GET | List all personas (with filters) | ✅ Updated |
| `/api/personas/:id` | GET | Get single persona | ✅ Updated |
| `/api/personas/archetypes` | GET | List all archetypes | ✅ NEW |
| `/api/personas/archetypes/:archetype/personas` | GET | Get personas by archetype | ✅ NEW |
| `/api/personas/suggest` | POST | AI persona suggestion | ⏳ Next |

---

## 🔍 Backward Compatibility

All changes are **100% backward compatible:**

✅ Existing queries still work (just return more fields)
✅ Query parameters are optional
✅ New endpoints don't replace old ones
✅ Old personas (version=1) still accessible
✅ No breaking changes to response structure

---

## 📝 Documentation

Complete documentation available:

- **[PERSONA_V2_QUICKSTART.md](../PERSONA_V2_QUICKSTART.md)** - 5-minute quick start
- **[PERSONA_V2_INTEGRATION_SUMMARY.md](./PERSONA_V2_INTEGRATION_SUMMARY.md)** - Complete overview
- **[PERSONA_V2_IMPORT_GUIDE.md](./PERSONA_V2_IMPORT_GUIDE.md)** - Import process
- **[API_UPDATES_PERSONA_V2.md](./API_UPDATES_PERSONA_V2.md)** - API documentation

---

## ✅ Phase 2 Checklist

- [x] Update GET `/api/personas` to return V2 fields
- [x] Add query parameters: `version` and `archetype`
- [x] Update GET `/api/personas/:id` to return V2 fields
- [x] Create GET `/api/personas/archetypes` endpoint
- [x] Create GET `/api/personas/archetypes/:archetype/personas` endpoint
- [x] Add helper function for archetype display names
- [x] Create test scripts for verification
- [x] Test all endpoints
- [x] Verify field population
- [x] Update package.json scripts
- [x] Document changes

---

## 🎉 Success Metrics

- ✅ 60 personas imported with all V2 fields
- ✅ All 10 archetypes have correct metadata
- ✅ API endpoints return new fields correctly
- ✅ Query filters work as expected
- ✅ 100% test pass rate
- ✅ Zero breaking changes
- ✅ Backward compatible

---

**Phase 2 Status:** ✅ **COMPLETE**

**Ready for Phase 3:** Frontend UI Components

---

**Document Version:** 1.0
**Last Updated:** January 28, 2026
