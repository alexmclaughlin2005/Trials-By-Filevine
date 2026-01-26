# API Gateway Build Time Optimization Analysis

## Current Build Time Baseline
- **Original:** ~502 seconds (8.4 minutes)
- **After duplicate install fix:** Expected ~450-480 seconds (7.5-8 minutes)

## Code Statistics
- **API Gateway:** ~15,590 lines of TypeScript
- **Shared Packages:** ~2,183 lines of TypeScript
- **Compiled Output:** ~108KB across 4 packages

---

## ✅ Optimization #1: Remove Duplicate Yarn Install (DEPLOYED)

**Status:** Deployed and testing

**Change:** Added `dependsOn = ["install"]` to nixpacks.toml

**Expected Savings:** 20-30 seconds

**Risk:** Low - prevents redundant operation

---

## 🎯 Optimization #2: Disable Unnecessary TypeScript Output Files

**Current Issue:**
All packages generate:
- `declaration: true` - Type definition files (.d.ts)
- `declarationMap: true` - Source maps for declarations
- `sourceMap: true` - Source maps for JavaScript

**Impact:**
- Declaration files only needed for published packages
- Source maps add ~30-50% overhead to compilation
- In monorepo, internal packages don't need .d.ts files

**Recommendation:**

### For Production Builds
Update `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "declaration": false,      // Disable in production
    "declarationMap": false,   // Disable in production
    "sourceMap": false,        // Disable in production (keep for dev)
  }
}
```

**OR** Create separate production config and update nixpacks.toml:
```toml
[phases.build]
cmds = [
  # ... other commands
  "tsc --project tsconfig.production.json"  # Uses optimized config
]
```

**Expected Savings:** 10-15 seconds

**Risk:** Low - only affects build artifacts, not runtime

---

## 🎯 Optimization #3: Enable TypeScript Incremental Compilation

**Current Issue:**
TypeScript recompiles everything from scratch each time

**Recommendation:**
Add to `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo"
  }
}
```

**Note:** This requires caching `.tsbuildinfo` files between builds. Railway may not support this out of the box.

**Expected Savings:** 15-25 seconds on rebuilds (not initial builds)

**Risk:** Medium - requires build cache support

---

## 🎯 Optimization #4: Parallel Package Builds

**Current Issue:**
Packages build sequentially even when independent:

```bash
cd packages/ai-client && npm run build && cd ../..      # Sequential
cd packages/prompt-client && npm run build && cd ../.. # Sequential
cd packages/utils && npm run build && cd ../..         # Sequential
```

**Recommendation:**

### Option A: Using npm workspaces (fastest)
```toml
[phases.build]
cmds = [
  "npx prisma generate --schema=./packages/database/prisma/schema.prisma",
  "cd packages/database && npm run build && cd ../..",
  # Build independent packages in parallel
  "npm run build --workspace=@juries/ai-client --workspace=@juries/prompt-client --workspace=@juries/utils",
  "cd services/api-gateway && npm run build && cd ../.."
]
```

### Option B: Using background jobs (most reliable)
```toml
[phases.build]
cmds = [
  "npx prisma generate --schema=./packages/database/prisma/schema.prisma",
  "cd packages/database && npm run build && cd ../..",
  # Build in parallel with background jobs
  "(cd packages/ai-client && npm run build) & (cd packages/prompt-client && npm run build) & (cd packages/utils && npm run build) & wait",
  "cd services/api-gateway && npm run build && cd ../.."
]
```

**Expected Savings:** 20-30 seconds

**Risk:** Low - packages are independent

---

## 🎯 Optimization #5: Remove Redundant Prebuild Script

**Current Issue:**
API Gateway's `package.json` has a prebuild script that rebuilds all packages:

```json
"prebuild": "cd ../../packages/database && npx prisma generate && npm run build && cd ../ai-client && npm run build && cd ../utils && npm run build"
```

This is **completely redundant** because nixpacks.toml already builds these packages!

**Recommendation:**
Update `services/api-gateway/package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",  // Remove prebuild
    "start": "node dist/src/index.js",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit"
  }
}
```

**Expected Savings:** 15-25 seconds (eliminates duplicate package builds)

**Risk:** Very Low - nixpacks already handles build order

---

## 🎯 Optimization #6: Use Turborepo Build Cache

**Current Issue:**
Not leveraging Turborepo's caching despite having `turbo.json` configured

**Recommendation:**
Replace manual build commands with Turborepo:

