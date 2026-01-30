# Production Deployment Guide - V2 Personas & Voyage AI

**Last Updated:** January 30, 2026

This guide covers deploying the Voyage AI embedding system and seeding V2 personas to production.

---

## Prerequisites

- ✅ Code pushed to `main` branch (already done)
- ✅ Railway project with PostgreSQL database
- ✅ Access to Railway dashboard
- ✅ Voyage AI API key (production)

---

## Step 1: Add Voyage AI API Key to Production

### 1.1 Get Production Voyage API Key

1. Go to [Voyage AI Dashboard](https://www.voyageai.com/)
2. Create a new API key for production (or use existing)
3. Copy the API key (format: `pa-...`)

### 1.2 Add to Railway Environment Variables

1. Go to Railway Dashboard → Your Project → **api-gateway** service
2. Click **Variables** tab
3. Add new variable:
   ```
   VOYAGE_API_KEY=pa-your-production-api-key-here
   ```
4. Click **Save**

**Note:** The API Gateway will automatically restart after adding the variable.

---

## Step 2: Verify Production Database Connection

### Option A: Using Railway CLI (Recommended)

```bash
# Install Railway CLI if needed
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Select the api-gateway service
railway service

# Test database connection
railway run npx tsx -e "import { PrismaClient } from '@juries/database'; const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Connected'); process.exit(0); }).catch(e => { console.error('❌ Error:', e); process.exit(1); });"
```

### Option B: Using Railway Dashboard

1. Go to Railway Dashboard → Your Project → **Postgres** service
2. Click **Variables** tab
3. Copy the `DATABASE_URL` value
4. Test locally:
   ```bash
   DATABASE_URL="postgresql://..." npx tsx -e "import { PrismaClient } from '@juries/database'; const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Connected'); process.exit(0); });"
   ```

---

## Step 3: Import V2 Personas to Production

### 3.1 Verify Export File Exists

Ensure `personas-v2-export.json` exists in the project root (it should be committed).

```bash
ls -lh personas-v2-export.json
```

You should see:
- File size: ~500KB-2MB
- Contains 60 V2 personas
- Includes all signal weights

### 3.2 Import Using Railway CLI

```bash
# Make sure you're in the project root
cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine"

# Link to Railway project (if not already linked)
railway link

# Select api-gateway service
railway service

# Run the import script
railway run npm run import-v2-personas-production
```

### 3.3 Import Using Direct Database URL

If Railway CLI isn't working, you can use the database URL directly:

```bash
# Get DATABASE_URL from Railway Dashboard → Postgres → Variables
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Run import
npm run import-v2-personas-production

# Unset for security
unset DATABASE_URL
```

### 3.4 Verify Import

After import completes, verify the personas were imported:

```bash
# Using Railway CLI
railway run npx tsx -e "
import { PrismaClient } from '@juries/database';
const prisma = new PrismaClient();
prisma.persona.count({ where: { version: 2, isActive: true } })
  .then(count => { console.log(\`✅ V2 Personas in production: \${count}\`); process.exit(0); });
"

# Or check via API (once server is running)
curl https://your-api-url.railway.app/api/personas?version=2
```

Expected result: **60 V2 personas** imported.

---

## Step 4: Verify Embedding System is Working

### 4.1 Check Cache Status Endpoint

Once the API Gateway has restarted with the new `VOYAGE_API_KEY`:

```bash
# Get your API Gateway URL from Railway Dashboard
curl https://your-api-url.railway.app/api/matching/cache-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "available": true,
  "cache": {
    "personaEmbeddingsCached": 0,
    "totalPersonas": 60,
    "completionPercentage": "0.0",
    "jurorNarrativesCached": 0
  }
}
```

**Note:** The preload will start automatically when the server starts. It may take 20-30 minutes to complete all 60 personas due to rate limiting.

### 4.2 Monitor Preload Progress

The preload runs in the background. Check progress periodically:

```bash
# Check cache status every 5 minutes
watch -n 300 'curl -s https://your-api-url.railway.app/api/matching/cache-status -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq'
```

Or check Railway logs:
```bash
railway logs --service api-gateway | grep -i "preload\|embedding\|batch"
```

### 4.3 Resume Preload if Needed

If preload stops due to rate limits, you can resume it:

```bash
# Using Railway CLI
railway run --service api-gateway npm run resume-embedding-preload

# Or manually via API (if endpoint exists)
curl -X POST https://your-api-url.railway.app/api/matching/resume-preload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Step 5: Test Matching in Production

### 5.1 Test Embedding Matching

Create a test juror and verify matching works:

```bash
# Test script (adjust API URL and auth token)
curl -X POST https://your-api-url.railway.app/api/matching/match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "juror": {
      "name": "Test Juror",
      "age": 55,
      "occupation": "Small Business Owner",
      "education": "Bachelor'\''s",
      "narrative": "Built my business from scratch. Pulled myself up by my bootstraps."
    },
    "limit": 5
  }'
```

Expected: Top matches should include "bootstrapper" archetype personas.

---

## Troubleshooting

### Issue: Preload Not Starting

**Symptoms:** Cache status shows 0/60 personas cached after 10+ minutes.

**Solutions:**
1. Check Railway logs for errors:
   ```bash
   railway logs --service api-gateway | grep -i error
   ```
2. Verify `VOYAGE_API_KEY` is set correctly
3. Check Voyage AI API key is valid and has credits
4. Restart the API Gateway service

### Issue: Rate Limit Errors (429)

**Symptoms:** Logs show "Rate limit exceeded" or "429" errors.

**Solutions:**
1. This is expected - the preload has retry logic
2. Wait 20-30 minutes for preload to complete
3. Remaining personas will load on-demand when needed
4. Check Voyage AI account limits/upgrade if needed

### Issue: Import Script Fails

**Symptoms:** Import script errors or doesn't complete.

**Solutions:**
1. Verify `DATABASE_URL` is correct
2. Check database connection:
   ```bash
   railway run npx prisma db pull
   ```
3. Ensure `personas-v2-export.json` exists in project root
4. Check Railway logs for detailed error messages

### Issue: No V2 Personas After Import

**Symptoms:** Import completes but count shows 0 V2 personas.

**Solutions:**
1. Verify import script ran successfully (check output)
2. Check if personas were imported as V1:
   ```bash
   railway run npx tsx -e "
   import { PrismaClient } from '@juries/database';
   const prisma = new PrismaClient();
   prisma.persona.findMany({ where: { isActive: true }, select: { name: true, version: true } })
     .then(p => { console.log(p); process.exit(0); });
   "
   ```
3. Re-run import script (it will skip duplicates)

---

## Summary Checklist

- [ ] Code pushed to `main` branch
- [ ] `VOYAGE_API_KEY` added to Railway environment variables
- [ ] API Gateway restarted (automatic after env var change)
- [ ] `personas-v2-export.json` exists in project root
- [ ] V2 personas imported to production database (60 personas)
- [ ] Cache status endpoint accessible
- [ ] Preload started (check logs)
- [ ] Test matching endpoint works
- [ ] Monitor preload progress (20-30 min expected)

---

## Next Steps

After deployment is complete:

1. **Monitor Preload:** Check cache status periodically until 60/60 personas cached
2. **Test Matching:** Run test jurors through matching to verify results
3. **Monitor Logs:** Watch for any errors or warnings
4. **Performance:** Verify matching response times are acceptable

---

## Support

If you encounter issues:

1. Check Railway logs: `railway logs --service api-gateway`
2. Verify environment variables are set correctly
3. Test database connection
4. Check Voyage AI account status and credits
