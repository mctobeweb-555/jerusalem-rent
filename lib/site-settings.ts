import { cache } from "react";
import { prisma } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";

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

export type WelcomePopup = {
  imageUrl: string | null;
  title: string;
  text: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

/** Un bloc de traduction de la popup tel que stocké dans `popupTranslations`. */
type PopupTranslation = { title?: string; text?: string; ctaLabel?: string };

// Le champ Json arrive non typé de Prisma : on ne lit que les 3 clés attendues
// et on ignore le reste (une saisie corrompue ne doit pas casser la page).
function readPopupTranslation(raw: unknown, locale: Locale): PopupTranslation {
  if (locale === "fr" || !raw || typeof raw !== "object") return {};
  const block = (raw as Record<string, unknown>)[locale];
  if (!block || typeof block !== "object") return {};
  const b = block as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  return { title: str(b.title), text: str(b.text), ctaLabel: str(b.ctaLabel) };
}

/**
 * Popup d'accueil pour la langue demandée, ou null si elle ne doit pas
 * s'afficher (désactivée, ou aucun titre saisi). EN/HE retombent sur le
 * français quand la traduction est absente — même règle que les annonces.
 */
export async function getWelcomePopup(locale: Locale): Promise<WelcomePopup | null> {
  const row = await getSiteSettingsRow();
  if (!row?.popupEnabled) return null;

  const t = readPopupTranslation(row.popupTranslations, locale);
  const title = t.title ?? row.popupTitle?.trim();
  // Sans titre, la popup n'aurait rien à annoncer : on ne l'affiche pas.
  if (!title) return null;

  const ctaLabel = t.ctaLabel ?? row.popupCtaLabel?.trim() ?? null;
  const ctaUrl = row.popupCtaUrl?.trim() || null;
  return {
    imageUrl: row.popupImageUrl?.trim() || null,
    title,
    text: t.text ?? row.popupText?.trim() ?? null,
    // Un bouton sans destination (ou une destination sans libellé) n'a pas de
    // sens : les deux doivent être renseignés pour que le CTA apparaisse.
    ctaLabel: ctaLabel && ctaUrl ? ctaLabel : null,
    ctaUrl: ctaLabel && ctaUrl ? ctaUrl : null,
  };
}
