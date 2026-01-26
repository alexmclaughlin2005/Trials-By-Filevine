# Phase 1 Build Optimizations - Testing Guide

## Changes Made

### Optimization #1: Remove Prebuild Script (15-25s expected savings)
**File:** `services/api-gateway/package.json`
- Removed redundant `prebuild` script that rebuilt all packages
- Nixpacks already builds packages in correct order
- **Risk:** Very Low - prebuild was pure duplication

### Optimization #2: Parallel Package Builds (20-30s expected savings)
**File:** `services/api-gateway/nixpacks.toml`
- Changed from sequential to parallel builds for independent packages
- Uses bash background jobs: `(cmd1) & (cmd2) & (cmd3) & wait`
- Packages `ai-client`, `prompt-client`, `utils` now build simultaneously
- **Risk:** Low - packages have no interdependencies

### Optimization #3: Disable TypeScript Output Files (10-15s expected savings)
**File:** `tsconfig.production.json` (new)
- Disables `declaration`, `declarationMap`, `sourceMap` for production builds
- These files add compilation overhead but aren't needed at runtime
- Only affects API Gateway service build
- **Risk:** Low - output files not used in production

## Expected Results

| Metric | Before | After Phase 1 | Savings |
|--------|--------|---------------|---------|
| Build Time | ~491s (8m 11s) | ~420-445s (7m 0s - 7m 25s) | 45-70s |
| yarn install | 22s | 22s | 0s |
| Package builds | ~40s sequential | ~15-20s parallel | 20-25s |
| Prebuild overhead | ~15-20s | 0s | 15-20s |
| TS compilation | ~30s | ~20s | 10s |

**Combined Expected Savings:** 45-70 seconds

## Testing Steps

### 1. Commit and Push Changes

```bash
cd /Users/alexmclaughlin/Desktop/Cursor\ Projects/Trials\ by\ Filevine
git add services/api-gateway/package.json \
        services/api-gateway/nixpacks.toml \
        services/api-gateway/package.json.backup \
        services/api-gateway/nixpacks.toml.backup2 \
        services/api-gateway/REVERT_PHASE1_OPTIMIZATIONS.sh \
        services/api-gateway/PHASE1_OPTIMIZATION_TEST.md \
        tsconfig.production.json \
        tsconfig.base.json.backup
git commit -m "optimize: Phase 1 build optimizations (45-70s expected savings)"
git push
```

### 2. Monitor Railway Build

Watch the Railway deployment logs:

**Success Indicators:**
- ✅ Build completes without errors
- ✅ Parallel builds show in logs: `npm run build` appears 3 times simultaneously
- ✅ No prebuild execution visible before api-gateway build
- ✅ Total build time: 420-445 seconds (down from 491s)
- ✅ Service starts successfully

**Failure Indicators:**
- ❌ Module not found errors
- ❌ TypeScript compilation errors
- ❌ Package dependency errors
- ❌ Service fails to start
- ❌ Build time doesn't improve

### 3. Check Build Output in Logs

Look for these patterns:

**Parallel Builds (should appear):**
```
RUN (cd packages/ai-client && npm run build) &
    (cd packages/prompt-client && npm run build) &
    (cd packages/utils && npm run build) & wait
```

**No Prebuild (should NOT appear):**
```
> @juries/api-gateway@1.0.0 prebuild
```

**Production TypeScript Config (should appear):**
```
npx tsc --project ../../tsconfig.production.json
```

### 4. Verify Service Health

After deployment:

1. Check Railway logs for startup:
   ```
   Server listening on port 3001
   Database connected
   ```

2. Test health endpoint:
   ```bash
   curl https://your-api-gateway.railway.app/health
   ```

3. Test a few API endpoints to ensure functionality

### 5. Measure Actual Savings

Compare build times:
- **Baseline:** 502 seconds (original)
- **After first optimization:** 491 seconds
- **After Phase 1:** ??? seconds (target: 420-445s)

Calculate actual savings:
```
Savings = 491 - [new_build_time]
```

### 6. If Build Fails - Quick Revert

**Option A: Use revert script**
```bash
cd services/api-gateway
./REVERT_PHASE1_OPTIMIZATIONS.sh
git add package.json nixpacks.toml
git commit -m "revert: Restore original build configuration"
git push
```

**Option B: Manual revert**
```bash
cd services/api-gateway
cp package.json.backup package.json
cp nixpacks.toml.backup2 nixpacks.toml
rm ../../tsconfig.production.json
```

## Detailed Change Analysis

### What Each Optimization Does

**1. Remove Prebuild:**
- **Before:** `npm run build` → runs prebuild → builds database, ai-client, utils → builds api-gateway
- **After:** `npm run build` → builds only api-gateway
- **Why it works:** Nixpacks already built those packages in the build phase

**2. Parallel Builds:**
- **Before:**
  ```
  cd packages/ai-client && npm run build     (10s)
  cd packages/prompt-client && npm run build (8s)
  cd packages/utils && npm run build         (7s)
  Total: 25s
  ```
- **After:**
  ```
  All three build simultaneously              (10s max)
  Total: 10s
  ```
- **Savings:** 15s

**3. Disable Output Files:**
- **Before:** TypeScript generates .js + .d.ts + .d.ts.map + .js.map files
- **After:** TypeScript generates only .js files
- **Why it works:** Production doesn't need declaration files or source maps
- **Savings:** ~30% less disk I/O, faster compilation

## Backup Files Created

- `package.json.backup` - Original package.json with prebuild
- `nixpacks.toml.backup2` - Config after first optimization (before parallel builds)
- `tsconfig.base.json.backup` - Original TypeScript config
- `REVERT_PHASE1_OPTIMIZATIONS.sh` - Quick revert script

## Risk Assessment

| Risk Level | Description |
|------------|-------------|
| **Very Low** | Removing prebuild script (pure duplication) |
| **Low** | Parallel builds (packages are independent) |
| **Low** | Disable output files (not used in production) |

All changes are easily reversible with no data loss risk.

## Next Steps After Success

If Phase 1 succeeds and saves 45-70 seconds, we can consider Phase 2:

1. **Incremental TypeScript compilation** (+15-25s on rebuilds)
2. **Optimize yarn install flags** (+5-10s)
3. **Turborepo for build caching** (+20-40s with cache)
4. **Upgrade to Node 22** (+5-15s)

Each would be tested individually with the same careful approach.

## Troubleshooting

### Build succeeds but service won't start

**Check:**
- Are all package dependencies built?
- Is Prisma client generated?
- Are TypeScript paths resolving correctly?

**Fix:**
```bash
# SSH into Railway container
railway shell

# Check built files
ls -la packages/*/dist
ls -la services/api-gateway/dist
```

### Parallel builds fail

**Symptoms:** "Module not found" errors for internal packages

**Cause:** One package trying to import another that hasn't finished building

**Fix:** Revert to sequential builds, investigate dependency order

### TypeScript compilation fails

**Symptoms:** Type errors, "Cannot find declaration file"

**Cause:** Production config might be too restrictive

**Fix:** Revert tsconfig.production.json, use default config

## Questions or Issues

If you encounter problems:
1. Check Railway logs for specific error messages
2. Run revert script to restore original config
3. Document the error and build output
4. Consider testing optimizations individually instead of combined
