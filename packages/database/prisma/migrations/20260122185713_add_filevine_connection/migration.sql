-- CreateTable
CREATE TABLE "filevine_connections" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT NOT NULL,
    "personal_access_token" TEXT NOT NULL,
    "access_token" TEXT,
    "session_id" TEXT,
    "numeric_user_id" TEXT,
    "filevine_org_id" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "connection_name" TEXT NOT NULL DEFAULT 'Filevine Integration',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(3),
    "last_test_successful" BOOLEAN,
    "last_test_at" TIMESTAMP(3),
    "last_error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filevine_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "filevine_connections_organization_id_key" ON "filevine_connections"("organization_id");

-- CreateIndex
CREATE INDEX "filevine_connections_organization_id_is_active_idx" ON "filevine_connections"("organization_id", "is_active");

-- AddForeignKey
ALTER TABLE "filevine_connections" ADD CONSTRAINT "filevine_connections_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
