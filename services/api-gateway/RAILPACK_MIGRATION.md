# Railpack Migration Guide

## Changes Made

### 1. Switched Builder: NIXPACKS → RAILPACK
- **Why:** Railpack is Railway's modern builder with better caching and 38% smaller images
- **Source:** [Railway Railpack Announcement](https://blog.railway.com/p/introducing-railpack)
- **Backup:** `railway.json.nixpacks-backup`

### 2. Replaced Build Command
**Old (Nixpacks):**
```bash
node --version && yarn install --frozen-lockfile && npx prisma generate --schema=./packages/database/prisma/schema.prisma && cd packages/database && npm run build && cd ../.. && cd packages/ai-client && npm run build && cd ../.. && cd packages/prompt-client && npm run build && cd ../.. && cd packages/utils && npm run build && cd ../.. && cd services/api-gateway && npm run build && cd ../..
```

**New (Railpack + Turborepo):**
```bash
npx prisma generate --schema=./packages/database/prisma/schema.prisma && npx turbo build --filter=@juries/api-gateway...
```

### What This Does

**Prisma Generation:**
- Still generates Prisma client first (required dependency)

**Turborepo Build:**
- `npx turbo build` - Uses your existing turbo.json configuration
- `--filter=@juries/api-gateway...` - Builds api-gateway and all its dependencies
- **Automatic parallelization:** Independent packages build simultaneously
- **Smart caching:** Skips unchanged packages between builds
- **Dependency graph:** Turborepo automatically understands package dependencies

## Expected Benefits

### Build Time Improvements
| Optimization | Expected Savings |
|--------------|------------------|
| **Parallel builds** | 30-40 seconds |
| **Turborepo caching** | 20-60 seconds on rebuilds |
| **Railpack efficiency** | 10-30 seconds |
| **Smaller images** | Faster deploy/startup |

**Total Expected:** 60-130 seconds savings (from current 369s → ~240-310s)

### Image Size Improvements
- **Before:** ~1.2GB (Nixpacks Node.js base)
- **After:** ~450MB (Railpack Node.js base)
- **Benefit:** Faster deployments, lower storage costs

## Known Issues & Risks

### 1. Turborepo Filter Bug
**Issue:** GitHub deployments may fail with "No projects matched the filters"
- **Cause:** Build container missing workspace metadata
- **Source:** [Railway Help Station](https://station.railway.com/questions/turbo-repo-deployment-railway-up-works-03e2ba39)
- **Workaround:** If this occurs, we can fall back to explicit build commands

### 2. Yarn Workspaces Detection
**Issue:** Railpack may have issues finding yarn.lock in monorepos
- **Source:** [Railway Help Station](https://station.railway.com/questions/deploying-a-hybrid-monorepo-f3d08a9c)
- **Status:** Railway has improved monorepo detection as of 2026
- **Workaround:** Set `RAILPACK_INSTALL_COMMAND` env var if needed

### 3. Build Command Limitations
**Issue:** Railpack runs from repo root, not service subdirectory
- **Impact:** Build command needs to reference paths from root
- **Status:** Already handled in our configuration

## Testing Plan

### Success Indicators
- ✅ Build completes in ~240-310 seconds (down from 369s)
- ✅ Parallel package builds visible in logs
- ✅ Turborepo reports cache hits on subsequent builds
- ✅ Service starts successfully
- ✅ All API endpoints work correctly

### Failure Indicators
- ❌ "No projects matched the filters" error
- ❌ yarn.lock not found errors
- ❌ Module resolution failures
- ❌ Build time doesn't improve or gets worse
- ❌ Service fails to start

## Rollback Procedure

### Quick Revert
```bash
cd services/api-gateway
cp railway.json.nixpacks-backup railway.json
git add railway.json
git commit -m "revert: Restore Nixpacks configuration"
git push
```

### Manual Revert
Edit `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "node --version && yarn install --frozen-lockfile && npx prisma generate --schema=./packages/database/prisma/schema.prisma && cd packages/database && npm run build && cd ../.. && cd packages/ai-client && npm run build && cd ../.. && cd packages/prompt-client && npm run build && cd ../.. && cd packages/utils && npm run build && cd ../.. && cd services/api-gateway && npm run build && cd ../.."
  }
}
```

## Alternative Approaches (If Turborepo Filter Fails)

### Option A: Explicit Package List
```json
{
  "build": {
    "buildCommand": "npx prisma generate --schema=./packages/database/prisma/schema.prisma && npx turbo build --filter=@juries/database --filter=@juries/ai-client --filter=@juries/prompt-client --filter=@juries/utils --filter=@juries/api-gateway"
  }
}
```

### Option B: Fall Back to Sequential (with Railpack benefits)
```json
{
  "build": {
    "buildCommand": "npx prisma generate --schema=./packages/database/prisma/schema.prisma && cd packages/database && npm run build && cd ../.. && (cd packages/ai-client && npm run build) & (cd packages/prompt-client && npm run build) & (cd packages/utils && npm run build) & wait && cd services/api-gateway && npm run build"
  }
}
```

### Option C: Set Root Directory
In Railway service settings, try setting:
- **Root Directory:** `/` (build from repo root)
- **Watch Paths:** `packages/**`, `services/api-gateway/**`

## Environment Variables (If Needed)

If Railpack has issues, you can override behavior:

```bash
# Override install command
RAILPACK_INSTALL_COMMAND=yarn install --frozen-lockfile

# Force specific Node version
RAILPACK_NODE_VERSION=20

# Enable debug logging
RAILPACK_DEBUG=true
```

## Monitoring

After deployment, check Railway logs for:

1. **Build Phase:**
   - "Building with Railpack" message
   - Parallel package builds
   - Turborepo cache hits/misses
   - Total build time

2. **Deploy Phase:**
   - Image size (should be ~450MB)
   - Container startup time
   - Service health check

3. **Runtime:**
   - API endpoint responses
   - Error rates
   - Performance metrics

## References

- [Railway Monorepo Guide](https://docs.railway.com/guides/monorepo)
- [Railway Build Configuration](https://docs.railway.com/guides/build-configuration)
- [Railpack vs Nixpacks Comparison](https://www.bitdoze.com/nixpacks-vs-railpack/)
- [Railway Railpack Announcement](https://blog.railway.com/p/introducing-railpack)
- [Turborepo Deployment Issues](https://station.railway.com/questions/turbo-repo-deployment-railway-up-works-03e2ba39)

## Next Steps After Success

If Railpack + Turborepo work well:

1. **Apply to other services** - Migrate notification-service, collaboration-service, etc.
2. **Optimize turbo.json** - Add more granular caching rules
3. **Watch path optimization** - Reduce unnecessary builds
4. **Consider pnpm** - Even faster installs (optional)

## Cost Considerations

**Benefits:**
- Smaller images = lower storage costs
- Faster builds = lower compute costs
- Better caching = fewer full rebuilds

**Estimated Savings:** ~$5-20/month depending on deployment frequency
