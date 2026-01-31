# Deploy v5.0.0 Juror Framing via Admin UI

**Quick deployment guide for updating prompts without CLI access**

---

## ✅ What Was Done

1. ✅ Added roundtable juror framing prompts (v5.0.0) to seed endpoint
2. ✅ Added "Seed/Update All Prompts" button to prompt-admin UI
3. ✅ Pushed to GitHub (commits: `6b51ec5`, `10254a7`)
4. ✅ Railway will auto-deploy the changes

---

## 🚀 Deployment Steps (Simple!)

### Step 1: Wait for Railway Deployment (~3-5 minutes)

Check Railway dashboard:
1. Go to https://railway.app
2. Wait for green "Deployed" status on:
   - `prompt-service` ✅
   - `api-gateway` ✅

### Step 2: Open Prompt Admin (Local or Production)

**Option A: Local (for testing)**
```
http://localhost:3000/admin/prompts
```
(Or wherever your prompt-admin runs)

**Option B: Production**
```
https://your-prompt-admin.vercel.app
```

### Step 3: Click "Seed/Update All Prompts" Button

1. Look for the green button in the top right: **"Seed/Update All Prompts"**
2. Click it
3. Wait ~5-10 seconds
4. You'll see a green success banner: ✅ "All prompts seeded/updated successfully!"

### Step 4: Verify Prompts Updated

After seeding, you should see updated prompts in the list:
- `roundtable-initial-reaction` - Should show new version
- `roundtable-conversation-turn` - Should show new version

Click on each to verify:
- System prompt starts with "CRITICAL CONTEXT: You are a JUROR, not a lawyer"
- Temperature is 0.5
- Version should be v5.0.0 or higher

### Step 5: Restart Services (Optional but Recommended)

**Via Railway Dashboard:**
1. Go to `prompt-service` → Click "⋮" → "Restart"
2. Go to `api-gateway` → Click "⋮" → "Restart"

This ensures services pick up the new prompts immediately.

### Step 6: Test in Production

1. Go to your production app
2. Navigate to: Cases → [Select case] → Focus Groups
3. Start a roundtable conversation
4. Verify personas act as jurors (not lawyers)

---

## 🎯 What the Seed Button Does

When you click "Seed/Update All Prompts", the admin UI calls:

```
POST http://localhost:3002/api/v1/admin/seed
```

This endpoint:
1. Checks if each prompt exists
2. If exists: Creates a new version and deploys it
3. If doesn't exist: Creates the prompt and initial version
4. Updates these prompts:
   - `extract-key-points`
   - `roundtable-takeaways-synthesis`
   - `persona-case-insights`
   - `roundtable-initial-reaction` ⭐ NEW (v5.0.0)
   - `roundtable-conversation-turn` ⭐ NEW (v5.0.0)

---

## 🛠️ Troubleshooting

### Issue: Seed Button Not Showing

**Solution:** Clear browser cache or hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

The button was just added, so you may need to refresh.

### Issue: "Network error" when clicking seed

**Solution:** Check that prompt-service is running:
```bash
curl http://localhost:3002/health
# Should return: {"status":"ok",...}
```

If not running, restart it.

### Issue: Seed succeeds but prompts still v4.0.0

**Solution:** Restart services (see Step 5 above)

Services cache prompts in memory. Restarting loads the new versions.

### Issue: Personas still acting like lawyers after deployment

**Possible causes:**
1. Services not restarted yet → Restart them
2. Frontend cache → Hard refresh browser
3. Temperature too high → Check prompt version shows 0.5

**Debug:**
```bash
# Check what version is active
curl https://your-prompt-service.railway.app/api/v1/admin/prompts | grep -A 5 "roundtable"
```

---

## 📊 Expected Behavior After Deployment

### Before (v4.0.0):
```
"We should immediately send preservation letters to any potential
bars. We need to subpoena the defendant's phone records. The
insurance company will want to settle to avoid punitive damages."
```

### After (v5.0.0):
```
"This drunk driving story makes me really angry - texting while
drunk is so reckless. I feel bad for the surgeon's family. I'm
curious what his injuries were though - was he paralyzed or just
hurt?"
```

---

## 🔄 Alternative: Direct API Call (No UI)

If you prefer to call the endpoint directly:

```bash
# Local
curl -X POST http://localhost:3002/api/v1/admin/seed

# Production
curl -X POST https://your-prompt-service.railway.app/api/v1/admin/seed
```

---

## 📝 Rollback (If Needed)

If v5.0.0 causes issues, you can rollback via the admin UI:

1. Go to prompt admin
2. Click on `roundtable-initial-reaction`
3. Find v4.0.0 in version history
4. Click "Deploy" next to v4.0.0
5. Repeat for `roundtable-conversation-turn`
6. Restart services

---

## ✅ Deployment Complete When:

- [ ] Railway shows both services deployed
- [ ] Clicked "Seed/Update All Prompts" button
- [ ] Saw green success banner
- [ ] Prompts show new versions in list
- [ ] Services restarted
- [ ] Production focus group tested
- [ ] Personas act as jurors, not lawyers

---

**Status:** 🟢 Ready to deploy via admin UI
**No Railway CLI needed!**
**Deployment time:** ~5-10 minutes total

---

## 📖 Related Docs

- [SESSION_SUMMARY_2026-01-27_JUROR_FRAMING_FIX.md](./SESSION_SUMMARY_2026-01-27_JUROR_FRAMING_FIX.md) - Why we did this
- [JUROR_FRAMING_DEPLOYMENT.md](./JUROR_FRAMING_DEPLOYMENT.md) - Full deployment guide (CLI method)
- [FEATURE_ATTORNEY_REVIEWER_MODE.md](./FEATURE_ATTORNEY_REVIEWER_MODE.md) - Future attorney mode

---

*Deployed via admin UI - No CLI required!* 🎉
