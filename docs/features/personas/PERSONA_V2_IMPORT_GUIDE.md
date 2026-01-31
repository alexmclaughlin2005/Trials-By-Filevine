# Persona V2.0 Import Guide

## Overview

This guide explains how to import the updated archetype definitions and persona files into the database.

## What's New in V2.0

### Archetype-Level Changes
- **Clearer verdict leans**: More explicit categories (STRONG DEFENSE, STRONG PLAINTIFF, NEUTRAL, etc.)
- **Core beliefs**: Added `what_they_believe` field explaining fundamental mindset
- **Deliberation behavior**: Added `how_they_behave_in_deliberation` for tactical guidance
- **Recognition indicators**: Added `how_to_spot_them` array for voir dire detection

### Persona-Level Changes
- **Instant read**: One-sentence summary for quick scanning (e.g., "Classic self-made man. Will blame plaintiff for not being careful.")
- **Memorable names**: Updated from IDs like "BOOT_1.1_BootstrapBob" to "Bootstrap Bob"
- **Characteristic phrases**: Array of `phrases_youll_hear` for voir dire recognition
- **Verdict prediction**: Structured prediction with liability probability, damages tendency, and deliberation role
- **Strike/keep guidance**: Specific strategies for plaintiff and defense attorneys

## File Structure

```
Persona Updates/
├── archetype_master_reference.json  # Master reference for all 10 archetypes
├── bootstrappers.json               # 10 personas (defense-leaning)
├── crusaders.json                   # 10 personas (plaintiff-leaning)
├── scale_balancers.json             # 6 personas (neutral)
├── captains.json                    # 6 personas (leadership)
├── chameleons.json                  # 5 personas (followers)
├── hearts.json                      # 6 personas (empathy-driven)
├── calculators.json                 # 5 personas (numbers-focused)
├── scarred.json                     # 5 personas (experience-driven)
├── trojan_horses.json               # 3 personas (hidden bias)
└── mavericks.json                   # 4 personas (nullifiers)
```

**Total: 60 system personas across 10 archetypes**

## Database Schema Changes

New fields added to `Persona` model:

```prisma
// Archetype-level guidance
archetypeVerdictLean          String? // "STRONG DEFENSE" | "STRONG PLAINTIFF" | etc
archetypeWhatTheyBelieve      String? // Core belief system
archetypeDeliberationBehavior String? // How they behave in deliberation
archetypeHowToSpot            Json?   // Array of recognition indicators

// Persona-specific fields
instantRead       String? // One-sentence summary
phrasesYoullHear  Json?   // Array of characteristic phrases
verdictPrediction Json?   // {liability_finding_probability, damages_if_liability, role_in_deliberation}
strikeOrKeep      Json?   // {plaintiff_strategy, defense_strategy}
```

## Import Process

### Step 1: Run Database Migration

```bash
cd packages/database
npx prisma migrate dev
```

This will apply the migration `add_persona_v2_fields` that adds the new columns.

### Step 2: Dry Run (Recommended)

Test the import without making changes:

```bash
npm run import-personas-v2 -- --dry-run
```

This will:
- ✅ Validate all JSON files
- ✅ Show what would be created/updated
- ✅ Report any validation errors
- ❌ NOT make any database changes

### Step 3: Run Import

```bash
npm run import-personas-v2
```

This will:
1. Read all 10 persona files from `Persona Updates/`
2. Validate structure and data
3. Upsert personas (create new or update existing by name)
4. Print detailed import summary

### Step 4: Verify Import

```bash
cd packages/database
npx prisma studio
```

Open Prisma Studio and check:
- Navigate to `Persona` table
- Filter by `version = 2` to see new personas
- Verify new fields are populated
- Check that 60 system personas exist

## Validation Rules

The import script validates:

✅ **Archetype IDs**: Must be one of 10 valid archetypes
✅ **Danger Ratings**: Must be 1-5 (or "Varies" for dynamic archetypes)
✅ **Liability Probability**: Must be 0.0-1.0
✅ **Required Fields**: All personas must have id, name, instant_read, demographics, verdict_prediction, strike_or_keep

## Persona ID Migration

### Old Format → New Format

