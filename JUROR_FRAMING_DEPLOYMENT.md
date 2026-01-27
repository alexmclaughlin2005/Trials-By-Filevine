# Juror Framing v5.0.0 - Production Deployment

**Date:** January 27, 2026
**Commit:** `eb5fa33`
**Status:** ⏳ Awaiting production database update

---

## ✅ Completed Steps

1. ✅ Created v5.0.0 juror framing prompts locally
2. ✅ Tested locally with all services running
3. ✅ Committed changes to git
4. ✅ Pushed to GitHub (main branch)

---

## 🚀 Production Deployment Steps

### Step 1: Wait for Railway Auto-Deploy

Railway automatically deploys when you push to `main`:

1. Go to [Railway Dashboard](https://railway.app/)
2. Check your services:
   - `prompt-service` - Should show "Deploying..."
   - `api-gateway` - May also redeploy if watch paths triggered
3. Wait for deployments to complete (~3-5 minutes)
4. Look for "Deployed" status with green checkmark

### Step 2: Run Migration Script in Production

**Option A: Railway CLI (Recommended)**

```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run the migration script on Railway
railway run npx tsx scripts/update-roundtable-prompts-juror-framing.ts

# You should see:
# 🎭 Updating roundtable prompts with juror framing (v5.0.0)...
# ✅ Updated initial reaction prompt with juror framing (v5.0.0)
# ✅ Updated conversation turn prompt with juror framing (v5.0.0)
# ✨ Juror framing update complete!
```

**Option B: Railway Dashboard (Alternative)**

1. Go to Railway project → `prompt-service`
2. Click **"Settings"** → **"Service"**
3. Under "Start Command", temporarily change to:
   ```
   npx tsx scripts/update-roundtable-prompts-juror-framing.ts && npx tsx src/index.ts
   ```
4. Click **"Deploy"**
5. Check logs for success message
6. Revert start command back to: `npx tsx src/index.ts`
7. Deploy again to restart service normally

**Option C: Database Direct (If Railway CLI doesn't work)**

1. Go to Railway → PostgreSQL database
2. Click **"Data"** → **"Query"**
3. Run the update script manually (see appendix below)

### Step 3: Verify Production Deployment

**Check Prompt Versions:**

```bash
# Test from your local machine
curl -X GET "https://your-prompt-service.railway.app/health"

# Should return: {"status":"ok",...}
```

**Or check directly in Railway logs:**

1. Go to Railway → `prompt-service`
2. Click **"Deployments"** → Latest deployment
3. View logs
4. Look for: "Prompt Service listening on..."

### Step 4: Restart Services (Important!)

After updating the database, restart both services to pick up new prompts:

**Via Railway Dashboard:**
1. Go to `prompt-service` → Click **"⋮"** → **"Restart"**
2. Go to `api-gateway` → Click **"⋮"** → **"Restart"**

**Or via Railway CLI:**
```bash
railway service restart prompt-service
railway service restart api-gateway
```

### Step 5: Test Production Focus Groups

1. Go to your production app: `https://your-app.vercel.app`
2. Navigate to: Cases → [Select case] → Focus Groups
3. Start a roundtable conversation
4. Verify personas act as jurors:
   - ✅ Emotional reactions: "This makes me angry," "I feel bad for..."
   - ✅ Personal questions: "I'm curious about...", "What were his injuries?"
   - ❌ NO lawyer talk: "subpoena," "dram shop," "preservation letters"

---

## 🔍 Verification Checklist

- [ ] Railway services deployed successfully
- [ ] Migration script ran without errors
- [ ] Prompt Service restarted
- [ ] API Gateway restarted
- [ ] Production focus group tested
- [ ] Personas respond as jurors, not lawyers
- [ ] No CORS errors in browser console
- [ ] Response times acceptable (<5s per statement)

---

## 🛠️ Troubleshooting

### Issue: Railway CLI Can't Find Project

```bash
# List your projects
railway list

# Link to specific project
railway link [project-id]
```

### Issue: Migration Script Fails in Production

Check Railway logs for error message:
```bash
railway logs -s prompt-service
```

Common errors:
- **Database connection timeout:** Check DATABASE_URL env var
- **Prisma client not generated:** Rebuild service
- **Permission denied:** Use Railway Dashboard method instead

### Issue: Prompts Still Using v4.0.0

1. Verify migration ran successfully:
   ```sql
   SELECT p."serviceId", pv.version, pv.config->>'temperature'
   FROM "Prompt" p
   JOIN "PromptVersion" pv ON p."currentVersionId" = pv.id
   WHERE p."serviceId" LIKE 'roundtable%';
   ```
   Should show v5.0.0 and temperature 0.5

2. Restart services (see Step 4)

3. Clear any Redis cache:
   ```bash
   railway run redis-cli FLUSHALL
   ```

### Issue: Personas Still Acting Like Lawyers

If after deployment personas still use legal jargon:

1. **Check active version in production:**
   ```bash
   curl https://your-prompt-service.railway.app/api/admin/prompts | grep -A 5 "roundtable"
   ```

2. **Lower temperature further:**
   Run this in production database:
   ```sql
   UPDATE "PromptVersion"
   SET config = jsonb_set(config, '{temperature}', '0.3')
   WHERE version = 'v5.0.0'
   AND "promptId" IN (
     SELECT id FROM "Prompt"
     WHERE "serviceId" LIKE 'roundtable%'
   );
   ```

3. **Check system prompt is applied:**
   View logs during conversation generation:
   ```bash
   railway logs -s api-gateway --filter "roundtable"
   ```

---

## 📊 Expected Changes After Deployment

### Before (v4.0.0):
```
"We should immediately send preservation letters to any potential
bars and restaurants. We need to subpoena the defendant's phone
records. The insurance company will want to settle to avoid
punitive damages."
```

### After (v5.0.0):
```
"This drunk driving story makes me really angry - texting while
drunk is so reckless. I feel bad for the surgeon's family. I'm
curious what his injuries were though - was he paralyzed or just
hurt?"
```

---

## 🔄 Future Adjustments

User noted we may need to make it "slightly less extreme and emotional."

**To adjust in v5.1.0 (future):**
1. Reduce emphasis on "gut feelings" and "anger"
2. Add language like "thoughtful reaction" instead of "emotional reaction"
3. Keep juror framing but tone down emotional intensity
4. Consider temperature 0.4 instead of 0.5

**To implement:**
```bash
# Create v5.1.0 with adjusted prompt
npx tsx scripts/update-roundtable-prompts-moderate-emotion.ts
```

---

## 📝 Rollback Plan (If Needed)

If v5.0.0 causes issues in production:

**Option 1: Rollback to v4.0.0 (Dissent Engagement)**
```sql
UPDATE "Prompt"
SET "currentVersionId" = (
  SELECT id FROM "PromptVersion"
  WHERE "promptId" = "Prompt".id
  AND version = 'v4.0.0'
)
WHERE "serviceId" IN ('roundtable-initial-reaction', 'roundtable-conversation-turn');
```

Then restart services.

**Option 2: Git Revert**
```bash
git revert eb5fa33
git push origin main
```

This will trigger Railway to redeploy without the changes.

---

## 📖 Related Documentation

- [SESSION_SUMMARY_2026-01-27_JUROR_FRAMING_FIX.md](./SESSION_SUMMARY_2026-01-27_JUROR_FRAMING_FIX.md) - Detailed explanation
- [scripts/update-roundtable-prompts-juror-framing.ts](./scripts/update-roundtable-prompts-juror-framing.ts) - Migration script
- [DEPLOYMENT.md](./apps/prompt-admin/DEPLOYMENT.md) - Prompt Admin deployment

---

## ✅ Deployment Complete When:

- [ ] Railway shows both services deployed
- [ ] Migration script completed successfully
- [ ] Services restarted
- [ ] Production focus group tested
- [ ] User confirms personas act as jurors
- [ ] This file moved to `docs/deployments/` for archival

---

**Deployed By:** Claude Sonnet 4.5
**Next Review:** After first production test
**Status:** 🟡 Pending production database migration

---

## Appendix: Manual SQL Migration (If Needed)

If Railway CLI doesn't work, run this directly in Railway PostgreSQL:

```sql
-- This is a simplified version - the TypeScript script is preferred
-- Use only if Railway CLI unavailable

-- Create v5.0.0 for initial reaction prompt
INSERT INTO "PromptVersion" (
  id, "promptId", version, "systemPrompt", "userPromptTemplate",
  config, variables, "outputSchema", "isDraft", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  id,
  'v5.0.0',
  'CRITICAL CONTEXT: You are a JUROR, not a lawyer...[full system prompt]',
  'YOU ARE A JUROR HEARING TESTIMONY IN THIS TRIAL...[full user prompt]',
  '{"model":"claude-sonnet-4-20250514","maxTokens":400,"temperature":0.5}'::jsonb,
  '{"caseContext":"string","argumentContent":"string",...}'::jsonb,
  '{}'::jsonb,
  false,
  NOW(),
  NOW()
FROM "Prompt"
WHERE "serviceId" = 'roundtable-initial-reaction';

-- Update currentVersionId
UPDATE "Prompt"
SET "currentVersionId" = (
  SELECT id FROM "PromptVersion"
  WHERE "promptId" = "Prompt".id AND version = 'v5.0.0'
)
WHERE "serviceId" = 'roundtable-initial-reaction';

-- Repeat for conversation-turn prompt...
-- [Similar SQL for roundtable-conversation-turn]
```

**Note:** The TypeScript script is much safer and includes full prompts. Use this manual method only as last resort.
