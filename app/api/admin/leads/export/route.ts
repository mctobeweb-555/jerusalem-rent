import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, canManageAllProperties } from "@/lib/guards";
import { buildLeadWhere } from "@/lib/leads";
import { toCsv } from "@/lib/csv";
import { LEAD_STATUS_LABELS, LISTING_STATUS_LABELS } from "@/lib/utils";

// GET /api/admin/leads/export — export CSV des leads visibles par
// l'utilisateur, avec les mêmes filtres que la page /admin/leads (mêmes
// paramètres de requête). Protégé par session (401 sinon).
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const where = buildLeadWhere(user, {
    property: sp.get("property") ?? undefined,
    agent: sp.get("agent") ?? undefined,
    status: sp.get("status") ?? undefined,
    category: sp.get("category") ?? undefined,
    q: sp.get("q") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
  });

  const manageAll = canManageAllProperties(user);

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        select: {
          title: true,
          status: true,
          owner: { select: { name: true } },
        },
      },
    },
  });

  const dateFmt = (d: Date) => d.toISOString().slice(0, 10);

  const header = [
    "Date",
    "Nom",
    "Email",
    "Telephone",
    "Bien",
    "Categorie annonce",
    ...(manageAll ? ["Agent"] : []),
    "Statut lead",
    "Message",
    "Arrivee",
    "Depart",
    "Adultes",
    "Enfants",
    "Bebes",
  ];

  const rows = leads.map((l) => [
    dateFmt(l.createdAt),
    l.name,
    l.email,
    l.phone ?? "",
    l.property?.title ?? "Demande générale",
    l.property ? LISTING_STATUS_LABELS[l.property.status] : "",
    ...(manageAll ? [l.property?.owner?.name ?? ""] : []),
    LEAD_STATUS_LABELS[l.status],
    l.message,
    l.checkIn ? dateFmt(l.checkIn) : "",
    l.checkOut ? dateFmt(l.checkOut) : "",
    l.adults != null ? String(l.adults) : "",
    l.children != null ? String(l.children) : "",
    l.babies != null ? String(l.babies) : "",
  ]);

  const csv = toCsv([header, ...rows]);
  const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
