# Manual Prompt Seeding (Railway CLI Issue Workaround)

## Problem
Railway CLI has certificate error. Need to seed prompts manually using DATABASE_URL.

## Steps

### 1. Get Production DATABASE_URL

Go to Railway Dashboard:
- Navigate to: https://railway.app
- Select your project
- Click on **api-gateway** service
- Go to **Variables** tab
- Copy the `DATABASE_URL` value

It will look like:
```
postgresql://postgres:password@host.railway.app:5432/railway
```

### 2. Run Seed Script with Production URL

```bash
cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine"

# Set DATABASE_URL and run seed script
DATABASE_URL="paste-your-production-url-here" npx tsx scripts/add-roundtable-prompts.ts
```

**Replace** `paste-your-production-url-here` with the actual DATABASE_URL from Railway.

### 3. Expected Output

```
🎭 Adding roundtable conversation prompts...

✅ Created prompt: roundtable-persona-system (v1.0.0)
✅ Created prompt: roundtable-initial-reaction (v1.0.0)
✅ Created prompt: roundtable-conversation-turn (v1.0.0)
✅ Created prompt: roundtable-statement-analysis (v1.0.0)
✅ Created prompt: roundtable-conversation-synthesis (v1.0.0)

✅ All roundtable prompts added successfully!
```

### 4. Verify in Production

Test immediately:
1. Go to production app
2. Navigate to any case → Focus Groups
3. Create/select a session
4. Click "Start Roundtable Discussion"
5. Should generate real AI responses (60-90 seconds)

## Alternative: Fix Railway CLI Certificate

If you want to fix the Railway CLI issue:

```bash
# Update Railway CLI
npm uninstall -g @railway/cli
npm install -g @railway/cli

# Re-login
railway logout
railway login

# Try again
railway run --service api-gateway npx tsx scripts/add-roundtable-prompts.ts
```

## Troubleshooting

### "Prompt already exists" errors
This is OK - it means prompts are already seeded. Skip to verification step.

### Connection timeout
- Check DATABASE_URL is correct
- Verify Railway database is running
- Check firewall/VPN isn't blocking connection

### Prisma errors
```bash
# Regenerate Prisma client
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Try seed script again
DATABASE_URL="..." npx tsx scripts/add-roundtable-prompts.ts
```

## Quick Command Template

```bash
DATABASE_URL="postgresql://postgres:PASSWORD@REGION.railway.app:5432/railway" \
  npx tsx scripts/add-roundtable-prompts.ts
```

Replace:
- `PASSWORD` - your database password
- `REGION` - your Railway region (e.g., `us-west1`)
