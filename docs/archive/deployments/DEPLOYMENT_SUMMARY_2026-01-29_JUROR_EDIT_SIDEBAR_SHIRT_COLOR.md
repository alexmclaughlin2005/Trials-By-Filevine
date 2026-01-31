# Deployment Summary - Juror Edit Sidebar & Shirt Color Feature
**Date**: January 29, 2026

## Overview

This deployment adds:
1. **Juror Edit Sidebar**: Converted juror detail/edit page to a slide-in sidebar for better UX
2. **Shirt Color/Clothing Field**: Added new field for juror clothing description and integrated into image generation

## Changes Summary

### Database Changes
- **New Migration**: `20260129170000_add_juror_shirt_color/migration.sql`
  - Adds `shirt_color` column to `jurors` table (nullable TEXT field)

### Backend Changes
- **Schema Updates**:
  - `packages/database/prisma/schema.prisma`: Added `shirtColor` field
  - `packages/types/src/juror.ts`: Added `shirtColor` to all juror interfaces
  - `services/api-gateway/src/routes/jurors.ts`: Added `shirtColor` to validation schemas and image generation endpoint

- **Image Generation**:
  - `services/api-gateway/src/services/juror-headshot-service.ts`: Updated to include shirt color in DALL-E prompts

### Frontend Changes
- **New Component**: `apps/web/components/case/juror-edit-sidebar.tsx`
  - Slide-in sidebar for editing jurors
  - Includes all juror fields, image generation, and research features

- **Updated Components**:
  - `apps/web/components/case/jurors-tab.tsx`: Added shirt color field to add juror form
  - `apps/web/components/case/jury-box-view.tsx`: Updated to use sidebar instead of navigation
  - `apps/web/components/case/juror-card.tsx`: Improved drag handle separation from click navigation

## Pre-Deployment Checklist

- [x] All code changes committed
- [x] Database migration file created
- [x] Types updated across codebase
- [x] API validation schemas updated
- [x] Frontend forms updated
- [x] Image generation service updated
- [ ] **Run database migration in production** (see below)
- [ ] **Deploy code changes**
- [ ] **Verify functionality in production**

## Database Migration Steps

### Option 1: Railway CLI (Recommended)

```bash
# 1. Navigate to project root
cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine"

# 2. Link to Railway project (if not already linked)
railway link

# 3. Run migration
railway run npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma
```

### Option 2: Local Migration Script

```bash
# 1. Get DATABASE_URL from Railway dashboard
#    - Go to Railway dashboard
#    - Select your database service
#    - Go to Variables tab
#    - Copy DATABASE_URL

# 2. Set environment variable
export DATABASE_URL="postgresql://user:password@host:port/database"

# 3. Run migration script
./migrate-railway.sh

# 4. Unset variable (IMPORTANT!)
unset DATABASE_URL
```

### Option 3: Manual Migration

```bash
# 1. Navigate to database package
cd packages/database

# 2. Set DATABASE_URL (from Railway dashboard)
export DATABASE_URL="postgresql://user:password@host:port/database"

# 3. Run migration
npx prisma migrate deploy

# 4. Verify migration status
npx prisma migrate status

# 5. Unset variable
unset DATABASE_URL
```

## Migration Details

**Migration File**: `packages/database/prisma/migrations/20260129170000_add_juror_shirt_color/migration.sql`

**SQL**:
```sql
ALTER TABLE "jurors" ADD COLUMN "shirt_color" TEXT;
```

**Impact**:
- ✅ Safe migration (adds nullable column)
- ✅ No data loss
- ✅ Existing records will have `NULL` for `shirt_color`
- ✅ Backward compatible (API handles missing field gracefully)

## Post-Deployment Verification

After deploying, verify:

1. **Database Migration**:
   ```sql
   -- Connect to production DB and verify column exists
   \d jurors
   -- Should show: shirt_color | text | 
   ```

2. **API Endpoints**:
   - ✅ Create juror with shirt color works
   - ✅ Update juror with shirt color works
   - ✅ Image generation includes shirt color in prompt

3. **Frontend**:
   - ✅ Add juror form shows shirt color field
   - ✅ Edit sidebar shows shirt color field
   - ✅ Clicking juror card opens sidebar (not navigation)
   - ✅ Sidebar slides in from right
   - ✅ Image generation button works

4. **Image Generation**:
   - ✅ Generate image with shirt color specified
   - ✅ Verify generated image reflects shirt color

## Rollback Plan

If issues occur:

1. **Code Rollback**: Revert to previous deployment
2. **Database Rollback** (if needed):
   ```sql
   ALTER TABLE "jurors" DROP COLUMN "shirt_color";
   ```

## Files Changed

### Database
- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260129170000_add_juror_shirt_color/migration.sql`

### Backend
- `packages/types/src/juror.ts`
- `services/api-gateway/src/routes/jurors.ts`
- `services/api-gateway/src/services/juror-headshot-service.ts`

### Frontend
- `apps/web/components/case/juror-edit-sidebar.tsx` (NEW)
- `apps/web/components/case/jurors-tab.tsx`
- `apps/web/components/case/jury-box-view.tsx`
- `apps/web/components/case/juror-card.tsx`

## Notes

- The sidebar maintains all existing functionality (research, archetype classification, etc.)
- Shirt color is optional - existing jurors without it will still generate images
- Image generation combines occupation-based clothing with specified shirt color
- Drag-and-drop still works via the grip icon on juror cards

## Quick Deploy Command

```bash
# Run migration
railway run npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma

# Then deploy code via Railway dashboard or CLI
railway up
```
