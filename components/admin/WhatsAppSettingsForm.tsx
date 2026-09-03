"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateContactSettings } from "@/app/admin/settings/actions";

export default function WhatsAppSettingsForm({
  initial,
}: {
  initial: { whatsappNumber: string; whatsappMessage: string };
}) {
  const router = useRouter();
  const [number, setNumber] = useState(initial.whatsappNumber);
  const [message, setMessage] = useState(initial.whatsappMessage);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function save() {
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const r = await updateContactSettings({
        whatsappNumber: number,
        whatsappMessage: message,
      });
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
        <h2 className="font-semibold">Bouton WhatsApp flottant</h2>
        <p className="mt-1 text-sm text-stone-500">
          Affiche un bouton flottant sur tout le site public, avec une bulle de
          discussion vers WhatsApp. Laissez le numéro vide pour le désactiver.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="wa-number">Numéro WhatsApp</label>
        <input
          id="wa-number"
          className="input"
          placeholder="+972 50 000 00 00"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
        <p className="mt-1 text-xs text-stone-400">
          Avec l'indicatif pays (ex. +972 pour Israël, +33 pour la France).
        </p>
      </div>
      <div>
        <label className="label" htmlFor="wa-message">
          Message affiché (et pré-rempli sur WhatsApp)
        </label>
        <textarea
          id="wa-message"
          rows={3}
          className="input resize-y"
          placeholder="Bonjour 👋 Une question ? Nous sommes là pour vous aider."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
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
