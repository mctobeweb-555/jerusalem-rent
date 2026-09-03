-- AlterEnum
ALTER TYPE "ListingStatus" ADD VALUE 'SHORT_TERM';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "checkIn" TIMESTAMP(3),
ADD COLUMN     "checkOut" TIMESTAMP(3),
ADD COLUMN     "guests" INTEGER;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "maxGuests" INTEGER;

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "showSale" BOOLEAN NOT NULL DEFAULT true,
    "showRent" BOOLEAN NOT NULL DEFAULT true,
    "showShortTerm" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
