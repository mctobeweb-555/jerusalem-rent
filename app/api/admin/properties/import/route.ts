import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import { parseCsv } from "@/lib/csv";
import { csvPropertyRowSchema, imageUrlSchema } from "@/lib/validations";
import { slugify, generateReference } from "@/lib/utils";
import { geocode } from "@/lib/geocode";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const runtime = "nodejs";

type RowError = { line: number; message: string };

// POST /api/admin/properties/import — corps = texte CSV. Crée les annonces
// valides, renvoie un rapport (créées + erreurs par ligne).
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!user.agencyId) {
    return NextResponse.json({ error: "Agence manquante" }, { status: 400 });
  }

  // Session valide ? (évite un échec FK si le compte n'existe plus)
  const [ownerExists, agencyExists] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { id: true } }),
    prisma.agency.findUnique({ where: { id: user.agencyId }, select: { id: true } }),
  ]);
  if (!ownerExists || !agencyExists) {
    return NextResponse.json(
      { error: "Session expirée. Reconnectez-vous." },
      { status: 401 },
    );
  }

  const csvText = await req.text();
  if (!csvText.trim()) {
    return NextResponse.json({ error: "Fichier CSV vide" }, { status: 400 });
  }

  let parsed: ReturnType<typeof parseCsv>;
  try {
    parsed = parseCsv(csvText);
  } catch {
    return NextResponse.json({ error: "CSV illisible" }, { status: 400 });
  }

  if (parsed.rows.length === 0) {
    return NextResponse.json(
      { error: "Aucune ligne de données trouvée." },
      { status: 400 },
    );
  }
  if (parsed.rows.length > 500) {
    return NextResponse.json(
      { error: "Maximum 500 lignes par import." },
      { status: 400 },
    );
  }

  const errors: RowError[] = [];
  let created = 0;

  // Unicité slug/reference vérifiée en mémoire contre l'existant chargé une
  // seule fois (au lieu d'un aller-retour Prisma par ligne, potentiellement
  // 1000+ sur un import de 500 lignes) — les deux Set sont mis à jour au fur
  // et à mesure des lignes traitées pour rester cohérents dans le lot.
  const [existingSlugs, existingReferences] = await Promise.all([
    prisma.property.findMany({ select: { slug: true } }),
    prisma.property.findMany({ select: { reference: true } }),
  ]);
  const usedSlugs = new Set(existingSlugs.map((p) => p.slug));
  const usedReferences = new Set(existingReferences.map((p) => p.reference));

  // Lignes sans coordonnées fournies : géocodées après coup, en arrière-plan
  // (throttlé ~1 req/s pour Nominatim), pour ne pas bloquer la réponse HTTP —
  // un import de plusieurs centaines de lignes pouvait auparavant dépasser
  // plusieurs minutes dans une seule requête synchrone.
  const pendingGeocode: { id: string; address: string; postalCode: string; city: string }[] = [];

  for (let i = 0; i < parsed.rows.length; i++) {
    const line = i + 2; // +1 en-tête, +1 pour un numéro « humain »
    const check = csvPropertyRowSchema.safeParse(parsed.rows[i]);
    if (!check.success) {
      const first = check.error.issues[0];
      errors.push({
        line,
        message: `${first.path.join(".") || "ligne"} : ${first.message}`,
      });
      continue;
    }
    const r = check.data;

    // Images : on ne garde que les URLs valides (http(s) ou /uploads/…).
    const images = (r.images ?? "")
      .split(/[;|]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((u) => imageUrlSchema.safeParse(u).success)
      .slice(0, 30)
      .map((url, idx) => ({ url, alt: r.title, order: idx }));

    const features = (r.features ?? "")
      .split(/[;|]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 30);

    const published = /^(true|1|oui|yes|o)$/i.test((r.published ?? "").trim());
    const priceHidden = /^(true|1|oui|yes|o)$/i.test(
      (r.priceHidden ?? "").trim(),
    );

    // Coordonnées : fournies dans le CSV, sinon géocodées après la réponse
    // (voir pendingGeocode plus haut) — l'annonce est créée sans lat/lng dans
    // ce cas, mises à jour dès que le géocodage aboutit.
    const coords: { lat: number | null; lng: number | null } = {
      lat: r.lat ?? null,
      lng: r.lng ?? null,
    };
    const needsGeocode = coords.lat == null || coords.lng == null;

    // Slug unique (en base + dans le lot courant, vérifié en mémoire).
    const base = slugify(`${r.title}-${r.city}`) || "annonce";
    let slug = base;
    let attempt = 0;
    while (usedSlugs.has(slug)) {
      attempt += 1;
      slug = `${base}-${attempt}`;
    }
    usedSlugs.add(slug);

    let reference = generateReference();
    while (usedReferences.has(reference)) {
      reference = generateReference();
    }
    usedReferences.add(reference);

    try {
      const createdProperty = await prisma.property.create({
        data: {
          slug,
          reference,
          title: r.title,
          description: r.description,
          type: r.type,
          status: r.status,
          price: Math.round(r.price * 100), // euros → centimes
          surface: r.surface,
          rooms: r.rooms ?? null,
          bedrooms: r.bedrooms ?? null,
          bathrooms: r.bathrooms ?? null,
          floor: r.floor ?? null,
          maxGuests: r.maxGuests ?? null,
          address: r.address,
          city: r.city,
          postalCode: r.postalCode,
          lat: coords.lat,
          lng: coords.lng,
          features,
          published,
          priceHidden,
          ownerId: user.id,
          agencyId: user.agencyId,
          images: { create: images },
        },
      });
      created += 1;
      if (needsGeocode) {
        pendingGeocode.push({
          id: createdProperty.id,
          address: r.address,
          postalCode: r.postalCode,
          city: r.city,
        });
      }
    } catch {
      errors.push({ line, message: "Erreur d'enregistrement en base." });
    }
  }

  // Fire-and-forget : ne bloque pas la réponse. Le process Node reste en vie
  // (serveur persistant, pas une fonction serverless) le temps de la boucle.
  if (pendingGeocode.length > 0) {
    void geocodePendingInBackground(pendingGeocode);
  }

  return NextResponse.json({
    total: parsed.rows.length,
    created,
    failed: errors.length,
    errors: errors.slice(0, 100),
    geocoding: pendingGeocode.length,
  });
}

// Géocode et enregistre les coordonnées des biens importés sans lat/lng,
// un par un, après que la réponse HTTP a déjà été envoyée à l'admin.
// Best-effort : une adresse introuvable ou une erreur réseau laisse
// simplement lat/lng à null, sans jamais faire échouer l'import lui-même.
async function geocodePendingInBackground(
  rows: { id: string; address: string; postalCode: string; city: string }[],
) {
  for (const row of rows) {
    try {
      const geo = await geocode(row.address, row.postalCode, row.city);
      if (geo) {
        await prisma.property.update({
          where: { id: row.id },
          data: { lat: geo.lat, lng: geo.lng },
        });
      }
    } catch {
      // best-effort — l'annonce reste sans coordonnées, modifiable à la main.
    }
    await sleep(1100);
  }
}
