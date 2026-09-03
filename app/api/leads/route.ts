import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { leadInputSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendEmail, emailLayout, emailEyebrow, emailHeading, emailButton, emailQuote, emailColors } from "@/lib/email";

// POST /api/leads — création publique d'un lead.
// Défenses : Zod .strict(), honeypot, Turnstile (optionnel), rate-limit.
export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Rate-limit : 5 requêtes / minute / IP.
  const rl = rateLimit(`leads:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans une minute." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = leadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Honeypot rempli → bot. On répond OK silencieusement sans rien enregistrer.
  if (data.honeypot && data.honeypot.length > 0) {
    return NextResponse.json({ ok: true });
  }

  // Turnstile (ignoré si non configuré côté serveur).
  const humanOk = await verifyTurnstile(data.turnstileToken || undefined, ip);
  if (!humanOk) {
    return NextResponse.json(
      { error: "Vérification anti-robot échouée." },
      { status: 400 },
    );
  }

  // Ne relier au bien que si l'id existe réellement (évite les FK invalides).
  // On récupère aussi l'agent et le titre pour les notifications email.
  let propertyId: string | null = null;
  let property:
    | { title: string; slug: string; owner: { name: string; email: string } | null }
    | null = null;
  if (data.propertyId) {
    const found = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: {
        id: true,
        title: true,
        slug: true,
        owner: { select: { name: true, email: true } },
      },
    });
    if (found) {
      propertyId = found.id;
      property = { title: found.title, slug: found.slug, owner: found.owner };
    }
  }

  // Dates de réservation (court terme) : YYYY-MM-DD → Date, si valides.
  const parseDate = (s?: string) => {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
      propertyId,
      status: "NEW",
      checkIn: parseDate(data.checkIn || undefined),
      checkOut: parseDate(data.checkOut || undefined),
      guests:
        data.guests ??
        (data.adults != null || data.children != null
          ? (data.adults ?? 0) + (data.children ?? 0)
          : null),
      adults: data.adults ?? null,
      children: data.children ?? null,
      babies: data.babies ?? null,
    },
  });

  // Notifications email (best-effort : n'échoue jamais la création du lead).
  await sendLeadEmails(data, property);

  return NextResponse.json({ ok: true }, { status: 201 });
}

async function sendLeadEmails(
  lead: { name: string; email: string; phone?: string; message: string },
  property:
    | { title: string; slug: string; owner: { name: string; email: string } | null }
    | null,
) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const bienLabel = property?.title ?? "une demande générale";
  const bienLink = property ? `${site}/annonces/${property.slug}` : site;

  try {
    // 1) Notification à l'agent (ou email de repli de l'agence).
    const agentEmail =
      property?.owner?.email || process.env.AGENCY_EMAIL || process.env.EMAIL_FROM;
    if (agentEmail) {
      const { MUTED, BORDER } = emailColors;
      const body = `
${emailEyebrow("Nouvelle demande")}
${emailHeading(property ? `Lead sur « ${property.title} »` : "Nouveau lead")}
<p style="margin:0 0 20px;color:${MUTED};line-height:1.6;">Vous avez reçu une nouvelle demande de contact.</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;border-top:1px solid ${BORDER};">
<tr><td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${MUTED};width:120px;">Nom</td><td style="padding:10px 0;border-bottom:1px solid ${BORDER};">${lead.name}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${MUTED};">Email</td><td style="padding:10px 0;border-bottom:1px solid ${BORDER};"><a href="mailto:${lead.email}" style="color:${emailColors.NAVY};">${lead.email}</a></td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${MUTED};">Téléphone</td><td style="padding:10px 0;border-bottom:1px solid ${BORDER};">${lead.phone || "—"}</td></tr>
<tr><td style="padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${MUTED};">Bien</td><td style="padding:10px 0;"><a href="${bienLink}" style="color:${emailColors.NAVY};">${bienLabel}</a></td></tr>
</table>
${emailQuote(escapeHtml(lead.message))}
<p style="margin:24px 0 0;">${emailButton(`${site}/admin/leads`, "Ouvrir dans l'admin")}</p>`;
      await sendEmail({
        to: agentEmail,
        subject: `Nouveau lead${property ? ` — ${property.title}` : ""}`,
        html: emailLayout(body, { preheader: `Demande de ${lead.name}` }),
        replyTo: lead.email,
      });
    }

    // 2) Confirmation au visiteur.
    const body2 = `
${emailEyebrow("Confirmation")}
${emailHeading("Votre demande a bien été reçue")}
<p style="margin:0 0 12px;color:${emailColors.INK};line-height:1.6;">Bonjour ${escapeHtml(lead.name)},</p>
<p style="margin:0 0 20px;color:${emailColors.INK};line-height:1.6;">Merci pour votre intérêt${property ? ` concernant <a href="${bienLink}" style="color:${emailColors.NAVY};">${property.title}</a>` : ""}. Un conseiller Jerusalem Rent vous recontacte très rapidement.</p>
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${emailColors.MUTED};">Rappel de votre message</p>
${emailQuote(escapeHtml(lead.message))}`;
    await sendEmail({
      to: lead.email,
      subject: "Nous avons bien reçu votre demande — Jerusalem Rent",
      html: emailLayout(body2, { preheader: "Un conseiller vous recontacte." }),
    });
  } catch {
    // best-effort : on ignore toute erreur d'envoi.
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
