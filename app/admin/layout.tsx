import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

// Layout protégé : vérifie la session côté serveur. Sinon → /login.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminTopBar />
      {/* Admin en pleine largeur (plus de confort pour les tableaux). */}
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <AdminSidebar
            userName={session.user.name ?? "Utilisateur"}
            role={session.user.role ?? "AGENT"}
          />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
