import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { PropertySearch } from "@/lib/validations";
import type { Locale } from "@/lib/i18n/config";

// Inclut la traduction de la langue courante (fr = pas de table, rien à inclure).
function translationInclude(locale: Locale) {
  return locale === "fr" ? undefined : { where: { locale } };
}

type TranslationInput =
  | { title?: string; description?: string; features?: string[] }
  | undefined;

/**
 * Synchronise les traductions EN/HE d'une annonce (admin) : upsert si
 * titre+description renseignés, suppression sinon (repli sur le FR).
 * Les équipements traduits sont optionnels même quand titre+description le
 * sont : vide/absent = repli sur les équipements FR (Property.features).
 */
export async function syncPropertyTranslations(
  propertyId: string,
  translations: { en?: TranslationInput; he?: TranslationInput } | undefined,
) {
  const entries: [string, TranslationInput][] = [
    ["en", translations?.en],
    ["he", translations?.he],
  ];
  for (const [locale, t] of entries) {
    const title = t?.title?.trim();
    const description = t?.description?.trim();
    const features = t?.features && t.features.length > 0 ? t.features : undefined;
    if (title && description) {
      await prisma.propertyTranslation.upsert({
        where: { propertyId_locale: { propertyId, locale } },
        update: { title, description, features: features ?? Prisma.JsonNull },
        create: { propertyId, locale, title, description, features },
      });
    } else {
      await prisma.propertyTranslation.deleteMany({ where: { propertyId, locale } });
    }
  }
}

// Construit le filtre Prisma à partir des critères de recherche validés.
export function buildPropertyWhere(
  search: PropertySearch,
): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = { published: true };

  if (search.q) {
    where.OR = [
      { title: { contains: search.q, mode: "insensitive" } },
      { description: { contains: search.q, mode: "insensitive" } },
      { city: { contains: search.q, mode: "insensitive" } },
      { address: { contains: search.q, mode: "insensitive" } },
      { neighborhood: { contains: search.q, mode: "insensitive" } },
    ];
  }
  if (search.city) where.city = { contains: search.city, mode: "insensitive" };
  if (search.neighborhood) where.neighborhood = search.neighborhood;
  if (search.type) where.type = search.type;
  if (search.status) where.status = search.status;

  if (search.priceMin != null || search.priceMax != null) {
    where.price = {};
    if (search.priceMin != null) where.price.gte = search.priceMin;
    if (search.priceMax != null) where.price.lte = search.priceMax;
  }
  if (search.surfaceMin != null) where.surface = { gte: search.surfaceMin };
  if (search.roomsMin != null) where.rooms = { gte: search.roomsMin };
  if (search.guests != null) where.maxGuests = { gte: search.guests };
  if (search.agent) where.owner = { slug: search.agent };

  // Bounding box carte : ne garde que les biens géolocalisés dans la zone.
  // (les lat/lng null n'étant pas comparables, ils sont naturellement exclus)
  if (search.latMin != null && search.latMax != null) {
    where.lat = { gte: search.latMin, lte: search.latMax };
  }
  if (search.lngMin != null && search.lngMax != null) {
    where.lng = { gte: search.lngMin, lte: search.lngMax };
  }

  return where;
}

// Recherche paginée d'annonces publiées.
const SORT_ORDER: Record<
  PropertySearch["sort"],
  Prisma.PropertyOrderByWithRelationInput
> = {
  recent: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  surface_desc: { surface: "desc" },
  surface_asc: { surface: "asc" },
};

export async function searchProperties(search: PropertySearch, locale: Locale = "fr") {
  const where = buildPropertyWhere(search);
  const skip = (search.page - 1) * search.perPage;

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: SORT_ORDER[search.sort] ?? { createdAt: "desc" },
      skip,
      take: search.perPage,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        translations: translationInclude(locale),
      },
    }),
    prisma.property.count({ where }),
  ]);

  return {
    items,
    total,
    page: search.page,
    perPage: search.perPage,
    totalPages: Math.max(1, Math.ceil(total / search.perPage)),
  };
}

// Plafond des marqueurs carte — indépendant de la pagination de la liste,
// mais borné pour ne pas charger un catalogue entier si celui-ci grossit
// beaucoup (largement suffisant pour toute taille de catalogue actuelle).
const MAX_MAP_MARKERS = 500;

// Biens correspondant aux mêmes critères que searchProperties, pour la carte
// — tous les résultats filtrés (pas seulement la page courante affichée en
// liste), afin que "X biens localisés sur la carte" corresponde au total
// affiché au-dessus, pagination ou non.
export async function searchPropertyMarkers(search: PropertySearch, locale: Locale = "fr") {
  const where = buildPropertyWhere(search);
  return prisma.property.findMany({
    where,
    orderBy: SORT_ORDER[search.sort] ?? { createdAt: "desc" },
    take: MAX_MAP_MARKERS,
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      priceHidden: true,
      status: true,
      city: true,
      lat: true,
      lng: true,
      surface: true,
      rooms: true,
      bedrooms: true,
      maxGuests: true,
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
      reviews: { where: { published: true }, select: { rating: true } },
      translations: translationInclude(locale),
    },
  });
}

type SimilarSource = {
  id: string;
  type: Prisma.PropertyGetPayload<object>["type"];
  status: Prisma.PropertyGetPayload<object>["status"];
  price: number;
  city: string;
};

// Famille de statuts d'une annonce : on ne recommande jamais hors catégorie
// (une vente ne recommande pas une location ni du court terme, etc.).
function statusFamily(status: string): string[] {
  if (status === "SHORT_TERM") return ["SHORT_TERM"];
  if (status === "FOR_RENT" || status === "RENTED") return ["FOR_RENT", "RENTED"];
  return ["FOR_SALE", "SOLD"];
}

/**
 * Recommande jusqu'à `take` biens similaires à `property`, TOUJOURS dans la même
 * famille de statuts (vente / location / court terme). Priorité au même type,
 * puis proximité de prix et même ville.
 */
export async function getSimilarProperties(
  property: SimilarSource,
  take = 3,
  locale: Locale = "fr",
) {
  const baseSelect = {
    orderBy: { createdAt: "desc" as const },
    include: {
      images: { orderBy: { order: "asc" as const }, take: 1 },
      translations: translationInclude(locale),
    },
  };
  const family = statusFamily(property.status);

  // 1er cercle : même type, dans la famille de statuts.
  let candidates = await prisma.property.findMany({
    where: {
      published: true,
      id: { not: property.id },
      type: property.type,
      status: { in: family as never },
    },
    take: 24,
    ...baseSelect,
  });

  // Élargissement : même famille de statuts, tout type.
  if (candidates.length < take) {
    const more = await prisma.property.findMany({
      where: {
        published: true,
        id: { not: property.id },
        type: { not: property.type },
        status: { in: family as never },
      },
      take: 24,
      ...baseSelect,
    });
    candidates = [...candidates, ...more];
  }

  // Score : proximité de prix (0..1) + bonus même ville.
  const scored = candidates
    .map((c) => {
      const priceGap =
        Math.abs(c.price - property.price) / Math.max(property.price, 1);
      const sameCity = c.city === property.city ? -0.5 : 0;
      return { c, score: priceGap + sameCity };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, take)
    .map((s) => s.c);

  return scored;
}
