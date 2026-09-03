import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import { propertyInputSchema } from "@/lib/validations";
import { slugify, generateReference } from "@/lib/utils";
import { resolveCoordinates } from "@/lib/geocode";
import { syncPropertyTranslations } from "@/lib/properties";

// POST /api/admin/properties — créer une annonce (protégé).
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!user.agencyId) {
    return NextResponse.json({ error: "Agence manquante" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = propertyInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Agent responsable : par défaut le créateur ; un ADMIN peut l'assigner à un
  // agent de SON agence.
  let ownerId = user.id;
  if (user.role === "ADMIN" && data.ownerId) {
    const agent = await prisma.user.findFirst({
      where: { id: data.ownerId, agencyId: user.agencyId },
      select: { id: true },
    });
    if (!agent) {
      return NextResponse.json(
        { error: "Agent invalide pour cette agence" },
        { status: 400 },
      );
    }
    ownerId = agent.id;
  }

  // Vérifie que l'agent propriétaire ET l'agence existent réellement (une session
  // périmée, ex. après un reset de la base, pointerait vers des ids supprimés →
  // on renvoie 401 pour forcer une reconnexion, plutôt qu'une erreur 500).
  const [ownerExists, agencyExists] = await Promise.all([
    prisma.user.findUnique({ where: { id: ownerId }, select: { id: true } }),
    prisma.agency.findUnique({ where: { id: user.agencyId }, select: { id: true } }),
  ]);
  if (!ownerExists || !agencyExists) {
    return NextResponse.json(
      { error: "Session expirée ou compte introuvable. Reconnectez-vous." },
      { status: 401 },
    );
  }

  // Coordonnées : fournies, sinon géocodage automatique depuis l'adresse.
  const coords = await resolveCoordinates({
    lat: data.lat,
    lng: data.lng,
    address: data.address,
    postalCode: data.postalCode,
    city: data.city,
  });

  // Slug unique (ajoute un suffixe si collision).
  let slug = slugify(`${data.title}-${data.city}`);
  let attempt = 0;
  while (await prisma.property.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${slugify(`${data.title}-${data.city}`)}-${attempt}`;
  }

  // Référence unique.
  let reference = generateReference();
  while (await prisma.property.findUnique({ where: { reference } })) {
    reference = generateReference();
  }

  const created = await prisma.property.create({
    data: {
      slug,
      reference,
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status,
      price: data.price,
      surface: data.surface,
      rooms: data.rooms ?? null,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      floor: data.floor ?? null,
      maxGuests: data.maxGuests ?? null,
      address: data.address,
      city: data.city,
      neighborhood: data.neighborhood || null,
      postalCode: data.postalCode,
      lat: coords.lat,
      lng: coords.lng,
      features: data.features,
      published: data.published,
      priceHidden: data.priceHidden,
      ownerId,
      agencyId: user.agencyId,
      images: {
        create: data.images.map((img, i) => ({
          url: img.url,
          alt: img.alt,
          order: img.order ?? i,
        })),
      },
    },
    select: { id: true, slug: true },
  });

  await syncPropertyTranslations(created.id, data.translations);

  return NextResponse.json(created, { status: 201 });
}
