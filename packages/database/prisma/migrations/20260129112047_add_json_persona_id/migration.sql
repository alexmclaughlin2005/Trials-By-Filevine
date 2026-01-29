-- AlterTable
ALTER TABLE "personas" ADD COLUMN "json_persona_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "personas_json_persona_id_key" ON "personas"("json_persona_id");

-- CreateIndex
CREATE INDEX "personas_json_persona_id_idx" ON "personas"("json_persona_id");
