import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser, propertyScope } from "@/lib/guards";
import {
  formatPrice,
  LISTING_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/utils";
import PropertyRowActions from "@/components/admin/PropertyRowActions";
import AdminPagination from "@/components/admin/AdminPagination";
import { ADMIN_PAGE_SIZE, parsePage } from "@/lib/pagination";

export const dynamic = "force-dynamic";

const STATUS_ORDER = [
  "FOR_SALE",
  "FOR_RENT",
  "SHORT_TERM",
  "SOLD",
  "RENTED",
] as const;

type SearchParams = { [key: string]: string | string[] | undefined };
function firstOf(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const statusParam = firstOf(searchParams.status);
  const pubParam = firstOf(searchParams.published); // "1" | "0"
  const typeParam = firstOf(searchParams.type);

  const where: Prisma.PropertyWhereInput = { ...propertyScope(user) };
  if (statusParam && STATUS_ORDER.includes(statusParam as never)) {
    where.status = statusParam as never;
  }
  if (typeParam) where.type = typeParam as never;
  if (pubParam === "1") where.published = true;
  if (pubParam === "0") where.published = false;

  const hasFilter = !!statusParam || !!pubParam || !!typeParam;
  const page = parsePage(searchParams.page);

  const [total, properties] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        city: true,
        price: true,
        priceHidden: true,
        type: true,
        status: true,
        published: true,
        slug: true,
        owner: { select: { name: true } },
        _count: { select: { leads: true } },
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Annonces</h1>
          <p className="mt-1 text-sm text-stone-500">
            {total} annonce{total > 1 ? "s" : ""}
            {hasFilter ? " (filtré)" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/properties/import" className="btn-outline">
            Importer CSV
          </Link>
          <Link href="/admin/properties/new" className="btn-primary">
            + Nouvelle annonce
          </Link>
        </div>
      </div>

      {/* Filtres (formulaire GET) */}
      <form method="get" className="mb-6 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="pf-status">
            Catégorie
          </label>
          <select id="pf-status" name="status" defaultValue={statusParam ?? ""} className="input py-2 text-sm">
            <option value="">Toutes</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{LISTING_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="pf-type">
            Type
          </label>
          <select id="pf-type" name="type" defaultValue={typeParam ?? ""} className="input py-2 text-sm">
            <option value="">Tous</option>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="pf-pub">
            Publication
          </label>
          <select id="pf-pub" name="published" defaultValue={pubParam ?? ""} className="input py-2 text-sm">
            <option value="">Toutes</option>
            <option value="1">Publiées</option>
            <option value="0">Brouillons</option>
          </select>
        </div>
        <button type="submit" className="btn-primary py-2">Filtrer</button>
        {hasFilter && (
          <Link href="/admin/properties" className="btn-outline py-2">Réinitialiser</Link>
        )}
      </form>

      {properties.length === 0 ? (
        <div className="card grid place-items-center p-12 text-center">
          <p className="text-stone-500">Aucune annonce pour l'instant.</p>
          <Link href="/admin/properties/new" className="btn-primary mt-4">
            Créer la première annonce
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Titre</th>
                  <th className="px-5 py-3 font-medium">Agent</th>
                  <th className="px-5 py-3 font-medium">Ville</th>
                  <th className="px-5 py-3 font-medium">Prix</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium">Publication</th>
                  <th className="px-5 py-3 font-medium">Leads</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {properties.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-stone-900">{p.title}</p>
                      <p className="text-xs text-stone-400">
                        {PROPERTY_TYPE_LABELS[p.type]}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-stone-600">
                      {p.owner?.name ?? (
                        <span className="text-stone-300">Non attribué</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-stone-600">{p.city}</td>
                    <td className="px-5 py-3 font-medium text-stone-900">
                      {formatPrice(p.price)}
                      {p.priceHidden && (
                        <span
                          className="ml-1.5 text-xs font-normal text-stone-400"
                          title="Prix masqué sur le site public"
                        >
                          (masqué)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="badge bg-stone-100 text-stone-600">
                        {LISTING_STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          "badge " +
                          (p.published
                            ? "bg-primary-100 text-primary-700"
                            : "bg-amber-100 text-amber-700")
                        }
                      >
                        {p.published ? "Publiée" : "Brouillon"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {p._count.leads > 0 ? (
                        <Link
                          href={`/admin/leads?property=${p.id}`}
                          className="badge bg-accent-100 text-accent-700 hover:bg-accent-200"
                        >
                          {p._count.leads}
                        </Link>
                      ) : (
                        <span className="text-sm text-stone-300">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <PropertyRowActions
                        id={p.id}
                        slug={p.slug}
                        published={p.published}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={page}
            totalPages={totalPages}
            basePath="/admin/properties"
            searchParams={searchParams}
          />
        </div>
      )}
    </div>
  );
}
