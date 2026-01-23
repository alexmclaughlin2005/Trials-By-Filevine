-- AlterTable
ALTER TABLE "jurors" ADD COLUMN     "box_order" INTEGER,
ADD COLUMN     "box_row" INTEGER,
ADD COLUMN     "box_seat" INTEGER;

-- AlterTable
ALTER TABLE "jury_panels" ADD COLUMN     "jury_box_layout" JSONB,
ADD COLUMN     "jury_box_rows" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "jury_box_size" INTEGER NOT NULL DEFAULT 12;

-- CreateIndex
CREATE INDEX "jurors_box_row_box_seat_idx" ON "jurors"("box_row", "box_seat");
