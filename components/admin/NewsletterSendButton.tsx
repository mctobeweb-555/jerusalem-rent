"use client";

import { useState, useTransition } from "react";
import { sendNewsletter, type NewsletterResult } from "@/app/admin/newsletter/actions";

export default function NewsletterSendButton({
  disabled,
}: {
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<NewsletterResult | null>(null);

  function onSend() {
    if (
      !confirm(
        "Envoyer la sélection des dernières annonces à tous les inscrits ?",
      )
    )
      return;
    startTransition(async () => {
      const r = await sendNewsletter();
      setResult(r);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onSend}
        disabled={pending || disabled}
        className="btn-primary"
      >
        {pending ? "Envoi en cours…" : "Envoyer la newsletter"}
      </button>

      {result && (
        <p
          className={
            "text-sm " + (result.ok ? "text-primary-700" : "text-red-600")
          }
        >
          {result.ok
            ? result.enabled
              ? `✓ Envoyée à ${result.sent} inscrit${result.sent > 1 ? "s" : ""}.`
              : `✓ Simulée pour ${result.sent} inscrit${result.sent > 1 ? "s" : ""} (mode démo : configurez RESEND_API_KEY pour un envoi réel).`
            : result.error ?? "Échec de l'envoi."}
        </p>
      )}
    </div>
  );
}
