"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSiteSettings } from "@/app/admin/settings/actions";

type Flags = { showSale: boolean; showRent: boolean; showShortTerm: boolean };

const OPTIONS: { key: keyof Flags; label: string; desc: string }[] = [
  { key: "showSale", label: "Vente", desc: "Biens à vendre (à vendre / vendus)." },
  { key: "showRent", label: "Location", desc: "Biens à louer (longue durée)." },
  {
    key: "showShortTerm",
    label: "Courte durée",
    desc: "Locations saisonnières. Si SEULE cette case est cochée, le site passe en mode réservation (dates + voyageurs).",
  },
];

export default function SiteSettingsForm({ initial }: { initial: Flags }) {
  const router = useRouter();
  const [flags, setFlags] = useState<Flags>(initial);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const shortTermOnly =
    flags.showShortTerm && !flags.showSale && !flags.showRent;

  function toggle(key: keyof Flags) {
    setFlags((f) => ({ ...f, [key]: !f[key] }));
    setMsg(null);
    setErr(null);
  }

  function save() {
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const r = await updateSiteSettings(flags);
      if (r.ok) {
        setMsg("Paramètres enregistrés.");
        router.refresh();
      } else {
        setErr(r.error ?? "Échec de l'enregistrement.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="card divide-y divide-stone-100">
        {OPTIONS.map((o) => (
          <label
            key={o.key}
            className="flex cursor-pointer items-start gap-4 p-5"
          >
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
              checked={flags[o.key]}
              onChange={() => toggle(o.key)}
            />
            <div>
              <p className="font-medium text-stone-900">{o.label}</p>
              <p className="text-sm text-stone-500">{o.desc}</p>
            </div>
          </label>
        ))}
      </section>

      {shortTermOnly && (
        <p className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-700">
          Mode <strong>réservation</strong> actif : le site affiche une recherche
          par dates et voyageurs, et les formulaires deviennent des demandes de
          réservation.
        </p>
      )}

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
