# Prompt Service Deployment - Simplified Guide

## Architecture

```
┌──────────────────────────────────────┐
│  Frontend (Vercel)                   │
│  ├─ Main Web App                     │
│  └─ /prompts route (integrated)      │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  Backend Microservices (Railway)     │
│  ├─ API Gateway                      │
│  ├─ Prompt Service (NEW)             │
│  ├─ Other Services...                │
│  └─ PostgreSQL Database              │
└──────────────────────────────────────┘
```

## What Changed

✅ **Before:** Prompt Admin was a separate Vercel app
✅ **Now:** Prompt Admin is integrated into main web app at `/prompts` route

This means:
- Only ONE deployment needed for frontend (your existing web app on Vercel)
- Prompt Service deploys as a microservice on your existing Railway project
- Simpler architecture, easier to maintain

## Deployment Steps

### Step 1: Deploy Prompt Service to Railway (10 min)

1. **Go to your Railway project dashboard**
   - https://railway.app/dashboard
   - Select your existing project

2. **Add new service from GitHub**
   - Click **"+ New"** → **"GitHub Repo"**
   - Select: **Trials-By-Filevine**
   - Railway will show: `services/prompt-service`
   - Click **"Add Service"**

3. **Configure service**
   - Name: **prompt-service**
   - Root Directory: `services/prompt-service` (auto-detected)
   - Build/Start commands from `railway.json` (auto-detected)

4. **Add environment variables**

   Go to **Variables** tab and add:

   ```env
   # Link to existing PostgreSQL
   DATABASE_URL=${{Postgres.DATABASE_URL}}

   # Server config
   NODE_ENV=production
   HOST=0.0.0.0

   # Generate secret (see command below)
   JWT_SECRET=<your-generated-secret>

   # Cache (optional)
   CACHE_ENABLED=false
   ```

   **Generate JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Run database migrations**

   Option A - Railway CLI:
   ```bash
   cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine/services/prompt-service"
   railway link  # Select your project
   railway run npx prisma migrate deploy
   ```

   Option B - Local to production:
   ```bash
   # Get DATABASE_URL from Railway
   export DATABASE_URL="<from-railway-variables>"

   cd services/prompt-service
   npx prisma generate
   npx prisma migrate deploy

   unset DATABASE_URL
   ```

6. **Generate public domain**
   - Go to **Settings** → **Networking**
   - Click **"Generate Domain"**
   - Save URL: `https://prompt-service-production.up.railway.app`

7. **Test deployment**
   ```bash
   curl https://prompt-service-production.up.railway.app/health
   # Should return: {"status":"ok",...}
   ```

### Step 2: Update Main Web App on Vercel (2 min)

1. **Go to Vercel dashboard**
   - https://vercel.com/dashboard
   - Select your main web app project

2. **Add environment variable**
   - Go to **Settings** → **Environment Variables**
   - Add new variable:
     ```
     NEXT_PUBLIC_PROMPT_SERVICE_URL=https://prompt-service-production.up.railway.app
     ```
   - Select: **Production**, **Preview**, and **Development**

3. **Redeploy**
   - Go to **Deployments**
   - Click **"..."** on latest → **"Redeploy"**
   - OR push any change to trigger auto-deploy:
     ```bash
     git commit --allow-empty -m "chore: Trigger redeploy"
     git push origin main
     ```

### Step 3: Test Integration (2 min)

1. **Open your web app**
   - Go to: `https://your-app.vercel.app`
   - Log in

2. **Navigate to Prompts**
   - Look in sidebar (bottom section)
   - Click **"Prompts"**
   - Should show `/prompts` route (not open new tab)

3. **Test functionality**
   - ✅ See list of prompts
   - ✅ Click on a prompt
   - ✅ Editor loads
   - ✅ Can edit and save

## Verification Checklist

- [ ] Prompt Service deployed on Railway
- [ ] Health check returns `{"status":"ok"}`
- [ ] Web app has `NEXT_PUBLIC_PROMPT_SERVICE_URL` env var
- [ ] Web app redeployed after adding env var
- [ ] `/prompts` route loads in main app
- [ ] Can view prompts list
- [ ] Can edit prompts
- [ ] Can save and deploy changes

## Troubleshooting

### Prompt Service Won't Start

**Check Railway logs:**
1. Railway → prompt-service → Deployments → View Logs

**Common issues:**
- Missing `DATABASE_URL` → Check Variables tab
- Migrations not run → Run Step 1.5 again
- Build failed → Check if TypeScript compiles locally

### Prompts Route Shows 404

**Issue:** Prompt Service not responding

**Fix:**
1. Check Prompt Service health: `curl <your-railway-url>/health`
2. Verify `NEXT_PUBLIC_PROMPT_SERVICE_URL` in Vercel
3. Redeploy web app after adding env var

### CORS Errors

**Symptoms:** Network errors in browser console

**Fix:**
Update Prompt Service CORS in Railway:
1. Railway → prompt-service → Variables
2. Add: `ALLOWED_ORIGINS=https://your-app.vercel.app`
3. Service will auto-redeploy

## Cost

**Added Cost:**
- Railway Prompt Service: ~$5/month (minimal compute)
- No extra Vercel cost (same app)

**Total: ~$5/month**

## Future Updates

Both services auto-deploy on push to `main`:

```bash
# Make changes
git add .
git commit -m "Update prompts"
git push origin main

# Railway and Vercel auto-deploy!
```

## Architecture Benefits

✅ **Single Frontend:** One app to manage
✅ **Unified UX:** No external links, integrated navigation
✅ **Simpler Auth:** Same auth context across all routes
✅ **Cost Effective:** One frontend deployment
✅ **Microservices Backend:** Prompt Service as separate, scalable service

## Next Steps

After deployment:
1. ✅ Access prompts at `/prompts` in your main app
2. ✅ Manage AI prompts without code deployments
3. ✅ Version control and rollback capabilities
4. ✅ Monaco editor for prompt editing

---

**Status:** Ready to Deploy 🚀

For detailed troubleshooting, see:
- [services/prompt-service/DEPLOYMENT.md](services/prompt-service/DEPLOYMENT.md)
