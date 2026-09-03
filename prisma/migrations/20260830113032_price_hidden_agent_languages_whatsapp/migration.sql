-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "priceHidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "whatsappMessage" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "languages" JSONB;
