# Vercel Redeploy Guide - Fix Environment Variables

## Current Issue
After updating `NEXT_PUBLIC_API_URL` in Vercel, the app is still trying to connect to `localhost:3001`. This is because **Vercel environment variable changes require a redeploy to take effect**.

## Step 1: Verify Environment Variable is Set

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project: **trials-by-filevine-web**
3. Go to **Settings** → **Environment Variables**
4. Verify `NEXT_PUBLIC_API_URL` is set to:
   ```
   https://trialforgeapi-gateway-production.up.railway.app/api
   ```
5. Make sure it's enabled for **Production** environment

## Step 2: Trigger a Redeploy

### Option A: Redeploy from Vercel Dashboard (Easiest)

1. In your Vercel project, go to the **Deployments** tab
2. Find the most recent deployment
3. Click the **⋯** (three dots) menu
4. Click **Redeploy**
5. Confirm the redeploy

### Option B: Push a Commit (Alternative)

If Option A doesn't work, push a small commit to trigger a rebuild:

```bash
cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine"

# Make a small change to force rebuild
echo "# Deployment update" >> apps/web/README.md

# Commit and push
git add .
git commit -m "chore: Trigger redeploy for env var update"
git push
```

## Step 3: Wait for Deployment

1. In Vercel dashboard, watch the deployment progress
2. Wait for it to show **Ready** status (usually takes 2-3 minutes)
3. You'll see a green checkmark when complete

## Step 4: Test the Login

Once deployment is complete:

1. Go to your Vercel app URL: `https://trials-by-filevine-web.vercel.app`
2. **Hard refresh** the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Open browser DevTools (F12) → **Network** tab
4. Click **Login**
5. Enter credentials:
   - Email: `attorney@example.com`
   - Password: `password123`
6. Click submit

## What to Look For

### ✅ Success Indicators:
In the Network tab, you should see:
```
POST https://trialforgeapi-gateway-production.up.railway.app/api/auth/login
Status: 200 OK
```

### ❌ If Still Failing:

**Error: Still connecting to localhost:3001**
- Environment variable didn't propagate yet
- Try clearing browser cache and hard refresh
- Check Vercel deployment logs for build errors

**Error: CORS issue**
```
Access to fetch at 'https://...' from origin 'https://trials-by-filevine-web.vercel.app' has been blocked by CORS
```
- Need to add Vercel domain to Railway API Gateway `ALLOWED_ORIGINS`

**Error: 404 Not Found**
- API endpoint doesn't exist or isn't deployed
- Check Railway API Gateway is running

**Error: 401 Unauthorized**
- This actually means it connected successfully!
- Just means credentials are wrong or database not seeded

## Step 5: Update Other Environment Variables (Optional)

While you're at it, you should also set these for full functionality:

```bash
# Collaboration Service
NEXT_PUBLIC_COLLABORATION_SERVICE_URL=https://trialforge-collaboration-service-production.up.railway.app
NEXT_PUBLIC_WS_URL=wss://trialforge-collaboration-service-production.up.railway.app

# If you need notification service directly
NEXT_PUBLIC_NOTIFICATION_URL=https://trialforge-notification-service-production.up.railway.app
```

After adding these, redeploy again following Option A or B above.

## Troubleshooting Environment Variables in Build

If the environment variable isn't being picked up, check the Vercel deployment logs:

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Scroll down to **Build Logs**
4. Search for `NEXT_PUBLIC_API_URL` to see if it was available during build

**Important**: `NEXT_PUBLIC_*` variables are baked into the build at build time, not runtime. This is why a redeploy is required!

## Quick Verification Command

After redeploy, you can verify the environment variable made it into the build by checking the browser console:

```javascript
// Open browser console and run:
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

If this shows `undefined` or `http://localhost:3001`, the redeploy didn't work properly.

---

## Next Steps After Successful Login

Once login works:

1. Verify the dashboard loads
2. Check that the sample case "Johnson v. TechCorp Industries" appears
3. Navigate to jury panel and see the 5 sample jurors
4. Test creating a new case
5. Test all main features

---

**Created**: January 22, 2026
**Status**: Waiting for Vercel redeploy to propagate environment variables
