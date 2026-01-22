# Railway Quick Start - Trials by Filevine

Quick reference for deploying and managing services on Railway.

## 🚀 New Service Deployment Checklist

### 1. Railway Dashboard Settings
```
Root Directory: /
Watch Paths:
  - services/{service-name}/**
  - packages/**
```

### 2. Configuration Files (in service directory)

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate --schema=./packages/database/prisma/schema.prisma && cd packages/database && npm run build && cd ../.. && cd packages/utils && npm run build && cd ../.. && cd services/{SERVICE_NAME} && npm run build && cd ../.."
  },
  "deploy": {
    "startCommand": "cd services/{SERVICE_NAME} && node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**nixpacks.toml:**
```toml
[phases.setup]
nixPkgs = ["nodejs", "npm"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = [
  "npx prisma generate --schema=./packages/database/prisma/schema.prisma",
  "cd packages/database && npm run build && cd ../..",
  "cd packages/utils && npm run build && cd ../..",
  "cd services/{SERVICE_NAME} && npm run build && cd ../.."
]

[start]
cmd = "cd services/{SERVICE_NAME} && node dist/index.js"
```

### 3. TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@juries/database": ["../../packages/database/src"],
      "@juries/types": ["../../packages/types/src"],
      "@juries/utils": ["../../packages/utils/src"],
      "@juries/ai-client": ["../../packages/ai-client/src"]
    }
  }
}
```

### 4. package.json

**Critical:** TypeScript must be in `dependencies`, not `devDependencies`

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "typescript": "^5.3.3"
  }
}
```

## 📋 Existing Services

### API Gateway
- **Service:** `api-gateway`
- **Port:** 3000
- **Requires:** DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY, FRONTEND_URL

### Collaboration Service
- **Service:** `collaboration-service`
- **Port:** 3002
- **Requires:** DATABASE_URL, REDIS_URL

### Notification Service
- **Service:** `notification-service`
- **Port:** 3003
- **Requires:** DATABASE_URL, REDIS_URL, SMTP_*, TWILIO_*

## 🔧 Common Commands

### Force Redeploy
```bash
git commit --allow-empty -m "chore: Trigger Railway redeploy"
git push
```

### Local Build Test
```bash
# From repository root
npm install
npx prisma generate --schema=./packages/database/prisma/schema.prisma
cd packages/database && npm run build && cd ../..
cd packages/utils && npm run build && cd ../..
cd services/{SERVICE_NAME} && npm run build && cd ../..
```

### Check Service Health
```bash
curl https://{your-service}.railway.app/health
```

## 🐛 Quick Troubleshooting

### Build Fails: Cannot find module '@juries/...'
```bash
# Add to tsconfig.json:
"paths": {
  "@juries/{package}": ["../../packages/{package}/src"]
}
```

### Build Fails: TypeScript not found
```bash
# In package.json, move TypeScript:
"dependencies": {
  "typescript": "^5.3.3"  // Not in devDependencies!
}
```

### Runtime: Cannot find dist/index.js
```bash
# Use explicit cd in railway.json:
"buildCommand": "... && cd services/{SERVICE} && npm run build && cd ../.."
```

### Runtime: Redis connection refused
```bash
# Add Redis database in Railway
# Add REDIS_URL to environment variables
# Update code to parse REDIS_URL
```

### Deployments not triggering
```bash
# Check Railway dashboard:
Root Directory: /
Watch Paths: services/{service}/** AND packages/**
```

## 📊 Build Order

**Always build dependencies first:**
```
1. npm install (root)
2. Generate Prisma client
3. Build @juries/database package
4. Build @juries/utils package
5. Build service
```

## 🔐 Environment Variables

### All Services
```bash
DATABASE_URL=postgresql://...
NODE_ENV=production
```

### Services with Redis
```bash
REDIS_URL=redis://...  # Railway format
```

### API Gateway Only
```bash
JWT_SECRET=...
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=https://...
```

## 📚 Documentation

- **Complete Guide:** [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **Project Structure:** [ai_instructions.md](./ai_instructions.md)
- **API Gateway:** [services/api-gateway/README.md](./services/api-gateway/README.md)

## ⚡ Pro Tips

1. **Always use explicit `cd` commands** - Don't rely on npm workspace execution context
2. **Point TypeScript paths to `src`** - Not `dist` (compile-time vs runtime)
3. **Build packages before services** - Respect dependency order
4. **Test builds locally first** - Catch issues before pushing
5. **Watch Railway logs** - Monitor build and deploy phases separately
6. **Keep watch paths minimal** - Only trigger rebuilds when necessary
7. **Use git commit messages** - Describe what changed to track deployment history

## 🆘 Support

If issues persist after checking this guide:

1. Check Railway build logs (not deploy logs)
2. Verify environment variables are set
3. Test local build with same commands
4. Review [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed troubleshooting
5. Check Railway dashboard settings (Root Directory, Watch Paths)

---

**Last Updated:** 2026-01-22
