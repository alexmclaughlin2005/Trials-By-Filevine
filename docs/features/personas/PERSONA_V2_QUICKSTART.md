# Persona V2.0 - Quick Start Guide

**🚀 Get up and running in 5 minutes**

---

## TL;DR

You have 60 updated personas across 10 archetypes ready to import. Everything is coded and ready—just run these commands:

```bash
# 1. Apply database migration
cd packages/database && npx prisma migrate dev && cd ../..

# 2. Preview import (no changes made)
npm run import-personas-v2 -- --dry-run

# 3. Import personas
npm run import-personas-v2

# 4. Verify (opens Prisma Studio)
cd packages/database && npx prisma studio
```

Done! 60 personas imported with enhanced fields.

---

## What You're Getting

### 10 Archetypes
- **Bootstrapper** - Personal responsibility hardliner (STRONG DEFENSE)
- **Crusader** - Anti-corporate warrior (STRONG PLAINTIFF)
- **Scale-Balancer** - Fair evaluator (NEUTRAL)
- **Captain** - Dominant leader (VARIES)
- **Chameleon** - Follower (FOLLOWS THE ROOM)
- **Scarred** - Experience-driven (VARIES)
- **Calculator** - Numbers-focused (SLIGHT DEFENSE)
- **Heart** - Empathy-driven (STRONG PLAINTIFF)
- **Trojan Horse** - Hidden bias (HIDDEN)
- **Maverick** - Wildcard nullifier (UNPREDICTABLE)

### 60 Personas
Each with:
- ✅ **Instant Read** - One-sentence summary
- ✅ **Danger Levels** - 1-5 scale for plaintiff/defense
- ✅ **Phrases You'll Hear** - Voir dire recognition patterns
- ✅ **Verdict Prediction** - Liability probability + damages
- ✅ **Strike/Keep Guidance** - Strategy by attorney side
- ✅ **Demographics** - Age, occupation, politics, etc.
- ✅ **Backstory** - Life experience context

---

## Step-by-Step

### 1. Database Migration (30 seconds)

```bash
cd packages/database
npx prisma migrate dev
```

**What it does:** Adds 8 new columns to `Persona` table

**Expected output:**
```
✔ Database synchronized with Prisma schema
✔ Generated Prisma Client
```

### 2. Test Import - Dry Run (10 seconds)

```bash
npm run import-personas-v2 -- --dry-run
```

**What it does:** Validates files and shows what would happen (no changes)

**Expected output:**
```
📦 Persona V2.0 Import
🔍 DRY RUN MODE - No changes will be made

📄 Processing bootstrappers.json...
✅ Validated (10 personas)
   ✨ [DRY RUN] Would create: Bootstrap Bob (BOOT_01)
   ✨ [DRY RUN] Would create: Tough-Love Tina (BOOT_02)
   ...

📊 Import Summary
Files processed: 10/10
Personas imported: 60
Errors: 0
```

### 3. Import Personas (20 seconds)

```bash
npm run import-personas-v2
```

**What it does:** Actually imports personas into database

**Expected output:**
```
📦 Persona V2.0 Import

📄 Processing bootstrappers.json...
✅ Validated (10 personas)
   ✨ Created: Bootstrap Bob (BOOT_01)
   ✨ Created: Tough-Love Tina (BOOT_02)
   ...

📊 Import Summary
Files processed: 10/10
Personas imported: 60
Personas skipped: 0
Errors: 0

✅ Import complete!
```

### 4. Verify in Database (10 seconds)

```bash
cd packages/database
npx prisma studio
```

**In Prisma Studio:**
1. Click "Persona" table
2. Add filter: `version` `equals` `2`
3. Should see ~60 rows
4. Click any row to see all fields populated

---

## New Fields You'll See

### Archetype-Level
- `archetypeVerdictLean` - "STRONG DEFENSE", "STRONG PLAINTIFF", etc.
- `archetypeWhatTheyBelieve` - Core belief system
- `archetypeDeliberationBehavior` - How they act in deliberation
- `archetypeHowToSpot` - Array of recognition indicators

### Persona-Level
- `instantRead` - "Classic self-made man. Will blame plaintiff..."
- `phrasesYoullHear` - ["Nobody put a gun to their head", ...]
- `verdictPrediction` - {liability: 0.25, damages: "minimum", role: "vocal"}
- `strikeOrKeep` - {plaintiff: "MUST STRIKE", defense: "KEEP"}

---

## Example Persona: Bootstrap Bob

```json
{
  "name": "Bootstrap Bob",
  "archetype": "bootstrapper",
  "instantRead": "Classic self-made man. Will blame plaintiff for not being careful.",

  "archetypeVerdictLean": "STRONG DEFENSE",
  "plaintiffDangerLevel": 5,
  "defenseDangerLevel": 1,

  "phrasesYoullHear": [
    "Nobody put a gun to their head",
    "At the end of the day, you're responsible for yourself",
    "Play stupid games, win stupid prizes"
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

  "demographics": {
    "age": 58,
    "gender": "male",
    "occupation": "Regional Sales Manager",
    "income": 145000,
    "politics": "Republican"
  }
}
```

---

## Troubleshooting

### Migration fails
```bash
# Reset and retry
cd packages/database
npx prisma migrate reset
npx prisma migrate dev
```

### Import script not found
```bash
# Make sure you're in project root
pwd  # Should end with "Trials by Filevine"
npm run import-personas-v2
```

### Personas directory not found
```bash
# Check directory exists
ls "Persona Updates/"

# Should see:
# archetype_master_reference.json
# bootstrappers.json
# crusaders.json
# ... 8 more files
```

### Import completes but shows 0 personas
- Check database connection (DATABASE_URL in .env)
- Verify Persona Updates directory has all 10 JSON files
- Run with `--dry-run` flag to see validation errors

---

## Next Steps

### Immediate
1. ✅ Import personas (you just did this!)
2. Test API endpoint: `curl http://localhost:3001/api/personas?version=2`
3. Review data in Prisma Studio

### This Week
1. Update API endpoints to return new fields
2. Create UI components to display new data
3. Update AI prompts to use new structure

### Next Week
1. Deploy to staging
2. User acceptance testing
3. Deploy to production

---

## Full Documentation

For complete details, see:

- **[PERSONA_V2_INTEGRATION_SUMMARY.md](./docs/PERSONA_V2_INTEGRATION_SUMMARY.md)** - Complete overview
- **[PERSONA_V2_IMPORT_GUIDE.md](./docs/PERSONA_V2_IMPORT_GUIDE.md)** - Detailed import guide
- **[API_UPDATES_PERSONA_V2.md](./docs/API_UPDATES_PERSONA_V2.md)** - API implementation guide

---

## Need Help?

**Common Issues:**
- Database connection: Check `packages/database/.env`
- File not found: Verify `Persona Updates/` directory location
- Validation errors: Check JSON structure matches schema

**Support:**
- Check error messages in import output
- Review validation errors (if any)
- See troubleshooting section in [PERSONA_V2_IMPORT_GUIDE.md](./docs/PERSONA_V2_IMPORT_GUIDE.md)

---

**That's it!** You now have 60 enhanced personas ready to use. 🎉
