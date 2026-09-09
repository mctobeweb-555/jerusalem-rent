"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";
import { updatePopupSettings, type PopupSettingsInput } from "@/app/admin/settings/actions";

export type PopupSettingsValues = PopupSettingsInput;

export default function PopupSettingsForm({
  initial,
}: {
  initial: PopupSettingsValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PopupSettingsValues>(initial);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof PopupSettingsValues>(key: K, v: PopupSettingsValues[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function setTranslation(
    locale: "en" | "he",
    field: "title" | "text" | "ctaLabel",
    v: string,
  ) {
    setValues((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: { ...prev.translations[locale], [field]: v },
      },
    }));
  }

  function save() {
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const r = await updatePopupSettings(values);
      if (r.ok) {
        setMsg("Popup enregistrée.");
        router.refresh();
      } else {
        setErr(r.error ?? "Échec de l'enregistrement.");
      }
    });
  }

  const translationBlock = (locale: "en" | "he", label: string, dir?: "rtl") => (
    <div className="space-y-3 border-s-2 border-stone-200 ps-4">
      <p className="text-sm font-medium text-stone-700">{label}</p>
      <input
        className="input"
        dir={dir}
        placeholder="Titre (vide = texte français)"
        value={values.translations[locale].title}
        onChange={(e) => setTranslation(locale, "title", e.target.value)}
      />
      <textarea
        rows={2}
        dir={dir}
        className="input resize-y"
        placeholder="Description (vide = texte français)"
        value={values.translations[locale].text}
        onChange={(e) => setTranslation(locale, "text", e.target.value)}
      />
      <input
        className="input"
        dir={dir}
        placeholder="Libellé du bouton (vide = texte français)"
        value={values.translations[locale].ctaLabel}
        onChange={(e) => setTranslation(locale, "ctaLabel", e.target.value)}
      />
    </div>
  );

  return (
    <section className="card space-y-5 p-6">
      <div>
        <h2 className="font-semibold">Popup d&apos;accueil</h2>
        <p className="mt-1 text-sm text-stone-500">
          Fenêtre affichée 3 secondes après l&apos;arrivée sur le site public
          (occasions spéciales, promotions…). Elle ne réapparaît pas pendant que
          le visiteur navigue sur les autres pages.
        </p>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={values.popupEnabled}
          onChange={(e) => set("popupEnabled", e.target.checked)}
        />
        <span className="text-sm text-stone-700">Activer la popup</span>
      </label>

      <div>
        <span className="label">Image</span>
        <div className="flex items-start gap-4">
          <div className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden bg-stone-100">
            {values.popupImageUrl ? (
              // Aperçu simple : l'URL peut pointer ailleurs que sur nos
              // domaines autorisés, next/image refuserait de la charger.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={values.popupImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-stone-400">Aucune</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <ImageUpload
              onUploaded={(url) => set("popupImageUrl", url)}
              label="Uploader une image"
            />
            <input
              className="input"
              placeholder="…ou coller une URL d'image"
              value={values.popupImageUrl}
              onChange={(e) => set("popupImageUrl", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="popup-title">Titre</label>
        <input
          id="popup-title"
          className="input"
          placeholder="Offre spéciale Pessah"
          value={values.popupTitle}
          onChange={(e) => set("popupTitle", e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="popup-text">Description</label>
        <textarea
          id="popup-text"
          rows={3}
          className="input resize-y"
          placeholder="Profitez de -15 % sur tous les séjours réservés avant le 30 avril."
          value={values.popupText}
          onChange={(e) => set("popupText", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="popup-cta-label">Libellé du bouton</label>
          <input
            id="popup-cta-label"
            className="input"
            placeholder="Voir les offres"
            value={values.popupCtaLabel}
            onChange={(e) => set("popupCtaLabel", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="popup-cta-url">Lien du bouton</label>
          <input
            id="popup-cta-url"
            className="input"
            placeholder="/annonces"
            value={values.popupCtaUrl}
            onChange={(e) => set("popupCtaUrl", e.target.value)}
          />
          <p className="mt-1 text-xs text-stone-400">
            Chemin interne (<code>/annonces</code>, la langue est ajoutée
            automatiquement) ou URL complète (<code>https://…</code>). Laissez
            vide pour une popup sans bouton.
          </p>
        </div>
      </div>

      <div className="space-y-4 border-t border-stone-100 pt-5">
        <p className="text-sm text-stone-500">
          Traductions (facultatives) — un champ laissé vide reprend le texte
          français.
        </p>
        {translationBlock("en", "Anglais")}
        {translationBlock("he", "Hébreu", "rtl")}
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
