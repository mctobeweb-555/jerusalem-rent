import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isLocale } from "@/lib/i18n/config";
import { translateProperty } from "@/lib/i18n/property-translation";

// GET /api/properties/by-ids?ids=a,b,c&locale=en — renvoie les annonces
// publiées correspondant aux ids (favoris stockés côté client), dans l'ordre
// demandé, avec le titre traduit dans la langue demandée (repli FR).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("ids") ?? "";
  const localeParam = url.searchParams.get("locale") ?? "fr";
  const locale = isLocale(localeParam) ? localeParam : "fr";
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);

  if (ids.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const props = await prisma.property.findMany({
    where: { id: { in: ids }, published: true },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      translations: locale === "fr" ? undefined : { where: { locale } },
    },
  });

  // Conserve l'ordre des favoris fourni par le client.
  const byId = new Map(props.map((p) => [p.id, p]));
  const items = ids
    .map((id) => byId.get(id))
    .filter((p): p is (typeof props)[number] => !!p)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: translateProperty(p, locale).title,
      city: p.city,
      postalCode: p.postalCode,
      price: p.price,
      priceHidden: p.priceHidden,
      surface: p.surface,
      rooms: p.rooms,
      bedrooms: p.bedrooms,
      maxGuests: p.maxGuests,
      type: p.type,
      status: p.status,
      images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    }));

  return NextResponse.json({ items });
}
