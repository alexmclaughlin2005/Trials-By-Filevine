-- AlterTable
ALTER TABLE "personas" ADD COLUMN     "communication_style" TEXT,
ADD COLUMN     "leadership_level" TEXT,
ADD COLUMN     "persuasion_susceptibility" TEXT;

-- CreateTable
CREATE TABLE "focus_group_conversations" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "argument_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "converged" BOOLEAN NOT NULL DEFAULT false,
    "convergence_reason" TEXT,
    "consensus_areas" JSONB,
    "fracture_points" JSONB,
    "key_debate_points" JSONB,
    "influential_personas" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "focus_group_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_group_statements" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "persona_name" TEXT NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sentiment" TEXT,
    "emotional_intensity" DECIMAL(3,2),
    "key_points" JSONB,
    "addressed_to" TEXT[],
    "agreement_signals" TEXT[],
    "disagreement_signals" TEXT[],
    "speak_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_group_statements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "focus_group_conversations_session_id_idx" ON "focus_group_conversations"("session_id");

-- CreateIndex
CREATE INDEX "focus_group_conversations_argument_id_idx" ON "focus_group_conversations"("argument_id");

-- CreateIndex
CREATE INDEX "focus_group_statements_conversation_id_idx" ON "focus_group_statements"("conversation_id");

-- CreateIndex
CREATE INDEX "focus_group_statements_persona_id_idx" ON "focus_group_statements"("persona_id");

-- CreateIndex
CREATE INDEX "focus_group_statements_sequence_number_idx" ON "focus_group_statements"("sequence_number");

-- AddForeignKey
ALTER TABLE "focus_group_conversations" ADD CONSTRAINT "focus_group_conversations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "focus_group_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_group_statements" ADD CONSTRAINT "focus_group_statements_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "focus_group_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
