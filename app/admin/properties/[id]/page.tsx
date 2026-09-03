import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  getSessionUser,
  canEditProperty,
  listAssignableAgents,
} from "@/lib/guards";
import PropertyForm, {
  type PropertyFormValues,
} from "@/components/admin/PropertyForm";

export const dynamic = "force-dynamic";

type TranslationRow = { title: string; description: string; features: unknown } | undefined;

function translationValues(t: TranslationRow) {
  const features = Array.isArray(t?.features) ? (t!.features as string[]) : [];
  return {
    title: t?.title ?? "",
    description: t?.description ?? "",
    features: features.join(", "),
  };
}

export default async function EditPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { order: "asc" } }, translations: true },
  });

  if (!property) notFound();
  if (!canEditProperty(user, property)) notFound();

  const agents = await listAssignableAgents(user);

  const features = Array.isArray(property.features)
    ? (property.features as string[])
    : [];

  const initial: PropertyFormValues = {
    title: property.title,
    description: property.description,
    type: property.type,
    status: property.status,
    priceEuros: String(property.price / 100),
    surface: String(property.surface),
    rooms: property.rooms != null ? String(property.rooms) : "",
    bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
    bathrooms: property.bathrooms != null ? String(property.bathrooms) : "",
    floor: property.floor != null ? String(property.floor) : "",
    maxGuests: property.maxGuests != null ? String(property.maxGuests) : "",
    address: property.address,
    city: property.city,
    neighborhood: property.neighborhood ?? "",
    postalCode: property.postalCode,
    lat: property.lat != null ? String(property.lat) : "",
    lng: property.lng != null ? String(property.lng) : "",
    features: features.join(", "),
    images:
      property.images.length > 0
        ? property.images.map((i) => ({ url: i.url, alt: i.alt }))
        : [{ url: "", alt: "" }],
    published: property.published,
    priceHidden: property.priceHidden,
    ownerId: property.ownerId ?? "",
    translations: {
      en: translationValues(property.translations.find((t) => t.locale === "en")),
      he: translationValues(property.translations.find((t) => t.locale === "he")),
    },
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/properties" className="text-sm text-stone-500 hover:text-primary-600">
          ← Retour aux annonces
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Modifier l'annonce</h1>
        <p className="mt-1 text-sm text-stone-400">Réf. {property.reference}</p>
      </div>
      <PropertyForm
        initial={initial}
        propertyId={property.id}
        agents={agents}
        canAssign={user.role === "ADMIN"}
      />
    </div>
  );
}
