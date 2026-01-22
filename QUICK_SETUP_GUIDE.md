# Quick Setup Guide: Connect Vercel Frontend to Railway Backend

## 🎯 Quick Reference

### Step 1: Get Your Railway URLs

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Find these service URLs (copy the "Public Domain" for each):
   - **api-gateway** → `https://xxxxx.railway.app`
   - **notification-service** → `https://yyyyy.railway.app`
   - **collaboration-service** → `https://zzzzz.railway.app`

### Step 2: Configure Railway Environment Variables

Add `ALLOWED_ORIGINS` to your **API Gateway** service on Railway:

```bash
# In Railway API Gateway Service → Variables
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://*.vercel.app
```

This allows your Vercel frontend to make requests to the API Gateway.

### Step 3: Configure Vercel Environment Variables

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add these variables (replace the Railway URLs with your actual URLs):

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `NEXT_PUBLIC_API_URL` | `https://your-api-gateway.railway.app/api` | Production, Preview, Development |
| `NEXT_PUBLIC_COLLABORATION_SERVICE_URL` | `https://your-collaboration-service.railway.app` | Production, Preview, Development |
| `NEXT_PUBLIC_WS_URL` | `wss://your-collaboration-service.railway.app` | Production, Preview, Development |

**Note**: Make sure to add `/api` to the end of the API Gateway URL!

### Step 4: Redeploy Both Platforms

1. **Railway**: If you added `ALLOWED_ORIGINS`, redeploy the API Gateway service
2. **Vercel**: Trigger a new deployment (or it will auto-deploy if connected to GitHub)

### Step 5: Test the Connection

1. Open your Vercel app in a browser
2. Open DevTools (F12) → Network tab
3. Try to make an API call (e.g., load a page that fetches data)
4. Verify:
   - ✅ Requests go to your Railway API Gateway URL
   - ✅ No CORS errors in the console
   - ✅ API responses return successfully

---

## 🔧 Detailed Setup Instructions

### Railway Configuration

Your Railway API Gateway needs this environment variable set:

```bash
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-vercel-app-git-branch.vercel.app,https://*.vercel.app
```

**Why?** This configures CORS to allow requests from your Vercel domains.

**Where to add it:**
1. Go to Railway Dashboard
2. Click on your **api-gateway** service
3. Go to the **Variables** tab
4. Click **+ New Variable**
5. Name: `ALLOWED_ORIGINS`
6. Value: Your Vercel domain(s), comma-separated
7. Click **Add** → Service will redeploy automatically

### Vercel Configuration

#### Method 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project (likely named "trials-by-filevine-web" or similar)
3. Click **Settings** → **Environment Variables**
4. Add each variable:

```bash
# API Gateway URL
NEXT_PUBLIC_API_URL = https://your-api-gateway.railway.app/api

# Collaboration Service URL
NEXT_PUBLIC_COLLABORATION_SERVICE_URL = https://your-collaboration-service.railway.app

# WebSocket URL (use wss:// for secure)
NEXT_PUBLIC_WS_URL = wss://your-collaboration-service.railway.app
```

5. For each variable, select environments: **Production**, **Preview**, and **Development**
6. Click **Save**
7. Go to the **Deployments** tab and click **Redeploy** on the latest deployment

#### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
cd apps/web
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_API_URL
# When prompted, paste: https://your-api-gateway.railway.app/api
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_COLLABORATION_SERVICE_URL
# When prompted, paste: https://your-collaboration-service.railway.app
# Select: Production, Preview, Development

vercel env add NEXT_PUBLIC_WS_URL
# When prompted, paste: wss://your-collaboration-service.railway.app
# Select: Production, Preview, Development

# Trigger a new deployment
vercel --prod
```

---

## 🐛 Troubleshooting

### Issue: CORS Error in Browser Console

**Symptom:**
```
Access to fetch at 'https://xxx.railway.app/api/...' from origin 'https://your-app.vercel.app'
has been blocked by CORS policy
```

**Solution:**
1. Verify `ALLOWED_ORIGINS` is set on Railway API Gateway
2. Make sure it includes your Vercel domain
3. Redeploy the API Gateway service on Railway
4. Clear browser cache and try again

### Issue: API Calls Going to Wrong URL

**Symptom:** API calls go to `localhost:3001` instead of Railway

**Solution:**
1. Verify `NEXT_PUBLIC_API_URL` is set in Vercel
2. Make sure environment variables are set for the correct environment (Production/Preview)
3. Redeploy your Vercel app
4. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Environment Variables Not Taking Effect

**Solution:**
1. In Vercel, go to Settings → Environment Variables
2. Verify variables are set for the environment you're testing
3. Go to Deployments tab
4. Click the three dots on your latest deployment → Redeploy
5. Select "Use existing Build Cache" is **OFF** (to ensure fresh build)

### Issue: WebSocket Connection Failing

**Symptom:** Real-time collaboration features not working

**Solution:**
1. Verify `NEXT_PUBLIC_WS_URL` uses `wss://` protocol (not `ws://`)
2. Check that collaboration-service is running on Railway
3. Verify the service has WebSocket support enabled
4. Test the WebSocket endpoint directly using a tool like [WebSocket King](https://websocketking.com/)

### Issue: Authentication Errors

**Symptom:** User login fails or returns 401 Unauthorized

**Solution:**
1. Verify `JWT_SECRET` is set on Railway API Gateway
2. Ensure Auth0/authentication is configured in both Railway and Vercel
3. Check that the JWT token is being sent in the Authorization header
4. Review Railway logs: `railway logs --service api-gateway`

---

## 📋 Checklist

Before you consider setup complete:

- [ ] All 4 Railway services are deployed and running (green status)
- [ ] `ALLOWED_ORIGINS` is set on Railway API Gateway with your Vercel domain
- [ ] `NEXT_PUBLIC_API_URL` is set in Vercel with `/api` suffix
- [ ] `NEXT_PUBLIC_COLLABORATION_SERVICE_URL` is set in Vercel
- [ ] `NEXT_PUBLIC_WS_URL` is set in Vercel with `wss://` protocol
- [ ] Vercel app has been redeployed after adding environment variables
- [ ] Opening Vercel app in browser shows no CORS errors
- [ ] API calls in Network tab go to Railway URLs (not localhost)
- [ ] You can successfully fetch data from the API Gateway
- [ ] WebSocket connection establishes successfully (if using collaboration features)

---

## 🚀 Next Steps

Once connected:

1. **Set up authentication** (Auth0 or your auth provider)
2. **Configure database seeding** for test data
3. **Set up monitoring** (Sentry, LogRocket, etc.)
4. **Enable analytics** (PostHog, Mixpanel, etc.)
5. **Configure CI/CD** for automated deployments
6. **Set up staging environment** for testing before production

---

## 📞 Need Help?

- **Railway Logs**: `railway logs --service api-gateway`
- **Vercel Logs**: Go to Deployments tab → Click on deployment → View Function Logs
- **Check Railway Status**: https://railway.app/dashboard → Your project → Services
- **Check Vercel Status**: https://vercel.com/dashboard → Your project → Deployments
