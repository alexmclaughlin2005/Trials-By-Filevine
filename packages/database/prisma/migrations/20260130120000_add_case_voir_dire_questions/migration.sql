-- CreateTable
CREATE TABLE "case_voir_dire_questions" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "question_category" TEXT,
    "source" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_voir_dire_questions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "case_voir_dire_questions" ADD CONSTRAINT "case_voir_dire_questions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "case_voir_dire_questions_case_id_idx" ON "case_voir_dire_questions"("case_id");

-- CreateIndex
CREATE INDEX "case_voir_dire_questions_is_active_idx" ON "case_voir_dire_questions"("is_active");

-- CreateIndex
CREATE INDEX "case_voir_dire_questions_sort_order_idx" ON "case_voir_dire_questions"("sort_order");

-- AlterTable
ALTER TABLE "voir_dire_responses" ADD COLUMN "question_type" TEXT;

-- CreateIndex
CREATE INDEX "voir_dire_responses_question_type_idx" ON "voir_dire_responses"("question_type");

-- AddForeignKey
ALTER TABLE "voir_dire_responses" ADD CONSTRAINT "voir_dire_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "case_voir_dire_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
