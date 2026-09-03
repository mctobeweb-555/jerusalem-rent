"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAgent } from "@/app/admin/agents/actions";

export default function AgentRowActions({
  id,
  name,
  slug,
  propertyCount,
  isSelf,
}: {
  id: string;
  name: string;
  slug: string | null;
  propertyCount: number;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onDelete() {
    const warning =
      propertyCount > 0
        ? `Supprimer ${name} ? ${propertyCount} annonce${propertyCount > 1 ? "s" : ""} lui étant assignée${propertyCount > 1 ? "s" : ""} deviendra${propertyCount > 1 ? "ent" : ""} non assignée${propertyCount > 1 ? "s" : ""} (elles ne seront pas supprimées).`
        : `Supprimer ${name} ?`;
    if (!confirm(warning)) return;
    startTransition(async () => {
      try {
        await deleteAgent(id);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {slug && (
        <Link
          href={`/agents/${slug}`}
          target="_blank"
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100"
        >
          Voir
        </Link>
      )}
      <Link
        href={`/admin/agents/${id}`}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50"
      >
        Éditer
      </Link>
      {!isSelf && (
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Suppr.
        </button>
      )}
    </div>
  );
}
