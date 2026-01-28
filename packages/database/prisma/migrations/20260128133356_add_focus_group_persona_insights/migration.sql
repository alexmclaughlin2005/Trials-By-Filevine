-- CreateTable
CREATE TABLE "focus_group_persona_insights" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "persona_name" TEXT NOT NULL,
    "archetype" TEXT NOT NULL,
    "case_interpretation" TEXT NOT NULL,
    "key_biases" JSONB NOT NULL,
    "decision_drivers" JSONB NOT NULL,
    "persuasion_strategy" TEXT NOT NULL,
    "vulnerabilities" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_group_persona_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "focus_group_persona_insights_conversation_id_idx" ON "focus_group_persona_insights"("conversation_id");

-- CreateIndex
CREATE INDEX "focus_group_persona_insights_persona_id_idx" ON "focus_group_persona_insights"("persona_id");

-- CreateIndex
CREATE UNIQUE INDEX "focus_group_persona_insights_conversation_id_persona_id_key" ON "focus_group_persona_insights"("conversation_id", "persona_id");

-- AddForeignKey
ALTER TABLE "focus_group_persona_insights" ADD CONSTRAINT "focus_group_persona_insights_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "focus_group_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
