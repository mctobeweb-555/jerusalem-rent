"use client";

import { useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      /* la réponse reste générique dans tous les cas */
    }
    setLoading(false);
    // Toujours un message générique : ne révèle jamais si l'email existe.
    setDone(true);
  }

  if (done) {
    return (
      <div className="card p-6 text-sm text-stone-600">
        Si un compte existe avec cet email, un lien de réinitialisation vient de lui être
        envoyé. Il est valable 1 heure.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@oximmo.fr"
        />
      </div>

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Envoi…" : "Envoyer le lien"}
      </button>
    </form>
  );
}
