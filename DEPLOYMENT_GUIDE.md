# Trials by Filevine AI - Deployment Guide

Complete guide to deploying Trials by Filevine AI to production on Railway (backend) and Vercel (frontend).

---

## Pre-Deployment Checklist

### Local Testing ✅
- [ ] API Gateway running on localhost:3001
- [ ] Web app running on localhost:3000
- [ ] All features tested locally
- [ ] Database migrations applied
- [ ] Environment variables configured

### Accounts Required
- [ ] Railway account (for API Gateway + PostgreSQL)
- [ ] Vercel account (for Next.js web app)
- [ ] Anthropic API account (for AI features)

---

## Part 1: Deploy Database (Railway)

### 1.1 Create Railway Account
1. Visit [railway.app](https://railway.app)
2. Sign up with GitHub (recommended)
3. Verify email

### 1.2 Create New Project
1. Click "New Project"
2. Select "Provision PostgreSQL"
3. Name it: `trialforge-database`

### 1.3 Get Database Connection String
1. Click on PostgreSQL service
2. Go to "Variables" tab
3. Copy `DATABASE_URL` value
4. Format: `postgresql://user:password@host:port/database`

**Save this URL - you'll need it for both API Gateway and migrations!**

---

## Part 2: Deploy API Gateway (Railway)

### 2.1 Prepare API Gateway for Deployment

From your project root:

```bash
cd services/api-gateway

# Create production build to verify it works
npm run build

# Check dist/ folder was created
ls dist/
```

### 2.2 Create Railway Service

1. In Railway dashboard, click "New" → "Empty Service"
2. Name it: `trialforge-api-gateway`
3. Go to "Settings" tab
4. Under "Source", click "Connect Repo"
5. Select your GitHub repository
6. Set **Root Directory**: `services/api-gateway`
7. Set **Build Command**: `npm install && npm run build`
8. Set **Start Command**: `npm start`

### 2.3 Configure Environment Variables

In the API Gateway service, go to "Variables" tab and add:

```env
# Database (from Part 1)
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=<generate-random-string-at-least-32-chars>

# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info

# Security
ALLOWED_ORIGINS=https://your-app.vercel.app
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
```

**How to generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.4 Run Database Migrations

**IMPORTANT:** You must run migrations before the API starts!

#### Option A: Railway CLI (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma migrate deploy
```

#### Option B: Local Migration to Production DB

```bash
cd packages/database

# Set production DATABASE_URL temporarily
export DATABASE_URL="postgresql://user:password@host:port/database"

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed

# Unset variable
unset DATABASE_URL
```

### 2.5 Deploy

1. Railway will auto-deploy on git push
2. Or click "Deploy" in Railway dashboard
3. Wait for build to complete (2-3 minutes)
4. Check logs for any errors

### 2.6 Get API Gateway URL

1. Go to "Settings" tab
2. Under "Networking", click "Generate Domain"
3. Railway will create: `trialforge-api-gateway-production.up.railway.app`
4. **Save this URL** - you'll need it for frontend!

### 2.7 Test Deployment

```bash
# Test health endpoint
curl https://trialforge-api-gateway-production.up.railway.app/health

# Should return:
# {"status":"ok","timestamp":"...","database":"connected"}
```

---

## Part 3: Deploy Frontend (Vercel)

### 3.1 Prepare Frontend

```bash
cd apps/web

# Create production build to verify it works
npm run build

# Should complete without errors
```

### 3.2 Create Vercel Account

1. Visit [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended)
3. Verify email

### 3.3 Import Project

1. Click "Add New" → "Project"
2. Import your GitHub repository
3. Vercel will auto-detect Next.js

### 3.4 Configure Build Settings

**Framework Preset:** Next.js

**Root Directory:** `apps/web`

**Build Command:**
```bash
cd ../.. && npm install && npm run build:web
```

**Output Directory:** `.next` (default)

**Install Command:**
```bash
cd ../.. && npm install
```

### 3.5 Configure Environment Variables

In Vercel project settings, add:

```env
# API Configuration (from Part 2)
NEXT_PUBLIC_API_URL=https://trialforge-api-gateway-production.up.railway.app/api
```

### 3.6 Deploy

1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)
3. Vercel will create: `trialforge-ai.vercel.app`

### 3.7 Update API CORS Settings

Now that you have the Vercel URL, update Railway API Gateway:

1. Go to Railway → API Gateway service → Variables
2. Update `ALLOWED_ORIGINS`:
```env
ALLOWED_ORIGINS=https://trialforge-ai.vercel.app,https://*.vercel.app
```
3. Railway will auto-redeploy

---

## Part 4: Post-Deployment Testing

### 4.1 Test Authentication

1. Visit your Vercel URL: `https://trialforge-ai.vercel.app`
2. Try to log in with test credentials:
   - Email: `admin@trialforge.ai`
   - Password: `admin123`
3. Should redirect to dashboard

### 4.2 Test Core Features

- [ ] Create a new case
- [ ] Add jurors to case
- [ ] Upload document for OCR
- [ ] Run archetype classification
- [ ] Generate voir dire questions
- [ ] Run focus group simulation
- [ ] Trigger deep research synthesis

### 4.3 Test API Directly

```bash
# Get auth token
curl -X POST https://trialforge-api-gateway-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trialforge.ai","password":"admin123"}'

# Save the token
TOKEN="<token-from-response>"

# Test cases endpoint
curl https://trialforge-api-gateway-production.up.railway.app/api/cases \
  -H "Authorization: Bearer $TOKEN"
```

---

## Part 5: Production Optimizations

### 5.1 Custom Domain (Optional)

**For Vercel:**
1. Go to Project Settings → Domains
2. Add your custom domain: `app.trialforge.ai`
3. Update DNS with CNAME record
4. Vercel auto-configures SSL

**For Railway:**
1. Go to API Gateway Settings → Networking
2. Add custom domain: `api.trialforge.ai`
3. Update DNS with CNAME record
4. Railway auto-configures SSL

**Update environment variables after custom domains:**
- Vercel: `NEXT_PUBLIC_API_URL=https://api.trialforge.ai/api`
- Railway: `ALLOWED_ORIGINS=https://app.trialforge.ai`

### 5.2 Set Up Monitoring

**Railway:**
1. Observability tab shows logs and metrics
2. Set up alerts for high error rates
3. Monitor database connection count

**Vercel:**
1. Analytics tab shows performance
2. Monitor build times
3. Check function execution limits

### 5.3 Configure Auto-Scaling (Railway)

1. Go to Settings → Autoscaling
2. Enable horizontal scaling
3. Set min/max replicas (start with 1-3)
4. Set CPU/memory thresholds

---

## Part 6: Troubleshooting

### API Gateway Won't Start

**Check logs in Railway:**
```
railway logs --tail 100
```

**Common issues:**
- Missing `DATABASE_URL` variable
- Migrations not run
- Missing `ANTHROPIC_API_KEY`
- Invalid `JWT_SECRET`

### Database Connection Errors

```bash
# Test connection locally
psql $DATABASE_URL

# Verify migrations
railway run npx prisma migrate status
```

### CORS Errors in Browser

1. Check `ALLOWED_ORIGINS` includes your Vercel URL
2. Include both specific URL and wildcard: `https://app.vercel.app,https://*.vercel.app`
3. Redeploy API Gateway after changing

### Frontend Build Errors

**Check Vercel build logs:**
- Missing environment variables?
- TypeScript errors?
- Import path issues?

**Test build locally:**
```bash
cd apps/web
npm run build
```

### Prisma Client Issues

If you see "Prisma Client not generated":

```bash
# In Railway, add to build command:
npm install && npx prisma generate && npm run build
```

---

## Part 7: Security Hardening

### 7.1 Rotate Secrets Regularly

- JWT_SECRET - every 90 days
- Database password - every 90 days
- API keys - check provider recommendations

### 7.2 Enable Rate Limiting

Already configured in `services/api-gateway/src/server.ts`:
- 100 requests per 15 minutes per IP
- Adjust `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW` as needed

### 7.3 Set Up Audit Logging

Add to API Gateway:
```typescript
// Log all authenticated requests
server.addHook('onRequest', async (request, reply) => {
  if (request.user) {
    console.log({
      userId: request.user.id,
      method: request.method,
      url: request.url,
      ip: request.ip,
    });
  }
});
```

### 7.4 Enable HTTPS Only

Railway and Vercel handle this automatically, but verify:
- No HTTP endpoints exposed
- All cookies have `secure` flag
- HSTS headers enabled

---

## Part 8: Cost Estimation

### Railway (API + Database)
- **Starter Plan**: $5/month
- **Developer Plan**: $20/month
  - 500 hours compute
  - Shared PostgreSQL (8GB storage)
  - Good for MVP
- **Team Plan**: $20/user/month
  - Dedicated resources
  - Better performance

**Expected Usage:**
- API Gateway: ~100 hours/month (always on)
- PostgreSQL: Included in plan

### Vercel
- **Hobby Plan**: FREE
  - Good for MVP
  - 100GB bandwidth
  - Unlimited deployments
- **Pro Plan**: $20/month
  - Custom domains
  - Team collaboration
  - Priority support

### Anthropic API
- **Claude 3.5 Sonnet**: $3 per million input tokens, $15 per million output
- **Claude 4 Sonnet**: $3 per million input tokens, $15 per million output
- **Typical Usage:**
  - OCR per document: ~$0.01-0.05
  - Archetype classification: ~$0.01-0.02
  - Deep research synthesis: ~$0.05-0.20 (includes web searches)
  - Focus group simulation: ~$0.02-0.05

**Estimated Monthly Cost (100 active users):**
- Infrastructure: $40-60/month (Railway + Vercel)
- AI API: $50-200/month (varies by usage)
- **Total: $90-260/month**

---

## Part 9: Rollback Procedure

### If Deployment Fails

**Railway:**
1. Go to Deployments tab
2. Click on last successful deployment
3. Click "Redeploy"

**Vercel:**
1. Go to Deployments
2. Find last successful deployment
3. Click "..." → "Promote to Production"

### If Database Migration Fails

```bash
# Never run migrate reset in production!
# Instead, create a rollback migration

cd packages/database

# Create new migration to undo changes
npx prisma migrate dev --name rollback_feature_x

# Apply to production
railway run npx prisma migrate deploy
```

---

## Part 10: Continuous Deployment

### Set Up Auto-Deploy

**Railway:**
- Already enabled by default
- Every push to `main` triggers deployment
- Configure branch: Settings → Source → Production Branch

**Vercel:**
- Already enabled by default
- Every push to `main` deploys to production
- Feature branches create preview deployments

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run typecheck
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Railway Deploy
        run: echo "Railway auto-deploys on push"
      - name: Trigger Vercel Deploy
        run: echo "Vercel auto-deploys on push"
```

---

## Success Checklist ✅

After completing all steps, you should have:

- [x] PostgreSQL database running on Railway
- [x] API Gateway deployed to Railway
- [x] Database migrations applied
- [x] Web app deployed to Vercel
- [x] Health endpoint responding
- [x] Authentication working
- [x] All AI features functional
- [x] CORS configured correctly
- [x] Environment variables set
- [x] Monitoring enabled
- [x] Auto-deployment configured

**Your production URLs:**
- Frontend: `https://trialforge-ai.vercel.app`
- API: `https://trialforge-api-gateway-production.up.railway.app`
- Health: `https://trialforge-api-gateway-production.up.railway.app/health`

---

## Next Steps

1. **Set up custom domain** (app.trialforge.ai, api.trialforge.ai)
2. **Enable error tracking** (Sentry integration)
3. **Set up analytics** (PostHog, Mixpanel, or Vercel Analytics)
4. **Create backup strategy** (Railway has auto-backups, but verify)
5. **Document incident response procedures**
6. **Set up uptime monitoring** (UptimeRobot, Pingdom)

---

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Prisma Deploy**: https://www.prisma.io/docs/guides/deployment
- **Fastify Deployment**: https://www.fastify.io/docs/latest/Guides/Deployment/
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

**Deployment Status:** Ready to Deploy 🚀

For questions or issues during deployment, refer to the troubleshooting section or check service provider documentation.
