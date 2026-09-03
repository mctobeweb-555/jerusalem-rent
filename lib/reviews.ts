import { prisma } from "@/lib/db";
import type { SiteMode } from "@/lib/site-settings";

// Nettoie un commentaire d'avis : retire les balises HTML résiduelles
// (copier-coller depuis un email/site, exports WordPress...), décode les
// entités les plus courantes, normalise les retours à la ligne/espaces.
// Utilisé à la saisie (formulaire admin, API) et à l'import CSV.
export function sanitizeReviewComment(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

/** Moyenne (1 décimale) et nombre d'avis, ou null si aucun. */
export function reviewStats(reviews: { rating: number }[]) {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

/**
 * Avis mis en avant sur la home, adaptés au mode du site :
 * - court-terme-only : derniers avis liés à une annonce (avec le bien).
 * - sinon : avis généraux (témoignages), seulement si activé dans les
 *   paramètres du site.
 */
export async function getHomeReviews(mode: SiteMode, generalized: boolean) {
  try {
    if (mode.shortTermOnly) {
      return await prisma.review.findMany({
        where: { published: true, propertyId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { property: { select: { title: true, slug: true } } },
      });
    }
    if (!generalized) return [];
    return await prisma.review.findMany({
      where: { published: true, propertyId: null },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  } catch {
    // Base injoignable (ex. au build sans DB) → pas de section avis.
    return [];
  }
}
