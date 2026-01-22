# 🚀 Quick Deployment Checklist

Use this checklist to deploy TrialForge AI to production.

For detailed instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

---

## Pre-Deployment

- [ ] Local system fully tested
- [ ] All environment variables documented
- [ ] Database migrations tested
- [ ] API Gateway builds successfully (`npm run build`)
- [ ] Web app builds successfully (`npm run build:web`)
- [ ] Git repository pushed to GitHub

---

## Step 1: Database (Railway)

- [ ] Create Railway account at [railway.app](https://railway.app)
- [ ] Create new project
- [ ] Provision PostgreSQL database
- [ ] Copy `DATABASE_URL` from Variables tab
- [ ] Save URL securely (you'll need it multiple times)

---

## Step 2: API Gateway (Railway)

- [ ] Create new "Empty Service" in Railway project
- [ ] Name it: `trialforge-api-gateway`
- [ ] Connect to GitHub repository
- [ ] Set Root Directory: `services/api-gateway`
- [ ] Set Build Command: `npm install && npm run build`
- [ ] Set Start Command: `npm start`

### Environment Variables:
- [ ] `DATABASE_URL` (from Step 1)
- [ ] `JWT_SECRET` (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] `ANTHROPIC_API_KEY` (from [console.anthropic.com](https://console.anthropic.com))
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `HOST=0.0.0.0`
- [ ] `LOG_LEVEL=info`
- [ ] `ALLOWED_ORIGINS=https://your-app.vercel.app` (update after Vercel deployment)
- [ ] `RATE_LIMIT_MAX=100`
- [ ] `RATE_LIMIT_WINDOW=900000`

### Run Migrations:
```bash
# Option A: Railway CLI
railway link
railway run npx prisma migrate deploy

# Option B: Local with production DB
cd packages/database
export DATABASE_URL="<production-url>"
npx prisma migrate deploy
npx prisma db seed
unset DATABASE_URL
```

- [ ] Migrations completed successfully
- [ ] Generate Railway domain
- [ ] Save API Gateway URL: `https://trialforge-api-gateway-production.up.railway.app`
- [ ] Test health endpoint: `curl https://your-api.up.railway.app/health`

---

## Step 3: Frontend (Vercel)

- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Click "Add New" → "Project"
- [ ] Import GitHub repository
- [ ] Framework: Next.js
- [ ] Root Directory: `apps/web`
- [ ] Build Command: `cd ../.. && npm install && npm run build:web`
- [ ] Output Directory: `.next`
- [ ] Install Command: `cd ../.. && npm install`

### Environment Variables:
- [ ] `NEXT_PUBLIC_API_URL=https://your-api.up.railway.app/api`

- [ ] Deploy and wait for build
- [ ] Save Vercel URL: `https://trialforge-ai.vercel.app`

---

## Step 4: Update CORS

- [ ] Go back to Railway → API Gateway → Variables
- [ ] Update `ALLOWED_ORIGINS` to include Vercel URL:
  ```
  https://trialforge-ai.vercel.app,https://*.vercel.app
  ```
- [ ] Wait for auto-redeploy

---

## Step 5: Test Production

### Authentication:
- [ ] Visit Vercel URL
- [ ] Log in with: `admin@trialforge.ai` / `admin123`
- [ ] Redirects to dashboard

### Core Features:
- [ ] Create a case
- [ ] Add jurors
- [ ] Upload document (OCR)
- [ ] Run archetype classification
- [ ] Generate questions
- [ ] Run focus group
- [ ] Trigger deep research

### API Health:
- [ ] Health endpoint returns `{"status":"ok","database":"connected"}`
- [ ] No CORS errors in browser console
- [ ] No 500 errors in Railway logs

---

## Step 6: Production Optimizations

### Custom Domains (Optional):
- [ ] Vercel: Add `app.trialforge.ai`
- [ ] Railway: Add `api.trialforge.ai`
- [ ] Update DNS CNAME records
- [ ] Update environment variables with new URLs

### Monitoring:
- [ ] Check Railway logs for errors
- [ ] Check Vercel Analytics
- [ ] Set up alerts for errors

### Security:
- [ ] Verify HTTPS on all endpoints
- [ ] Test rate limiting
- [ ] Review environment variables (no secrets exposed)

---

## Rollback Plan

If something goes wrong:

**Railway:**
1. Go to Deployments tab
2. Find last successful deployment
3. Click "Redeploy"

**Vercel:**
1. Go to Deployments
2. Find last successful deployment
3. Click "..." → "Promote to Production"

---

## Success! 🎉

Your production URLs:
- **Frontend**: https://trialforge-ai.vercel.app
- **API**: https://trialforge-api-gateway-production.up.railway.app
- **Health**: https://trialforge-api-gateway-production.up.railway.app/health

---

## Estimated Costs

- **Railway Starter**: $5/month
- **Railway Developer**: $20/month (recommended for production)
- **Vercel Hobby**: FREE
- **Vercel Pro**: $20/month (for custom domains)
- **Anthropic API**: $50-200/month (varies by usage)

**Total**: ~$75-240/month for production use

---

## Next Steps

1. Monitor logs for first 24 hours
2. Set up custom domains
3. Enable error tracking (Sentry)
4. Set up uptime monitoring
5. Document incident response procedures

---

For detailed instructions and troubleshooting, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).
