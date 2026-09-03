"use client";

import { useState } from "react";

// Bouton d'upload d'image(s). Envoie chaque fichier à /api/admin/upload et
// remonte l'URL obtenue via onUploaded (appelé une fois par fichier).
export default function ImageUpload({
  onUploaded,
  label = "Uploader une photo",
  multiple = false,
}: {
  onUploaded: (url: string) => void;
  label?: string;
  multiple?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadOne(file: File): Promise<boolean> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Upload échoué");
      return false;
    }
    const { url } = (await res.json()) as { url: string };
    onUploaded(url);
    return true;
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    setError(null);

    let done = 0;
    for (const file of files) {
      done += 1;
      if (files.length > 1) setProgress(`Envoi ${done}/${files.length}…`);
      // Séquentiel : évite de saturer et garde un ordre d'ajout stable.
      // eslint-disable-next-line no-await-in-loop
      await uploadOne(file);
    }

    setBusy(false);
    setProgress(null);
    e.target.value = ""; // permet de re-sélectionner les mêmes fichiers
  }

  return (
    <div>
      <label className="btn-outline cursor-pointer px-3 py-2 text-xs">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          multiple={multiple}
          onChange={onChange}
          disabled={busy}
        />
        {busy ? (progress ?? "Envoi…") : label}
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
