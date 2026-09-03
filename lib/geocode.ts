// Géocodage d'adresse → coordonnées GPS. Couverture mondiale (Israël, France…).
// Deux fournisseurs (mêmes réponses, format Nominatim) :
//   - LocationIQ si LOCATIONIQ_API_KEY est défini (fiable, 5000 req/jour gratuit)
//   - sinon Nominatim/OpenStreetMap public (gratuit sans clé, mais throttlé :
//     ~1 req/s, à réserver à un usage léger).
// Biais pays via GEOCODE_COUNTRYCODES (ex. "il" ; vide = mondial).
// Best-effort : renvoie null si introuvable, ne bloque jamais l'enregistrement.

function endpoint(): { url: string; key?: string } {
  const key = process.env.LOCATIONIQ_API_KEY?.trim();
  if (key) return { url: "https://us1.locationiq.com/v1/search", key };
  return { url: "https://nominatim.openstreetmap.org/search" };
}

export async function geocode(
  address: string,
  postalCode: string,
  city: string,
): Promise<{ lat: number; lng: number } | null> {
  // On privilégie « rue + ville » : les codes postaux sont mal indexés hors
  // France et dégradent le matching. Le CP reste stocké sur l'annonce.
  const q = [address, city]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(", ");
  const fallback = [address, postalCode, city]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(", ");
  if (!q && !fallback) return null;

  const { url, key } = endpoint();
  const params = new URLSearchParams({ q: q || fallback, format: "json", limit: "1" });
  const cc = process.env.GEOCODE_COUNTRYCODES?.trim();
  if (cc) params.set("countrycodes", cc);
  if (key) params.set("key", key);

  try {
    const res = await fetch(`${url}?${params.toString()}`, {
      headers: {
        "User-Agent": "OxImmo/1.0 (contact@oximmo.fr)",
        "Accept-Language": "he,en,fr",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const f = Array.isArray(data) ? data[0] : null;
    if (f?.lat && f?.lon) {
      const lat = parseFloat(f.lat);
      const lng = parseFloat(f.lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    return null;
  } catch {
    return null;
  }
}

// Renvoie les coordonnées fournies, ou tente un géocodage si l'une manque.
export async function resolveCoordinates(input: {
  lat?: number | null;
  lng?: number | null;
  address: string;
  postalCode: string;
  city: string;
}): Promise<{ lat: number | null; lng: number | null }> {
  if (input.lat != null && input.lng != null) {
    return { lat: input.lat, lng: input.lng };
  }
  const geo = await geocode(input.address, input.postalCode, input.city);
  return { lat: geo?.lat ?? null, lng: geo?.lng ?? null };
}
