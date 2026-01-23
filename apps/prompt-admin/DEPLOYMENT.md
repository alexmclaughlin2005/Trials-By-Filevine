# Prompt Admin Deployment Guide (Vercel)

## Prerequisites

- Vercel account with GitHub connected
- Prompt Service already deployed on Railway
- Prompt Service URL from Railway deployment

## Deployment Steps

### 1. Prepare Local Environment

Test that the build works locally:

```bash
cd apps/prompt-admin

# Create .env.local with production Prompt Service URL
echo "NEXT_PUBLIC_PROMPT_SERVICE_URL=https://your-prompt-service.railway.app" > .env.local

# Test build
npm run build

# Should complete successfully
```

### 2. Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Project"**
3. Select your GitHub repository: `Trials-By-Filevine`
4. Configure project:
   - **Project Name**: `prompt-admin` or `juries-prompt-admin`
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/prompt-admin`

5. **Build & Development Settings:**
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install`

6. **Environment Variables:**
   Click "Add" and enter:
   ```env
   NEXT_PUBLIC_PROMPT_SERVICE_URL=https://your-prompt-service.railway.app
   ```
   Replace with your actual Railway Prompt Service URL!

7. Click **"Deploy"**
8. Wait 3-5 minutes for build to complete
9. Vercel creates: `prompt-admin.vercel.app` (or custom name)

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from project root
cd /path/to/Trials-by-Filevine
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set root directory: apps/prompt-admin
# - Override settings? No

# Set environment variable
vercel env add NEXT_PUBLIC_PROMPT_SERVICE_URL production
# Enter: https://your-prompt-service.railway.app

# Deploy to production
vercel --prod
```

### 3. Configure Custom Domain (Optional)

1. Go to Vercel project → **Settings** → **Domains**
2. Add custom domain: `prompts.trialforge.ai` or `admin-prompts.trialforge.ai`
3. Add DNS records as shown by Vercel:
   ```
   Type: CNAME
   Name: prompts
   Value: cname.vercel-dns.com
   ```
4. Wait for DNS propagation (5-30 minutes)
5. Vercel auto-configures SSL

### 4. Test Deployment

```bash
# Visit your Vercel URL
open https://prompt-admin.vercel.app

# Check connection to Prompt Service
# 1. You should see list of prompts
# 2. Click on a prompt to edit
# 3. Try saving changes

# If you see CORS errors:
# - Update Prompt Service CORS configuration on Railway
# - Add your Vercel URL to allowed origins
```

### 5. Update Main Application

Update the main web app to link to the production Prompt Admin:

1. Go to Railway → `trialforge-api-gateway` (or your main web app)
2. Update environment variable:
   ```env
   NEXT_PUBLIC_PROMPT_ADMIN_URL=https://prompt-admin.vercel.app
   ```
3. Or for custom domain:
   ```env
   NEXT_PUBLIC_PROMPT_ADMIN_URL=https://prompts.trialforge.ai
   ```
4. Redeploy main app

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_PROMPT_SERVICE_URL` | ✅ | Prompt Service backend URL from Railway |

**Important:** Must start with `NEXT_PUBLIC_` to be available in the browser!

## Troubleshooting

### Build Fails in Vercel

**Check build logs:**
1. Go to Vercel project → **Deployments**
2. Click on failed deployment
3. View build logs

**Common issues:**
- Missing `NEXT_PUBLIC_PROMPT_SERVICE_URL` env var
- TypeScript errors → Run `npm run build` locally
- Missing dependencies → Check `package.json`

### CORS Errors

If you see CORS errors in browser console:

1. Go to Railway → Prompt Service
2. Update CORS configuration in `src/index.ts`:
   ```typescript
   await fastify.register(cors, {
     origin: [
       'https://prompt-admin.vercel.app',
       'https://*.vercel.app', // For preview deployments
       'https://your-main-app.vercel.app',
     ],
     credentials: true,
   });
   ```
3. Push to GitHub to redeploy Railway service

### Prompts Not Loading

**Check Prompt Service URL:**
```bash
# Test from your local machine
curl https://your-prompt-service.railway.app/health

# Should return: {"status":"ok",...}
```

**Check browser console:**
- Open DevTools → Console
- Look for network errors
- Verify API URL is correct

### Monaco Editor Not Loading

This is usually due to SSR issues. We've already fixed this with:
```typescript
const Editor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default as any),
  { ssr: false }
) as any;
```

If issues persist:
- Check browser console for errors
- Verify `dynamic` import is working
- Test in incognito mode (clear cache)

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every push to feature branches or PRs

To disable auto-deploy:
1. Go to **Settings** → **Git**
2. Configure branch deployment settings

## Preview Deployments

Every PR creates a preview deployment:
1. Push to feature branch
2. Create PR
3. Vercel comments with preview URL
4. Test changes before merging
5. Merge PR → Auto-deploys to production

## Monitoring

- **Analytics**: Vercel dashboard → Analytics
- **Logs**: Real-time logs in dashboard
- **Performance**: Core Web Vitals tracked automatically

## Rollback

If deployment breaks:
1. Go to **Deployments**
2. Find last working deployment
3. Click **"..."** → **"Promote to Production"**

## Production Optimizations

### 1. Configure CDN Caching

Vercel automatically caches static assets. To configure:

1. Create `vercel.json` in `apps/prompt-admin/`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, must-revalidate"
        }
      ]
    }
  ]
}
```

### 2. Enable Vercel Analytics

1. Go to **Analytics** tab
2. Click **"Enable Analytics"**
3. View real user metrics

### 3. Set Up Monitoring

Use Vercel's built-in monitoring or integrate:
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **DataDog**: APM monitoring

## Security

### 1. Environment Variables

- Never commit `.env.local` to git
- Use Vercel's encrypted environment variables
- Rotate secrets regularly

### 2. Access Control

Currently, the Prompt Admin is publicly accessible. To add authentication:

1. Integrate with your existing auth system
2. Or use Vercel Edge Middleware for simple auth:

Create `apps/prompt-admin/middleware.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add your auth logic here
  const auth = request.cookies.get('auth-token');

  if (!auth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
```

## Cost Estimation

### Vercel Pricing

- **Hobby (Free)**: Perfect for MVP
  - 100GB bandwidth/month
  - Unlimited deployments
  - Automatic HTTPS

- **Pro ($20/month)**: For production
  - 1TB bandwidth/month
  - Team collaboration
  - Advanced analytics
  - Priority support

### Estimated Usage

- **Bandwidth**: ~1-5GB/month (for 100 active attorneys)
- **Build Minutes**: ~10-20 builds/month = Free
- **Function Executions**: Serverless functions are included

**Total**: $0-20/month depending on plan

## Next Steps

After deploying Prompt Admin:

1. ✅ Test complete workflow:
   - View prompts
   - Edit prompt
   - Save draft
   - Deploy to production
   - Verify changes appear

2. ✅ Update main app sidebar link

3. ✅ Share URL with team

4. 📋 Set up monitoring

5. 🔐 Add authentication (if needed)

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Issues**: Check GitHub repository issues
