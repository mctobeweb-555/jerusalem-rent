-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "neighborhood" TEXT;

-- CreateIndex
CREATE INDEX "Property_neighborhood_idx" ON "Property"("neighborhood");
