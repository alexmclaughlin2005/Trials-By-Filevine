-- AlterTable
ALTER TABLE "personas" ADD COLUMN     "archetype_deliberation_behavior" TEXT,
ADD COLUMN     "archetype_how_to_spot" JSONB,
ADD COLUMN     "archetype_verdict_lean" TEXT,
ADD COLUMN     "archetype_what_they_believe" TEXT,
ADD COLUMN     "instant_read" TEXT,
ADD COLUMN     "phrases_youll_hear" JSONB,
ADD COLUMN     "strike_or_keep" JSONB,
ADD COLUMN     "verdict_prediction" JSONB;
