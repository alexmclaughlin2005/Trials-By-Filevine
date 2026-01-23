-- Fix failed migration in production database
-- Run this via Railway CLI or direct DATABASE_URL connection

-- Option 1: Mark the migration as completed
UPDATE _prisma_migrations
SET finished_at = NOW(),
    applied_steps_count = 1,
    logs = 'Migration manually marked as completed - schema verified via db push'
WHERE migration_name = '20260123125601_add_focus_group_configuration_fields'
  AND finished_at IS NULL;

-- Option 2: Check if migration needs to be rolled back and re-applied
-- First verify the schema is correct:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'focus_group_sessions'
-- AND column_name IN ('selectedArchetypes', 'configurationStep');

-- If columns exist, use Option 1 above
-- If columns missing, need to manually apply the migration DDL
