"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { confirmUnsubscribe } from "@/app/desabonnement/actions";

export default function UnsubscribeCard({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    startTransition(async () => {
      const r = await confirmUnsubscribe(token);
      if (r.ok) setDone(true);
      else setError(r.error ?? "Une erreur est survenue.");
    });
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-100 text-primary-700">
          ✓
        </div>
        <h1 className="mt-4 text-xl font-bold">Vous êtes désinscrit</h1>
        <p className="mt-2 text-stone-500">
          <strong>{email}</strong> ne recevra plus la newsletter Jerusalem Rent.
          Vous pouvez vous réinscrire à tout moment depuis le site.
        </p>
        <Link href="/" className="btn-outline mt-5 inline-flex">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-8 text-center">
      <h1 className="text-xl font-bold">Se désinscrire de la newsletter</h1>
      <p className="mt-2 text-stone-500">
        Confirmez-vous vouloir vous désinscrire avec l&apos;adresse{" "}
        <strong>{email}</strong> ?
      </p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-center gap-3">
        <Link href="/" className="btn-outline">
          Annuler
        </Link>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="btn-primary"
        >
          {pending ? "Envoi…" : "Confirmer la désinscription"}
        </button>
      </div>
    </div>
  );
}
