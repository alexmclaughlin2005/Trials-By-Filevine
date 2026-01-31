# Persona Import Guide

**Last Updated:** January 22, 2026

## Overview

This guide explains how to import juror personas from JSON files into the database. The system supports importing detailed archetype-based persona definitions that power the jury simulation and strategic recommendation features.

## Current Status

### What's Imported
- ✅ 2 Bootstrapper personas (Bootstrap Bob, Immigrant Dream Ivan)
- ✅ 9 archetype simulation configurations
- ✅ Influence matrix, conflict matrix, alliance matrix
- ✅ Deliberation parameters, evidence processing weights
- ✅ Damages calculation rules, regional/case-type modifiers

### Database State
```
Total Personas: 11 active
├─ bootstrapper: 2 personas (system)
└─ null: 9 personas (from previous seed, need archetype assignment)

Archetype Configs: 9 active configurations
```

## File Structure

### Persona Files Location
```
Juror Personas/
├── bootstrappers_sample.json       # 2 bootstrapper personas ✅
├── simulation_config.json          # Archetype configuration ✅
├── ENGINEERING_HANDOFF.md          # Documentation
└── PICKUP_STATUS.md                # Project status (~69 personas expected)
```

### Expected Archetype Files
Based on PICKUP_STATUS.md, the system was designed for ~69 personas across 10 archetypes:

| Archetype | Count | File Expected | Status |
|-----------|-------|--------------|--------|
| Bootstrapper (Personal Responsibility) | 10 | `bootstrappers.json` | ⚠️ Only sample (2 of 10) |
| Crusader (Systemic Thinker) | 10 | `crusaders.json` | ❌ Missing |
| Scale-Balancer (Fair-Minded) | 8 | `scale_balancers.json` | ❌ Missing |
| Captain (Authoritative Leader) | 7 | `captains.json` | ❌ Missing |
| Chameleon (Compliant Follower) | 6 | `chameleons.json` | ❌ Missing |
| Scarred (Wounded Veteran) | 7 | `scarred.json` | ❌ Missing |
| Calculator (Numbers Person) | 6 | `calculators.json` | ❌ Missing |
| Heart (Empathic Connector) | 7 | `hearts.json` | ❌ Missing |
| Trojan Horse (Stealth Juror) | 4 | `trojan_horses.json` | ❌ Missing |
| Maverick (Nullifier) | 4 | `mavericks.json` | ❌ Missing |
| **Total** | **69** | | **2 imported** |

## Persona JSON Format

### Archetype File Structure
```json
{
  "archetype": "bootstrapper",
  "archetype_display_name": "The Bootstrapper",
  "archetype_tagline": "Pull yourself up by your bootstraps",
  "plaintiff_danger_level": 5,
  "defense_danger_level": 1,
  "archetype_centroids": {
    "attribution_orientation": 1.5,
    "just_world_belief": 4.5,
    // ... 8 dimensions total
  },
  "personas": [
    {
      "persona_id": "BOOT_1.1_BootstrapBob",
      "nickname": "Bootstrap Bob",
      "full_name": "Gary Hendricks",
      "tagline": "Nobody owes you anything",
      "archetype": "bootstrapper",
      "archetype_strength": 0.9,
      "secondary_archetype": null,
      "variant": "CLASSIC",
      "demographics": { /* age, gender, location, etc */ },
      "dimensions": { /* 8 psychological dimension scores */ },
      "life_experiences": [ /* array of strings */ ],
      "characteristic_phrases": [ /* typical speech patterns */ ],
      "voir_dire_responses": { /* predicted Q&A */ },
      "deliberation_behavior": { /* predicted role */ },
      "simulation_parameters": { /* liability thresholds, etc */ },
      "case_type_predictions": { /* case-specific behavior */ },
      "strategy_guidance": { /* attorney recommendations */ },
      "regional_notes": { /* geographic variations */ }
    }
  ]
}
```

### Required Fields
- `persona_id` - Unique identifier (e.g., "BOOT_1.1_BootstrapBob")
- `nickname` - Short name (e.g., "Bootstrap Bob")
- `full_name` - Full character name
- `archetype` - One of 10 archetype types
- `archetype_strength` - 0.0 to 1.0 (how strongly they match)

### Optional but Recommended
- `demographics` - Age, gender, location, occupation, income, etc.
- `dimensions` - 8 psychological dimension scores (1-5 scale)
- `life_experiences` - Key formative experiences
- `characteristic_phrases` - Typical things they say
- `voir_dire_responses` - How they answer common questions
- `deliberation_behavior` - Predicted role in deliberation
- `simulation_parameters` - Used by focus group engine
- `strategy_guidance` - For attorney recommendations

## Import Commands

### Import All Personas
```bash
npm run import-personas
```

This script:
1. Reads all `.json` files from `Juror Personas/` directory
2. Imports archetype persona definitions
3. Imports simulation configuration
4. Skips duplicates (based on name + archetype)
5. Shows summary of imported/skipped personas

### List Current Personas
```bash
npm run list-personas
```

Shows all personas grouped by archetype with danger levels.

### Generate Prisma Client (if needed)
```bash
npm run db:generate
```

## Database Schema

Personas are stored in the `personas` table with the following structure:

