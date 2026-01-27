-- CreateTable
CREATE TABLE "focus_group_takeaways" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "what_landed" JSONB NOT NULL,
    "what_confused" JSONB NOT NULL,
    "what_backfired" JSONB NOT NULL,
    "top_questions" JSONB NOT NULL,
    "recommended_edits" JSONB NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_group_takeaways_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "focus_group_takeaways_conversation_id_key" ON "focus_group_takeaways"("conversation_id");

-- CreateIndex
CREATE INDEX "focus_group_takeaways_conversation_id_idx" ON "focus_group_takeaways"("conversation_id");

-- AddForeignKey
ALTER TABLE "focus_group_takeaways" ADD CONSTRAINT "focus_group_takeaways_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "focus_group_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
