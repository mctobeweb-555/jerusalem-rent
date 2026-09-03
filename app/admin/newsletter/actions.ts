"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import { sendEmail, isEmailEnabled } from "@/lib/email";
import { buildNewsletterHtml } from "@/lib/newsletter";

export type NewsletterResult = {
  ok: boolean;
  sent: number;
  subscribers: number;
  enabled: boolean;
  error?: string;
};

// Envoie aux inscrits actifs un email récapitulant les dernières annonces.
// Chaque envoi est individualisé pour porter le lien de désinscription propre
// à son destinataire (le HTML de base est identique, seul ce lien change).
export async function sendNewsletter(): Promise<NewsletterResult> {
  const user = await getSessionUser();
  const enabled = isEmailEnabled();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, sent: 0, subscribers: 0, enabled, error: "Accès refusé" };
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const subs = await prisma.newsletterSubscriber.findMany({
    where: { active: true },
    select: { email: true, unsubToken: true },
  });

  if (subs.length === 0) {
    return { ok: true, sent: 0, subscribers: 0, enabled };
  }

  // Contenu construit une seule fois, avec un jeton de désinscription
  // substitué ensuite pour chaque destinataire (évite de re-requêter la base
  // pour chaque envoi).
  const UNSUB_PLACEHOLDER = `${site}/desabonnement?token=__PLACEHOLDER__`;
  const template = await buildNewsletterHtml({
    unsubscribeUrl: UNSUB_PLACEHOLDER,
  });
  if (!template) {
    return {
      ok: false,
      sent: 0,
      subscribers: subs.length,
      enabled,
      error: "Aucune annonce à envoyer.",
    };
  }

  let sent = 0;
  for (const sub of subs) {
    const html = template.replace(
      UNSUB_PLACEHOLDER,
      `${site}/desabonnement?token=${sub.unsubToken}`,
    );
    // eslint-disable-next-line no-await-in-loop
    const res = await sendEmail({
      to: sub.email,
      subject: "Les dernières annonces Jerusalem Rent",
      html,
    });
    if (res.ok) sent += 1;
  }

  return { ok: true, sent, subscribers: subs.length, enabled };
}