```typescript
{
  id: string                    // UUID
  name: string                  // Full name
  nickname: string              // Short name
  description: string           // Brief description
  tagline: string               // Characteristic phrase

  // Archetype Classification
  archetype: string             // bootstrapper, crusader, etc.
  archetypeStrength: Decimal    // 0.00 - 1.00
  secondaryArchetype: string    // Optional
  variant: string               // e.g., "MILITARY_PROCEDURAL"

  // Source
  sourceType: string            // system | ai_generated | user_created

  // Rich Data (JSON fields)
  demographics: Json            // Age, gender, location, etc.
  dimensions: Json              // 8 psychological dimensions
  lifeExperiences: Json         // Formative experiences
  characteristicPhrases: Json   // Speech patterns
  voirDireResponses: Json       // Predicted Q&A
  deliberationBehavior: Json    // Predicted role
  simulationParams: Json        // For simulation engine
  caseTypeModifiers: Json       // Case-specific behavior
  regionalModifiers: Json       // Geographic variations

  // Strategic Guidance
  plaintiffDangerLevel: int     // 1-5 scale
  defenseDangerLevel: int       // 1-5 scale
  causeChallenge: Json          // Vulnerability and scripts
  strategyGuidance: Json        // Attorney recommendations

  // Metadata
  isActive: boolean
  version: int
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Creating New Persona Files

### Step 1: Choose Archetype
Pick one of the 10 archetypes that needs more personas:
- Crusader (10 needed)
- Scale-Balancer (8 needed)
- Captain (7 needed)
- Scarred (7 needed)
- Heart (7 needed)
- Calculator (6 needed)
- Chameleon (6 needed)
- Trojan Horse (4 needed)
- Maverick (4 needed)
- Bootstrapper (8 more to complete set of 10)

### Step 2: Use Template
Copy `bootstrappers_sample.json` as a template and modify:
1. Change `archetype` and `archetype_display_name`
2. Update `plaintiff_danger_level` and `defense_danger_level`
3. Adjust `archetype_centroids` for the archetype
4. Create 4-10 personas with varied demographics

### Step 3: Persona Naming Convention
Use alliterative names: `[Descriptor] [First Name]`
- Crusader examples: "Activist Angela", "Union-Strong Ulysses"
- Calculator examples: "Data-Driven David", "Actuary Andrew"
- Heart examples: "Counselor Carmen", "Nurse Nancy"

### Step 4: Set Dimension Scores
Each persona needs 8 dimension scores (1-5 scale):
- `attribution_orientation` - 1=dispositional, 5=situational
- `just_world_belief` - 1=low, 5=high
- `authoritarianism` - 1=low, 5=high
- `institutional_trust` - By entity (corporations, medical, legal, insurance)
- `litigation_attitude` - 1=anti-lawsuit, 5=pro-plaintiff
- `leadership_tendency` - 1=follower, 5=leader
- `cognitive_style` - 1=narrative, 5=analytical
- `damages_orientation` - 1=conservative, 5=liberal

### Step 5: Test Import
```bash
npm run import-personas
npm run list-personas
```

## Simulation Configuration

The `simulation_config.json` file contains:

### Archetype Influence Matrix
How much each archetype influences others during deliberation (0.0-1.0)

### Conflict Matrix
Likelihood of direct conflict between archetype pairs

### Alliance Matrix
Natural alliance formations (e.g., Bootstrapper + Calculator)

### Deliberation Parameters
- First ballot majority rule (90% becomes final verdict)
- Foreperson selection factors
- Speaking time distribution by archetype
- Position shift thresholds
- Hung jury risk factors

### Evidence Processing
How each archetype weights different evidence types:
- Plaintiff/defendant testimony
- Expert witnesses
- Documentary evidence
- Emotional appeals
- Statistical data

### Damages Calculation
- Economic damages acceptance rates
- Non-economic multipliers by archetype
- Punitive damage inclinations
- Anchoring effects

### Regional & Case-Type Modifiers
Adjustments for geography and case type (e.g., Texas tort reform culture)

## Next Steps

### Immediate (To Complete Import)
1. **Locate remaining persona files** - Check for `crusaders.json`, `calculators.json`, etc.
2. **Or create them** - Use `bootstrappers_sample.json` as template
3. **Import all personas** - Run `npm run import-personas`
4. **Verify database** - Run `npm run list-personas`

### Future Enhancements
1. **Web UI for persona management** - Create/edit personas through frontend
2. **AI persona generation** - Use Claude to generate new persona variations
3. **Regional expansion** - Add more geographic variations
4. **Case-type expansion** - Add more case-specific behavior predictions
5. **Demographic diversity** - Add underrepresented demographic variations

## Troubleshooting

### "Persona already exists" - Skipped
This is normal. The script checks for duplicates by name + archetype.

### "Config already exists" - Updated
Simulation configs are updated on each run, not duplicated.

### Prisma Client Errors
Run `npm run db:generate` to regenerate the Prisma client.

### Missing Fields
All JSON fields are optional except `persona_id`, `nickname`, `full_name`, and `archetype`.

## Related Documentation
- [ARCHETYPE_SYSTEM_SUMMARY.md](../ARCHETYPE_SYSTEM_SUMMARY.md) - Overview of 10 archetypes
- [ENGINEERING_HANDOFF.md](../Juror Personas/ENGINEERING_HANDOFF.md) - Technical specifications
- [PICKUP_STATUS.md](../Juror Personas/PICKUP_STATUS.md) - Development status
- [ai_instructions.md](../ai_instructions.md) - Project structure

## Support
For questions or issues with persona import:
1. Check this guide first
2. Review sample files in `Juror Personas/`
3. Run `npm run list-personas` to see current state
4. Check Prisma schema in `packages/database/prisma/schema.prisma`
