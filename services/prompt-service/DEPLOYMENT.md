# Prompt Service Deployment Guide (Railway)

## Prerequisites

- Railway account with GitHub connected
- Access to the existing PostgreSQL database on Railway
- Anthropic API key (if needed for AI features)

## Deployment Steps

### 1. Create New Railway Service

1. Go to your Railway project dashboard
2. Click **"New"** → **"Empty Service"**
3. Name it: `prompt-service`

### 2. Connect GitHub Repository

1. Go to **Settings** tab
2. Under **Source**, click **"Connect Repo"**
3. Select your GitHub repository: `Trials-By-Filevine`
4. Set **Root Directory**: `services/prompt-service`
5. Railway will auto-detect the configuration from `railway.json`

### 3. Configure Environment Variables

In the **Variables** tab, add:

```env
# Database (use existing Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Server Configuration
NODE_ENV=production
PORT=3002
HOST=0.0.0.0

# JWT Secret (generate a new one)
JWT_SECRET=<generate-random-32-char-string>

# Redis (optional - for caching)
# REDIS_URL=${{Redis.REDIS_URL}}
CACHE_ENABLED=false

# Authentication
REQUIRE_AUTH=false
```

**To generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run Database Migrations

**IMPORTANT:** Run migrations before first deployment!

#### Option A: Railway CLI (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Link to the prompt-service
railway service

# Run migrations
railway run npx prisma migrate deploy
```

#### Option B: Local Migration to Production DB

```bash
cd services/prompt-service

# Set DATABASE_URL from Railway
export DATABASE_URL="<your-railway-database-url>"

# Generate Prisma Client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Unset variable
unset DATABASE_URL
```

### 5. Deploy

1. Click **"Deploy"** or push to `main` branch
2. Railway will automatically:
   - Run `npm install`
   - Generate Prisma Client
   - Build TypeScript (`npm run build`)
   - Start service (`npm start`)

3. Wait 2-3 minutes for deployment
4. Check logs for any errors

### 6. Generate Public URL

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Railway creates: `prompt-service-production.up.railway.app`
4. **Save this URL** - you'll need it for the frontend!

### 7. Test Deployment

```bash
# Test health endpoint
curl https://prompt-service-production.up.railway.app/health

# Should return:
# {"status":"ok","timestamp":"...","cache":"disabled"}

# Test prompts endpoint
curl https://prompt-service-production.up.railway.app/api/v1/admin/prompts
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `NODE_ENV` | ✅ | development | Set to `production` |
| `PORT` | ❌ | 3002 | Server port (Railway auto-assigns) |
| `HOST` | ❌ | 0.0.0.0 | Server host |
| `JWT_SECRET` | ✅ | - | Secret for JWT tokens |
| `REDIS_URL` | ❌ | - | Redis connection (optional) |
| `CACHE_ENABLED` | ❌ | true | Enable/disable caching |
| `CACHE_TTL` | ❌ | 300 | Cache TTL in seconds |
| `REQUIRE_AUTH` | ❌ | false | Require JWT authentication |

## Troubleshooting

### Build Fails

**Check logs:**
```bash
railway logs --tail 100
```

**Common issues:**
- Missing `DATABASE_URL`
- Prisma Client not generated → Add to build command: `npx prisma generate`
- TypeScript errors → Run `npm run build` locally first

### Database Connection Errors

```bash
# Test connection locally
psql $DATABASE_URL

# Verify migrations
railway run npx prisma migrate status
```

### Service Won't Start

**Check:**
- `PORT` is not hardcoded (Railway assigns dynamically)
- `HOST` is set to `0.0.0.0` (not `localhost`)
- All required env vars are set

## Updating the Service

Railway auto-deploys on every push to `main`:

```bash
# Make changes
git add .
git commit -m "Update prompt service"
git push origin main

# Railway automatically redeploys
```

## Rollback

If deployment fails:

1. Go to **Deployments** tab
2. Find last successful deployment
3. Click **"Redeploy"**

## Monitoring

- **Logs**: Railway dashboard → Deployments → View logs
- **Metrics**: Observability tab shows CPU, memory, network
- **Health Check**: `GET /health` endpoint

## CORS Configuration

If you need to configure CORS for the frontend:

1. Edit `services/prompt-service/src/index.ts`
2. Update CORS configuration:
```typescript
await fastify.register(cors, {
  origin: [
    'https://your-app.vercel.app',
    'https://*.vercel.app', // For preview deployments
  ],
  credentials: true,
});
```
3. Push changes to redeploy

## Next Steps

After deploying Prompt Service:
1. Deploy Prompt Admin UI to Vercel (see `apps/prompt-admin/DEPLOYMENT.md`)
2. Update main app sidebar with production URL
3. Test end-to-end workflow
