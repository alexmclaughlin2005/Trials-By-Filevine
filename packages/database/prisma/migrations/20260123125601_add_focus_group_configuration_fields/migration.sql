-- AlterTable
ALTER TABLE "focus_group_sessions" ADD COLUMN     "archetype_count" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "archetype_selection_mode" TEXT NOT NULL DEFAULT 'random',
ADD COLUMN     "configuration_step" TEXT NOT NULL DEFAULT 'setup',
ADD COLUMN     "custom_questions" JSONB,
ADD COLUMN     "selected_archetypes" JSONB,
ADD COLUMN     "selected_arguments" JSONB;
