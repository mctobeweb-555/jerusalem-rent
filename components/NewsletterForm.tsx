"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type State = "idle" | "sending" | "done" | "error";

export default function NewsletterForm({ dict }: { dict: Dictionary["newsletter"] }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);

    const form = e.currentTarget;
    const honeypot = String(new FormData(form).get("company") ?? "");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, honeypot }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? dict.error);
      }
      setState("done");
      setEmail("");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : dict.error);
    }
  }

  if (state === "done") {
    return (
      <p className="bg-white/15 px-4 py-3 text-sm font-medium text-white">
        {dict.success}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={dict.placeholder}
          aria-label={dict.placeholder}
          className="w-full flex-1 border-0 px-4 py-3 text-sm text-stone-900 outline-none ring-2 ring-transparent focus:ring-white/60"
        />
        {/* Honeypot anti-spam */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="nl-company">Ne pas remplir</label>
          <input id="nl-company" name="company" tabIndex={-1} autoComplete="off" />
        </div>
        <button
          type="submit"
          disabled={state === "sending"}
          className="btn-accent whitespace-nowrap px-6 py-3 disabled:opacity-60"
        >
          {state === "sending" ? dict.sending : dict.submit}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-white/90">{error}</p>}
      <p className="mt-2 text-xs text-white/70">{dict.disclaimer}</p>
    </form>
  );
}
