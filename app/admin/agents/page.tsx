import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  // Gestion des agents réservée aux ADMIN.
  if (user.role !== "ADMIN") redirect("/admin");

  const agents = await prisma.user.findMany({
    where: { agencyId: user.agencyId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      slug: true,
      _count: { select: { properties: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="mt-1 text-sm text-stone-500">
            {agents.length} membre{agents.length > 1 ? "s" : ""} de l'agence
          </p>
        </div>
        <Link href="/admin/agents/new" className="btn-primary">
          + Nouvel agent
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Rôle</th>
                <th className="px-5 py-3 font-medium">Téléphone</th>
                <th className="px-5 py-3 font-medium">Biens</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {agents.map((a) => (
                <tr key={a.id} className="hover:bg-stone-50/60">
                  <td className="px-5 py-3 font-medium text-stone-900">{a.name}</td>
                  <td className="px-5 py-3 text-stone-600">{a.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        "badge " +
                        (a.role === "ADMIN"
                          ? "bg-accent-100 text-accent-700"
                          : "bg-stone-100 text-stone-600")
                      }
                    >
                      {a.role === "ADMIN" ? "Administrateur" : "Agent"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-stone-600">
                    {a.phone ?? <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-stone-600">{a._count.properties}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {a.slug && (
                        <Link
                          href={`/agents/${a.slug}`}
                          target="_blank"
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100"
                        >
                          Voir
                        </Link>
                      )}
                      <Link
                        href={`/admin/agents/${a.id}`}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50"
                      >
                        Éditer
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
