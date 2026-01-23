-- AlterTable
ALTER TABLE "imported_documents" ADD COLUMN     "extracted_text" TEXT,
ADD COLUMN     "text_extracted_at" TIMESTAMP(3),
ADD COLUMN     "text_extraction_error" TEXT,
ADD COLUMN     "text_extraction_status" TEXT NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "argument_documents" (
    "id" TEXT NOT NULL,
    "argument_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "attached_by" TEXT NOT NULL,
    "attached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "argument_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "argument_documents_argument_id_idx" ON "argument_documents"("argument_id");

-- CreateIndex
CREATE INDEX "argument_documents_document_id_idx" ON "argument_documents"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "argument_documents_argument_id_document_id_key" ON "argument_documents"("argument_id", "document_id");

-- CreateIndex
CREATE INDEX "imported_documents_text_extraction_status_idx" ON "imported_documents"("text_extraction_status");

-- AddForeignKey
ALTER TABLE "argument_documents" ADD CONSTRAINT "argument_documents_argument_id_fkey" FOREIGN KEY ("argument_id") REFERENCES "case_arguments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "argument_documents" ADD CONSTRAINT "argument_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "imported_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
