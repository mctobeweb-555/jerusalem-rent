// Parseur CSV sans dépendance : gère les champs entre guillemets (avec
// délimiteurs/retours à la ligne internes et guillemets échappés ""), et
// auto-détecte le séparateur ("," ou ";" — Excel FR utilise ";").

function detectDelimiter(headerLine: string): "," | ";" | "\t" {
  const counts: Record<string, number> = {
    ",": (headerLine.match(/,/g) || []).length,
    ";": (headerLine.match(/;/g) || []).length,
    "\t": (headerLine.match(/\t/g) || []).length,
  };
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return (best && best[1] > 0 ? best[0] : ",") as "," | ";" | "\t";
}

export function parseCsv(input: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const text = input.replace(/^﻿/, ""); // retire le BOM éventuel
  const nl = text.indexOf("\n");
  const firstLine = nl >= 0 ? text.slice(0, nl) : text;
  const delim = detectDelimiter(firstLine);

  const records: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      records.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  const headers = (records.shift() ?? []).map((h) => h.trim());
  const rows = records
    .filter((r) => r.some((c) => c.trim() !== "")) // ignore les lignes vides
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = (r[idx] ?? "").trim();
      });
      return obj;
    });

  return { headers, rows };
}

// Caractères qu'Excel/LibreOffice/Google Sheets interprètent comme un début
// de formule (CSV/Formula Injection) si un champ commence par l'un d'eux.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

// Échappe une cellule si elle contient le délimiteur, un guillemet ou un
// retour à la ligne (double les guillemets internes, entoure de guillemets).
// Neutralise aussi l'injection de formule : un lead soumis via le formulaire
// public avec un nom/message du type `=HYPERLINK(...)` s'exécuterait sinon à
// l'ouverture du CSV exporté par l'admin — préfixe d'une apostrophe (convention
// Excel pour forcer le texte), sans altérer la valeur affichée.
function escapeCell(v: string, delimiter: string): string {
  let s = v ?? "";
  if (FORMULA_TRIGGER.test(s)) s = `'${s}`;
  return new RegExp(`["${delimiter}\n]`).test(s)
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

// Génère un CSV (UTF-8 avec BOM pour Excel) à partir de lignes de cellules.
// Délimiteur ";" par défaut (convention Excel FR utilisée dans tout le projet).
export function toCsv(rows: string[][], delimiter = ";"): string {
  const body = rows
    .map((r) => r.map((c) => escapeCell(c, delimiter)).join(delimiter))
    .join("\n");
  return "﻿" + body + "\n"; // BOM (U+FEFF) en tête
}
