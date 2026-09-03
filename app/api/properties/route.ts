import { NextResponse } from "next/server";
import { propertySearchSchema } from "@/lib/validations";
import { searchProperties } from "@/lib/properties";
import { formatPrice } from "@/lib/utils";

// GET /api/properties — recherche publique validée par Zod (.strict()).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw: Record<string, string> = {};
  for (const [k, v] of url.searchParams.entries()) {
    if (v !== "") raw[k] = v;
  }

  const parsed = propertySearchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await searchProperties(parsed.data);

  const payload = {
    page: result.page,
    perPage: result.perPage,
    total: result.total,
    totalPages: result.totalPages,
    items: result.items.map((p) => ({
      id: p.id,
      slug: p.slug,
      reference: p.reference,
      title: p.title,
      type: p.type,
      status: p.status,
      priceHidden: p.priceHidden,
      priceCents: p.priceHidden ? null : p.price,
      priceLabel: p.priceHidden ? null : formatPrice(p.price),
      surface: p.surface,
      rooms: p.rooms,
      city: p.city,
      postalCode: p.postalCode,
      image: p.images[0]?.url ?? null,
    })),
  };

  return NextResponse.json(payload, {
    headers: {
      // Cache CDN : réponse fraîche 60 s, servie en stale-while-revalidate.
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
