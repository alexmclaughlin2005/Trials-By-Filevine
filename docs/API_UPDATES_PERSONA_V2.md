# API Updates for Persona V2.0

## Overview

This document outlines the API endpoint changes needed to support the new Persona V2.0 data structure.

## Affected Endpoints

### 1. GET `/api/personas`

**Changes:**
- Return new fields: `instantRead`, `archetypeVerdictLean`, `phrasesYoullHear`, `verdictPrediction`, `strikeOrKeep`
- Add filter parameter: `?version=2` to get only V2 personas
- Add filter parameter: `?archetype=bootstrapper` to filter by archetype

**Example Response:**
```json
{
  "personas": [
    {
      "id": "uuid-1234",
      "name": "Bootstrap Bob",
      "nickname": "Bootstrap Bob",
      "archetype": "bootstrapper",
      "secondaryArchetype": null,
      "tagline": "I built everything I have. Nobody handed me anything.",

      "instantRead": "Classic self-made man. Will blame plaintiff for not being careful.",

      "archetypeVerdictLean": "STRONG DEFENSE",
      "archetypeWhatTheyBelieve": "People are responsible for their own outcomes...",
      "archetypeDeliberationBehavior": "Will argue plaintiff contributed to their own injury...",
      "archetypeHowToSpot": [
        "Stories about overcoming hardship without help",
        "Phrases like 'personal responsibility'"
      ],

      "phrasesYoullHear": [
        "Nobody put a gun to their head",
        "At the end of the day, you're responsible for yourself"
      ],

      "verdictPrediction": {
        "liability_finding_probability": 0.25,
        "damages_if_liability": "Will push for minimum. Economic only, heavily reduced.",
        "role_in_deliberation": "Vocal advocate for defense. May try to lead."
      },

      "strikeOrKeep": {
        "plaintiff_strategy": "MUST STRIKE. Textbook defense juror.",
        "defense_strategy": "KEEP. Dream juror who will do your work for you."
      },

      "plaintiffDangerLevel": 5,
      "defenseDangerLevel": 1,

      "demographics": {
        "age": 58,
        "gender": "male",
        "occupation": "Regional Sales Manager",
        "income": 145000
      },

      "sourceType": "system",
      "version": 2
    }
  ]
}
```

### 2. GET `/api/personas/:id`

**Changes:**
- Include all new fields in response
- No breaking changes (new fields are additions)

### 3. GET `/api/archetypes`

**New Endpoint** - Returns master list of archetypes

```typescript
GET /api/archetypes

Response:
{
  "archetypes": [
    {
      "id": "bootstrapper",
      "display_name": "The Bootstrapper",
      "verdict_lean": "STRONG DEFENSE",
      "danger_for_plaintiff": 5,
      "danger_for_defense": 1,
      "what_they_believe": "People are responsible for their own outcomes...",
      "how_they_behave_in_deliberation": "Will argue plaintiff contributed...",
      "how_to_spot_them": [
        "Stories about overcoming hardship",
        "Skepticism about lawsuits"
      ],
      "plaintiff_strategy": "Must strike. If stuck with one, emphasize defendant's clear rule violations.",
      "defense_strategy": "Keep as many as possible. They'll do your work for you.",
      "persona_count": 10
    }
  ]
}
```

### 4. GET `/api/archetypes/:archetype/personas`

**New Endpoint** - Returns all personas for a specific archetype

```typescript
GET /api/archetypes/bootstrapper/personas

Response:
{
  "archetype": {
    "id": "bootstrapper",
    "display_name": "The Bootstrapper",
    "verdict_lean": "STRONG DEFENSE"
  },
  "personas": [
    // Array of full persona objects
  ]
}
```

### 5. GET `/api/jurors/:id`

**Changes:**
- When returning mapped personas, include new fields
- Add `instant_read` to persona preview for quick scanning

```json
{
  "juror": {
    "id": "uuid",
    "firstName": "John",
    "personaMappings": [
      {
        "persona": {
          "id": "uuid",
          "name": "Bootstrap Bob",
          "instantRead": "Classic self-made man. Will blame plaintiff for not being careful.",
          "plaintiffDangerLevel": 5,
          "defenseDangerLevel": 1
        },
        "confidence": 0.85
      }
    ]
  }
}
```

### 6. POST `/api/personas/suggest`

**Changes:**
- Update AI prompt to consider new persona fields
- Return `instant_read` in suggestions for quick scanning

```json
{
  "suggestions": [
    {
      "persona": {
        "id": "uuid",
        "name": "Bootstrap Bob",
        "instantRead": "Classic self-made man. Will blame plaintiff for not being careful.",
        "phrasesYoullHear": ["Nobody put a gun to their head"]
      },
      "confidence": 0.85,
      "reasoning": "Juror's profile indicates..."
    }
  ]
}
```

## Implementation Files

### Backend (API Gateway)

**File:** `services/api-gateway/src/routes/personas.ts`

