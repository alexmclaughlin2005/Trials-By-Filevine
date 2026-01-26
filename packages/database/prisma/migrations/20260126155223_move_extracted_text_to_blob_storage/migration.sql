/*
  Warnings:

  - You are about to drop the column `extracted_text` on the `imported_documents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "imported_documents" DROP COLUMN "extracted_text",
ADD COLUMN     "extracted_text_chars" INTEGER,
ADD COLUMN     "extracted_text_url" TEXT;
