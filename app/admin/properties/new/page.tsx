import Link from "next/link";
import { getSessionUser, listAssignableAgents } from "@/lib/guards";
import PropertyForm, { EMPTY_PROPERTY } from "@/components/admin/PropertyForm";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const agents = await listAssignableAgents(user);

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/properties" className="text-sm text-stone-500 hover:text-primary-600">
          ← Retour aux annonces
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nouvelle annonce</h1>
      </div>
      <PropertyForm
        initial={EMPTY_PROPERTY}
        agents={agents}
        canAssign={user.role === "ADMIN"}
      />
    </div>
  );
}
