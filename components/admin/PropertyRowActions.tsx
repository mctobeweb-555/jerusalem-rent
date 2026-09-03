"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePublish, deleteProperty } from "@/app/admin/properties/actions";

export default function PropertyRowActions({
  id,
  slug,
  published,
}: {
  id: string;
  slug: string;
  published: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onToggle() {
    startTransition(async () => {
      await togglePublish(id);
      router.refresh();
    });
  }

  function onDelete() {
    if (!confirm("Supprimer définitivement cette annonce ?")) return;
    startTransition(async () => {
      await deleteProperty(id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={`/annonces/${slug}`}
        target="_blank"
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100"
        title="Voir en ligne"
      >
        Voir
      </Link>
      <Link
        href={`/admin/properties/${id}`}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50"
      >
        Éditer
      </Link>
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
      >
        {published ? "Dépublier" : "Publier"}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Suppr.
      </button>
    </div>
  );
}
