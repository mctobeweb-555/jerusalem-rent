import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  getSessionUser,
  propertyScope,
  canManageAllProperties,
} from "@/lib/guards";
import { listAgents } from "@/lib/agents";
import { buildLeadWhere } from "@/lib/leads";
import { LEAD_STATUS_LABELS } from "@/lib/utils";
import LeadStatusSelect from "@/components/admin/LeadStatusSelect";
import AdminPagination from "@/components/admin/AdminPagination";
import { ADMIN_PAGE_SIZE, parsePage } from "@/lib/pagination";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type SearchParams = { [key: string]: string | string[] | undefined };

function firstOf(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// Nombre de nuits entre deux dates (arrondi, min 0).
function nightsBetween(checkIn: Date | null, checkOut: Date | null): number | null {
  if (!checkIn || !checkOut) return null;
  const ms = checkOut.getTime() - checkIn.getTime();
  const n = Math.round(ms / (1000 * 60 * 60 * 24));
  return n > 0 ? n : null;
}

// Détail des voyageurs : adultes / enfants / bébés si renseignés, sinon total.
function formatGuests(lead: {
  guests: number | null;
  adults: number | null;
  children: number | null;
  babies: number | null;
}): string | null {
  const parts: string[] = [];
  if (lead.adults != null)
    parts.push(`${lead.adults} adulte${lead.adults > 1 ? "s" : ""}`);
  if (lead.children)
    parts.push(`${lead.children} enfant${lead.children > 1 ? "s" : ""}`);
  if (lead.babies)
    parts.push(`${lead.babies} bébé${lead.babies > 1 ? "s" : ""}`);
  if (parts.length > 0) return parts.join(" · ");
  if (lead.guests != null)
    return `${lead.guests} voyageur${lead.guests > 1 ? "s" : ""}`;
  return null;
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const propertyFilter = firstOf(searchParams.property);
  const agentFilter = firstOf(searchParams.agent);
  const statusFilter = firstOf(searchParams.status);
  const categoryFilter = firstOf(searchParams.category); // sale|rent|short
  const q = firstOf(searchParams.q)?.trim();
  const fromParam = firstOf(searchParams.from);
  const toParam = firstOf(searchParams.to);
  const manageAll = canManageAllProperties(user);

  const leadWhere = buildLeadWhere(user, {
    property: propertyFilter,
    agent: agentFilter,
    status: statusFilter,
    category: categoryFilter,
    q,
    from: fromParam,
    to: toParam,
  });

  // Export CSV : conserve exactement les mêmes filtres que la vue actuelle.
  const exportParams = new URLSearchParams();
  if (propertyFilter) exportParams.set("property", propertyFilter);
  if (agentFilter) exportParams.set("agent", agentFilter);
  if (statusFilter) exportParams.set("status", statusFilter);
  if (categoryFilter) exportParams.set("category", categoryFilter);
  if (q) exportParams.set("q", q);
  if (fromParam) exportParams.set("from", fromParam);
  if (toParam) exportParams.set("to", toParam);
  const exportHref = `/api/admin/leads/export${
    exportParams.toString() ? `?${exportParams.toString()}` : ""
  }`;

  const page = parsePage(searchParams.page);

  // Options de filtre.
  const [total, leads, filterProperties, agents] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.findMany({
      where: leadWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { property: { select: { title: true, slug: true } } },
    }),
    prisma.property.findMany({
      where: propertyScope(user),
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    manageAll ? listAgents() : Promise.resolve([]),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  const agentOptions = agents
    .filter((a) => a.slug)
    .map((a) => ({ slug: a.slug as string, name: a.name }));

  const hasFilter =
    !!propertyFilter ||
    !!agentFilter ||
    !!statusFilter ||
    !!categoryFilter ||
    !!q ||
    !!fromParam ||
    !!toParam;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="mt-1 text-sm text-stone-500">
            {total} demande{total > 1 ? "s" : ""} de contact
            {hasFilter ? " (filtré, export inclus)" : ""}
          </p>
        </div>
        {leads.length > 0 && (
          <a href={exportHref} className="btn-outline">
            Exporter CSV
          </a>
        )}
      </div>

      {/* Filtres (formulaire GET, sans JS) */}
      <form method="get" className="mb-6 flex flex-wrap items-end gap-2">
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="lf-q">
            Recherche
          </label>
          <input
            id="lf-q"
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Nom, email, message…"
            className="input py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="lf-from">
            Du
          </label>
          <input id="lf-from" type="date" name="from" defaultValue={fromParam ?? ""} className="input py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="lf-to">
            Au
          </label>
          <input id="lf-to" type="date" name="to" defaultValue={toParam ?? ""} className="input py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="lf-category">
            Type
          </label>
          <select id="lf-category" name="category" defaultValue={categoryFilter ?? ""} className="input py-2 text-sm">
            <option value="">Tout</option>
            <option value="sale">Vente</option>
            <option value="rent">Long terme</option>
            <option value="short">Court terme</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="lf-property">
            Annonce
          </label>
          <select id="lf-property" name="property" defaultValue={propertyFilter ?? ""} className="input py-2 text-sm">
            <option value="">Toutes</option>
            {filterProperties.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
        {manageAll && agentOptions.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="lf-agent">
              Agent
            </label>
            <select id="lf-agent" name="agent" defaultValue={agentFilter ?? ""} className="input py-2 text-sm">
              <option value="">Tous</option>
              {agentOptions.map((a) => (
                <option key={a.slug} value={a.slug}>{a.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="lf-status">
            Statut
          </label>
          <select id="lf-status" name="status" defaultValue={statusFilter ?? ""} className="input py-2 text-sm">
            <option value="">Tous</option>
            {Object.entries(LEAD_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary py-2">Filtrer</button>
        {hasFilter && (
          <Link href="/admin/leads" className="btn-outline py-2">Réinitialiser</Link>
        )}
      </form>

      {leads.length === 0 ? (
        <div className="card grid place-items-center p-12 text-center">
          <p className="text-stone-500">Aucun lead pour le moment.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Téléphone</th>
                  <th className="px-5 py-3 font-medium">Bien</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="align-top hover:bg-stone-50/60">
                    <td className="px-5 py-4">
                      <p className="font-medium text-stone-900">{lead.name}</p>
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        {lead.email}
                      </a>
                      <p className="mt-1 max-w-xs text-xs text-stone-500 line-clamp-2">
                        {lead.message}
                      </p>
                      {lead.checkIn && (
                        <p className="mt-1.5 inline-flex flex-wrap gap-1 text-xs">
                          <span className="rounded bg-accent-100 px-1.5 py-0.5 font-medium text-accent-700">
                            📅 {lead.checkIn.toLocaleDateString("fr-FR")}
                            {lead.checkOut
                              ? ` → ${lead.checkOut.toLocaleDateString("fr-FR")}`
                              : ""}
                            {(() => {
                              const n = nightsBetween(lead.checkIn, lead.checkOut);
                              return n ? ` · ${n} nuit${n > 1 ? "s" : ""}` : "";
                            })()}
                          </span>
                          {formatGuests(lead) && (
                            <span className="rounded bg-stone-100 px-1.5 py-0.5 font-medium text-stone-600">
                              👥 {formatGuests(lead)}
                            </span>
                          )}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-stone-600">
                      {lead.phone ? (
                        <a href={`tel:${lead.phone}`} className="hover:underline">
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {lead.property ? (
                        <Link
                          href={`/annonces/${lead.property.slug}`}
                          target="_blank"
                          className="text-sm text-stone-700 hover:text-primary-600"
                        >
                          {lead.property.title}
                        </Link>
                      ) : (
                        <span className="text-sm text-stone-400">Demande générale</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-stone-500">
                      {dateFmt.format(lead.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <LeadStatusSelect leadId={lead.id} current={lead.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={page}
            totalPages={totalPages}
            basePath="/admin/leads"
            searchParams={searchParams}
          />
        </div>
      )}
    </div>
  );
}
