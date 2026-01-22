-- CreateTable
CREATE TABLE "batch_imports" (
    "id" TEXT NOT NULL,
    "panel_id" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "successful_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "auto_search" BOOLEAN NOT NULL DEFAULT false,
    "venue_id" TEXT,
    "column_mapping" JSONB,
    "imported_jurors" JSONB NOT NULL DEFAULT '[]',
    "errors" JSONB NOT NULL DEFAULT '[]',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "batch_imports_panel_id_idx" ON "batch_imports"("panel_id");

-- CreateIndex
CREATE INDEX "batch_imports_status_idx" ON "batch_imports"("status");

-- CreateIndex
CREATE INDEX "batch_imports_uploaded_by_idx" ON "batch_imports"("uploaded_by");

-- AddForeignKey
ALTER TABLE "batch_imports" ADD CONSTRAINT "batch_imports_panel_id_fkey" FOREIGN KEY ("panel_id") REFERENCES "jury_panels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
