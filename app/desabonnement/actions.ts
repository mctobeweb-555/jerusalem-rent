"use server";

import { prisma } from "@/lib/db";

export type UnsubscribeResult = {
  ok: boolean;
  error?: string;
};

// Désinscription publique via le token unique reçu par email (aucune
// authentification requise — le token en fait office).
export async function confirmUnsubscribe(
  token: string,
): Promise<UnsubscribeResult> {
  const sub = await prisma.newsletterSubscriber.findUnique({
    where: { unsubToken: token },
    select: { id: true, active: true },
  });
  if (!sub) {
    return { ok: false, error: "Lien de désinscription invalide." };
  }
  if (!sub.active) {
    return { ok: true }; // déjà désinscrit, idempotent
  }

  await prisma.newsletterSubscriber.update({
    where: { id: sub.id },
    data: { active: false, unsubscribedAt: new Date() },
  });

  return { ok: true };
}
