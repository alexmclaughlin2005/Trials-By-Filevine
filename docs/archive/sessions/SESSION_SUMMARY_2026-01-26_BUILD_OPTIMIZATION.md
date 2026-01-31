# Session Summary: Railway Build Time Optimization
**Date:** January 26, 2026
**Focus:** API Gateway build time optimization on Railway

## Executive Summary

Successfully reduced API Gateway build times from **9-10 minutes (502s) to 1.5-3 minutes (94-180s)** - a **63-81% improvement** - by migrating from Nixpacks to Railpack with Turborepo integration.

## Problem Statement

The API Gateway service was taking 9-10 minutes to build and deploy on Railway, significantly impacting developer productivity and deployment velocity.

## Root Causes Identified

1. **Deprecated builder:** Using Nixpacks (deprecated) instead of Railpack (modern BuildKit-based)
2. **Missing dependency declaration:** `@juries/utils` was imported in code but not declared in `package.json`
3. **Inefficient build orchestration:** Not leveraging Turborepo's dependency graph and caching
4. **Sequential package builds:** Packages were built one at a time instead of in parallel

## Solution Architecture

### Migration to Railpack + Turborepo

**Key Components:**
- **Builder:** Switched from Nixpacks to Railpack (Railway's modern Go-based builder)
- **Build Orchestration:** Turborepo with `--filter=@juries/api-gateway...` syntax
- **Caching:** BuildKit layer caching + Turborepo dependency caching
- **Parallel Builds:** Turborepo automatically parallelizes package builds

### Critical Fix: Dependency Graph

The breakthrough came from fixing the dependency declaration issue:

**Problem:**
```typescript
// Code was importing @juries/utils
import { metaphone } from '@juries/utils';
import { parseName, calculateNameSimilarity } from '@juries/utils';
```

**But package.json was missing:**
```json
{
  "dependencies": {
    "@juries/ai-client": "^1.0.0",
    "@juries/database": "*",
    "@juries/prompt-client": "*",
    "@juries/types": "*",
    // @juries/utils was MISSING!
  }
}
```

**Fix:**
```json
{
  "dependencies": {
    "@juries/utils": "*"  // Added
  }
}
```

This allowed Turborepo's dependency graph analysis to work correctly, ensuring all packages were built in the correct order.

## Implementation Timeline

### Phase 1: Initial Optimization (502s → 369s)
- Added `dependsOn = ["install"]` to nixpacks.toml
- Removed duplicate `prebuild` script from package.json
- **Result:** 122 second improvement (24%)

### Phase 2: Railpack Migration Attempt #1 (FAILED)
- Created railway.json with Railpack + Turborepo filter
- **Error:** `Cannot find module '@juries/utils'` at runtime
- **Root Cause:** Turborepo filter only detected 5 packages (missing utils)
- **Action:** Reverted to Nixpacks

### Phase 3: Investigation & Fix
- Used `npx turbo build --filter=@juries/api-gateway... --dry-run=json` to diagnose
- Discovered missing `@juries/utils` dependency in package.json
- Added dependency and verified with dry-run (now 6 packages detected)

### Phase 4: Railpack Migration Attempt #2 (SUCCESS)
- Re-deployed with fixed dependency graph
- **Result:** 182 seconds (63% faster than baseline)

### Phase 5: Verification
- Pushed multiple verification commits
- **Consistent Result:** 94-180 seconds across all builds
- Confirmed BuildKit + Turborepo caching working correctly

## Files Modified

### services/api-gateway/railway.json
**Purpose:** Railway deployment configuration
**Key Changes:**
- Builder: `NIXPACKS` → `RAILPACK`
- Build command: Simplified to use Turborepo filter

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npx prisma generate --schema=./packages/database/prisma/schema.prisma && npx turbo build --filter=@juries/api-gateway..."
  },
  "deploy": {
    "startCommand": "cd services/api-gateway && node dist/services/api-gateway/src/migrate-and-start.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### services/api-gateway/package.json
**Purpose:** Package dependencies and scripts
**Key Changes:**
- Added `"@juries/utils": "*"` to dependencies
- Removed `prebuild` script (duplicate work)

```json
{
  "dependencies": {
    "@juries/ai-client": "^1.0.0",
    "@juries/database": "*",
    "@juries/prompt-client": "*",
    "@juries/types": "*",
    "@juries/utils": "*"  // ADDED
  }
}
```

## Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Build Time (Baseline)** | 502 seconds | 94-180 seconds | 63-81% |
| **Typical Range** | 9-10 minutes | 1.5-3 minutes | 6-7 minutes saved |
| **Yarn Install** | ~120s | ~0s (cached) | 100% |
| **Turborepo Execution** | N/A | 6-8 seconds | Optimal |
| **Node Modules Copy** | ~30s | ~0s (cached) | 100% |

### Build Log Highlights

**Third Verification Build (94.17 seconds):**
```
yarn install --frozen-lockfile cached
0ms

npx turbo build --filter=@juries/api-gateway...
12s
Time: 8.018s

copy /app/node_modules cached
0ms
```

## Verification Testing

Deployed empty commits to all services to ensure no breakage:
- ✅ api-gateway (multiple verification builds: 94-180s consistently)
- ✅ collaboration-service
- ✅ notification-service
- ✅ prompt-service
- ✅ apps/web (Vercel frontend)

All services deployed successfully with no issues.

## Technical Insights

### Why Turborepo Filter Works

The `--filter=@juries/api-gateway...` syntax tells Turborepo to:
1. Build `@juries/api-gateway` package
2. Build all dependencies (trailing `...` = include dependencies)
3. Use cached builds for unchanged packages
4. Parallelize independent package builds

### Turborepo Dependency Detection

Turborepo analyzes `package.json` dependencies to build the dependency graph:
```
@juries/api-gateway
├── @juries/database
├── @juries/ai-client
├── @juries/prompt-client
├── @juries/types
└── @juries/utils  ← Was missing, causing filter to fail
```

### BuildKit Caching

Railpack uses BuildKit's advanced caching:
- Layer-level caching (vs entire stage caching)
- Content-addressable cache (only invalidate what changed)
- Parallel layer builds
- Cache mounts for node_modules, yarn cache, etc.

## Backup Files Created

The following backup files were created during the optimization process and can be safely removed:

1. `services/api-gateway/nixpacks.toml.backup` - Original Nixpacks config
2. `services/api-gateway/nixpacks.toml.backup2` - After first optimization
3. `services/api-gateway/package.json.backup` - Before prebuild removal
4. `services/api-gateway/railway.json.nixpacks-backup` - Nixpacks configuration
5. `services/api-gateway/railway.json.before-turborepo-fix` - Before dependency fix
6. `tsconfig.base.json.backup` - Original TypeScript config
7. `tsconfig.production.json` - Created but not actively used
8. `REVERT_BUILD_OPTIMIZATION.sh` - Revert script
9. `REVERT_PHASE1_OPTIMIZATIONS.sh` - Revert script
10. `services/api-gateway/REVERT_TO_NIXPACKS.sh` - Revert script

## Lessons Learned

### 1. Always Declare Runtime Dependencies
Even if a package is in the monorepo, it must be declared in `package.json` for build tools to detect it.

### 2. Use Dry-Run for Debugging
`npx turbo build --filter=<package>... --dry-run=json` is invaluable for understanding what Turborepo will build.

### 3. Modern Build Tools Matter
Railpack (BuildKit) is significantly faster than Nixpacks with better caching.

### 4. Verify with Multiple Builds
First build might be lucky timing - always verify with subsequent builds to confirm improvements.

### 5. Empty Commits Must Touch Service Directory
Railway watches specific directories - root-level changes won't trigger service builds.

## Future Optimization Opportunities

While the current optimization is successful, additional improvements could include:

1. **Remote Turborepo Cache:** Configure Vercel Remote Cache for cross-machine cache sharing
2. **Pre-compiled Prisma Client:** Build Prisma client as part of database package build
3. **TypeScript Project References:** Use composite projects for incremental compilation
4. **Parallel Prisma Generation:** Generate Prisma client in parallel with other tasks

However, these are diminishing returns - the current 1.5-3 minute build time is excellent for a monorepo of this complexity.

## Conclusion

The migration from Nixpacks to Railpack with proper Turborepo integration delivered a **63-81% improvement** in build times. The critical success factor was fixing the missing dependency declaration, which allowed Turborepo's dependency graph analysis to work correctly.

**Key Achievements:**
- ✅ Build time reduced from 9-10 minutes to 1.5-3 minutes
- ✅ Consistent, reproducible results across multiple builds
- ✅ All services verified working correctly
- ✅ Modern, maintainable build configuration
- ✅ Leveraging Railway's recommended builder (Railpack)

This optimization significantly improves developer productivity and deployment velocity for the entire team.

---

## Related Documentation
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Railway deployment procedures
- [ai_instructions.md](ai_instructions.md) - Project structure and architecture
- [turbo.json](turbo.json) - Turborepo configuration
