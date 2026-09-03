-- CreateIndex
CREATE INDEX "Property_agencyId_idx" ON "Property"("agencyId");

-- CreateIndex
CREATE INDEX "Property_published_createdAt_idx" ON "Property"("published", "createdAt");
