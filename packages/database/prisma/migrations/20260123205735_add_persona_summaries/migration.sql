-- CreateTable
CREATE TABLE "focus_group_persona_summaries" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "persona_name" TEXT NOT NULL,
    "total_statements" INTEGER NOT NULL,
    "first_statement" TEXT NOT NULL,
    "last_statement" TEXT NOT NULL,
    "initial_position" TEXT NOT NULL,
    "final_position" TEXT NOT NULL,
    "position_shifted" BOOLEAN NOT NULL,
    "shift_description" TEXT,
    "main_points" JSONB NOT NULL,
    "concerns_raised" JSONB NOT NULL,
    "questions_asked" JSONB NOT NULL,
    "influence_level" TEXT NOT NULL,
    "agreed_with_most" TEXT[],
    "disagreed_with_most" TEXT[],
    "influenced_by" TEXT[],
    "average_sentiment" TEXT NOT NULL,
    "average_emotional_intensity" DECIMAL(3,2) NOT NULL,
    "most_emotional_statement" TEXT,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_group_persona_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "focus_group_persona_summaries_conversation_id_idx" ON "focus_group_persona_summaries"("conversation_id");

-- CreateIndex
CREATE INDEX "focus_group_persona_summaries_persona_id_idx" ON "focus_group_persona_summaries"("persona_id");

-- CreateIndex
CREATE UNIQUE INDEX "focus_group_persona_summaries_conversation_id_persona_id_key" ON "focus_group_persona_summaries"("conversation_id", "persona_id");

-- AddForeignKey
ALTER TABLE "focus_group_persona_summaries" ADD CONSTRAINT "focus_group_persona_summaries_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "focus_group_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
