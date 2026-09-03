"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PROPERTY_TYPE_LABELS,
  LISTING_STATUS_LABELS,
} from "@/lib/utils";
import ImageUpload from "@/components/admin/ImageUpload";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";

export type TranslationValues = { title: string; description: string; features: string };

// Liste "a, b, c" saisie dans un champ texte → tableau de chaînes nettoyées.
function splitFeatures(input: string): string[] {
  return input
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}

export type PropertyFormValues = {
  title: string;
  description: string;
  type: string;
  status: string;
  priceEuros: string; // saisi en euros
  surface: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  maxGuests: string;
  address: string;
  city: string;
  neighborhood: string;
  postalCode: string;
  lat: string;
  lng: string;
  features: string; // liste séparée par des virgules
  images: { url: string; alt: string }[];
  published: boolean;
  priceHidden: boolean;
  ownerId: string; // agent responsable
  translations: { en: TranslationValues; he: TranslationValues };
};

export type AgentOption = { id: string; name: string };

export const EMPTY_PROPERTY: PropertyFormValues = {
  title: "",
  description: "",
  type: "HOUSE",
  status: "FOR_SALE",
  priceEuros: "",
  surface: "",
  rooms: "",
  bedrooms: "",
  bathrooms: "",
  floor: "",
  maxGuests: "",
  address: "",
  city: "",
  neighborhood: "",
  postalCode: "",
  lat: "",
  lng: "",
  features: "",
  images: [{ url: "", alt: "" }],
  published: false,
  priceHidden: false,
  ownerId: "",
  translations: {
    en: { title: "", description: "", features: "" },
    he: { title: "", description: "", features: "" },
  },
};

// Normalise une saisie numérique FR (virgule décimale, espaces) → nombre.
function parseNum(v: string): number {
  return Number(String(v).replace(/\s/g, "").replace(",", "."));
}

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = parseNum(v);
  return Number.isFinite(n) ? n : null;
}

