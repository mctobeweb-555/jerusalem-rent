// Envoi d'emails — provider-agnostique.
// Si RESEND_API_KEY + EMAIL_FROM sont définis → envoi réel via l'API Resend
// (aucune dépendance npm, simple fetch). Sinon → mode « démo » : on journalise
// et on renvoie ok (rien n'est cassé sans configuration).

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  bcc?: string[];
};

export function isEmailEnabled(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(
  args: SendArgs,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!key || !from) {
    console.log(
      `[email] (démo, non envoyé) → ${Array.isArray(args.to) ? args.to.join(", ") : args.to} | ${args.subject}`,
    );
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: args.to,
        subject: args.subject,
        html: args.html,
        reply_to: args.replyTo,
        bcc: args.bcc,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "erreur réseau" };
  }
}

// Palette/typo alignées sur le site (marine #1c1f40, champagne #c1ab83,
// neutres stone froids) — mêmes contraintes email habituelles : tout en
// styles inline, tableaux pour la mise en page, aucune police custom fiable
// d'un client à l'autre (Georgia/Arial en polices de repli sûres plutôt que
// Jost/Heebo, qui ne chargeraient de toute façon pas dans la plupart des
// clients mail). Coins nets partout (aucun border-radius) : même parti pris
// "pas d'arrondi sur les boutons/cadres" que sur le reste du site.
const NAVY = "#1c1f40";
const CHAMPAGNE = "#c1ab83";
// Champagne plus soutenu (accent-600) : le ton clair ne tient pas assez de
// contraste sur fond blanc pour du texte, réservé aux fonds marine.
const CHAMPAGNE_TEXT = "#a88e5e";
const INK = "#302e29"; // stone-800
const MUTED = "#726f65"; // stone-500
const BORDER = "#e5e3df"; // stone-200
const PAGE_BG = "#f2f1ef"; // stone-100
const SURFACE = "#fafaf9"; // stone-50

// Gabarit HTML commun (inline styles pour compatibilité clients mail).
export function emailLayout(
  bodyHtml: string,
  opts?: { preheader?: string; unsubscribeUrl?: string },
): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `<!doctype html><html lang="fr"><body style="margin:0;background:${PAGE_BG};font-family:Arial,Helvetica,sans-serif;color:${INK};">
${opts?.preheader ? `<span style="display:none;opacity:0;color:transparent;">${opts.preheader}</span>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:32px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BORDER};">
<tr><td style="background:${NAVY};padding:32px;text-align:center;">
<a href="${site}" style="display:inline-block;text-decoration:none;font-family:Georgia,'Times New Roman',serif;color:#ffffff;font-size:22px;letter-spacing:3px;text-transform:uppercase;">Jerusalem Rent</a>
<div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;color:${CHAMPAGNE};font-size:10px;letter-spacing:3px;text-transform:uppercase;">Luxury Vacation Rental</div>
</td></tr>
<tr><td style="padding:36px 32px;">${bodyHtml}</td></tr>
<tr><td style="padding:20px 32px;background:${SURFACE};border-top:1px solid ${BORDER};color:${MUTED};font-size:12px;text-align:center;">
Jerusalem Rent — Locations de prestige à Jérusalem<br>
<a href="${site}" style="color:${NAVY};text-decoration:none;">${site.replace(/^https?:\/\//, "")}</a>
${
  opts?.unsubscribeUrl
    ? `<br><a href="${opts.unsubscribeUrl}" style="color:${MUTED};text-decoration:underline;">Se désinscrire de la newsletter</a>`
    : ""
}
</td></tr>
</table>
</td></tr></table></body></html>`;
}

// Éléments HTML réutilisables dans les templates (voir lib/newsletter.ts,
// app/api/leads/route.ts) : eyebrow, titre, bouton, citation de message.
export function emailEyebrow(text: string): string {
  return `<p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${CHAMPAGNE_TEXT};">${text}</p>`;
}

export function emailHeading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:normal;color:${NAVY};">${text}</h1>`;
}

export function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">${label}</a>`;
}

export function emailQuote(text: string): string {
  return `<p style="margin:16px 0 0;padding:16px 20px;border-left:3px solid ${NAVY};background:${SURFACE};color:${INK};white-space:pre-line;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;line-height:1.6;">${text}</p>`;
}

export const emailColors = { NAVY, CHAMPAGNE, INK, MUTED, BORDER, PAGE_BG, SURFACE };
