# API Gateway Build Optimization - Testing Guide

## What Changed

Modified `nixpacks.toml` to prevent duplicate `yarn install` during build phase.

**Key Change:** Added `dependsOn = ["install"]` to explicitly tell Nixpacks that the build phase depends on the install phase being complete, preventing it from auto-adding a redundant `yarn install`.

## Expected Results

- **Build time reduction:** 20-30 seconds (from ~9 minutes to ~8-8.5 minutes)
- **Behavior:** Build should work exactly the same, just faster
- **Risk level:** LOW - only removing redundant operation

## Testing Steps

### 1. Commit and Push Changes

```bash
cd /Users/alexmclaughlin/Desktop/Cursor\ Projects/Trials\ by\ Filevine
git add services/api-gateway/nixpacks.toml
git commit -m "optimize: Remove duplicate yarn install from API Gateway build"
git push
```

### 2. Monitor Railway Build

Watch the Railway deployment logs for the api-gateway service:

1. Go to Railway dashboard
2. Select the api-gateway service
3. Watch the "Deployments" tab
4. Look for the build output

**What to check:**
- ✅ Build completes successfully
- ✅ Build time is reduced (compare to ~502 seconds baseline)
- ✅ No "module not found" or dependency errors
- ✅ Service starts successfully after build

### 3. Verify Service Health

After deployment completes:

1. Check Railway logs to ensure service started: `Server listening on port 3001`
2. Test a few API endpoints to ensure functionality:
   - `GET /health` - Health check
   - `GET /api/cases` - List cases (requires auth)
   - Any other critical endpoints

### 4. If Build Fails

**Quick Revert:**

```bash
cd /Users/alexmclaughlin/Desktop/Cursor\ Projects/Trials\ by\ Filevine/services/api-gateway
./REVERT_BUILD_OPTIMIZATION.sh
git add nixpacks.toml
git commit -m "revert: Restore original nixpacks.toml configuration"
git push
```

**Or manually:**

```bash
cd services/api-gateway
cp nixpacks.toml.backup nixpacks.toml
```

### 5. Check Build Logs

Look for these indicators in the Railway build logs:

**Success indicators:**
- `yarn install --frozen-lockfile` appears ONCE in the logs (in install phase)
- NO duplicate yarn install in build phase
- Build completes without errors
- Total build time is 420-480 seconds (down from 502 seconds)

**Failure indicators:**
- Module not found errors
- Prisma client generation failures
- TypeScript compilation errors
- Service fails to start

## Backup Files Created

- `nixpacks.toml.backup` - Original configuration
- `REVERT_BUILD_OPTIMIZATION.sh` - Quick revert script

## Next Steps After Success

If this optimization works well, we can pursue additional optimizations:

1. **Parallel package builds** - Build independent packages simultaneously
2. **Remove prebuild from package.json** - Eliminate redundant package rebuilds
3. **TypeScript incremental compilation** - Speed up subsequent builds
4. **Turborepo caching** - Leverage build cache for faster rebuilds

Each of these could save additional 10-30 seconds.

## Questions or Issues

If you encounter any problems:
1. Check Railway deployment logs for specific error messages
2. Revert using the script above
3. Document the error for further investigation
