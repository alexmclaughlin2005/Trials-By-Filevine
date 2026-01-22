-- CreateTable
CREATE TABLE "case_filevine_projects" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "filevine_project_id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "project_type_name" TEXT,
    "client_name" TEXT,
    "linked_by" TEXT NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_synced_at" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'active',
    "sync_error_message" TEXT,
    "auto_sync_documents" BOOLEAN NOT NULL DEFAULT false,
    "sync_folder_ids" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_filevine_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imported_documents" (
    "id" TEXT NOT NULL,
    "case_filevine_project_id" TEXT NOT NULL,
    "filevine_document_id" TEXT NOT NULL,
    "filevine_folder_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "folder_name" TEXT,
    "current_version" TEXT,
    "upload_date" TIMESTAMP(3),
    "uploader_fullname" TEXT,
    "size" BIGINT,
    "local_file_url" TEXT,
    "thumbnail_url" TEXT,
    "imported_by" TEXT NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "download_attempts" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "document_category" TEXT,
    "tags" JSONB DEFAULT '[]',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imported_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "case_filevine_projects_case_id_key" ON "case_filevine_projects"("case_id");

-- CreateIndex
CREATE INDEX "case_filevine_projects_case_id_idx" ON "case_filevine_projects"("case_id");

-- CreateIndex
CREATE INDEX "case_filevine_projects_organization_id_idx" ON "case_filevine_projects"("organization_id");

-- CreateIndex
CREATE INDEX "case_filevine_projects_filevine_project_id_idx" ON "case_filevine_projects"("filevine_project_id");

-- CreateIndex
CREATE INDEX "imported_documents_case_filevine_project_id_idx" ON "imported_documents"("case_filevine_project_id");

-- CreateIndex
CREATE INDEX "imported_documents_filevine_document_id_idx" ON "imported_documents"("filevine_document_id");

-- CreateIndex
CREATE INDEX "imported_documents_status_idx" ON "imported_documents"("status");

-- AddForeignKey
ALTER TABLE "case_filevine_projects" ADD CONSTRAINT "case_filevine_projects_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imported_documents" ADD CONSTRAINT "imported_documents_case_filevine_project_id_fkey" FOREIGN KEY ("case_filevine_project_id") REFERENCES "case_filevine_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
