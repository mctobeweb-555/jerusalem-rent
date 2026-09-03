"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ImageUpload from "@/components/admin/ImageUpload";

export type AgentFormValues = {
  name: string;
  email: string;
  password: string;
  role: "AGENT" | "ADMIN";
  phone: string;
  title: string;
  avatarUrl: string;
  canManageAll: boolean;
  languages: string; // liste séparée par des virgules
};

export const EMPTY_AGENT: AgentFormValues = {
  name: "",
  email: "",
  password: "",
  role: "AGENT",
  phone: "",
  title: "Conseiller immobilier",
  avatarUrl: "",
  canManageAll: false,
  languages: "",
};

export default function AgentForm({
  initial = EMPTY_AGENT,
  agentId,
  isSelf = false,
}: {
  initial?: AgentFormValues;
  agentId?: string;
  isSelf?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<AgentFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!agentId;

  function set<K extends keyof AgentFormValues>(
    key: K,
    value: AgentFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // En édition, le mot de passe vide = inchangé.
    const payload: Record<string, unknown> = {
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role,
      phone: values.phone.trim() || undefined,
      title: values.title.trim() || undefined,
      avatarUrl: values.avatarUrl.trim() || undefined,
      canManageAll: values.canManageAll,
      languages: values.languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
    };
    if (values.password) payload.password = values.password;

    try {
      const res = await fetch(
        isEdit ? `/api/admin/agents/${agentId}` : "/api/admin/agents",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Enregistrement impossible");
      }

      router.push("/admin/agents");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Identité</h2>

        <div>
          <label className="label" htmlFor="name">Nom complet *</label>
          <input
            id="name"
            required
            minLength={2}
            className="input"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="role">Rôle *</label>
            <select
              id="role"
              className="input disabled:bg-stone-100"
              value={values.role}
              disabled={isSelf}
              onChange={(e) => set("role", e.target.value as AgentFormValues["role"])}
            >
              <option value="AGENT">Agent</option>
              <option value="ADMIN">Administrateur</option>
            </select>
            {isSelf && (
              <p className="mt-1 text-xs text-stone-400">
                Vous ne pouvez pas modifier votre propre rôle.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="password">
            {isEdit ? "Nouveau mot de passe" : "Mot de passe provisoire *"}
          </label>
          <input
            id="password"
            type="text"
            required={!isEdit}
            minLength={8}
            className="input"
            placeholder={
              isEdit ? "Laisser vide pour ne pas changer" : "Au moins 8 caractères"
            }
            value={values.password}
            onChange={(e) => set("password", e.target.value)}
          />
          {!isEdit && (
            <p className="mt-1 text-xs text-stone-400">
              Communiquez-le à l'agent ; il pourra le changer plus tard.
            </p>
          )}
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Profil public</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="title">Fonction</label>
            <input
              id="title"
              className="input"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="phone">Téléphone</label>
            <input
              id="phone"
              type="tel"
              className="input"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="languages">
            Langues parlées (séparées par des virgules)
          </label>
          <input
            id="languages"
            className="input"
            placeholder="Français, Anglais, Hébreu"
            value={values.languages}
            onChange={(e) => set("languages", e.target.value)}
          />
          <p className="mt-1 text-xs text-stone-400">
            Affichées sur le profil public de l'agent et sur les fiches de ses
            annonces.
          </p>
        </div>

        <div>
          <span className="label">Photo</span>
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-stone-100">
              {values.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={values.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-stone-300">👤</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <ImageUpload
                onUploaded={(url) => set("avatarUrl", url)}
                label="Uploader une photo"
              />
              <input
                className="input"
                placeholder="…ou coller une URL d'image"
                value={values.avatarUrl}
                onChange={(e) => set("avatarUrl", e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold">Permissions</h2>
        {values.role === "ADMIN" ? (
          <p className="mt-2 text-sm text-stone-500">
            Un administrateur gère déjà toutes les annonces de l'agence.
          </p>
        ) : (
          <label className="mt-3 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
              checked={values.canManageAll}
              onChange={(e) => set("canManageAll", e.target.checked)}
            />
            <span>
              <span className="font-medium text-stone-900">
                Voir et modifier toutes les annonces de l'agence
              </span>
              <span className="block text-sm text-stone-500">
                Décoché, l'agent ne gère et ne voit que ses propres annonces (et leurs
                leads).
              </span>
            </span>
          </label>
        )}
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/agents")}
          className="btn-outline"
        >
          Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer l'agent"}
        </button>
      </div>
    </form>
  );
}
