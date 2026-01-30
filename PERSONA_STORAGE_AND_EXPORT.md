# Persona Storage and Export Guide

## Where Personas Are Stored

### 1. **JSON Files** (Source of Truth)
Personas are originally defined in JSON files:

**V1 Personas** (Legacy):
- **Location**: `Juror Personas/generated/`
- **Files**: 
  - `bootstrappers.json`
  - `crusaders.json`
  - `scale_balancers.json`
  - `captains.json`
  - `chameleons.json`
  - `scarreds.json`
  - `calculators.json`
  - `hearts.json`
  - `trojan_horses.json`
  - `mavericks.json`

**V2 Personas** (Current):
- **Location**: `Persona Updates/`
- **Files**: Same archetype files (note: `scarred.json` instead of `scarreds.json`)

### 2. **Database** (Authoritative Source)
Personas are imported into PostgreSQL via Prisma:
- **Table**: `personas`
- **Schema**: `packages/database/prisma/schema.prisma`
- **Includes**: All fields, signal weights, V2 enhancements, metadata

**Why Database is Authoritative**:
- Contains all imported data plus any manual edits
- Includes signal weights (`SignalPersonaWeight` table)
- Has V2 fields populated
- Tracks version, creation dates, organization associations

---

## Exporting All Personas

### Quick Export

Run the export script to get all personas with their complete data:

```bash
npm run export-personas
```

This will create two files in the project root:

1. **`personas-export.json`**: Complete export with all fields
   - All persona data (basic info, V2 fields, signal weights, etc.)
   - Metadata (export timestamp, counts by source/version/archetype)
   - Fully structured JSON

2. **`personas-export-summary.csv`**: Quick summary spreadsheet
   - ID, Name, Nickname, Archetype, Version, Source
   - Signal weight count
   - Created/Updated dates

### What's Included in the Export

The export includes **everything** from the database:

#### Basic Information
- ID, organizationId, name, nickname, description, tagline
- jsonPersonaId (links to JSON files)

#### Archetype Classification
- archetype, archetypeStrength, secondaryArchetype, variant

#### Legacy Fields
- attributes, signals, persuasionLevers, pitfalls

#### Archetype System Fields
- demographics, dimensions, lifeExperiences
- characteristicPhrases, voirDireResponses, deliberationBehavior

#### Roundtable Behavior
- leadershipLevel, communicationStyle, persuasionSusceptibility
- vocabularyLevel, sentenceStyle, speechPatterns
- responseTendency, engagementStyle

#### Simulation Parameters
- simulationParams, caseTypeModifiers, regionalModifiers

#### Strategic Guidance
- plaintiffDangerLevel, defenseDangerLevel
- causeChallenge, strategyGuidance

#### V2 Fields - Archetype-level
- archetypeVerdictLean
- archetypeWhatTheyBelieve
- archetypeDeliberationBehavior
- archetypeHowToSpot

#### V2 Fields - Persona-specific
- instantRead
- phrasesYoullHear
- verdictPrediction
- strikeOrKeep

#### Signal Weights
- Complete list of all signal weights (positive and negative)
- Includes signal ID, name, direction, weight value

#### Metadata
- version (1 or 2)
- isActive
- createdAt, updatedAt

---

## Export Format Example

```json
{
  "exportedAt": "2026-01-30T12:00:00.000Z",
  "totalPersonas": 45,
  "personasBySource": {
    "system": 40,
    "userCreated": 3,
    "aiGenerated": 2
  },
  "personasByVersion": {
    "v1": 5,
    "v2": 40
  },
  "personasByArchetype": {
    "bootstrapper": 10,
    "crusader": 8,
    ...
  },
  "personas": [
    {
      "id": "uuid",
      "name": "Bootstrap Bob",
      "nickname": "Bob",
      "archetype": "bootstrapper",
      "version": 2,
      "instantRead": "Hardworking individual who believes in personal responsibility...",
      "phrasesYoullHear": ["I pulled myself up by my bootstraps", ...],
      "signalWeights": [
        {
          "signalId": "OCCUPATION_BLUE_COLLAR",
          "signalName": "Blue Collar Occupation",
          "direction": "POSITIVE",
          "weight": 0.8
        },
        ...
      ],
      ...
    }
  ]
}
```

---

## Alternative: Export from JSON Files

If you want the original JSON file format (before database import):

### V1 Personas
```bash
# View a specific archetype file
cat "Juror Personas/generated/bootstrappers.json"

# Or copy all files
cp -r "Juror Personas/generated/" ./personas-json-v1/
```

### V2 Personas
```bash
# View a specific archetype file
cat "Persona Updates/bootstrappers.json"

# Or copy all files
cp -r "Persona Updates/" ./personas-json-v2/
```

**Note**: JSON files don't include signal weights or database metadata - use the database export for complete data.

---

## Manual Database Query

If you need to query personas directly:

```typescript
import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

// Get all personas with signal weights
const personas = await prisma.persona.findMany({
  where: { isActive: true },
  include: {
    signalWeights: {
      include: {
        signal: true,
      },
    },
  },
});
```

---

## File Locations Summary

| Type | Location | Purpose |
|------|----------|---------|
| **V1 JSON** | `Juror Personas/generated/` | Original persona definitions |
| **V2 JSON** | `Persona Updates/` | Updated persona definitions |
| **Database** | PostgreSQL (`personas` table) | Authoritative source with all data |
| **Export Script** | `scripts/export-all-personas.ts` | Export tool |
| **Schema** | `packages/database/prisma/schema.prisma` | Database structure |

---

## Next Steps

1. **Run Export**: `npm run export-personas`
2. **Review**: Check `personas-export.json` for complete data
3. **Use CSV**: Open `personas-export-summary.csv` for quick overview
4. **Customize**: Modify `scripts/export-all-personas.ts` if you need different fields
