"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSocialSettings } from "@/app/admin/settings/actions";

type Values = { facebookUrl: string; instagramUrl: string; linkedinUrl: string };

export default function SocialSettingsForm({ initial }: { initial: Values }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function set(key: keyof Values, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setMsg(null);
    setErr(null);
  }

  function save() {
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const r = await updateSocialSettings(values);
      if (r.ok) {
        setMsg("Paramètres enregistrés.");
        router.refresh();
      } else {
        setErr(r.error ?? "Échec de l'enregistrement.");
      }
    });
  }

  return (
    <section className="card space-y-4 p-6">
      <div>
        <h2 className="font-semibold">Réseaux sociaux</h2>
        <p className="mt-1 text-sm text-stone-500">
          Affichés dans le footer du site public. Laissez vide pour masquer
          l'icône correspondante.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="facebookUrl">Facebook</label>
          <input
            id="facebookUrl"
            className="input"
            placeholder="https://facebook.com/…"
            value={values.facebookUrl}
            onChange={(e) => set("facebookUrl", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="instagramUrl">Instagram</label>
          <input
            id="instagramUrl"
            className="input"
            placeholder="https://instagram.com/…"
            value={values.instagramUrl}
            onChange={(e) => set("instagramUrl", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="linkedinUrl">LinkedIn</label>
          <input
            id="linkedinUrl"
            className="input"
            placeholder="https://linkedin.com/…"
            value={values.linkedinUrl}
            onChange={(e) => set("linkedinUrl", e.target.value)}
          />
        </div>
      </div>

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
    </section>
  );
}
