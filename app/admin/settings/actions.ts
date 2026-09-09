"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";

export type PopupSettingsInput = {
  popupEnabled: boolean;
  popupImageUrl: string;
  popupTitle: string;
  popupText: string;
  popupCtaLabel: string;
  popupCtaUrl: string;
  translations: {
    en: { title: string; text: string; ctaLabel: string };
    he: { title: string; text: string; ctaLabel: string };
  };
};

export async function updatePopupSettings(
  input: PopupSettingsInput,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, error: "Accès refusé" };
  }

  const title = input.popupTitle.trim();
  // On ne bloque la saisie que si la popup est activée : un brouillon
  // incomplet peut rester enregistré tant qu'elle est désactivée.
  if (input.popupEnabled && !title) {
    return { ok: false, error: "Renseignez au moins un titre pour activer la popup." };
  }

  const ctaUrl = input.popupCtaUrl.trim();
  if (ctaUrl && !/^(https?:\/\/.+|\/[^\s]*)$/i.test(ctaUrl)) {
    return {
      ok: false,
      error: "Lien du bouton invalide : une URL (https://…) ou un chemin interne (/annonces).",
    };
  }
  const ctaLabel = input.popupCtaLabel.trim();
  if (ctaLabel && !ctaUrl) {
    return { ok: false, error: "Le bouton a un libellé mais pas de lien." };
  }
  if (ctaUrl && !ctaLabel) {
    return { ok: false, error: "Le bouton a un lien mais pas de libellé." };
  }

  const imageUrl = input.popupImageUrl.trim();
  if (imageUrl && !/^(https?:\/\/.+|\/[^\s]*)$/i.test(imageUrl)) {
    return { ok: false, error: "URL d'image invalide." };
  }

  // Une langue n'est stockée que si elle apporte quelque chose ; sinon on la
  // retire pour que l'affichage public retombe proprement sur le français.
  const cleanBlock = (b: { title: string; text: string; ctaLabel: string }) => {
    const out: Record<string, string> = {};
    if (b.title.trim()) out.title = b.title.trim();
    if (b.text.trim()) out.text = b.text.trim();
    if (b.ctaLabel.trim()) out.ctaLabel = b.ctaLabel.trim();
    return Object.keys(out).length > 0 ? out : null;
  };
  const en = cleanBlock(input.translations.en);
  const he = cleanBlock(input.translations.he);
  // Typé en Record<string, string> (et non unknown) : Prisma n'accepte que des
  // valeurs JSON concrètes pour un champ Json.
  const translations: Record<string, Record<string, string>> = {};
  if (en) translations.en = en;
  if (he) translations.he = he;

  const data = {
    popupEnabled: input.popupEnabled,
    popupImageUrl: imageUrl || null,
    popupTitle: title || null,
    popupText: input.popupText.trim() || null,
    popupCtaLabel: ctaLabel || null,
    popupCtaUrl: ctaUrl || null,
    // Champ Json? : on efface avec Prisma.JsonNull, pas avec null.
    popupTranslations:
      Object.keys(translations).length > 0 ? translations : Prisma.JsonNull,
  };

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateSiteSettings(input: {
  showSale: boolean;
  showRent: boolean;
  showShortTerm: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, error: "Accès refusé" };
  }
  // Au moins une catégorie doit rester active.
  if (!input.showSale && !input.showRent && !input.showShortTerm) {
    return { ok: false, error: "Activez au moins une catégorie." };
  }

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      showSale: input.showSale,
      showRent: input.showRent,
      showShortTerm: input.showShortTerm,
    },
    create: {
      id: "default",
      showSale: input.showSale,
      showRent: input.showRent,
      showShortTerm: input.showShortTerm,
    },
  });

  // Le mode change l'affichage public partout.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateReviewsSettings(input: {
  reviewsGeneralized: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, error: "Accès refusé" };
  }

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: { reviewsGeneralized: input.reviewsGeneralized },
    create: { id: "default", reviewsGeneralized: input.reviewsGeneralized },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateSocialSettings(input: {
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, error: "Accès refusé" };
  }

  const urlOrEmpty = (v: string) => {
    const t = v.trim();
    if (!t) return null;
    if (!/^https?:\/\/.+/i.test(t)) return undefined; // invalide
    return t;
  };
  const facebookUrl = urlOrEmpty(input.facebookUrl);
  const instagramUrl = urlOrEmpty(input.instagramUrl);
  const linkedinUrl = urlOrEmpty(input.linkedinUrl);
  if (facebookUrl === undefined || instagramUrl === undefined || linkedinUrl === undefined) {
    return { ok: false, error: "URL invalide (doit commencer par http:// ou https://)." };
  }

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: { facebookUrl, instagramUrl, linkedinUrl },
    create: { id: "default", facebookUrl, instagramUrl, linkedinUrl },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateContactSettings(input: {
  whatsappNumber: string;
  whatsappMessage: string;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, error: "Accès refusé" };
  }

  const number = input.whatsappNumber.trim();
  if (number && !/^\+?[0-9\s]{6,20}$/.test(number)) {
    return {
      ok: false,
      error: "Numéro WhatsApp invalide (chiffres uniquement, avec indicatif pays).",
    };
  }

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      whatsappNumber: number || null,
      whatsappMessage: input.whatsappMessage.trim() || null,
    },
    create: {
      id: "default",
      whatsappNumber: number || null,
      whatsappMessage: input.whatsappMessage.trim() || null,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
