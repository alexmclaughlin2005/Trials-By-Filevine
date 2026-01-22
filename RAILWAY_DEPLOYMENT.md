# Railway Deployment Guide

## Overview

This document outlines the deployment strategy for the Trials by Filevine application on Railway, including configuration, best practices, and troubleshooting guidelines.

## Architecture

### Services Deployed on Railway

1. **api-gateway** - Main REST API service
2. **collaboration-service** - WebSocket service for real-time collaboration
3. **notification-service** - Background job processor for notifications

### Supporting Infrastructure

- **PostgreSQL Database** - Managed PostgreSQL instance
- **Redis** - Used for pub/sub (collaboration service) and queue processing (notification service)

## Monorepo Structure

```
/
├── packages/
│   ├── database/          # Prisma schema and client
│   ├── utils/             # Shared utilities
│   ├── types/             # Shared TypeScript types
│   └── ai-client/         # AI service client
└── services/
    ├── api-gateway/
    ├── collaboration-service/
    └── notification-service/
```

## Railway Configuration

### Project Structure

- **Root Directory**: `/` (set in Railway dashboard for all services)
- **Watch Paths**: Configured per service to trigger deployments on relevant changes
  - API Gateway: `services/api-gateway/**` and `packages/**`
  - Collaboration Service: `services/collaboration-service/**` and `packages/**`
  - Notification Service: `services/notification-service/**` and `packages/**`

### Service Configuration Files

Each service has two configuration files:

1. **railway.json** - Primary Railway configuration
2. **nixpacks.toml** - Alternative/backup configuration using Nixpacks

## Build Strategy

### Key Principles

1. **Build from Root**: All builds execute from the repository root (`/app` in Railway container)
2. **Explicit Directory Changes**: Use `cd` commands to ensure builds happen in correct context
3. **Build Order**: Dependencies must be built before dependents
4. **Production Dependencies**: TypeScript and other build tools must be in `dependencies`, not `devDependencies`

### Build Order

```bash
1. npm install                    # Install all dependencies
2. npx prisma generate           # Generate Prisma client
3. cd packages/database && npm run build    # Build database package
4. cd packages/utils && npm run build       # Build utils package
5. cd services/{service} && npm run build   # Build specific service
```

