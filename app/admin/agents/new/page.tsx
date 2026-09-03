import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import AgentForm from "@/components/admin/AgentForm";

export const dynamic = "force-dynamic";

export default async function NewAgentPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "ADMIN") redirect("/admin");

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/agents" className="text-sm text-stone-500 hover:text-primary-600">
          ← Retour aux agents
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nouvel agent</h1>
      </div>
      <AgentForm />
    </div>
  );
}
