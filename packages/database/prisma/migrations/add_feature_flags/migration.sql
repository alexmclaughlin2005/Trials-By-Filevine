-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_organizationId_key" ON "FeatureFlag"("key", "organizationId");

-- CreateIndex
CREATE INDEX "FeatureFlag_key_idx" ON "FeatureFlag"("key");

-- AddForeignKey
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default V2 persona feature flags
INSERT INTO "FeatureFlag" ("id", "key", "name", "description", "enabled", "organizationId")
VALUES
  (gen_random_uuid(), 'personas_v2', 'Persona V2 Data', 'Use enhanced V2 persona data with instant reads, danger levels, and strike/keep strategies', false, NULL),
  (gen_random_uuid(), 'focus_groups_v2', 'Focus Groups V2', 'Use V2 persona data in focus group simulations', false, NULL),
  (gen_random_uuid(), 'voir_dire_v2', 'Voir Dire Generator V2', 'Enable V2 voir dire question generation', false, NULL);
