# Deploy Personas to Production - Complete Guide

**Last Updated:** January 23, 2026

---

## Overview

This guide shows you how to deploy all 67 personas and archetype configurations to:
1. ✅ Local development database (PostgreSQL on localhost)
2. ✅ Production database (Railway PostgreSQL)

---

## Current State

### Local Development Database
- **Status:** ✅ Already has 67 personas
- **Database:** `postgresql://localhost:5432/trialforge`
- **Location:** Your local machine
- **Command to verify:** `npm run list-personas`

### Production Database (Railway)
- **Status:** ⚠️ Needs personas imported
- **Database:** Railway PostgreSQL
- **Location:** Cloud hosted
- **Command to deploy:** `npm run deploy-personas`

---

## Step-by-Step Deployment

### Step 1: Verify Local Database is Ready

Your local database already has all the personas. Let's confirm:

```bash
# Check local database
npm run list-personas
```

You should see:
- 67 active personas
- All 10 archetypes represented
- 9 configuration entries

✅ **Local database is ready!**

---

### Step 2: Get Production Database URL from Railway

#### Option A: Using Railway CLI (Recommended)

```bash
# Install Railway CLI if you haven't
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project (if not already linked)
railway link

# Get the database URL
railway variables get DATABASE_URL
```

#### Option B: Using Railway Dashboard

1. Go to https://railway.app
2. Navigate to your project
3. Click on your PostgreSQL service
4. Go to "Variables" tab
5. Copy the `DATABASE_URL` value

The URL will look like:
```
postgresql://postgres:PASSWORD@HOST.railway.app:5432/railway
```

---

### Step 3: Deploy to Production Database

#### Option 1: Using Environment Variable

```bash
# Set the production DATABASE_URL and deploy
DATABASE_URL="postgresql://postgres:xxx@xxx.railway.app:5432/railway" npm run deploy-personas
```

#### Option 2: Using Railway CLI

```bash
# Deploy using Railway's environment
railway run npm run deploy-personas
```

#### Option 3: Set Environment Variable First

```bash
# Export the variable (lasts for current terminal session)
export DATABASE_URL="postgresql://postgres:xxx@xxx.railway.app:5432/railway"

# Then deploy
npm run deploy-personas
```

---

### Step 4: Verify Production Deployment

After deployment completes, you should see:

```
🚀 Deploying Personas to Production Database
============================================================
🔌 Testing database connection...
✅ Connected to database successfully

📂 Reading file: bootstrappers.json
📊 Archetype: The Bootstrapper
   Personas to import: 20
   ✅ Imported: Bootstrap Bob
   ✅ Imported: Immigrant Dream Ivan
   ...

============================================================
📊 Deployment Summary:
   ✅ Personas imported: 67
   ⏭️  Personas skipped: 0
   📋 Config entries: 9
============================================================

📈 Total active personas in database: 67

📊 Personas by Archetype:
   bootstrapper: 20 personas
   crusader: 7 personas
   scale_balancer: 4 personas
   captain: 7 personas
   chameleon: 4 personas
   scarred: 6 personas
   calculator: 2 personas
   heart: 6 personas
   trojan_horse: 4 personas
   maverick: 4 personas

✨ Deployment complete!
```

---

## What Gets Deployed

### Personas (67 total)
All persona data including:
- ✅ Demographics (age, gender, location, occupation, income, etc.)
- ✅ Psychological dimensions (8 dimensions on 1-5 scale)
- ✅ Life experiences and formative events
- ✅ Characteristic phrases and speech patterns
- ✅ Voir dire Q&A responses
- ✅ Deliberation behavior predictions
- ✅ Simulation parameters
- ✅ Case-type predictions
- ✅ Strategic guidance for attorneys
- ✅ Regional variations

### Archetype Configurations (9 configs)
- ✅ Influence matrix (how archetypes influence each other)
- ✅ Conflict matrix (likelihood of conflicts)
- ✅ Alliance matrix (natural alliances)
- ✅ Deliberation parameters (foreperson selection, speaking time, etc.)
- ✅ Evidence processing weights (by archetype)
- ✅ Damages calculation rules
- ✅ Jury composition scenarios
- ✅ Regional modifiers (Texas, California, etc.)
- ✅ Case-type modifiers (med mal, product liability, etc.)

---

## Deployment Safety Features

### Duplicate Prevention
The deployment script:
- ✅ Checks for existing personas before importing
- ✅ Skips duplicates automatically
- ✅ Updates configs instead of creating duplicates
- ✅ Shows skip count in summary

### Connection Validation
The script:
- ✅ Tests database connection before proceeding
- ✅ Shows clear error messages if connection fails
- ✅ Exits gracefully on errors
- ✅ Hides passwords in logs

### Safe to Run Multiple Times
You can run the deployment script multiple times safely:
- First run: Imports all 67 personas
- Second run: Skips all 67 (already exist)
- Updates configs each time

---

## Troubleshooting

### Error: "DATABASE_URL environment variable not set"

**Solution:**
```bash
# Make sure to set DATABASE_URL
DATABASE_URL="your_production_url" npm run deploy-personas
```

### Error: "Failed to connect to database"

**Possible causes:**
1. Wrong DATABASE_URL
2. Database is down
3. Network/firewall issue
4. Wrong password

