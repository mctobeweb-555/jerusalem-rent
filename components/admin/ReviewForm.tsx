"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ImageUpload from "@/components/admin/ImageUpload";

export type ReviewFormValues = {
  propertyId: string; // vide = avis général
  authorName: string;
  rating: number;
  comment: string;
  avatarUrl: string;
  published: boolean;
};

export const EMPTY_REVIEW: ReviewFormValues = {
  propertyId: "",
  authorName: "",
  rating: 5,
  comment: "",
  avatarUrl: "",
  published: true,
};

export type PropertyOption = { id: string; title: string };

export default function ReviewForm({
  initial = EMPTY_REVIEW,
  reviewId,
  properties,
}: {
  initial?: ReviewFormValues;
  reviewId?: string;
  properties: PropertyOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<ReviewFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!reviewId;

  function set<K extends keyof ReviewFormValues>(
    key: K,
    value: ReviewFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      propertyId: values.propertyId || undefined,
      authorName: values.authorName.trim(),
      rating: values.rating,
      comment: values.comment.trim(),
      avatarUrl: values.avatarUrl.trim() || undefined,
      published: values.published,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/reviews/${reviewId}` : "/api/admin/reviews",
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

      router.push("/admin/reviews");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Avis</h2>

        <div>
          <label className="label" htmlFor="propertyId">Annonce concernée</label>
          <select
            id="propertyId"
            className="input"
            value={values.propertyId}
            onChange={(e) => set("propertyId", e.target.value)}
          >
            <option value="">— Avis général (témoignage) —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-stone-400">
            Laissez sur « avis général » pour un témoignage non lié à une
            annonce précise (affiché sur l'accueil en mode vente/location si
            activé dans les paramètres).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="authorName">Nom du client *</label>
            <input
              id="authorName"
              required
              minLength={2}
              className="input"
              value={values.authorName}
              onChange={(e) => set("authorName", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="rating">Note *</label>
            <select
              id="rating"
              className="input"
              value={values.rating}
              onChange={(e) => set("rating", Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)}
                  {"☆".repeat(5 - n)} ({n}/5)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="comment">Avis *</label>
          <textarea
            id="comment"
            required
            minLength={5}
            rows={4}
            className="input"
            placeholder="Texte de l'avis, retranscrit depuis le mail/WhatsApp du client…"
            value={values.comment}
            onChange={(e) => set("comment", e.target.value)}
          />
        </div>

        <div>
          <span className="label">Photo (facultatif)</span>
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

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
            checked={values.published}
            onChange={(e) => set("published", e.target.checked)}
          />
          <span>
            <span className="font-medium text-stone-900">Publié</span>
            <span className="block text-sm text-stone-500">
              Décoché, l'avis reste enregistré mais n'est visible nulle part
              sur le site public.
            </span>
          </span>
        </label>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/reviews")}
          className="btn-outline"
        >
          Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer l'avis"}
        </button>
      </div>
    </form>
  );
}
