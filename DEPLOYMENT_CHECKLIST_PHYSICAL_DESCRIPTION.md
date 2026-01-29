# Production Deployment Checklist - Physical Description Fields

## Summary of Changes

This deployment adds physical description fields to the juror form and database.

### Code Changes
- ✅ Updated `apps/web/components/case/jurors-tab.tsx`:
  - Separated "Occupation" into "Job Title" and "Employer" fields
  - Added physical description section with 7 new fields
  - Made "Add Juror" button sticky at bottom of dialog
- ✅ Updated `services/api-gateway/src/routes/jurors.ts`:
  - Added physical description fields to `createJurorSchema`
- ✅ Updated `packages/types/src/juror.ts`:
  - Added physical description fields to TypeScript interfaces
- ✅ Updated `packages/database/prisma/schema.prisma`:
  - Added 7 new fields to Juror model

### Database Migration
- ✅ Migration file created: `packages/database/prisma/migrations/20260129150000_add_physical_description_fields/migration.sql`
- Migration adds 7 nullable columns (safe, no data loss)

## Pre-Deployment Checklist

- [ ] All code changes committed to git
- [ ] Code pushed to main branch
- [ ] Local testing completed and verified
- [ ] API Gateway builds successfully
- [ ] Frontend builds successfully

## Deployment Steps

### 1. Push Code to Production

```bash
# Verify all changes are committed
git status

# Push to main branch
git push origin main
```

### 2. Run Database Migration

**Option A: Railway CLI (Recommended)**

```bash
# Install Railway CLI if needed
npm install -g @railway/cli

# Login and link
railway login
railway link  # Select your project

# Run migration
railway run npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma
```

**Option B: Local with Production DB**

```bash
cd packages/database

# Get DATABASE_URL from Railway dashboard (Variables tab)
export DATABASE_URL="<your-production-database-url>"

# Run migration
npx prisma migrate deploy

# Verify
npx prisma migrate status

# Unset variable
unset DATABASE_URL
```

### 3. Verify Deployment

- [ ] API Gateway deployed successfully (check Railway logs)
- [ ] Frontend deployed successfully (check Vercel)
- [ ] Database migration applied (check migration status)
- [ ] Test creating a juror with physical description fields
- [ ] Verify form displays correctly
- [ ] Verify data saves correctly

## Rollback Plan (if needed)

If issues occur, the migration can be rolled back:

```sql
-- Connect to production database and run:
ALTER TABLE jurors DROP COLUMN IF EXISTS hair_color;
ALTER TABLE jurors DROP COLUMN IF EXISTS height;
ALTER TABLE jurors DROP COLUMN IF EXISTS weight;
ALTER TABLE jurors DROP COLUMN IF EXISTS gender;
ALTER TABLE jurors DROP COLUMN IF EXISTS skin_tone;
ALTER TABLE jurors DROP COLUMN IF EXISTS race;
ALTER TABLE jurors DROP COLUMN IF EXISTS physical_description;
```

Then revert code changes via git.

## Files Changed

1. `apps/web/components/case/jurors-tab.tsx` - Form UI updates
2. `services/api-gateway/src/routes/jurors.ts` - API schema updates
3. `packages/types/src/juror.ts` - TypeScript type updates
4. `packages/database/prisma/schema.prisma` - Database schema
5. `packages/database/prisma/migrations/20260129150000_add_physical_description_fields/migration.sql` - Migration file

## Notes

- Migration is **safe** - only adds nullable columns
- No data loss - existing records will have NULL for new fields
- API will work fine with NULL values
- Frontend form handles empty fields gracefully
