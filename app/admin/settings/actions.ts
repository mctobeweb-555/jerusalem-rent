"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";

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
