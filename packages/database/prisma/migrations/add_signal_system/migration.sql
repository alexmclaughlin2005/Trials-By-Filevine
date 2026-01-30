-- CreateTable: Signal System for Juror-Persona Matching
-- Phase 1: Foundation - Signal System & Data Models

-- CreateTable: signals
CREATE TABLE "signals" (
    "id" TEXT NOT NULL,
    "signal_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "extraction_method" TEXT NOT NULL,
    "source_field" TEXT,
    "patterns" JSONB,
    "nlp_classifier_id" TEXT,
    "value_type" TEXT NOT NULL,
    "possible_values" JSONB,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable: signal_persona_weights
CREATE TABLE "signal_persona_weights" (
    "id" TEXT NOT NULL,
    "signal_id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "weight" DECIMAL(3,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signal_persona_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable: juror_signals
CREATE TABLE "juror_signals" (
    "id" TEXT NOT NULL,
    "juror_id" TEXT NOT NULL,
    "signal_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "source_reference" TEXT,
    "voir_dire_response_id" TEXT,
    "confidence" DECIMAL(3,2) NOT NULL,
    "extracted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "juror_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable: voir_dire_responses
CREATE TABLE "voir_dire_responses" (
    "id" TEXT NOT NULL,
    "juror_id" TEXT NOT NULL,
    "question_id" TEXT,
    "question_text" TEXT NOT NULL,
    "response_summary" TEXT NOT NULL,
    "response_timestamp" TIMESTAMP(3) NOT NULL,
    "entered_by" TEXT NOT NULL,
    "entry_method" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voir_dire_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: persona_match_updates
CREATE TABLE "persona_match_updates" (
    "id" TEXT NOT NULL,
    "juror_id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "voir_dire_response_id" TEXT,
    "probability_delta" DECIMAL(5,4) NOT NULL,
    "previous_probability" DECIMAL(3,2),
    "new_probability" DECIMAL(3,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persona_match_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: suggested_questions
CREATE TABLE "suggested_questions" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_juror_id" TEXT,
    "question_text" TEXT NOT NULL,
    "question_category" TEXT NOT NULL,
    "discriminates_between" JSONB NOT NULL,
    "response_interpretations" JSONB NOT NULL,
    "follow_up_questions" JSONB,
    "priority_score" DECIMAL(5,4) NOT NULL,
    "priority_rationale" TEXT,
    "times_asked" INTEGER NOT NULL DEFAULT 0,
    "average_information_gain" DECIMAL(5,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggested_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "signals_signal_id_key" ON "signals"("signal_id");

-- CreateIndex
CREATE INDEX "signals_category_idx" ON "signals"("category");

-- CreateIndex
CREATE INDEX "signals_signal_id_idx" ON "signals"("signal_id");

-- CreateIndex
CREATE INDEX "signals_extraction_method_idx" ON "signals"("extraction_method");

-- CreateIndex
CREATE UNIQUE INDEX "signal_persona_weights_signal_id_persona_id_direction_key" ON "signal_persona_weights"("signal_id", "persona_id", "direction");

-- CreateIndex
CREATE INDEX "signal_persona_weights_signal_id_idx" ON "signal_persona_weights"("signal_id");

-- CreateIndex
CREATE INDEX "signal_persona_weights_persona_id_idx" ON "signal_persona_weights"("persona_id");

-- CreateIndex
CREATE UNIQUE INDEX "juror_signals_juror_id_signal_id_source_source_reference_key" ON "juror_signals"("juror_id", "signal_id", "source", "source_reference");

-- CreateIndex
CREATE INDEX "juror_signals_juror_id_idx" ON "juror_signals"("juror_id");

-- CreateIndex
CREATE INDEX "juror_signals_signal_id_idx" ON "juror_signals"("signal_id");

-- CreateIndex
CREATE INDEX "juror_signals_source_idx" ON "juror_signals"("source");

-- CreateIndex
CREATE INDEX "juror_signals_voir_dire_response_id_idx" ON "juror_signals"("voir_dire_response_id");

-- CreateIndex
CREATE INDEX "voir_dire_responses_juror_id_idx" ON "voir_dire_responses"("juror_id");

-- CreateIndex
CREATE INDEX "voir_dire_responses_response_timestamp_idx" ON "voir_dire_responses"("response_timestamp");

-- CreateIndex
CREATE INDEX "voir_dire_responses_question_id_idx" ON "voir_dire_responses"("question_id");

-- CreateIndex
CREATE INDEX "persona_match_updates_juror_id_idx" ON "persona_match_updates"("juror_id");

-- CreateIndex
CREATE INDEX "persona_match_updates_persona_id_idx" ON "persona_match_updates"("persona_id");

-- CreateIndex
CREATE INDEX "persona_match_updates_updated_at_idx" ON "persona_match_updates"("updated_at");

-- CreateIndex
CREATE INDEX "suggested_questions_case_id_idx" ON "suggested_questions"("case_id");

-- CreateIndex
CREATE INDEX "suggested_questions_target_juror_id_idx" ON "suggested_questions"("target_juror_id");

-- CreateIndex
CREATE INDEX "suggested_questions_priority_score_idx" ON "suggested_questions"("priority_score");

-- AddForeignKey
ALTER TABLE "signal_persona_weights" ADD CONSTRAINT "signal_persona_weights_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_persona_weights" ADD CONSTRAINT "signal_persona_weights_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "juror_signals" ADD CONSTRAINT "juror_signals_juror_id_fkey" FOREIGN KEY ("juror_id") REFERENCES "jurors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "juror_signals" ADD CONSTRAINT "juror_signals_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "signals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "juror_signals" ADD CONSTRAINT "juror_signals_voir_dire_response_id_fkey" FOREIGN KEY ("voir_dire_response_id") REFERENCES "voir_dire_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voir_dire_responses" ADD CONSTRAINT "voir_dire_responses_juror_id_fkey" FOREIGN KEY ("juror_id") REFERENCES "jurors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_match_updates" ADD CONSTRAINT "persona_match_updates_juror_id_fkey" FOREIGN KEY ("juror_id") REFERENCES "jurors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_match_updates" ADD CONSTRAINT "persona_match_updates_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_match_updates" ADD CONSTRAINT "persona_match_updates_voir_dire_response_id_fkey" FOREIGN KEY ("voir_dire_response_id") REFERENCES "voir_dire_responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggested_questions" ADD CONSTRAINT "suggested_questions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