export default function PropertyForm({
  initial,
  propertyId,
  agents = [],
  canAssign = false,
}: {
  initial: PropertyFormValues;
  propertyId?: string;
  agents?: AgentOption[];
  canAssign?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PropertyFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!propertyId;

  function set<K extends keyof PropertyFormValues>(
    key: K,
    value: PropertyFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function setTranslation(
    locale: "en" | "he",
    field: keyof TranslationValues,
    value: string,
  ) {
    setValues((v) => ({
      ...v,
      translations: {
        ...v.translations,
        [locale]: { ...v.translations[locale], [field]: value },
      },
    }));
  }

  function updateImage(i: number, patch: Partial<{ url: string; alt: string }>) {
    setValues((v) => ({
      ...v,
      images: v.images.map((img, idx) => (idx === i ? { ...img, ...patch } : img)),
    }));
  }

  function addImage() {
    setValues((v) => ({ ...v, images: [...v.images, { url: "", alt: "" }] }));
  }

  function removeImage(i: number) {
    setValues((v) => ({ ...v, images: v.images.filter((_, idx) => idx !== i) }));
  }

  // Ajoute une photo uploadée : remplit la 1re ligne vide, sinon en ajoute une.
  function addUploadedImage(url: string) {
    setValues((v) => {
      const alt = v.title.trim() || "Photo";
      const firstEmpty = v.images.findIndex((img) => !img.url.trim());
      if (firstEmpty >= 0) {
        const images = v.images.map((img, idx) =>
          idx === firstEmpty ? { url, alt: img.alt.trim() || alt } : img,
        );
        return { ...v, images };
      }
      return { ...v, images: [...v.images, { url, alt }] };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const priceEuros = parseNum(values.priceEuros);
    if (!Number.isFinite(priceEuros) || priceEuros < 0) {
      setError("Le prix est invalide.");
      setSaving(false);
      return;
    }

    const surface = parseNum(values.surface);
    if (!Number.isFinite(surface) || surface <= 0) {
      setError("La surface est invalide (indiquez un nombre supérieur à 0).");
      setSaving(false);
      return;
    }

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      type: values.type,
      status: values.status,
      price: Math.round(priceEuros * 100), // centimes
      surface,
      rooms: numOrNull(values.rooms),
      bedrooms: numOrNull(values.bedrooms),
      bathrooms: numOrNull(values.bathrooms),
      floor: numOrNull(values.floor),
      maxGuests: numOrNull(values.maxGuests),
      address: values.address.trim(),
      city: values.city.trim(),
      neighborhood: values.neighborhood || undefined,
      postalCode: values.postalCode.trim(),
      lat: numOrNull(values.lat),
      lng: numOrNull(values.lng),
      features: splitFeatures(values.features),
      images: values.images
        .filter((img) => img.url.trim())
        .map((img, i) => ({
          url: img.url.trim(),
          alt: img.alt.trim() || values.title.trim() || "Photo",
          order: i,
        })),
      published: values.published,
      priceHidden: values.priceHidden,
      ownerId: values.ownerId || undefined,
      translations: {
        en: {
          title: values.translations.en.title.trim(),
          description: values.translations.en.description.trim(),
          features: splitFeatures(values.translations.en.features),
        },
        he: {
          title: values.translations.he.title.trim(),
          description: values.translations.he.description.trim(),
          features: splitFeatures(values.translations.he.features),
        },
      },
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/properties/${propertyId}` : "/api/admin/properties",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (res.status === 401) {
        // Session expirée → retour à la connexion.
        router.push("/login?callbackUrl=/admin/properties");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Détaille le premier champ en erreur pour aider l'utilisateur.
        const fieldErrors: Record<string, string[]> =
          data?.details?.fieldErrors ?? {};
        const first = Object.entries(fieldErrors)[0];
        const detail = first ? ` (${first[0]} : ${first[1][0]})` : "";
        throw new Error((data.error ?? "Enregistrement impossible") + detail);
      }

      router.push("/admin/properties");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Informations principales */}
      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Informations</h2>

        <div>
          <label className="label" htmlFor="title">Titre *</label>
          <input
            id="title"
            required
            className="input"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="description">Description *</label>
          <textarea
            id="description"
            required
            rows={5}
            className="input resize-y"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="type">Type *</label>
            <select
              id="type"
              className="input"
              value={values.type}
              onChange={(e) => set("type", e.target.value)}
            >
              {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status">Statut *</label>
            <select
              id="status"
              className="input"
              value={values.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {Object.entries(LISTING_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {canAssign && agents.length > 0 && (
          <div>
            <label className="label" htmlFor="ownerId">Agent responsable</label>
            <select
              id="ownerId"
              className="input"
              value={values.ownerId}
              onChange={(e) => set("ownerId", e.target.value)}
            >
              <option value="">
                {isEdit ? "— Conserver l'agent actuel —" : "— Moi (par défaut) —"}
              </option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-stone-400">
              L'agent choisi apparaît sur la fiche publique du bien.
            </p>
          </div>
        )}
      </section>

      {/* Prix & caractéristiques */}
      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Prix &amp; caractéristiques</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="price">Prix (€) *</label>
            <input
              id="price"
              type="number"
              min={0}
              step="any"
              required
              className="input"
              value={values.priceEuros}
              onChange={(e) => set("priceEuros", e.target.value)}
            />
            <p className="mt-1 text-xs text-stone-400">
              Stocké en centimes. Pour une location, indiquer le loyer mensuel.
            </p>
            <label className="mt-2 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                checked={values.priceHidden}
                onChange={(e) => set("priceHidden", e.target.checked)}
              />
              <span className="text-sm text-stone-600">
                Masquer le prix sur le site (affiche « Prix sur demande »)
              </span>
            </label>
          </div>
          <div>
            <label className="label" htmlFor="surface">Surface (m²) *</label>
            <input
              id="surface"
              type="number"
              min={0}
              step="any"
              required
              className="input"
              value={values.surface}
              onChange={(e) => set("surface", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { k: "rooms", l: "Pièces" },
            { k: "bedrooms", l: "Chambres" },
            { k: "bathrooms", l: "SdB" },
            { k: "floor", l: "Étage" },
            { k: "maxGuests", l: "Capacité (voyageurs)" },
          ].map((f) => (
            <div key={f.k}>
              <label className="label" htmlFor={f.k}>{f.l}</label>
              <input
                id={f.k}
                type="number"
                className="input"
                value={values[f.k as keyof PropertyFormValues] as string}
                onChange={(e) =>
                  set(f.k as keyof PropertyFormValues, e.target.value as never)
                }
              />
            </div>
          ))}
        </div>

        <div>
          <label className="label" htmlFor="features">Équipements (séparés par des virgules)</label>
          <input
            id="features"
            className="input"
            placeholder="piscine, garage, terrasse"
            value={values.features}
            onChange={(e) => set("features", e.target.value)}
          />
        </div>
      </section>

      {/* Localisation */}
      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Localisation</h2>
        <div>
          <label className="label" htmlFor="address">Adresse *</label>
          <input
            id="address"
            required
            className="input"
            value={values.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="city">Ville *</label>
            <input
              id="city"
              required
              className="input"
              value={values.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="postalCode">Code postal *</label>
            <input
              id="postalCode"
              required
              className="input"
              value={values.postalCode}
              onChange={(e) => set("postalCode", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="neighborhood">Quartier</label>
          <select
            id="neighborhood"
            className="input"
            value={values.neighborhood}
            onChange={(e) => set("neighborhood", e.target.value)}
          >
            <option value="">— Aucun —</option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n.slug} value={n.name}>{n.name}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-stone-500">
            Utilisé par le filtre "Quartier" sur la page des annonces.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="lat">Latitude</label>
            <input
              id="lat"
              type="number"
              step="any"
              className="input"
              placeholder="Ex. 48.8566"
              value={values.lat}
              onChange={(e) => set("lat", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="lng">Longitude</label>
            <input
              id="lng"
              type="number"
              step="any"
              className="input"
              placeholder="Ex. 2.3522"
              value={values.lng}
              onChange={(e) => set("lng", e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-stone-400">
          Coordonnées GPS optionnelles : <strong>laissées vides, elles sont
          calculées automatiquement depuis l'adresse</strong> à l'enregistrement
          (pour l'affichage sur la carte). Renseignez-les pour forcer une position
          précise.
        </p>
      </section>

      {/* Photos (par URL) */}
      <section className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Photos</h2>
          <div className="flex items-center gap-2">
            <ImageUpload onUploaded={addUploadedImage} multiple label="Uploader des photos" />
            <button type="button" onClick={addImage} className="btn-outline px-3 py-2 text-xs">
              + URL
            </button>
          </div>
        </div>
        <p className="text-xs text-stone-400">
          Sélectionnez une ou plusieurs photos d'un coup (JPEG, PNG, WebP, AVIF —
          5 Mo max chacune) ou renseignez l'URL d'une image déjà hébergée.
        </p>
        <div className="space-y-3">
          {values.images.map((img, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-stone-100">
                {img.url ? (
                  // Aperçu admin : <img> simple pour accepter n'importe quelle URL.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-stone-300">🖼️</span>
                )}
              </div>
              <input
                className="input"
                placeholder="https://…/photo.jpg"
                value={img.url}
                onChange={(e) => updateImage(i, { url: e.target.value })}
              />
              <input
                className="input"
                placeholder="Texte alternatif"
                value={img.alt}
                onChange={(e) => updateImage(i, { alt: e.target.value })}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="btn-outline px-3"
                aria-label="Retirer cette photo"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Traductions */}
      <section className="card space-y-4 p-6">
        <div>
          <h2 className="font-semibold">Traductions</h2>
          <p className="mt-1 text-xs text-stone-400">
            Facultatif. Laissez vide pour qu'une langue affiche automatiquement
            le titre et la description en français.
          </p>
        </div>
        {(["en", "he"] as const).map((locale) => (
          <div key={locale} className="space-y-3 border-t border-stone-100 pt-4 first:border-t-0 first:pt-0">
            <p className="text-sm font-medium text-stone-700">
              {locale === "en" ? "🇬🇧 Anglais" : "🇮🇱 Hébreu"}
            </p>
            <div>
              <label className="label" htmlFor={`title-${locale}`}>Titre</label>
              <input
                id={`title-${locale}`}
                className="input"
                dir={locale === "he" ? "rtl" : "ltr"}
                value={values.translations[locale].title}
                onChange={(e) => setTranslation(locale, "title", e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor={`description-${locale}`}>Description</label>
              <textarea
                id={`description-${locale}`}
                rows={4}
                className="input resize-y"
                dir={locale === "he" ? "rtl" : "ltr"}
                value={values.translations[locale].description}
                onChange={(e) => setTranslation(locale, "description", e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor={`features-${locale}`}>
                Équipements (séparés par des virgules)
              </label>
              <input
                id={`features-${locale}`}
                className="input"
                dir={locale === "he" ? "rtl" : "ltr"}
                value={values.translations[locale].features}
                onChange={(e) => setTranslation(locale, "features", e.target.value)}
                placeholder="Vide = reprend les équipements en français"
              />
            </div>
          </div>
        ))}
      </section>

      {/* Publication */}
      <section className="card flex items-center justify-between p-6">
        <div>
          <p className="font-medium">Publier l'annonce</p>
          <p className="text-sm text-stone-500">
            Une annonce non publiée reste en brouillon (invisible du public).
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-stone-300 text-primary-600 focus:ring-primary-500"
            checked={values.published}
            onChange={(e) => set("published", e.target.checked)}
          />
          <span className="text-sm font-medium">
            {values.published ? "Publiée" : "Brouillon"}
          </span>
        </label>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/properties")}
          className="btn-outline"
        >
          Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer l'annonce"}
        </button>
      </div>
    </form>
  );
}
