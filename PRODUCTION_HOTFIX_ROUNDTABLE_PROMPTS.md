# 🚨 Production Hotfix: Seed Roundtable Prompts

**Issue:** Roundtable conversations failing in production with "Prompt not found" errors
**Root Cause:** Production database missing roundtable prompt seeds
**Priority:** CRITICAL - Feature completely broken in production

---

## Quick Fix (Railway CLI)

### Option 1: Run Seed Script via Railway CLI

```bash
# 1. Install Railway CLI (if not already installed)
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Link to your project
cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine"
railway link

# 4. Run the seed script against production database
railway run npx tsx scripts/add-roundtable-prompts.ts

# This will:
# - Connect to production DATABASE_URL
# - Seed all 5 roundtable prompts
# - Set correct model: claude-sonnet-4-20250514
```

---

## Option 2: Run Locally with Production DATABASE_URL

```bash
# 1. Get production DATABASE_URL from Railway
# Go to: Railway Dashboard → Project → Variables → DATABASE_URL

# 2. Run seed script with production URL
cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine"

DATABASE_URL="postgresql://..." npx tsx scripts/add-roundtable-prompts.ts

# Replace the DATABASE_URL with your actual production connection string
```

---

## Option 3: Deploy Seed Job to Railway

### Create One-Time Job Service

1. **Create new service in Railway:**
   - Go to Railway Dashboard
   - Click "+ New Service"
   - Select "Empty Service"
   - Name it: `seed-roundtable-prompts`

2. **Configure the service:**
   - **Build Command:** `npm install`
   - **Start Command:** `npx tsx scripts/add-roundtable-prompts.ts`
   - **Root Directory:** `/`
   - **Variables:** Link same DATABASE_URL as api-gateway

3. **Deploy:**
   - Push to trigger deployment
   - Service will run once and seed prompts
   - Delete service after successful completion

---

## Verification

After running the seed script, verify prompts exist:

```sql
-- Check if prompts were created
SELECT service_id, name, created_at
FROM prompts
WHERE service_id LIKE 'roundtable%'
ORDER BY service_id;

-- Expected results (5 prompts):
-- roundtable-conversation-synthesis
-- roundtable-conversation-turn
-- roundtable-initial-reaction
-- roundtable-persona-system
-- roundtable-statement-analysis

-- Check prompt versions have correct model
SELECT
  p.service_id,
  pv.version,
  pv.config->>'model' as model
FROM prompts p
JOIN prompt_versions pv ON p.current_version_id = pv.id
WHERE p.service_id LIKE 'roundtable%';

-- All should show: claude-sonnet-4-20250514
```

---

## Test After Seeding

1. Navigate to production app
2. Go to any case → Focus Groups tab
3. Create or select a session
4. Click "Start Roundtable Discussion"
5. Should generate real AI responses (not mock data)

---

## Why This Happened

The production database wasn't properly migrated/seeded when the roundtable feature was deployed:

1. ✅ Code deployed to Railway (api-gateway, prompt-service)
2. ✅ Frontend deployed to Vercel
3. ❌ Database prompts never seeded

**Prevention:**
- Add seed script to Railway deployment process
- Create migration checklist for new features
- Add health check endpoint that verifies required prompts exist

---

## Prompts Being Seeded

1. **`roundtable-initial-reaction`** - First impressions of argument
2. **`roundtable-conversation-turn`** - Dynamic deliberation responses
3. **`roundtable-statement-analysis`** - Analyzes individual statements
4. **`roundtable-conversation-synthesis`** - Synthesizes full conversation
5. **`roundtable-persona-system`** - System prompt template (shared)

**Model:** `claude-sonnet-4-20250514`

---

## Alternative: SQL Direct Insert

If the seed script fails, you can manually insert prompts via SQL:

**⚠️ WARNING:** This is complex and error-prone. Use seed script if possible.

```sql
-- See scripts/add-roundtable-prompts.ts for full SQL
-- Not recommended - use seed script instead
```

---

## Status

- [ ] Seed script executed
- [ ] Prompts verified in database
- [ ] Test conversation in production
- [ ] Confirm real AI responses (not mock data)
- [ ] Document for future deployments

---

## Support

**If seed script fails:**
1. Check Railway logs for connection errors
2. Verify DATABASE_URL environment variable
3. Ensure Prisma client is generated: `npx prisma generate`
4. Check database has `prompts` and `prompt_versions` tables

**Contact:** Alex McLaughlin
**Last Updated:** January 23, 2026
