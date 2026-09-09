-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "popupCtaLabel" TEXT,
ADD COLUMN     "popupCtaUrl" TEXT,
ADD COLUMN     "popupEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "popupImageUrl" TEXT,
ADD COLUMN     "popupText" TEXT,
ADD COLUMN     "popupTitle" TEXT,
ADD COLUMN     "popupTranslations" JSONB;
