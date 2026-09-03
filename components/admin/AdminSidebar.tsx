"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Tableau de bord", exact: true, adminOnly: false },
  { href: "/admin/stats", label: "Statistiques", adminOnly: false },
  { href: "/admin/properties", label: "Annonces", adminOnly: false },
  { href: "/admin/leads", label: "Leads", adminOnly: false },
  { href: "/admin/reviews", label: "Avis", adminOnly: true },
  { href: "/admin/agents", label: "Agents", adminOnly: true },
  { href: "/admin/newsletter", label: "Newsletter", adminOnly: true },
  { href: "/admin/settings", label: "Paramètres", adminOnly: true },
];

export default function AdminSidebar({
  userName,
  role,
}: {
  userName: string;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="card p-4">
        <div className="mb-4 border-b border-stone-100 pb-4">
          <p className="text-sm font-semibold text-stone-900">{userName}</p>
          <span className="badge mt-1 bg-primary-100 text-primary-700">
            {role === "ADMIN" ? "Administrateur" : "Agent"}
          </span>
        </div>

        <nav className="space-y-1">
          {links
            .filter((l) => !l.adminOnly || role === "ADMIN")
            .map((l) => {
            const active = l.exact
              ? pathname === l.href
              : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-primary-600 text-white"
                    : "text-stone-600 hover:bg-stone-100",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