```toml
[phases.build]
cmds = [
  "npx prisma generate --schema=./packages/database/prisma/schema.prisma",
  "npx turbo build --filter=@juries/api-gateway"
]
```

**Benefits:**
- Automatically handles build dependencies
- Caches outputs between builds
- Parallel builds by default
- Skips unchanged packages

**Expected Savings:** 20-40 seconds (with cache); 10-20 seconds (without cache due to parallelization)

**Risk:** Medium - requires testing Turborepo with Railway

---

## 🎯 Optimization #7: Optimize Yarn Install

**Current Issue:**
Using standard `yarn install --frozen-lockfile`

**Recommendation:**
Add network/cache optimizations:

```toml
[phases.install]
cmds = [
  "yarn install --frozen-lockfile --prefer-offline --network-timeout 100000"
]
```

**Options:**
- `--prefer-offline` - Use cached packages when available
- `--network-timeout 100000` - Increase timeout for reliability
- `--check-cache` - Verify cache integrity

**Expected Savings:** 5-10 seconds

**Risk:** Low - only affects package fetching

---

## 🎯 Optimization #8: Use Node 22 (Optional)

**Current Issue:**
Using Node 20 (required for some packages)

**Check if Node 22 compatible:**
```bash
# Test locally
nvm use 22
npm run build
```

**Benefits:**
- ~5-10% faster V8 compilation
- Better module resolution
- Faster startup times

**Expected Savings:** 5-15 seconds

**Risk:** Medium - need to verify package compatibility

---

## 📊 Optimization Priority & Estimated Impact

| Priority | Optimization | Savings | Risk | Effort |
|----------|-------------|---------|------|--------|
| 1 | ✅ Remove duplicate install (DONE) | 20-30s | Low | Done |
| 2 | Remove prebuild script | 15-25s | Very Low | 5 min |
| 3 | Parallel package builds | 20-30s | Low | 10 min |
| 4 | Disable TS output files | 10-15s | Low | 10 min |
| 5 | Use Turborepo | 20-40s | Medium | 20 min |
| 6 | Optimize yarn install | 5-10s | Low | 5 min |
| 7 | Incremental compilation | 15-25s* | Medium | 15 min |
| 8 | Upgrade to Node 22 | 5-15s | Medium | 30 min |

*Only helps on rebuilds, not initial builds

---

## 🎬 Recommended Implementation Plan

### Phase 1: Quick Wins (30 minutes, 50-70 second savings)
1. ✅ Remove duplicate install (DONE)
2. Remove prebuild script from api-gateway/package.json
3. Add parallel package builds to nixpacks.toml
4. Optimize yarn install flags

**Expected total:** 60-75 seconds saved
**New build time:** ~6.5-7 minutes

### Phase 2: Medium Impact (40 minutes, 30-55 second savings)
5. Disable unnecessary TS output files for production
6. Test Turborepo build approach
7. Incremental compilation (if Railway supports caching)

**Expected total:** 90-130 seconds saved from baseline
**New build time:** ~6-6.5 minutes

### Phase 3: Advanced (Optional, 1 hour, 5-15 second savings)
8. Test Node 22 compatibility
9. Fine-tune package manager settings
10. Consider build container optimizations

**Expected total:** 95-145 seconds saved from baseline
**New build time:** ~5.5-6 minutes

---

## 🚨 Important Notes

1. **Test Each Change:** Deploy one optimization at a time to measure actual impact
2. **Monitor Logs:** Watch Railway build logs for errors or warnings
3. **Revert Capability:** Keep backup configs for quick rollback
4. **Cache Considerations:** Some optimizations depend on Railway's cache support
5. **Measure Reality:** Actual savings may vary based on network, CPU, and cache hits

---

## 📈 Expected Final Results

| Scenario | Build Time | Savings |
|----------|------------|---------|
| Baseline | 502s (8m 22s) | - |
| After Phase 1 | 425-442s (7m 5s - 7m 22s) | 60-77s |
| After Phase 2 | 372-412s (6m 12s - 6m 52s) | 90-130s |
| After Phase 3 | 357-407s (5m 57s - 6m 47s) | 95-145s |

**Best case:** ~6 minutes (40% reduction)
**Realistic case:** ~6.5-7 minutes (30% reduction)

---

## Next Steps

1. Wait for current deployment to complete
2. Measure actual time saved from duplicate install fix
3. Implement Phase 1 optimizations
4. Test and measure each change
5. Document final results
