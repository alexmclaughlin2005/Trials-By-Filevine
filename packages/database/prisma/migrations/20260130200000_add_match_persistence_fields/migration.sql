-- AlterTable
ALTER TABLE "juror_persona_mappings" ADD COLUMN "match_rank" INTEGER,
ADD COLUMN "match_details" JSONB;
