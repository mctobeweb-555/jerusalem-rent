import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import { isEmailEnabled } from "@/lib/email";
import NewsletterSendButton from "@/components/admin/NewsletterSendButton";
import AdminPagination from "@/components/admin/AdminPagination";
import { ADMIN_PAGE_SIZE, parsePage, type SearchParams } from "@/lib/pagination";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "ADMIN") redirect("/admin");

  const page = parsePage(searchParams.page);
  const [subscribers, total, activeCount, unsubscribedCount] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { active: true } }),
    prisma.newsletterSubscriber.count({ where: { active: false } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Newsletter</h1>
          <p className="mt-1 text-sm text-stone-500">
            {activeCount} inscrit{activeCount > 1 ? "s" : ""} actif
            {activeCount > 1 ? "s" : ""}
            {unsubscribedCount > 0
              ? ` · ${unsubscribedCount} désinscrit${unsubscribedCount > 1 ? "s" : ""}`
              : ""}
          </p>
          {!isEmailEnabled() && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Mode démo : les envois sont simulés. Renseignez{" "}
              <code>RESEND_API_KEY</code> et <code>EMAIL_FROM</code> pour un envoi
              réel.
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <a
              href="/admin/newsletter/preview"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Prévisualiser
            </a>
            <NewsletterSendButton disabled={activeCount === 0} />
          </div>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <div className="card grid place-items-center p-12 text-center">
          <p className="text-stone-500">Aucun inscrit pour le moment.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 text-right font-medium">Inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/60">
                    <td className="px-5 py-3">
                      <a
                        href={`mailto:${s.email}`}
                        className={
                          s.active
                            ? "text-primary-600 hover:underline"
                            : "text-stone-400 hover:underline"
                        }
                      >
                        {s.email}
                      </a>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          "badge " +
                          (s.active
                            ? "bg-primary-100 text-primary-700"
                            : "bg-stone-100 text-stone-500")
                        }
                        title={
                          !s.active && s.unsubscribedAt
                            ? `Désinscrit le ${dateFmt.format(s.unsubscribedAt)}`
                            : undefined
                        }
                      >
                        {s.active ? "Actif" : "Désinscrit"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-stone-500">
                      {dateFmt.format(s.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={page}
            totalPages={totalPages}
            basePath="/admin/newsletter"
            searchParams={searchParams}
          />
        </div>
      )}
    </div>
  );
}