### Example railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate --schema=./packages/database/prisma/schema.prisma && cd packages/database && npm run build && cd ../.. && cd packages/utils && npm run build && cd ../.. && cd services/api-gateway && npm run build && cd ../.."
  },
  "deploy": {
    "startCommand": "cd services/api-gateway && node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## TypeScript Configuration

### Path Mappings

Each service's `tsconfig.json` must include path mappings for workspace packages:

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

**Important**: Paths point to `src` directories (not `dist`) for compile-time resolution. Runtime resolution uses npm workspaces.

### Database Package Configuration

The database package has special considerations:

```json
{
  "compilerOptions": {
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "prisma"]
}
```

**Note**: `prisma` directory is excluded to prevent TypeScript from trying to compile seed files.

## Package.json Configuration

### Critical Requirements

1. **TypeScript in dependencies**:
   ```json
   {
     "dependencies": {
       "typescript": "^5.3.3"
     }
   }
   ```
   Railway uses `npm ci` which only installs production dependencies.

2. **Database package entry points**:
   ```json
   {
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts"
   }
   ```
   Must point to compiled output, not source files.

3. **Service scripts**:
   ```json
   {
     "scripts": {
       "dev": "tsx watch src/index.ts",
       "build": "tsc",
       "start": "node dist/index.js"
     }
   }
   ```

## Environment Variables

### Required Variables by Service

#### All Services
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Set to `production`

#### API Gateway
- `PORT` - Server port (Railway provides this)
- `JWT_SECRET` - Authentication secret
- `ANTHROPIC_API_KEY` - Claude API key
- `FRONTEND_URL` - CORS origin

#### Collaboration Service
- `PORT` - WebSocket server port
- `REDIS_URL` - Redis connection string (Railway format)

#### Notification Service
- `REDIS_URL` - Redis connection string (Railway format)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email configuration
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` - SMS configuration

### Redis Configuration

Services support both `REDIS_URL` (Railway format) and individual parameters:

```typescript
const redisUrl = process.env.REDIS_URL;
const redis = redisUrl
  ? new Redis(redisUrl)
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    });
```

## Watch Paths Configuration

Watch paths determine when Railway triggers a new deployment.

### Configuration in Railway Dashboard

For each service, set:
- **Root Directory**: `/`
- **Watch Paths**:
  - Service-specific: `services/{service-name}/**`
  - Shared packages: `packages/**`

### Example

For API Gateway:
```
Root Directory: /
Watch Paths:
  services/api-gateway/**
  packages/**
```

This ensures deployments trigger when:
- Any file in `services/api-gateway/` changes
- Any file in shared `packages/` changes

## Common Issues and Solutions

### Issue 1: Cannot find module '/app/services/{service}/dist/index.js'

**Cause**: Build not creating dist folder in correct location.

**Solution**: Use explicit `cd` commands in build script:
```bash
cd services/{service} && npm run build && cd ../..
```

### Issue 2: error TS2307: Cannot find module '@juries/...'

**Cause**: Missing TypeScript path mappings.

**Solution**: Add to service's `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@juries/{package}": ["../../packages/{package}/src"]
    }
  }
}
```

### Issue 3: TypeScript not found during build

**Cause**: TypeScript in devDependencies.

**Solution**: Move TypeScript to dependencies in package.json:
```json
{
  "dependencies": {
    "typescript": "^5.3.3"
  }
}
```

### Issue 4: Prisma seed files causing build errors

**Cause**: TypeScript trying to compile files outside rootDir.

**Solution**: Exclude prisma directory in database package tsconfig:
```json
{
  "exclude": ["node_modules", "dist", "prisma"]
}
```

### Issue 5: Redis connection refused (ECONNREFUSED ::1:6379)

**Cause**: Service trying to connect to localhost instead of Railway Redis.

**Solution**:
1. Add Redis database in Railway
2. Add `REDIS_URL` environment variable
3. Update service code to parse `REDIS_URL`

### Issue 6: Deployments not triggering on code changes

**Cause**: Watch paths not configured.

**Solution**: Set watch paths in Railway dashboard for each service.

### Issue 7: npm workspace commands not working

**Cause**: npm workspace commands execute in wrong context.

**Solution**: Use explicit `cd` commands instead of `npm run build --workspace=@juries/{package}`.

## Best Practices

### 1. Dependency Management

- **Always** put build tools (TypeScript, etc.) in `dependencies`, not `devDependencies`
- Keep `@juries/*` workspace dependencies in sync across services
- Use exact versions for critical packages

### 2. Build Configuration

- Use explicit `cd` commands for directory changes
- Always build in order: database → utils → service
- Include Prisma generation in build command
- Test builds locally before pushing

### 3. TypeScript Configuration

- Point path mappings to `src` directories
- Exclude build artifacts and special directories
- Use consistent compiler options across services
- Enable `strict` mode for type safety

### 4. Environment Variables

- Never commit `.env` files
- Use Railway dashboard for production variables
- Provide fallbacks for local development
- Document all required variables

### 5. Watch Paths

- Include both service directory and shared packages
- Use `/**` to watch all nested files
- Test that changes trigger deployments
- Keep watch paths minimal to avoid unnecessary builds

### 6. Monitoring

- Check Railway logs after deployment
- Verify all services are running
- Test health endpoints
- Monitor Redis connections

### 7. Git Workflow

- Commit configuration files together
- Use descriptive commit messages
- Push small, focused changes
- Verify deployments before moving on

## Testing Deployment Locally

Before pushing to Railway, test the build process locally:

```bash
# From repository root
npm install

# Generate Prisma client
npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Build packages in order
cd packages/database && npm run build && cd ../..
cd packages/utils && npm run build && cd ../..

# Build service
cd services/api-gateway && npm run build && cd ../..

# Start service
cd services/api-gateway && node dist/index.js
```

## Rollback Strategy

If a deployment fails:

1. **Check logs** in Railway dashboard
2. **Identify the error** (build vs runtime)
3. **Revert changes** if necessary:
   ```bash
   git revert HEAD
   git push
   ```
4. **Or redeploy** previous working commit from Railway dashboard

## Maintenance

### Regular Tasks

- **Weekly**: Check Railway logs for errors
- **Monthly**: Update dependencies
- **Quarterly**: Review and optimize build times
- **As needed**: Update environment variables

### Performance Optimization

- Minimize build command complexity
- Cache node_modules when possible
- Use .dockerignore to exclude unnecessary files
- Monitor build times and optimize bottlenecks

## Support and Resources

- **Railway Documentation**: https://docs.railway.app/
- **Project Repository**: https://github.com/alexmclaughlin2005/Trials-By-Filevine
- **Railway Dashboard**: https://railway.app/dashboard

## Version History

- **2026-01-22**: Initial documentation after successful Railway deployment
  - Established build strategy with explicit cd commands
  - Configured TypeScript path mappings
  - Set up Redis for collaboration and notification services
  - Configured watch paths for automatic deployments