| Old ID | New ID | New Name |
|--------|--------|----------|
| `BOOT_1.1_BootstrapBob` | `BOOT_01` | Bootstrap Bob |
| `CRUS_2.1_SocialJusticeSarah` | `CRUS_01` | Woke Wendy |
| `SCALE_3.1_FairMindedFred` | `SCALE_01` | Evidence Eric |

**Note**: The import script uses persona names as the unique identifier, not IDs. This allows for seamless updates without orphaning existing juror-persona mappings.

## Backward Compatibility

### Existing Data
- ✅ Existing `JurorPersonaMapping` records remain intact
- ✅ Old persona records can be marked inactive (`isActive = false`)
- ✅ New personas are created with `version = 2`

### API Compatibility
- ✅ GET `/api/personas` returns both old and new personas
- ✅ Filter by `version = 2` to get only V2 personas
- ✅ New fields are nullable, so old code won't break

## API Endpoint Updates

### Get All Personas (with new fields)

```typescript
GET /api/personas

Response:
{
  "personas": [
    {
      "id": "uuid",
      "name": "Bootstrap Bob",
      "archetype": "bootstrapper",
      "instantRead": "Classic self-made man. Will blame plaintiff for not being careful.",
      "archetypeVerdictLean": "STRONG DEFENSE",
      "plaintiffDangerLevel": 5,
      "defenseDangerLevel": 1,
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
      }
    }
  ]
}
```

### Get Persona Details

```typescript
GET /api/personas/:id

// Returns full persona with all new fields
```

### Get Archetypes

```typescript
GET /api/archetypes

// Returns list of all 10 archetypes with metadata
```

### Get Archetypes with Personas

```typescript
GET /api/archetypes/:archetype/personas

// Returns all personas for a specific archetype
```

## UI Integration Points

### 1. Juror Research Panel
- Show `instantRead` as quick summary
- Display danger ratings with visual indicators (1-5 scale)
- Show `phrasesYoullHear` for voir dire recognition

### 2. Persona Selection
- Filter by archetype
- Show verdict lean with color coding
- Display instant read for quick scanning

### 3. Archetype Classification
- Use `archetypeHowToSpot` for detection guidance
- Show `archetypeWhatTheyBelieve` for understanding
- Display `archetypeDeliberationBehavior` for strategy

### 4. Strategic Guidance
- Show `strikeOrKeep` recommendations by attorney side
- Display verdict prediction with probability
- Highlight plaintiff/defense danger levels

## Cost Implications

This is a **data update only** - no AI API calls required:
- ❌ No Claude API usage
- ✅ Pure database import
- ✅ One-time operation
- ✅ Can be re-run safely (upserts)

## Troubleshooting

### Migration Fails
```bash
# Reset and try again
cd packages/database
npx prisma migrate reset
npx prisma migrate dev
```

### Import Errors
Check the error messages:
- **File not found**: Verify `Persona Updates/` directory exists
- **Validation failed**: Check JSON structure matches schema
- **Database error**: Verify DATABASE_URL is correct

### Duplicate Personas
The script uses persona names as unique identifiers. If you see duplicates:
1. Run with `--dry-run` to preview
2. Manually deactivate old personas in Prisma Studio
3. Re-run import

## Rollback

If you need to rollback:

```bash
# Rollback migration
cd packages/database
npx prisma migrate resolve --rolled-back 20260128135013_add_persona_v2_fields

# Delete V2 personas
npx prisma studio
# Filter: version = 2
# Bulk delete
```

## Next Steps

After successful import:

1. ✅ Update API endpoints to expose new fields
2. ✅ Update frontend components to display new data
3. ✅ Update archetype classification prompts to use new structure
4. ✅ Update persona suggestion prompts to reference new fields
5. ✅ Update focus group simulation to use new deliberation behaviors
6. ✅ Document new UI features in user guides

## Questions?

See:
- [ARCHETYPE_SYSTEM_SUMMARY.md](../ARCHETYPE_SYSTEM_SUMMARY.md) - Original archetype documentation
- [CURRENT_STATE.md](../CURRENT_STATE.md) - Project status
- [packages/types/src/archetype-v2.ts](../packages/types/src/archetype-v2.ts) - Type definitions
