# Vercel Deployment Configuration

Configuration and documentation for deploying the TrialForge AI web application to Vercel.

## Overview

Vercel hosts:
- Main web application (Next.js 14)
- Trial Mode PWA (optional separate deployment)
- Static assets via Vercel Edge Network

## Setup Instructions

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Link Project

```bash
# From project root
cd apps/web
vercel link
```

### 4. Configure Project

In Vercel dashboard:
1. Import GitHub repository
2. Set framework preset: "Next.js"
3. Set root directory: `apps/web`
4. Configure environment variables

## Environment Variables

Configure in Vercel dashboard under Settings → Environment Variables.

### Production Variables

```env
# API Endpoints
NEXT_PUBLIC_API_URL=https://api.trialforge.ai
NEXT_PUBLIC_WS_URL=wss://api.trialforge.ai

# Auth0
NEXT_PUBLIC_AUTH0_DOMAIN=trialforge.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=<client-id>
NEXT_PUBLIC_AUTH0_AUDIENCE=https://api.trialforge.ai
AUTH0_SECRET=<secret>

# NextAuth
NEXTAUTH_URL=https://app.trialforge.ai
NEXTAUTH_SECRET=<generate-random-secret>

# File Storage
BLOB_READ_WRITE_TOKEN=<vercel-blob-token>

# Feature Flags
NEXT_PUBLIC_ENABLE_TRIAL_MODE=true
NEXT_PUBLIC_ENABLE_FOCUS_GROUPS=true

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=<posthog-key>
NEXT_PUBLIC_SENTRY_DSN=<sentry-dsn>
```

### Preview/Development Variables

Set different values for non-production deployments:
- Use staging API URLs
- Use test Auth0 tenant
- Enable additional debugging

## Deployment

### Automatic Deployments

Vercel automatically deploys:
- **Production:** Pushes to `main` branch → `app.trialforge.ai`
- **Preview:** Pull requests → `pr-123.vercel.app`
- **Development:** Pushes to other branches → `branch-name.vercel.app`

### Manual Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Deployment Configuration

The `vercel.json` configures:
- Build settings
- Environment variables
- Headers and redirects
- Edge functions

## Custom Domain Setup

### 1. Add Domain in Vercel

1. Go to project Settings → Domains
2. Add custom domain: `app.trialforge.ai`
3. Vercel provides DNS configuration

### 2. Configure DNS

Add these records to your DNS provider:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### 3. SSL Certificate

Vercel automatically provisions and renews SSL certificates.

## Build Configuration

### Next.js Config

```javascript
// apps/web/next.config.js
module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@trialforge/types', '@trialforge/utils'],
  images: {
    domains: ['blob.vercel-storage.com'],
  },
  experimental: {
    serverActions: true,
  },
};
```

### Build Commands

```bash
# Build command (runs in Vercel)
cd apps/web && npm run build

# Install command
npm install

# Dev command (for Vercel Dev)
cd apps/web && npm run dev
```

## Edge Functions

For WebSocket proxy or API routes requiring edge compute:

```typescript
// apps/web/app/api/ws/route.ts
export const config = {
  runtime: 'edge',
};

export async function GET(request: Request) {
  // WebSocket upgrade logic
}
```

## Performance Optimization

### 1. Image Optimization

Use Next.js Image component:

```typescript
import Image from 'next/image';

<Image
  src="/hero.jpg"
  width={1200}
  height={600}
  alt="Hero"
  priority
/>
```

### 2. Static Generation

Use Static Site Generation where possible:

```typescript
// Static page
export default function Page() {
  return <div>Static content</div>;
}

// Dynamic with ISR
export const revalidate = 3600; // 1 hour

export default function Page() {
  return <div>Regenerated hourly</div>;
}
```

### 3. Edge Caching

Configure cache headers:

```typescript
// apps/web/next.config.js
headers: async () => [
  {
    source: '/api/personas',
    headers: [
      {
        key: 'Cache-Control',
        value: 's-maxage=3600, stale-while-revalidate',
      },
    ],
  },
];
```

## Monitoring

### Analytics

Vercel provides built-in analytics:
- Page views
- Core Web Vitals
- Error tracking

Access: Project → Analytics

### Real User Monitoring

Install Vercel Speed Insights:

```bash
npm install @vercel/speed-insights
```

```typescript
// apps/web/app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Error Tracking

Integrate Sentry:

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV,
});
```

## Security

### 1. Security Headers

Configured in `vercel.json`:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### 2. Environment Variables

- Production variables marked as sensitive
- Not exposed in client bundle unless prefixed with `NEXT_PUBLIC_`
- Encrypted at rest

### 3. CORS

Configure in API routes:

```typescript
export async function GET(request: Request) {
  const response = await fetch('...');

  return new Response(response.body, {
    headers: {
      'Access-Control-Allow-Origin': 'https://app.trialforge.ai',
      'Access-Control-Allow-Methods': 'GET, POST',
    },
  });
}
```

## Preview Deployments

### Preview URLs

Each PR gets a unique preview URL:
- `https://trialforge-ai-git-feature-branch.vercel.app`
- Allows testing before merging
- Shareable with team

### Preview Environment Variables

Set preview-specific variables:
- Different API endpoints (staging)
- Test Auth0 tenant
- Debug mode enabled

## Rollback

### Via Dashboard

1. Go to Deployments
2. Find previous successful deployment
3. Click "⋯" → "Promote to Production"

### Via CLI

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy-vercel.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Logs

### View Deployment Logs

```bash
# Via CLI
vercel logs <deployment-url>

# Via dashboard
Project → Deployments → [deployment] → View Logs
```

### Runtime Logs

For serverless functions and edge functions:
- View in Vercel dashboard under Functions
- Real-time streaming available

## Cost Optimization

### 1. Bandwidth

- Enable image optimization (reduces bandwidth)
- Use Vercel Blob for large files
- Implement proper caching

### 2. Build Minutes

- Use `TURBO_TEAM` and `TURBO_TOKEN` for Remote Caching
- Cache node_modules between builds
- Optimize build scripts

### 3. Function Invocations

- Use edge functions for simple operations (faster, cheaper)
- Cache API responses
- Implement ISR for dynamic pages

## Troubleshooting

### Build Failures

Check build logs:
```bash
vercel logs <deployment-url>
```

Common issues:
- Missing environment variables
- TypeScript errors
- Import path issues

### 404 Errors

Ensure `next.config.js` has correct `basePath` and `trailingSlash` settings.

### Slow Builds

- Enable Remote Caching with Turborepo
- Check for large dependencies
- Optimize image processing

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: support@vercel.com
- Team contact: frontend@trialforge.ai
