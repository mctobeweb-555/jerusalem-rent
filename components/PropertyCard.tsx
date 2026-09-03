import Image from "next/image";
import Link from "next/link";
import type { Property, Image as PropImage } from "@prisma/client";
import FavoriteButton from "@/components/FavoriteButton";
import { formatPrice, formatSurface, cn } from "@/lib/utils";
import { localizedHref, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type CardProperty = Pick<
  Property,
  "id" | "slug" | "title" | "city" | "postalCode" | "price" | "surface" | "rooms" | "bedrooms" | "maxGuests" | "type" | "status"
> & { priceHidden?: boolean; images: Pick<PropImage, "url" | "alt">[] };

const statusStyles: Record<string, string> = {
  FOR_SALE: "bg-primary-100 text-primary-700",
  FOR_RENT: "bg-accent-100 text-accent-700",
  SOLD: "bg-stone-200 text-stone-600",
  RENTED: "bg-stone-200 text-stone-600",
};

export default function PropertyCard({
  property,
  locale,
  dict,
}: {
  property: CardProperty;
  locale: Locale;
  dict: Dictionary;
}) {
  const cover = property.images[0];
  const isRent = property.status === "FOR_RENT" || property.status === "RENTED";
  const isShortTerm = property.status === "SHORT_TERM";
  const priceUnit = isShortTerm ? dict.property.perNight : isRent ? dict.property.perMonth : "";

  return (
    // Conteneur relatif : le lien couvre la carte en overlay, le bouton favori
    // reste cliquable au-dessus (évite un <button> imbriqué dans un <a>).
    <div className="card group relative overflow-hidden transition hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-stone-400">
            {dict.common.noPhoto}
          </div>
        )}
        <span
          className={cn(
            "badge absolute start-3 top-3 z-[2] shadow-sm",
            statusStyles[property.status] ?? "bg-stone-200 text-stone-600",
          )}
        >
          {dict.property.statuses[property.status as keyof Dictionary["property"]["statuses"]]}
        </span>

        <FavoriteButton
          propertyId={property.id}
          className="absolute end-3 top-3 z-[2]"
        />
      </div>

      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
          {dict.property.types[property.type as keyof Dictionary["property"]["types"]]}
        </p>
        <h3 className="mt-1 line-clamp-1 text-base font-light text-stone-900">
          {property.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-sm text-stone-500">
          {property.city} ({property.postalCode})
        </p>

        <div className="mt-3 flex items-center justify-between">
          <p className="font-display text-base font-medium text-primary-700">
            {property.priceHidden ? (
              dict.property.priceOnRequest
            ) : (
              <>
                {formatPrice(property.price)}
                {priceUnit && (
                  <span className="text-xs font-normal text-stone-400">{priceUnit}</span>
                )}
              </>
            )}
          </p>
          <p className="text-sm text-stone-500">
            {isShortTerm
              ? [
                  formatSurface(property.surface),
                  property.bedrooms != null ? `${property.bedrooms} ${dict.property.specs.bedroomsShort}` : null,
                  property.maxGuests != null ? `${property.maxGuests} ${dict.property.specs.guestsShort}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : [
                  formatSurface(property.surface),
                  property.rooms ? `${property.rooms} ${dict.property.specs.roomsShort}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
        </div>
      </div>

      {/* Lien couvrant toute la carte (sous le bouton favori). */}
      <Link
        href={localizedHref(locale, `/annonces/${property.slug}`)}
        className="absolute inset-0 z-[1]"
        aria-label={property.title}
      />
    </div>
  );
}
