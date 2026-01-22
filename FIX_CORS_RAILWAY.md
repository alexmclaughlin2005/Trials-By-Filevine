# Fix CORS Error in Railway API Gateway

## Current Error
```
Access to fetch at 'https://trialforgeapi-gateway-production.up.railway.app/api/auth/login'
from origin 'https://trials-by-filevine-web.vercel.app' has been blocked by CORS policy
```

## Solution: Add ALLOWED_ORIGINS to Railway

### Step 1: Open Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click on your **api-gateway** service

### Step 2: Add Environment Variable

1. Click on the **Variables** tab
2. Click **+ New Variable**
3. Add the following:
   - **Variable name:** `ALLOWED_ORIGINS`
   - **Value:** `https://trials-by-filevine-web.vercel.app,http://localhost:3000`

### Step 3: Deploy

1. Railway will automatically redeploy the service after you save the variable
2. Wait for the deployment to complete (1-2 minutes)
3. Look for the green "Active" status

### Step 4: Test Login Again

Once the Railway service is redeployed:

1. Go to `https://trials-by-filevine-web.vercel.app`
2. Hard refresh (Cmd+Shift+R)
3. Click **Login**
4. Enter credentials:
   - Email: `attorney@example.com`
   - Password: `password123`
5. Submit

## What This Does

The `ALLOWED_ORIGINS` environment variable tells your API Gateway which domains are allowed to make requests to it. The value is a **comma-separated list** of allowed origins:

- `https://trials-by-filevine-web.vercel.app` - Your production Vercel app
- `http://localhost:3000` - For local development

## Expected Result

After setting this, you should see:
- ✅ No CORS errors in the browser console
- ✅ Login request succeeds
- ✅ You get redirected to the dashboard

## If You Still See CORS Errors

### Check 1: Verify the Variable
- Go back to Railway → api-gateway → Variables
- Confirm `ALLOWED_ORIGINS` is set correctly
- Make sure there are no extra spaces or typos

### Check 2: Check Deployment Status
- Make sure the api-gateway service shows "Active" (green)
- Check the deployment logs for any errors

### Check 3: Check the Exact Error
If you still see CORS errors, check if the error message has changed. Look for:
- "The value of the 'Access-Control-Allow-Origin' header..." (means the variable is set but value is wrong)
- "No 'Access-Control-Allow-Origin' header is present" (means the variable isn't being read)

## Adding More Allowed Origins

If you need to add more domains later (like a custom domain), just update the variable:

```
ALLOWED_ORIGINS=https://trials-by-filevine-web.vercel.app,https://yourdomain.com,http://localhost:3000
```

Remember: **comma-separated, no spaces**

---

## Other Services (Future Reference)

If you need to access other Railway services from Vercel, you'll need to add the same `ALLOWED_ORIGINS` variable to:

- **Collaboration Service** (for real-time collaboration features)
- **Notification Service** (if accessed directly from frontend)

Both services likely have the same CORS configuration pattern.

---

**Created**: January 22, 2026
**Status**: Ready to fix - add ALLOWED_ORIGINS to Railway API Gateway
