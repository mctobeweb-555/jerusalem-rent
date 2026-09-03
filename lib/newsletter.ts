import { prisma } from "@/lib/db";
import { emailLayout, emailEyebrow, emailHeading, emailButton, emailColors } from "@/lib/email";
import { getSiteMode } from "@/lib/site-settings";
import {
  formatPrice,
  formatSurface,
  LISTING_STATUS_LABELS,
} from "@/lib/utils";

function propertyEmailCard(
  p: {
    slug: string;
    title: string;
    city: string;
    price: number;
    priceHidden: boolean;
    surface: number;
    status: string;
    images: { url: string }[];
  },
  site: string,
): string {
  const rent = p.status === "FOR_RENT" || p.status === "RENTED";
  const short = p.status === "SHORT_TERM";
  const unit = short ? " /nuit" : rent ? " /mois" : "";
  const priceText = p.priceHidden ? "Prix sur demande" : `${formatPrice(p.price)}${unit}`;
  const img = p.images[0]?.url;
  const { NAVY, BORDER, MUTED } = emailColors;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid ${BORDER};">
<tr>
${img ? `<td width="160" style="width:160px;"><a href="${site}/annonces/${p.slug}"><img src="${img}" alt="" width="160" style="display:block;width:160px;height:120px;object-fit:cover;"></a></td>` : ""}
<td style="padding:16px 18px;vertical-align:top;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${NAVY};">${LISTING_STATUS_LABELS[p.status as keyof typeof LISTING_STATUS_LABELS] ?? ""}</div>
<a href="${site}/annonces/${p.slug}" style="display:block;margin-top:4px;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#1c1b18;text-decoration:none;">${p.title}</a>
<div style="font-size:13px;color:${MUTED};margin-top:3px;">${p.city} · ${formatSurface(p.surface)}</div>
<div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${NAVY};margin-top:8px;">${priceText}</div>
</td>
</tr>
</table>`;
}

// Libellé « catégorie à ville » pour les puces d'exploration (ex. « Courte
// durée à Tel Aviv », « Dernières locations à Jerusalem »).
function categoryCityLabel(status: string, city: string): string {
  if (status === "SHORT_TERM") return `Courte durée à ${city}`;
  if (status === "FOR_RENT") return `Dernières locations à ${city}`;
  return `À vendre à ${city}`;
}

// Combinaisons catégorie × ville les plus représentées parmi les annonces
// publiées et disponibles (hors vendu/loué), pour une section « Explorez
// aussi » en bas de newsletter.
async function getCategoryCityHighlights(
  limit = 4,
): Promise<{ label: string; href: string }[]> {
  const mode = await getSiteMode();
  const available: string[] = [];
  if (mode.showSale) available.push("FOR_SALE");
  if (mode.showRent) available.push("FOR_RENT");
  if (mode.showShortTerm) available.push("SHORT_TERM");
  if (available.length === 0) return [];

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const groups = await prisma.property.groupBy({
    by: ["status", "city"],
    where: { published: true, status: { in: available as never } },
    _count: { _all: true },
    orderBy: { _count: { city: "desc" } },
    take: limit,
  });

  return groups.map((g) => ({
    label: categoryCityLabel(g.status, g.city),
    href: `${site}/annonces?status=${g.status}&city=${encodeURIComponent(g.city)}`,
  }));
}

function highlightsSection(items: { label: string; href: string }[]): string {
  if (items.length === 0) return "";
  const { NAVY, BORDER } = emailColors;
  const chips = items
    .map(
      (i) =>
        `<a href="${i.href}" style="display:inline-block;margin:0 8px 8px 0;padding:9px 16px;border:1px solid ${BORDER};color:${NAVY};text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">${i.label}</a>`,
    )
    .join("");
  return `
<div style="margin-top:28px;padding-top:24px;border-top:1px solid ${BORDER};">
${emailEyebrow("Explorez aussi")}
<div style="margin-top:2px;">${chips}</div>
</div>`;
}

// Construit le HTML de la newsletter (6 dernières annonces publiées visibles
// + puces catégorie/ville). `unsubscribeUrl` personnalise le lien de
// désinscription en pied de page (propre à chaque destinataire).
// Renvoie null s'il n'y a aucune annonce.
export async function buildNewsletterHtml(
  opts?: { unsubscribeUrl?: string },
): Promise<string | null> {
  const mode = await getSiteMode();
  const visible: string[] = [];
  if (mode.showSale) visible.push("FOR_SALE", "SOLD");
  if (mode.showRent) visible.push("FOR_RENT", "RENTED");
  if (mode.showShortTerm) visible.push("SHORT_TERM");

  const [props, highlights] = await Promise.all([
    prisma.property.findMany({
      where: { published: true, status: { in: visible as never } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
    }),
    getCategoryCityHighlights(),
  ]);
  if (props.length === 0) return null;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const cards = props
    .map((p) =>
      propertyEmailCard(
        {
          slug: p.slug,
          title: p.title,
          city: p.city,
          price: p.price,
          priceHidden: p.priceHidden,
          surface: p.surface,
          status: p.status,
          images: p.images,
        },
        site,
      ),
    )
    .join("");

  return emailLayout(
    `${emailEyebrow("Nouveautés")}
${emailHeading("Nos dernières annonces")}
<p style="margin:0 0 24px;color:${emailColors.MUTED};line-height:1.6;">Découvrez une sélection de biens récemment publiés chez Jerusalem Rent.</p>
${cards}
<p style="margin:26px 0 0;">${emailButton(`${site}/annonces`, "Voir toutes les annonces")}</p>
${highlightsSection(highlights)}`,
    { preheader: "Les dernières annonces Jerusalem Rent", unsubscribeUrl: opts?.unsubscribeUrl },
  );
}
