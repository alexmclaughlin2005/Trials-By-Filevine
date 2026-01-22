# Vercel Environment Variables Setup

## Required Environment Variables for Production

Add these environment variables to your Vercel project:

### 1. Go to Vercel Dashboard
- Navigate to your project settings
- Click on "Environment Variables"
- Add the following variables for **Production**, **Preview**, and **Development** environments

### 2. Backend API URLs

```bash
# API Gateway (Railway URL)
NEXT_PUBLIC_API_URL=https://your-api-gateway.railway.app/api

# Notification Service (Railway URL) - Optional if API Gateway proxies
NEXT_PUBLIC_NOTIFICATION_URL=https://your-notification-service.railway.app

# Collaboration Service (Railway URL)
NEXT_PUBLIC_COLLABORATION_SERVICE_URL=https://your-collaboration-service.railway.app
NEXT_PUBLIC_WS_URL=wss://your-collaboration-service.railway.app
```

### 3. Auth Configuration (if using Auth0)

```bash
# Auth0 Configuration
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_AUDIENCE=https://api.trialforge.ai
AUTH0_SECRET=your-auth0-secret

# NextAuth (if using)
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

### 4. Feature Flags

```bash
NEXT_PUBLIC_ENABLE_TRIAL_MODE=true
NEXT_PUBLIC_ENABLE_FOCUS_GROUPS=true
```

### 5. Analytics (Optional)

```bash
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_SENTRY_DSN=
```

## Getting Your Railway URLs

### Method 1: Railway Dashboard
1. Go to https://railway.app/dashboard
2. Select your project
3. Click on each service
4. Copy the "Public Domain" URL from the Settings tab

### Method 2: Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# List services and their URLs
railway status
```

## Setting Environment Variables in Vercel

### Method 1: Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with appropriate environment scope (Production, Preview, Development)

### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_API_URL preview
vercel env add NEXT_PUBLIC_API_URL development
```

## CORS Configuration on Railway

Your Railway API Gateway needs to allow requests from your Vercel domain. Make sure the following environment variable is set on Railway:

```bash
# In Railway API Gateway service settings
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-preview-domain.vercel.app
```

## Testing the Connection

After setting up the environment variables:

1. **Trigger a new deployment** in Vercel (or redeploy)
2. **Test the API connection**:
   - Open your Vercel app
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try to make an API call
   - Check if requests are going to the correct Railway URLs

3. **Check for CORS errors**:
   - If you see CORS errors in the console, verify the ALLOWED_ORIGINS on Railway
   - Ensure your API Gateway has CORS properly configured

## Troubleshooting

### Issue: API requests failing with CORS errors
**Solution**: Add your Vercel domain to ALLOWED_ORIGINS in Railway API Gateway

### Issue: 404 errors on API calls
**Solution**: Verify the API_URL includes the `/api` path suffix

### Issue: WebSocket connection failing
**Solution**:
- Use `wss://` protocol (not `ws://`) for secure connections
- Verify the collaboration service allows WebSocket upgrades

### Issue: Environment variables not updating
**Solution**:
- Redeploy your Vercel app after adding env vars
- Clear build cache if needed: Settings → Advanced → Clear Build Cache

## Next Steps

After configuring environment variables:

1. ✅ Set Railway service URLs in Vercel
2. ✅ Configure CORS on Railway API Gateway
3. ✅ Redeploy Vercel app
4. ✅ Test API connectivity
5. ✅ Set up Auth0 (if using authentication)
6. ✅ Monitor logs in both Vercel and Railway for any issues
