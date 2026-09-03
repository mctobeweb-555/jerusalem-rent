-- AlterTable: ajoute les colonnes en optionnel d'abord (rétrocompatible avec les lignes existantes)
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "unsubToken" TEXT;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "unsubscribedAt" TIMESTAMP(3);

-- Backfill : génère un token unique pour chaque abonné existant (pas besoin d'extension).
UPDATE "NewsletterSubscriber"
SET "unsubToken" = md5(random()::text || clock_timestamp()::text || id)
WHERE "unsubToken" IS NULL;

-- Rend la colonne obligatoire maintenant qu'elle est peuplée.
ALTER TABLE "NewsletterSubscriber" ALTER COLUMN "unsubToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubToken_key" ON "NewsletterSubscriber"("unsubToken");
