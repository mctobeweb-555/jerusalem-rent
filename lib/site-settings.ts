import { cache } from "react";
import { prisma } from "@/lib/db";

export type SiteMode = {
  showSale: boolean;
  showRent: boolean;
  showShortTerm: boolean;
  /** true si SEUL le court terme est actif → le site bascule en mode réservation. */
  shortTermOnly: boolean;
};

const DEFAULTS = {
  showSale: true,
  showRent: true,
  showShortTerm: false,
  whatsappNumber: null as string | null,
  whatsappMessage: null as string | null,
  facebookUrl: null as string | null,
  instagramUrl: null as string | null,
  linkedinUrl: null as string | null,
  reviewsGeneralized: false,
};

// Lit le singleton SiteSettings une seule fois par requête (dédupliqué via
// React.cache) — getSiteMode/getWhatsappConfig/getSocialLinks partagent ce
// même appel au lieu de faire chacune leur propre aller-retour Prisma.
const getSiteSettingsRow = cache(async () => {
  try {
    return await prisma.siteSettings.findUnique({ where: { id: "default" } });
  } catch {
    // base injoignable (ex. build) → défauts
    return null;
  }
});

export async function getSiteMode(): Promise<SiteMode> {
  const s = (await getSiteSettingsRow()) ?? DEFAULTS;
  return {
    showSale: s.showSale,
    showRent: s.showRent,
    showShortTerm: s.showShortTerm,
    shortTermOnly: s.showShortTerm && !s.showSale && !s.showRent,
  };
}

// Statuts d'annonce visibles selon la configuration.
export function visibleStatuses(mode: SiteMode): string[] {
  const out: string[] = [];
  if (mode.showSale) out.push("FOR_SALE", "SOLD");
  if (mode.showRent) out.push("FOR_RENT", "RENTED");
  if (mode.showShortTerm) out.push("SHORT_TERM");
  return out;
}

export type WhatsappConfig = { number: string; message: string };

// Configuration du bouton WhatsApp flottant. Renvoie null si désactivé
// (aucun numéro configuré) — le composant flottant ne s'affiche pas alors.
export async function getWhatsappConfig(): Promise<WhatsappConfig | null> {
  const row = await getSiteSettingsRow();
  if (!row?.whatsappNumber) return null;
  return {
    number: row.whatsappNumber,
    message:
      row.whatsappMessage?.trim() ||
      "Bonjour 👋 Une question ? Nous sommes là pour vous aider.",
  };
}

export type SocialLinks = {
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
};

// Liens réseaux sociaux configurés dans l'admin, pour le footer public.
export async function getSocialLinks(): Promise<SocialLinks> {
  const row = await getSiteSettingsRow();
  return {
    facebookUrl: row?.facebookUrl ?? null,
    instagramUrl: row?.instagramUrl ?? null,
    linkedinUrl: row?.linkedinUrl ?? null,
  };
}

// Avis "généralisés" affichés sur la home en mode vente/location (cf. lib/reviews.ts).
export async function getReviewsGeneralized(): Promise<boolean> {
  const row = await getSiteSettingsRow();
  return row?.reviewsGeneralized ?? DEFAULTS.reviewsGeneralized;
}
