-- AlterTable
ALTER TABLE "personas" ADD COLUMN     "embedding" JSONB,
ADD COLUMN     "embedding_model" TEXT,
ADD COLUMN     "embedding_updated_at" TIMESTAMP(3);
