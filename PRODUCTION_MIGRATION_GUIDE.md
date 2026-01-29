# Production Database Migration Guide

## Overview

When you push schema changes to production, you need to run database migrations to apply the changes to your production database.

## Migration File Created

The following migration has been created for the physical description fields:
- **File**: `packages/database/prisma/migrations/20260129150000_add_physical_description_fields/migration.sql`
- **Changes**: Adds 7 new fields to the `jurors` table:
  - `hair_color`
  - `height`
  - `weight`
  - `gender`
  - `skin_tone`
  - `race`
  - `physical_description`

## Pre-Deployment Checklist

Before running migrations in production:

- [ ] **Test migration locally first** (recommended)
- [ ] **Backup production database** (if possible)
- [ ] **Verify migration file is committed** to git
- [ ] **Ensure code changes are deployed** (API and frontend support the new fields)

## Running Migrations in Production

### Option A: Railway CLI (Recommended)

This is the safest and easiest method:

```bash
# 1. Install Railway CLI (if not already installed)
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Navigate to your project root
cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine"

# 4. Link to your Railway project
railway link
# Select your project when prompted

# 5. Link to the database service (or API Gateway service that has DB access)
railway service
# Select the service that has DATABASE_URL configured

# 6. Run migrations
railway run --service <your-service-name> npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma
```

**Alternative (if Railway CLI doesn't work):**
```bash
# Set the schema path explicitly
railway run npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma
```

### Option B: Local Migration to Production DB

If Railway CLI isn't available, you can run migrations locally against the production database:

```bash
# 1. Navigate to database package
cd packages/database

# 2. Get production DATABASE_URL from Railway dashboard:
#    - Go to Railway dashboard
#    - Select your database service
#    - Go to Variables tab
#    - Copy DATABASE_URL value

# 3. Set DATABASE_URL temporarily (DO NOT commit this!)
export DATABASE_URL="postgresql://user:password@host:port/database"

# 4. Run production migrations (this applies pending migrations)
npx prisma migrate deploy

# 5. Verify migration was applied
npx prisma migrate status

# 6. IMPORTANT: Unset the variable immediately
unset DATABASE_URL
```

### Option C: Using the Migration Script

There's a helper script in the root directory:

```bash
# 1. Get DATABASE_URL from Railway dashboard
# 2. Set it in your environment
export DATABASE_URL="postgresql://user:password@host:port/database"

# 3. Run the script
./migrate-railway.sh

# 4. Unset the variable
unset DATABASE_URL
```

## Verification Steps

After running migrations, verify they were applied:

```bash
# Check migration status
npx prisma migrate status

# Should show: "Database schema is up to date"
```

Or connect to your production database and verify the columns exist:

```sql
-- Connect to production DB and run:
\d jurors

-- Should show the new columns:
-- hair_color, height, weight, gender, skin_tone, race, physical_description
```

## Important Notes

1. **`prisma migrate deploy` vs `prisma migrate dev`**:
   - Use `migrate deploy` for production (applies pending migrations)
   - Use `migrate dev` only for local development (creates new migrations)

2. **Migration Safety**:
   - The migration only adds new columns (all nullable)
   - No data will be lost
   - Existing records will have `NULL` for new fields

3. **Rollback**:
   - If you need to rollback, you'll need to manually drop the columns:
   ```sql
   ALTER TABLE jurors DROP COLUMN hair_color;
   ALTER TABLE jurors DROP COLUMN height;
   -- etc.
   ```
   - Or create a new migration to remove them

4. **Timing**:
   - Run migrations **before** deploying code changes
   - Or run migrations **immediately after** deploying (before users hit the new features)
   - The API will work fine with NULL values for the new fields

## Troubleshooting

### Error: "Migration failed to apply cleanly"

This usually means there's a conflict with existing migrations. Try:

```bash
# Reset migration state (CAREFUL - only if safe to do so)
npx prisma migrate resolve --applied 20260129150000_add_physical_description_fields
```

### Error: "Cannot find migration"

Make sure you're running from the correct directory and the migration file exists:

```bash
ls packages/database/prisma/migrations/20260129150000_add_physical_description_fields/
```

### Error: "Database connection failed"

- Verify DATABASE_URL is correct
- Check Railway database is running
- Ensure network access is allowed

## Post-Migration

After successful migration:

- [ ] Verify API endpoints accept new fields
- [ ] Test creating a juror with physical description fields
- [ ] Verify frontend form works correctly
- [ ] Check application logs for any errors

## Summary

**Quick Command (Railway CLI):**
```bash
railway link && railway run npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma
```

**Quick Command (Local with Production DB):**
```bash
cd packages/database
export DATABASE_URL="<your-production-db-url>"
npx prisma migrate deploy
unset DATABASE_URL
```
