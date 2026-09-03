"use client";

import { useState } from "react";
import { useDict } from "@/lib/i18n/context";

type State = "idle" | "sending" | "sent" | "error";

export default function ContactForm({
  propertyId,
  propertyTitle,
  heading,
  confirmText,
}: {
  propertyId?: string;
  propertyTitle?: string;
  heading?: string;
  confirmText?: string;
}) {
  const dict = useDict().contactForm;
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload: Record<string, string> = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: String(data.get("message") ?? ""),
      honeypot: String(data.get("company") ?? ""), // honeypot (voir champ caché)
    };
    if (propertyId) payload.propertyId = propertyId;

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Envoi impossible");
      setState("sent");
      form.reset();
    } catch {
      setState("error");
      setError(dict.disclaimer);
    }
  }

  if (state === "sent") {
    return (
      <div className="card p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-100 text-primary-700">
          ✓
        </div>
        <h3 className="mt-3 font-display text-lg font-light uppercase tracking-[0.1em]">
          {dict.sentTitle}
        </h3>
        <p className="mt-1 text-sm text-stone-500">{confirmText ?? dict.sentDesc}</p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="btn-outline mt-4"
        >
          {dict.sendAnother}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <div>
        <h3 className="font-display text-lg font-light uppercase tracking-[0.1em]">
          {heading ?? dict.heading}
        </h3>
        {propertyTitle && (
          <p className="mt-1 text-sm text-stone-500">{dict.interestedIn(propertyTitle)}</p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="name">{dict.name} *</label>
        <input id="name" name="name" required minLength={2} className="input" />
      </div>

      <div>
        <label className="label" htmlFor="email">{dict.email} *</label>
        <input id="email" name="email" type="email" required className="input" />
      </div>

      <div>
        <label className="label" htmlFor="phone">{dict.phone}</label>
        <input id="phone" name="phone" type="tel" className="input" />
      </div>

      <div>
        <label className="label" htmlFor="message">{dict.message} *</label>
        <textarea
          id="message"
          name="message"
          required
          minLength={5}
          rows={4}
          className="input resize-y"
          defaultValue={propertyTitle ? dict.defaultMessage(propertyTitle) : ""}
        />
      </div>

      {/* Honeypot : champ caché, invisible pour les humains, rempli par les bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Ne pas remplir</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={state === "sending"}
      >
        {state === "sending" ? dict.sending : dict.submit}
      </button>
      <p className="text-xs text-stone-400">{dict.disclaimer}</p>
    </form>
  );
}