```typescript
// Add new GET endpoint for archetypes list
router.get('/archetypes', async (request, reply) => {
  // Return list of all archetypes with metadata
});

// Add new GET endpoint for archetype personas
router.get('/archetypes/:archetype/personas', async (request, reply) => {
  // Return all personas for specific archetype
});

// Update existing GET /personas to include new fields
router.get('/personas', async (request, reply) => {
  const { version, archetype } = request.query;

  const personas = await prisma.persona.findMany({
    where: {
      ...(version && { version: parseInt(version) }),
      ...(archetype && { archetype }),
      isActive: true,
      organizationId: null // System personas only
    },
    select: {
      id: true,
      name: true,
      nickname: true,
      archetype: true,
      secondaryArchetype: true,
      tagline: true,
      instantRead: true,
      archetypeVerdictLean: true,
      archetypeWhatTheyBelieve: true,
      archetypeDeliberationBehavior: true,
      archetypeHowToSpot: true,
      phrasesYoullHear: true,
      verdictPrediction: true,
      strikeOrKeep: true,
      plaintiffDangerLevel: true,
      defenseDangerLevel: true,
      demographics: true,
      sourceType: true,
      version: true
    }
  });

  return { personas };
});
```

### Frontend (Types)

**File:** `apps/web/src/types/persona.ts`

```typescript
// Add new interface extending existing Persona type
export interface PersonaV2 extends Persona {
  instantRead?: string;
  archetypeVerdictLean?: string;
  archetypeWhatTheyBelieve?: string;
  archetypeDeliberationBehavior?: string;
  archetypeHowToSpot?: string[];
  phrasesYoullHear?: string[];
  verdictPrediction?: {
    liability_finding_probability: number;
    damages_if_liability: string;
    role_in_deliberation: string;
  };
  strikeOrKeep?: {
    plaintiff_strategy: string;
    defense_strategy: string;
  };
}
```

### Frontend (Components)

**New Component:** `apps/web/src/components/persona-card-v2.tsx`

```typescript
import { PersonaV2 } from '@/types/persona';

export function PersonaCardV2({ persona }: { persona: PersonaV2 }) {
  return (
    <div className="persona-card">
      <div className="persona-header">
        <h3>{persona.name}</h3>
        <span className="archetype-badge">{persona.archetype}</span>
      </div>

      {/* NEW: Instant Read */}
      {persona.instantRead && (
        <p className="instant-read">{persona.instantRead}</p>
      )}

      {/* Danger Levels with Visual Indicators */}
      <div className="danger-ratings">
        <DangerMeter
          label="Plaintiff Danger"
          level={persona.plaintiffDangerLevel}
          max={5}
        />
        <DangerMeter
          label="Defense Danger"
          level={persona.defenseDangerLevel}
          max={5}
        />
      </div>

      {/* NEW: Phrases You'll Hear */}
      {persona.phrasesYoullHear && (
        <div className="phrases">
          <h4>Phrases You'll Hear</h4>
          <ul>
            {persona.phrasesYoullHear.map((phrase, i) => (
              <li key={i}>"{phrase}"</li>
            ))}
          </ul>
        </div>
      )}

      {/* NEW: Strike/Keep Guidance */}
      {persona.strikeOrKeep && (
        <div className="strategy">
          <div className="plaintiff-strategy">
            <strong>Plaintiff:</strong> {persona.strikeOrKeep.plaintiff_strategy}
          </div>
          <div className="defense-strategy">
            <strong>Defense:</strong> {persona.strikeOrKeep.defense_strategy}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Migration Strategy

### Phase 1: Database & Data (Completed)
- ✅ Add new columns to Persona table
- ✅ Create import script
- ✅ Import 60 V2 personas

### Phase 2: Backend API (Current)
- Update GET /api/personas to include new fields
- Add GET /api/archetypes endpoint
- Add GET /api/archetypes/:archetype/personas endpoint
- Update persona suggestion service to use new fields

### Phase 3: Frontend UI
- Create PersonaCardV2 component
- Add danger level visual indicators
- Display instant_read prominently
- Show phrases_youll_hear in expandable section
- Add strike/keep guidance by attorney side

### Phase 4: AI Service Updates
- Update PersonaSuggester prompt to consider new fields
- Update ArchetypeClassifier to return new structure
- Update FocusGroupEngine to use deliberation behaviors

## Testing Checklist

- [ ] GET /api/personas returns new fields
- [ ] GET /api/personas?version=2 filters correctly
- [ ] GET /api/personas?archetype=bootstrapper filters correctly
- [ ] GET /api/archetypes returns all 10 archetypes
- [ ] GET /api/archetypes/bootstrapper/personas returns 10 personas
- [ ] Frontend displays instant_read correctly
- [ ] Danger level meters render correctly
- [ ] Strike/keep guidance appears for both sides
- [ ] Phrases array renders as list

## Backward Compatibility

All changes are **backward compatible**:
- ✅ New fields are nullable
- ✅ Old personas still work (version = 1)
- ✅ Existing API contracts unchanged
- ✅ New endpoints are additions, not replacements

## Performance Considerations

- Use `select` clause to only fetch needed fields
- Index on `archetype` column for fast filtering
- Index on `version` column for version filtering
- Consider caching archetype list (changes rarely)

## Next Steps

1. Implement backend API changes
2. Test with Postman/Thunder Client
3. Update frontend types
4. Create PersonaCardV2 component
5. Update existing components to use new fields
6. Update AI service prompts
7. Deploy to staging
8. User acceptance testing
9. Deploy to production

## Questions?

See:
- [PERSONA_V2_IMPORT_GUIDE.md](./PERSONA_V2_IMPORT_GUIDE.md) - Import process
- [packages/types/src/archetype-v2.ts](../packages/types/src/archetype-v2.ts) - Type definitions
- [CURRENT_STATE.md](../CURRENT_STATE.md) - Project status
