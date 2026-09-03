// Pagination des listes admin (properties, leads, reviews, newsletter) —
// tables amenées à grossir en continu, pas de findMany() sans limite.
export const ADMIN_PAGE_SIZE = 25;

export type SearchParams = { [key: string]: string | string[] | undefined };

export function parsePage(v: string | string[] | undefined): number {
  const raw = Array.isArray(v) ? v[0] : v;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

// Construit le href d'une page donnée en conservant tous les autres
// paramètres de recherche/filtre déjà présents dans l'URL.
export function pageHref(
  basePath: string,
  searchParams: SearchParams,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page") continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v) params.set(key, v);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
