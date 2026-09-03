"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateReviewsSettings } from "@/app/admin/settings/actions";

export default function ReviewsSettingsForm({
  initial,
}: {
  initial: { reviewsGeneralized: boolean };
}) {
  const router = useRouter();
  const [generalized, setGeneralized] = useState(initial.reviewsGeneralized);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function save() {
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const r = await updateReviewsSettings({ reviewsGeneralized: generalized });
      if (r.ok) {
        setMsg("Paramètres enregistrés.");
        router.refresh();
      } else {
        setErr(r.error ?? "Échec de l'enregistrement.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Avis</h2>
      <section className="card">
        <label className="flex cursor-pointer items-start gap-4 p-5">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
            checked={generalized}
            onChange={(e) => {
              setGeneralized(e.target.checked);
              setMsg(null);
              setErr(null);
            }}
          />
          <div>
            <p className="font-medium text-stone-900">
              Avis généralisés sur l'accueil
            </p>
            <p className="text-sm text-stone-500">
              Affiche sur la page d'accueil les derniers témoignages non liés
              à une annonce précise. Sans effet en mode « courte durée
              uniquement » : la home y affiche automatiquement les avis liés
              à chaque annonce.
            </p>
          </div>
        </label>
      </section>

      {err && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>
      )}
      {msg && (
        <p className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-700">
          {msg}
        </p>
      )}

      <button type="button" onClick={save} disabled={pending} className="btn-primary">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}
