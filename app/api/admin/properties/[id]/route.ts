import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, canEditProperty } from "@/lib/guards";
import { propertyInputSchema } from "@/lib/validations";
import { resolveCoordinates } from "@/lib/geocode";
import { syncPropertyTranslations } from "@/lib/properties";

type Ctx = { params: { id: string } };

async function loadEditable(id: string) {
  return prisma.property.findUnique({
    where: { id },
    select: { id: true, ownerId: true, agencyId: true },
  });
}

// PUT/PATCH — mise à jour complète d'une annonce (protégé + scoping).
async function update(req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const existing = await loadEditable(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (!canEditProperty(user, existing)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
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

  // Réassignation de l'agent : réservée aux ADMIN, vers un agent de leur agence.
  let ownerReassign: string | undefined;
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
    ownerReassign = agent.id;
  }

  // Coordonnées : fournies, sinon géocodage automatique depuis l'adresse.
  const coords = await resolveCoordinates({
    lat: data.lat,
    lng: data.lng,
    address: data.address,
    postalCode: data.postalCode,
    city: data.city,
  });

  // On remplace intégralement les images (simple et prévisible).
  const updated = await prisma.property.update({
    where: { id: params.id },
    data: {
      ...(ownerReassign ? { ownerId: ownerReassign } : {}),
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
      images: {
        deleteMany: {},
        create: data.images.map((img, i) => ({
          url: img.url,
          alt: img.alt,
          order: img.order ?? i,
        })),
      },
    },
    select: { id: true, slug: true },
  });

  await syncPropertyTranslations(updated.id, data.translations);

  return NextResponse.json(updated);
}

export const PUT = update;
export const PATCH = update;

// DELETE — suppression d'une annonce (protégé + scoping).
export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const existing = await loadEditable(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (!canEditProperty(user, existing)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // onDelete: Cascade sur Image ; les leads passent propertyId à null (SetNull).
  await prisma.property.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
