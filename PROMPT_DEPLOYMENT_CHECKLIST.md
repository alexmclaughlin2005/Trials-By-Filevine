# Prompt Management System - Deployment Checklist

## ✅ Pre-Deployment (Already Complete)

- [x] Code built and tested locally
- [x] All changes committed to GitHub (`main` branch)
- [x] Railway configuration created
- [x] Deployment guides written

## 🚀 Step 1: Deploy Prompt Service to Railway (10 minutes)

### 1.1 Create Railway Service

1. **Open Railway Dashboard:**
   - Go to https://railway.app/dashboard
   - Select your existing project (or create new project)

2. **Create New Service:**
   - Click **"+ New"** → **"GitHub Repo"**
   - Select repository: **"Trials-By-Filevine"**
   - Railway will show all services in your repo

3. **Configure Service:**
   - Select: **services/prompt-service**
   - Click **"Add Service"**
   - Name it: **"prompt-service"**

### 1.2 Configure Build Settings

Railway should auto-detect from `railway.json`, but verify:

- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `services/prompt-service`

### 1.3 Add Environment Variables

Click on the **prompt-service** → **Variables** tab:

```env
# Database (link to existing PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Server
NODE_ENV=production
HOST=0.0.0.0

# Generate this with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<PASTE_GENERATED_SECRET_HERE>

# Cache (disable for now, enable later if needed)
CACHE_ENABLED=false

# Auth (disable for now)
REQUIRE_AUTH=false
```

**To generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as the `JWT_SECRET` value.

### 1.4 Run Database Migrations

**Option A: Using Railway CLI (if logged in):**

```bash
cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine/services/prompt-service"
railway link  # Select your project and prompt-service
railway run npx prisma migrate deploy
```

**Option B: Using Railway Dashboard (recommended if CLI issues):**

1. Go to prompt-service → **Deployments**
2. After first deployment, click **"View Logs"**
3. If you see "Prisma migration needed" error, run migrations manually:
   - Go to **Settings** → **One-off Commands**
   - Run: `npx prisma migrate deploy`

**Option C: Local to Production DB:**

```bash
# Get DATABASE_URL from Railway dashboard
export DATABASE_URL="<copy-from-railway-variables-tab>"

cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine/services/prompt-service"

npx prisma generate
npx prisma migrate deploy

unset DATABASE_URL
```

### 1.5 Deploy & Get URL

1. Railway will auto-deploy after adding variables
2. Wait 2-3 minutes for deployment
3. Go to **Settings** → **Networking**
4. Click **"Generate Domain"**
5. **Copy the URL** (e.g., `prompt-service-production.up.railway.app`)
6. **SAVE THIS URL** - you need it for Step 2!

### 1.6 Test Deployment

```bash
# Replace with your Railway URL
curl https://prompt-service-production.up.railway.app/health

# Should return:
# {"status":"ok","timestamp":"2026-01-22T...","cache":"disabled"}
```

**Expected URL:** `https://prompt-service-production.up.railway.app`

---

## 🎨 Step 2: Deploy Prompt Admin to Vercel (5 minutes)

### 2.1 Open Vercel Dashboard

1. Go to https://vercel.com/new
2. Click **"Import Project"**
3. If not connected to GitHub, click **"Connect GitHub"**

### 2.2 Import Repository

1. Find and select: **"Trials-By-Filevine"**
2. Click **"Import"**

### 2.3 Configure Project

**Framework Preset:** Next.js (auto-detected)

**Project Settings:**
- **Project Name**: `juries-prompt-admin` (or your preferred name)
- **Root Directory**: Click **"Edit"** → Select **`apps/prompt-admin`**

**Build Settings:**
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 2.4 Add Environment Variables

Click **"Environment Variables"** and add:

**Key:** `NEXT_PUBLIC_PROMPT_SERVICE_URL`
**Value:** `https://prompt-service-production.up.railway.app`
*(Use the URL from Step 1.5)*

**Environment:** Production (and Preview if you want)

### 2.5 Deploy

1. Click **"Deploy"**
2. Wait 3-5 minutes for build
3. Vercel will show your deployment URL
4. **Copy the URL** (e.g., `juries-prompt-admin.vercel.app`)
5. **SAVE THIS URL** - you need it for Step 3!

### 2.6 Test Deployment

1. Open your Vercel URL in browser
2. You should see the prompt list page
3. Click on "Archetype Classifier" or any prompt
4. You should see the prompt editor with Monaco

**If you see CORS errors**, continue to Step 2.7:

### 2.7 Fix CORS (if needed)

If you see CORS errors in the browser console:

1. Go back to **Railway Dashboard**
2. Select **prompt-service**
3. Go to **Variables**
4. Add new variable:
   ```env
   ALLOWED_ORIGINS=https://juries-prompt-admin.vercel.app,https://*.vercel.app
   ```
   *(Replace with your actual Vercel URL)*
5. Railway will auto-redeploy (2 minutes)
6. Refresh your Vercel app

**Expected URL:** `https://juries-prompt-admin.vercel.app`

---

