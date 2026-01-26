-- AlterTable
ALTER TABLE "personas" ADD COLUMN     "engagement_style" TEXT,
ADD COLUMN     "response_tendency" TEXT,
ADD COLUMN     "sentence_style" TEXT,
ADD COLUMN     "speech_patterns" JSONB,
ADD COLUMN     "vocabulary_level" TEXT;
