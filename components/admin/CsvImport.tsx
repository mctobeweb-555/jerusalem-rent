"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Report = {
  total: number;
  created: number;
  failed: number;
  errors: { line: number; message: string }[];
  geocoding: number;
};

const TEMPLATE_HEADERS = [
  "title",
  "description",
  "type",
  "status",
  "price",
  "surface",
  "rooms",
  "bedrooms",
  "bathrooms",
  "floor",
  "address",
  "city",
  "postalCode",
  "lat",
  "lng",
  "features",
  "images",
  "published",
  "priceHidden",
];

const TEMPLATE_EXAMPLE = [
  "Maison lumineuse avec jardin",
  "Belle maison rénovée, séjour ouvert, quatre chambres et jardin arboré.",
  "HOUSE",
  "FOR_SALE",
  "489000",
  "165",
  "6",
  "4",
  "2",
  "",
  "12 rue des Tilleuls",
  "Nantes",
  "44000",
  "47.2184",
  "-1.5536",
  "jardin|garage|cave",
  "https://picsum.photos/seed/demo1/1200/800|https://picsum.photos/seed/demo2/1200/800",
  "true",
  "false",
];

function csvCell(v: string): string {
  return /[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export default function CsvImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  function downloadTemplate() {
    const csv =
      TEMPLATE_HEADERS.join(";") +
      "\n" +
      TEMPLATE_EXAMPLE.map(csvCell).join(";") +
      "\n";
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-annonces-oximmo.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImport() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/admin/properties/import", {
        method: "POST",
        headers: { "content-type": "text/csv" },
        body: text,
      });
      if (res.status === 401) {
        router.push("/login?callbackUrl=/admin/properties/import");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import impossible");
      setReport(data as Report);
      if (data.created > 0) router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'import");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">1. Préparez votre fichier</h2>
        <p className="text-sm text-stone-500">
          Colonnes attendues (1re ligne = en-têtes) :{" "}
          <code className="text-xs">title, description, type, status, price
          (€), surface, rooms, bedrooms, bathrooms, floor, address, city,
          postalCode, lat, lng, features, images, published, priceHidden</code>.
        </p>
        <ul className="list-inside list-disc text-sm text-stone-500">
          <li><code>type</code> : HOUSE, APARTMENT, LAND ou COMMERCIAL</li>
          <li><code>status</code> : FOR_SALE, FOR_RENT, SHORT_TERM, SOLD ou RENTED</li>
          <li><code>features</code> et <code>images</code> : plusieurs valeurs séparées par <code>|</code> (recommandé, ex. <code>jardin|garage</code>)</li>
          <li><code>published</code> et <code>priceHidden</code> : true / oui / 1 (sinon false)</li>
          <li>Séparateur <code>,</code> ou <code>;</code> (auto-détecté)</li>
        </ul>
        <button type="button" onClick={downloadTemplate} className="btn-outline">
          Télécharger le modèle CSV
        </button>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">2. Importez</h2>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-white hover:file:bg-primary-700"
        />
        <button
          type="button"
          onClick={onImport}
          disabled={!file || busy}
          className="btn-primary"
        >
          {busy ? "Import en cours…" : "Importer les annonces"}
        </button>
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      {report && (
        <section className="card space-y-4 p-6">
          <h2 className="font-semibold">Résultat</h2>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-xl bg-stone-50 px-4 py-3">
              <p className="text-2xl font-bold">{report.total}</p>
              <p className="text-xs text-stone-500">lignes</p>
            </div>
            <div className="rounded-xl bg-primary-50 px-4 py-3">
              <p className="text-2xl font-bold text-primary-700">{report.created}</p>
              <p className="text-xs text-stone-500">créées</p>
            </div>
            <div className="rounded-xl bg-red-50 px-4 py-3">
              <p className="text-2xl font-bold text-red-600">{report.failed}</p>
              <p className="text-xs text-stone-500">en erreur</p>
            </div>
          </div>

          {report.geocoding > 0 && (
            <p className="rounded-lg bg-accent-50 px-4 py-3 text-sm text-accent-700">
              {report.geocoding} bien{report.geocoding > 1 ? "s" : ""} sans coordonnées
              fourni{report.geocoding > 1 ? "es" : "e"} — localisation automatique en
              cours en arrière-plan (~{Math.ceil((report.geocoding * 1.1) / 60)} min),
              rafraîchissez la fiche annonce ou la carte un peu plus tard.
            </p>
          )}

          {report.errors.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-stone-700">Détail des erreurs :</p>
              <ul className="max-h-64 space-y-1 overflow-y-auto text-sm text-red-700">
                {report.errors.map((e, i) => (
                  <li key={i}>Ligne {e.line} — {e.message}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
