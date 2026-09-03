import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser, propertyScope } from "@/lib/guards";
import { LISTING_STATUS_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };
function firstOf(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function pct(leads: number, views: number): string {
  if (views === 0) return "—";
  return `${((leads / views) * 100).toFixed(1)} %`;
}

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const fromParam = firstOf(searchParams.from);
  const toParam = firstOf(searchParams.to);
  const hasRange = !!fromParam || !!toParam;

  const dateFilter: Prisma.DateTimeFilter = {};
  if (fromParam) dateFilter.gte = new Date(fromParam);
  if (toParam) {
    const end = new Date(toParam);
    end.setHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  const properties = await prisma.property.findMany({
    where: propertyScope(user),
    select: {
      id: true,
      title: true,
      city: true,
      status: true,
      slug: true,
      published: true,
      views: true,
      _count: { select: { leads: true } },
    },
  });

  const ids = properties.map((p) => p.id);
  // Par défaut (sans période) : compteurs cumulés. Avec période : agrégation
  // des événements de vue et des leads sur la plage de dates.
  const viewsMap = new Map<string, number>(
    properties.map((p) => [p.id, p.views]),
  );
  const leadsMap = new Map<string, number>(
    properties.map((p) => [p.id, p._count.leads]),
  );

  if (hasRange && ids.length > 0) {
    const [vg, lg] = await Promise.all([
      prisma.propertyView.groupBy({
        by: ["propertyId"],
        where: { propertyId: { in: ids }, createdAt: dateFilter },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ["propertyId"],
        where: { propertyId: { in: ids }, createdAt: dateFilter },
        _count: { _all: true },
      }),
    ]);
    ids.forEach((id) => {
      viewsMap.set(id, 0);
      leadsMap.set(id, 0);
    });
    vg.forEach((g) => viewsMap.set(g.propertyId, g._count._all));
    lg.forEach((g) => {
      if (g.propertyId) leadsMap.set(g.propertyId, g._count._all);
    });
  }

  const rows = properties
    .map((p) => {
      const views = viewsMap.get(p.id) ?? 0;
      const leads = leadsMap.get(p.id) ?? 0;
      return { ...p, v: views, l: leads };
    })
    .sort((a, b) => b.v - a.v || b.l - a.l);

  const totalViews = rows.reduce((s, r) => s + r.v, 0);
  const totalLeads = rows.reduce((s, r) => s + r.l, 0);
  const publishedCount = properties.filter((p) => p.published).length;

  const kpis = [
    { label: "Vues", value: totalViews.toLocaleString("fr-FR") },
    { label: "Formulaires remplis", value: totalLeads.toLocaleString("fr-FR") },
    { label: "Taux de conversion", value: pct(totalLeads, totalViews) },
    { label: "Annonces publiées", value: String(publishedCount) },
  ];

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <p className="mt-1 text-sm text-stone-500">
          Performance de vos annonces
          {hasRange ? " sur la période sélectionnée" : " (depuis le début)"}.
        </p>
      </div>

      {/* Filtre par date */}
      <form method="get" className="mb-6 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="sf-from">Du</label>
          <input id="sf-from" type="date" name="from" defaultValue={fromParam ?? ""} className="input py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="sf-to">Au</label>
          <input id="sf-to" type="date" name="to" defaultValue={toParam ?? ""} className="input py-2 text-sm" />
        </div>
        <button type="submit" className="btn-primary py-2">Appliquer</button>
        {hasRange && (
          <Link href="/admin/stats" className="btn-outline py-2">Réinitialiser</Link>
        )}
      </form>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-5">
            <p className="text-sm text-stone-500">{k.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-stone-900">
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Par annonce */}
      <div className="card overflow-hidden">
        <div className="border-b border-stone-100 p-5">
          <h2 className="font-semibold">Détail par annonce</h2>
        </div>
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-stone-500">Aucune annonce.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Annonce</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 text-right font-medium">Vues</th>
                  <th className="px-5 py-3 text-right font-medium">Formulaires</th>
                  <th className="px-5 py-3 text-right font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/annonces/${p.slug}`}
                        target="_blank"
                        className="font-medium text-stone-900 hover:text-primary-600"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-stone-400">{p.city}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="badge bg-stone-100 text-stone-600">
                        {LISTING_STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-stone-900">
                      {p.v.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {p.l > 0 ? (
                        <Link
                          href={`/admin/leads?property=${p.id}`}
                          className="font-medium text-primary-600 hover:underline"
                        >
                          {p.l}
                        </Link>
                      ) : (
                        <span className="text-stone-300">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-stone-600">
                      {pct(p.l, p.v)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