**Solution:**
```bash
# Test connection with psql
psql "postgresql://user:pass@host:port/db"

# Or test with Prisma
npx prisma db pull --schema=packages/database/prisma/schema.prisma
```

### Error: "Generated directory not found"

**Solution:**
```bash
# Run the converter first
npm run convert-personas-v2

# Then deploy
DATABASE_URL="..." npm run deploy-personas
```

### Deployment Hangs or Times Out

**Possible causes:**
1. Railway database is paused/sleeping
2. Network issue
3. Too many personas to import at once

**Solution:**
```bash
# Wake up the database first by connecting to it
railway run psql

# Then try deployment again
railway run npm run deploy-personas
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] ✅ Local database has all 67 personas (`npm run list-personas`)
- [ ] ✅ All persona JSON files exist in `Juror Personas/generated/`
- [ ] ✅ Simulation config exists in `Juror Personas/simulation_config.json`
- [ ] ✅ Railway project is accessible
- [ ] ✅ Production DATABASE_URL is available
- [ ] ✅ Production database is awake/active

Deploy:
```bash
DATABASE_URL="production_url" npm run deploy-personas
```

Verify:
- [ ] ✅ Deployment shows "67 personas imported" (or skipped if already exist)
- [ ] ✅ Deployment shows "9 config entries"
- [ ] ✅ No error messages
- [ ] ✅ Summary shows all 10 archetypes

Test in Production:
- [ ] ✅ Test archetype classification endpoint
- [ ] ✅ Test persona suggester endpoint
- [ ] ✅ Test focus group simulation
- [ ] ✅ Verify personas appear in frontend

---

## Environment-Specific Commands

### Local Development
```bash
# Your local PostgreSQL database
npm run list-personas
npm run import-personas
npm run cleanup-personas
```

### Production (Railway)
```bash
# Deploy to Railway database
DATABASE_URL="railway_url" npm run deploy-personas

# Or using Railway CLI
railway run npm run deploy-personas

# List personas in production
railway run npm run list-personas
```

---

## Database Schema

Both local and production databases use the same schema:

```prisma
model Persona {
  id                   String   @id @default(uuid())
  name                 String
  nickname             String?
  description          String?
  tagline              String?
  archetype            String?
  archetypeStrength    Decimal?
  secondaryArchetype   String?
  variant              String?
  sourceType           String   // "system" | "ai_generated" | "user_created"

  // Rich JSON fields
  demographics         Json?
  dimensions           Json?
  lifeExperiences      Json?
  characteristicPhrases Json?
  voirDireResponses    Json?
  deliberationBehavior Json?
  simulationParams     Json?
  caseTypeModifiers    Json?
  regionalModifiers    Json?

  // Strategic fields
  plaintiffDangerLevel Int?
  defenseDangerLevel   Int?
  causeChallenge       Json?
  strategyGuidance     Json?

  // Metadata
  isActive             Boolean  @default(true)
  version              Int      @default(1)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model ArchetypeConfig {
  id          String   @id @default(uuid())
  configType  String
  version     String
  data        Json
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Post-Deployment Testing

After deploying to production, test these features:

### 1. Archetype Classification
```bash
curl -X POST https://your-app.vercel.app/api/classify-archetype \
  -H "Content-Type: application/json" \
  -d '{"responses": {...}}'
```

### 2. Persona Suggester
```bash
curl https://your-app.vercel.app/api/personas?archetype=bootstrapper
```

### 3. Focus Group Simulation
```bash
curl -X POST https://your-app.vercel.app/api/focus-group/simulate \
  -H "Content-Type: application/json" \
  -d '{"jurors": [...], "caseContext": {...}}'
```

---

## Maintenance

### Adding New Personas

1. Add to markdown files or create JSON directly
2. Convert if needed: `npm run convert-personas-v2`
3. Deploy to local: `npm run import-personas`
4. Deploy to production: `DATABASE_URL="..." npm run deploy-personas`

### Updating Existing Personas

1. Delete old version from database
2. Update JSON file
3. Re-import: `npm run import-personas`
4. Deploy to production: `DATABASE_URL="..." npm run deploy-personas`

### Backup Personas

```bash
# Export from production
railway run npx prisma db pull

# Or export as JSON
railway run "psql -c 'SELECT * FROM personas' --json" > personas-backup.json
```

---

## Quick Reference

### Local Development
```bash
npm run list-personas          # View personas
npm run import-personas        # Import to local DB
npm run cleanup-personas       # Remove duplicates
```

### Production Deployment
```bash
# Get Railway DATABASE_URL
railway variables get DATABASE_URL

# Deploy personas
DATABASE_URL="..." npm run deploy-personas

# Or using Railway CLI
railway run npm run deploy-personas
```

### Verification
```bash
# Local count
npm run list-personas

# Production count
railway run npm run list-personas
```

---

## Success Criteria

✅ Local database has 67 personas
✅ Production database has 67 personas
✅ All 10 archetypes represented in both
✅ 9 configuration entries in both
✅ No duplicate personas
✅ All features working (classification, suggestions, simulations)

---

## Support

If you encounter issues:
1. Check this guide first
2. Verify DATABASE_URL is correct
3. Test database connection
4. Check Railway logs
5. Review error messages carefully

Common issues are covered in the Troubleshooting section above.

---

**Next Steps:**
Once deployment is complete, your production app will have access to all 67 personas and can power the full jury intelligence platform! 🚀
