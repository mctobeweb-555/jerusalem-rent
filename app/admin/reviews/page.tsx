import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import ReviewStars from "@/components/ReviewStars";
import ReviewRowActions from "@/components/admin/ReviewRowActions";
import AdminPagination from "@/components/admin/AdminPagination";
import { ADMIN_PAGE_SIZE, parsePage, type SearchParams } from "@/lib/pagination";
import { truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function firstOf(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "ADMIN") redirect("/admin");

  const propertyFilter = firstOf(searchParams.property);
  const baseWhere: Prisma.ReviewWhereInput = propertyFilter
    ? { propertyId: propertyFilter, property: { agencyId: user.agencyId } }
    : { OR: [{ propertyId: null }, { property: { agencyId: user.agencyId } }] };
  const page = parsePage(searchParams.page);
  const [total, all, properties] = await Promise.all([
    prisma.review.count({ where: baseWhere }),
    prisma.review.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { property: { select: { title: true } } },
    }),
    prisma.property.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Avis</h1>
          <p className="mt-1 text-sm text-stone-500">
            {total} avis — saisis manuellement, pas de dépôt public.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/reviews/import" className="btn-outline">
            Importer CSV
          </Link>
          <Link href="/admin/reviews/new" className="btn-primary">
            + Nouvel avis
          </Link>
        </div>
      </div>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-2">
        <div className="min-w-[220px]">
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="rf-property">
            Annonce
          </label>
          <select id="rf-property" name="property" defaultValue={propertyFilter ?? ""} className="input py-2 text-sm">
            <option value="">Toutes (+ avis généraux)</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary py-2">Filtrer</button>
        {propertyFilter && (
          <Link href="/admin/reviews" className="btn-outline py-2">Réinitialiser</Link>
        )}
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Note</th>
                <th className="px-5 py-3 font-medium">Avis</th>
                <th className="px-5 py-3 font-medium">Annonce</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {all.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50/60">
                  <td className="px-5 py-3 font-medium text-stone-900">
                    {r.authorName}
                  </td>
                  <td className="px-5 py-3">
                    <ReviewStars rating={r.rating} />
                  </td>
                  <td className="max-w-xs px-5 py-3 text-stone-600">
                    {truncate(r.comment, 80)}
                  </td>
                  <td className="px-5 py-3 text-stone-600">
                    {r.property?.title ?? (
                      <span className="text-stone-400">Avis général</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        "badge " +
                        (r.published
                          ? "bg-primary-100 text-primary-700"
                          : "bg-stone-100 text-stone-500")
                      }
                    >
                      {r.published ? "Publié" : "Masqué"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <ReviewRowActions id={r.id} published={r.published} />
                  </td>
                </tr>
              ))}
              {all.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-stone-400">
                    Aucun avis pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          page={page}
          totalPages={totalPages}
          basePath="/admin/reviews"
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}
