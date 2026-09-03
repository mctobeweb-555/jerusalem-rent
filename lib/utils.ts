import type { PropertyType, ListingStatus, LeadStatus } from "@prisma/client";

/** Formate un prix stocké en centimes vers une chaîne EUR. */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Convertit un prix en euros (nombre) vers des centimes (Int). */
export function toCents(euros: number): number {
  return Math.round(euros * 100);
}

/** Slug URL-safe : minuscules, sans accents (NFD), tirets. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les diacritiques (combining marks)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Référence unique du type "OX-2026-4821". */
export function generateReference(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `OX-${year}-${rand}`;
}

/** Tronque un texte proprement à `max` caractères. */
export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

/** Surface formatée "85 m²". */
export function formatSurface(surface: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(surface)} m²`;
}

// --- Libellés FR pour les enums ---

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  HOUSE: "Maison",
  APARTMENT: "Appartement",
  LAND: "Terrain",
  COMMERCIAL: "Local commercial",
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  FOR_SALE: "À vendre",
  FOR_RENT: "À louer",
  SHORT_TERM: "Courte durée",
  SOLD: "Vendu",
  RENTED: "Loué",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  QUALIFIED: "Qualifié",
  CLOSED: "Clôturé",
};

/** cn : concatène des classes conditionnelles sans dépendance externe. */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