## 🔗 Step 3: Update Main App (2 minutes)

### 3.1 Update Main Web App Environment

1. Go to **Vercel Dashboard**
2. Find your **main web app** project (e.g., "juries-web" or "trialforge-web")
3. Go to **Settings** → **Environment Variables**
4. Add or update:
   ```env
   NEXT_PUBLIC_PROMPT_ADMIN_URL=https://juries-prompt-admin.vercel.app
   ```
   *(Use the URL from Step 2.5)*

### 3.2 Redeploy Main App

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment → **"Redeploy"**
3. OR just push a small change to trigger redeploy:
   ```bash
   cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine"
   git commit --allow-empty -m "chore: Trigger redeploy with new prompt admin URL"
   git push origin main
   ```

### 3.3 Test Integration

1. Open your main app (e.g., `your-app.vercel.app`)
2. Log in
3. Look in the sidebar (bottom section)
4. Click **"Prompts"** link
5. Should open the Prompt Admin in a new tab
6. Should work without CORS errors

---

## ✅ Verification Checklist

After completing all steps:

- [ ] **Prompt Service Health Check**
  ```bash
  curl https://prompt-service-production.up.railway.app/health
  ```
  ✅ Returns `{"status":"ok",...}`

- [ ] **Prompt Service API Check**
  ```bash
  curl https://prompt-service-production.up.railway.app/api/v1/admin/prompts
  ```
  ✅ Returns array of prompts

- [ ] **Prompt Admin Loads**
  - Open: `https://juries-prompt-admin.vercel.app`
  - ✅ See list of prompts (no CORS errors)

- [ ] **Edit Prompt Works**
  - Click on a prompt
  - ✅ Monaco editor loads
  - ✅ Can see prompt content

- [ ] **Save Draft Works**
  - Edit prompt text
  - Click "Save Draft"
  - ✅ New version created
  - ✅ Shows "Draft Saved" message

- [ ] **Deploy Works**
  - Click "Deploy" button on a draft version
  - ✅ Version marked as deployed
  - ✅ Changes appear in editor

- [ ] **Main App Integration**
  - Open main app
  - Click "Prompts" in sidebar
  - ✅ Opens Prompt Admin in new tab
  - ✅ No CORS errors

---

## 📝 URLs to Save

After deployment, save these URLs:

```
Prompt Service (Railway):
https://prompt-service-production.up.railway.app

Prompt Admin (Vercel):
https://juries-prompt-admin.vercel.app

Health Check:
https://prompt-service-production.up.railway.app/health

API Endpoint:
https://prompt-service-production.up.railway.app/api/v1/admin/prompts
```

---

## 🔧 Troubleshooting

### Prompt Service Won't Start

**Check Railway logs:**
1. Railway Dashboard → prompt-service → Deployments
2. Click on failed deployment → View logs
3. Common issues:
   - Missing `DATABASE_URL` → Check Variables tab
   - Prisma not generated → Run migrations (Step 1.4)
   - Build failed → Check if TypeScript errors exist

### Prompt Admin Build Fails

**Check Vercel logs:**
1. Vercel Dashboard → Deployments → Click failed deployment
2. Common issues:
   - Missing `NEXT_PUBLIC_PROMPT_SERVICE_URL`
   - TypeScript errors → We already fixed these
   - Build timeout → Retry deployment

### CORS Errors

**Symptoms:** Prompt Admin loads but shows "Network Error" when fetching prompts

**Fix:**
1. Railway Dashboard → prompt-service → Variables
2. Add: `ALLOWED_ORIGINS=https://your-vercel-url.vercel.app,https://*.vercel.app`
3. Redeploy will happen automatically

### Prompts Not Loading

**Check:**
1. Prompt Service is running (check health endpoint)
2. Prompt Admin has correct `NEXT_PUBLIC_PROMPT_SERVICE_URL`
3. No CORS errors in browser console (F12 → Console)
4. Database has prompts (check Railway database)

---

## 🎉 Success!

Once all checks pass, you have:
- ✅ Prompt Service running on Railway
- ✅ Prompt Admin running on Vercel
- ✅ Main app integrated with Prompt Admin
- ✅ Attorneys can manage AI prompts without deployments!

---

## 💰 Cost

**Railway Prompt Service:**
- Developer Plan: $20/month (includes database)
- Or use existing database, add ~$5/month for compute

**Vercel Prompt Admin:**
- Hobby Plan: FREE
- Or Pro Plan: $20/month (if you need team features)

**Total Added Cost:** $5-25/month

---

## 🔄 Future Deployments

Both services auto-deploy on push to `main`:

```bash
# Make changes
git add .
git commit -m "Update prompts or fix bugs"
git push origin main

# Railway and Vercel auto-deploy!
```

---

## 📞 Support

If you run into issues:
1. Check Railway logs
2. Check Vercel logs
3. Review troubleshooting section above
4. Check deployment guides:
   - [Prompt Service Guide](services/prompt-service/DEPLOYMENT.md)
   - [Prompt Admin Guide](apps/prompt-admin/DEPLOYMENT.md)
