# Persona Deployment Checklist

Quick reference for deploying personas to production.

---

## ✅ Pre-Deployment Verification

- [x] **Local DB has personas** - Run `npm run list-personas` → Shows 67 personas
- [x] **All JSON files ready** - Check `Juror Personas/generated/` → 10 archetype files
- [x] **Simulation config ready** - Check `Juror Personas/simulation_config.json` → Exists
- [ ] **Railway access** - Can access Railway dashboard or CLI
- [ ] **DATABASE_URL available** - Got production database URL

---

## 🚀 Deployment Steps

### Option 1: Using Environment Variable (Recommended)

```bash
# 1. Get your Railway DATABASE_URL from dashboard or CLI
railway variables get DATABASE_URL

# 2. Deploy personas
DATABASE_URL="postgresql://postgres:xxx@xxx.railway.app:5432/railway" npm run deploy-personas

# 3. Verify
# Should show: "67 personas imported" or "67 personas skipped"
```

### Option 2: Using Railway CLI

```bash
# 1. Make sure Railway CLI is installed
npm install -g @railway/cli

# 2. Login and link project
railway login
railway link

# 3. Deploy
railway run npm run deploy-personas

# 4. Verify in production
railway run npm run list-personas
```

---

## ✅ Post-Deployment Verification

- [ ] **Deployment completed** - No error messages
- [ ] **67 personas deployed** - Check deployment summary
- [ ] **9 configs deployed** - Check config count
- [ ] **All archetypes present** - See 10 archetype types in summary

### Quick Verification Commands

```bash
# If using Railway CLI
railway run npm run list-personas

# Should show:
# - bootstrapper: 20 personas
# - crusader: 7 personas
# - scale_balancer: 4 personas
# - captain: 7 personas
# - chameleon: 4 personas
# - scarred: 6 personas
# - calculator: 2 personas
# - heart: 6 personas
# - trojan_horse: 4 personas
# - maverick: 4 personas
# - Total: 67 personas
```

---

## 🧪 Production Testing

Test these features in your production app:

- [ ] **Archetype classification** - Test with sample voir dire responses
- [ ] **Persona library** - View personas in frontend
- [ ] **Focus group simulation** - Run a test simulation
- [ ] **Strategic recommendations** - Check persona danger levels appear

---

## 📋 Expected Output

When deployment runs successfully, you should see:

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
   [... more personas ...]

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

## ❌ Common Issues

### "DATABASE_URL environment variable not set"
```bash
# Make sure to include DATABASE_URL=
DATABASE_URL="your_url_here" npm run deploy-personas
```

### "Failed to connect to database"
```bash
# Test connection first
psql "your_database_url"

# Or wake up Railway database
railway run psql
```

### "Generated directory not found"
```bash
# Run converter first
npm run convert-personas-v2

# Then deploy
DATABASE_URL="..." npm run deploy-personas
```

---

## 🔄 Re-running Deployment

Safe to run multiple times! The script:
- ✅ Skips personas that already exist
- ✅ Updates configs instead of duplicating
- ✅ Shows what was imported vs skipped

Second run will show:
```
   ⏭️  Skipping Bootstrap Bob (already exists)
   ⏭️  Skipping Immigrant Dream Ivan (already exists)
   ...
   ⏭️  Personas skipped: 67
```

---

## 📚 Full Documentation

See [docs/DEPLOY_PERSONAS_GUIDE.md](docs/DEPLOY_PERSONAS_GUIDE.md) for complete guide.

---

## ✨ Success!

Once complete:
- ✅ Local DB has 67 personas
- ✅ Production DB has 67 personas
- ✅ All 10 archetypes in both databases
- ✅ App can use full persona intelligence features

**Your persona work is now live in production!** 🎉
