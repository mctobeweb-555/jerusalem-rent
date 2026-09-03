"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleReviewPublished, deleteReview } from "@/app/admin/reviews/actions";

export default function ReviewRowActions({
  id,
  published,
}: {
  id: string;
  published: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onToggle() {
    startTransition(async () => {
      await toggleReviewPublished(id);
      router.refresh();
    });
  }

  function onDelete() {
    if (!confirm("Supprimer définitivement cet avis ?")) return;
    startTransition(async () => {
      await deleteReview(id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={`/admin/reviews/${id}`}
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
