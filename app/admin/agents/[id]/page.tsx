import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import AgentForm, { type AgentFormValues } from "@/components/admin/AgentForm";

export const dynamic = "force-dynamic";

export default async function EditAgentPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "ADMIN") redirect("/admin");

  const agent = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      title: true,
      avatarUrl: true,
      canManageAll: true,
      languages: true,
      agencyId: true,
    },
  });

  if (!agent || agent.agencyId !== user.agencyId) notFound();

  const initial: AgentFormValues = {
    name: agent.name,
    email: agent.email,
    password: "",
    role: agent.role as "AGENT" | "ADMIN",
    phone: agent.phone ?? "",
    title: agent.title ?? "",
    avatarUrl: agent.avatarUrl ?? "",
    canManageAll: agent.canManageAll,
    languages: Array.isArray(agent.languages)
      ? (agent.languages as string[]).join(", ")
      : "",
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/agents" className="text-sm text-stone-500 hover:text-primary-600">
          ← Retour aux agents
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Modifier l'agent</h1>
      </div>
      <AgentForm
        initial={initial}
        agentId={agent.id}
        isSelf={agent.id === user.id}
      />
    </div>
  );
}
