import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  getSessionUser,
  propertyScope,
  canManageAllProperties,
} from "@/lib/guards";
import { LEAD_STATUS_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await getSessionUser();
  if (!user) return null; // le layout redirige déjà

  const scope = propertyScope(user);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const manageAll = canManageAllProperties(user);

  // Leads visibles selon la permission.
  const leadWhere = manageAll
    ? { OR: [{ property: { agencyId: user.agencyId } }, { propertyId: null }] }
    : { property: { ownerId: user.id } };

  const [
    publishedSale,
    publishedRent,
    publishedShort,
    leadsMonth,
    visitorsMonth,
    recentLeads,
  ] = await Promise.all([
    prisma.property.count({
      where: { ...scope, published: true, status: { in: ["FOR_SALE", "SOLD"] } },
    }),
    prisma.property.count({
      where: { ...scope, published: true, status: { in: ["FOR_RENT", "RENTED"] } },
    }),
    prisma.property.count({
      where: { ...scope, published: true, status: "SHORT_TERM" },
    }),
    prisma.lead.count({
      where: { ...leadWhere, createdAt: { gte: monthAgo } },
    }),
    prisma.propertyView.count({
      where: { property: scope, createdAt: { gte: monthAgo } },
    }),
    prisma.lead.findMany({
      where: leadWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { property: { select: { title: true, slug: true } } },
    }),
  ]);

  const publishedTotal = publishedSale + publishedRent + publishedShort;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <Link href="/admin/properties/new" className="btn-primary">
          + Nouvelle annonce
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Annonces publiées + répartition */}
        <Link href="/admin/properties" className="card p-5 transition hover:shadow-lift">
          <p className="text-sm text-stone-500">Annonces publiées</p>
          <p className="mt-2 font-display text-3xl font-bold text-stone-900">
            {publishedTotal}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {publishedSale} vente · {publishedRent} location · {publishedShort} court terme
          </p>
        </Link>

        <Link href="/admin/leads" className="card p-5 transition hover:shadow-lift">
          <p className="text-sm text-stone-500">Leads (30 derniers jours)</p>
          <p className="mt-2 font-display text-3xl font-bold text-stone-900">
            {leadsMonth}
          </p>
        </Link>

        <Link href="/admin/stats" className="card p-5 transition hover:shadow-lift">
          <p className="text-sm text-stone-500">Visiteurs (30 derniers jours)</p>
          <p className="mt-2 font-display text-3xl font-bold text-stone-900">
            {visitorsMonth}
          </p>
        </Link>
      </div>

      <div className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <h2 className="font-semibold">Derniers leads</h2>
          <Link href="/admin/leads" className="text-sm font-medium text-primary-600">
            Tout voir →
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <p className="p-5 text-sm text-stone-500">Aucun lead pour le moment.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {recentLeads.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-900">{lead.name}</p>
                  <p className="truncate text-sm text-stone-500">
                    {lead.email}
                    {lead.property ? ` · ${lead.property.title}` : ""}
                  </p>
                </div>
                <span className="badge shrink-0 bg-stone-100 text-stone-600">
                  {LEAD_STATUS_LABELS[lead.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
