-- CreateTable
CREATE TABLE "synthesized_profiles" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "profile" JSONB NOT NULL,
    "case_context" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "web_search_count" INTEGER NOT NULL DEFAULT 0,
    "context_hash" TEXT NOT NULL,
    "data_richness" TEXT,
    "confidence_overall" TEXT,
    "concerns_count" INTEGER NOT NULL DEFAULT 0,
    "favorable_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "error_message" TEXT,
    "processing_time_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "synthesized_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "synthesized_profiles_candidate_id_idx" ON "synthesized_profiles"("candidate_id");

-- CreateIndex
CREATE INDEX "synthesized_profiles_case_id_idx" ON "synthesized_profiles"("case_id");

-- CreateIndex
CREATE INDEX "synthesized_profiles_status_idx" ON "synthesized_profiles"("status");

-- CreateIndex
CREATE INDEX "synthesized_profiles_context_hash_idx" ON "synthesized_profiles"("context_hash");

-- AddForeignKey
ALTER TABLE "synthesized_profiles" ADD CONSTRAINT "synthesized_profiles_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
