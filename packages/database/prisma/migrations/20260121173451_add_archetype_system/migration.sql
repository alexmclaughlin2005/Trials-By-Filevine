-- AlterTable
ALTER TABLE "focus_group_sessions" ADD COLUMN     "deliberation_summary" JSONB,
ADD COLUMN     "evidence_strength" JSONB,
ADD COLUMN     "expected_damages" JSONB,
ADD COLUMN     "jury_composition" JSONB,
ADD COLUMN     "key_jurors" JSONB,
ADD COLUMN     "simulation_mode" TEXT NOT NULL DEFAULT 'detailed',
ADD COLUMN     "verdict_probabilities" JSONB;

-- AlterTable
ALTER TABLE "jurors" ADD COLUMN     "archetype_confidence" DECIMAL(3,2),
ADD COLUMN     "classified_archetype" TEXT,
ADD COLUMN     "classified_at" TIMESTAMP(3),
ADD COLUMN     "dimension_scores" JSONB;

-- AlterTable
ALTER TABLE "personas" ADD COLUMN     "archetype" TEXT,
ADD COLUMN     "archetype_strength" DECIMAL(3,2),
ADD COLUMN     "case_type_modifiers" JSONB,
ADD COLUMN     "cause_challenge" JSONB,
ADD COLUMN     "characteristic_phrases" JSONB,
ADD COLUMN     "defense_danger_level" INTEGER,
ADD COLUMN     "deliberation_behavior" JSONB,
ADD COLUMN     "demographics" JSONB,
ADD COLUMN     "dimensions" JSONB,
ADD COLUMN     "life_experiences" JSONB,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "plaintiff_danger_level" INTEGER,
ADD COLUMN     "regional_modifiers" JSONB,
ADD COLUMN     "secondary_archetype" TEXT,
ADD COLUMN     "simulation_params" JSONB,
ADD COLUMN     "strategy_guidance" JSONB,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "variant" TEXT,
ADD COLUMN     "voir_dire_responses" JSONB;

-- CreateTable
CREATE TABLE "archetype_configs" (
    "id" TEXT NOT NULL,
    "config_type" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "data" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archetype_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "archetype_configs_config_type_idx" ON "archetype_configs"("config_type");

-- CreateIndex
CREATE INDEX "archetype_configs_is_active_idx" ON "archetype_configs"("is_active");

-- CreateIndex
CREATE INDEX "jurors_classified_archetype_idx" ON "jurors"("classified_archetype");

-- CreateIndex
CREATE INDEX "personas_archetype_idx" ON "personas"("archetype");
