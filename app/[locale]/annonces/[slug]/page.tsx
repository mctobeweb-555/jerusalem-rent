import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Gallery from "@/components/Gallery";
import ContactForm from "@/components/ContactForm";
import ReservationForm from "@/components/ReservationForm";
import ShareButtons from "@/components/ShareButtons";
import FavoriteButton from "@/components/FavoriteButton";
import PrintButton from "@/components/PrintButton";
import AgentCard from "@/components/AgentCard";
import PropertyCard from "@/components/PropertyCard";
import LocationMapView from "@/components/map/LocationMapView";
import ViewTracker from "@/components/ViewTracker";
import ReviewCard from "@/components/ReviewCard";
import ReviewStars from "@/components/ReviewStars";
import { getSimilarProperties } from "@/lib/properties";
import { reviewStats } from "@/lib/reviews";
import { formatPrice, formatSurface, truncate } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, localizedHref, type Locale } from "@/lib/i18n/config";
import { translateProperty, translateFeatures, withTranslatedTitle } from "@/lib/i18n/property-translation";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ISR : la fiche ne change qu'à l'édition admin, pas à chaque requête.
export const revalidate = 300;

// Pré-génère les fiches des biens publiés au build ; toute nouvelle
// annonce/locale non couverte ici est rendue à la demande puis mise en cache
// (fallback "blocking" par défaut de generateStaticParams).
export async function generateStaticParams() {
  const properties = await prisma.property.findMany({
    where: { published: true },
    select: { slug: true },
  });
  const locales: Locale[] = ["fr", "en", "he"];
  return locales.flatMap((locale) =>
    properties.map((p) => ({ locale, slug: p.slug })),
  );
}

async function getProperty(slug: string, locale: Locale) {
  return prisma.property.findFirst({
    where: { slug, published: true },
    include: {
      images: { orderBy: { order: "asc" } },
      reviews: { where: { published: true }, orderBy: { createdAt: "desc" } },
      translations: locale === "fr" ? undefined : { where: { locale } },
      agency: true,
      owner: {
        select: {
          slug: true,
          name: true,
          email: true,
          phone: true,
          title: true,
          avatarUrl: true,
          languages: true,
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const property = await getProperty(params.slug, params.locale);
  if (!property) return { title: "Not found" };

  const { title, description } = translateProperty(property, params.locale);
  const cover = property.images[0]?.url;
  return {
    title,
    description: truncate(description ?? "", 155),
    alternates: { canonical: `/${params.locale}/annonces/${property.slug}` },
    openGraph: {
      title,
      description: truncate(description ?? "", 155),
      type: "article",
      images: cover ? [{ url: cover }] : undefined,
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDictionary(locale);
  const href = (path: string) => localizedHref(locale, path);

  const property = await getProperty(params.slug, locale);
  if (!property) notFound();
  const { title, description } = translateProperty(property, locale);

  const similar = await getSimilarProperties(property, 3, locale);

  const isRent =
    property.status === "FOR_RENT" || property.status === "RENTED";
  const isShortTerm = property.status === "SHORT_TERM";
  const priceUnit = isShortTerm ? dict.property.perNight : isRent ? dict.property.perMonth : "";
  const features = translateFeatures(property, locale);

  const specs: { label: string; value: string }[] = [
    { label: dict.property.specs.type, value: dict.property.types[property.type] },
    { label: dict.property.specs.surface, value: formatSurface(property.surface) },
    ...(isShortTerm && property.maxGuests != null
      ? [{ label: dict.property.specs.capacity, value: `${property.maxGuests} ${dict.property.specs.capacityUnit}` }]
      : []),
    ...(property.rooms != null
      ? [{ label: dict.property.specs.rooms, value: String(property.rooms) }]
      : []),
    ...(property.bedrooms != null
      ? [{ label: dict.property.specs.bedrooms, value: String(property.bedrooms) }]
      : []),
    ...(property.bathrooms != null
      ? [{ label: dict.property.specs.bathrooms, value: String(property.bathrooms) }]
      : []),
    ...(property.floor != null
      ? [{ label: dict.property.specs.floor, value: String(property.floor) }]
      : []),
    { label: dict.property.specs.city, value: `${property.city} (${property.postalCode})` },
    { label: dict.property.specs.reference, value: property.reference },
  ];

  // JSON-LD RealEstateListing (SEO / rich results). Le prix est omis si masqué.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: title,
    description: truncate(description ?? "", 300),
    url: `${siteUrl}/${locale}/annonces/${property.slug}`,
    image: property.images.map((i) => i.url),
    datePosted: property.createdAt.toISOString(),
    ...(property.priceHidden
      ? {}
      : {
          offers: {
            "@type": "Offer",
            price: (property.price / 100).toFixed(2),
            priceCurrency: "EUR",
            availability: isRent
              ? "https://schema.org/InStock"
              : "https://schema.org/InStock",
          },
        }),
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city,
      postalCode: property.postalCode,
      addressCountry: "IL",
    },
  };

  return (
    <div className="container-page py-8">
      <script
        type="application/ld+json"
        // JSON.stringify n'échappe pas "<" : un titre/adresse contenant
        // "</script><script>..." (saisi par un ADMIN ou un AGENT) casserait
        // le contexte JSON-LD et injecterait du JS exécuté pour tout visiteur
        // public de la fiche. < neutralise ce vecteur sans changer la
        // valeur JSON décodée par les moteurs de recherche.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ViewTracker propertyId={property.id} />

      {/* Fil d'ariane */}
      <nav aria-label={dict.property.breadcrumbHome} className="mb-5 text-sm text-stone-500 no-print">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={href("/")} className="hover:text-primary-600">{dict.property.breadcrumbHome}</Link>
          </li>
          <li aria-hidden>›</li>
          <li>
            <Link href={href("/annonces")} className="hover:text-primary-600">{dict.property.breadcrumbListings}</Link>
          </li>
          <li aria-hidden>›</li>
          <li className="text-stone-700">{truncate(title, 50)}</li>
        </ol>
      </nav>

      <Gallery
        images={property.images.map((i) => ({ url: i.url, alt: i.alt }))}
      />

      <div className="print-single-col mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Contenu principal */}
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary-600">
            {dict.property.statuses[property.status]} · {dict.property.types[property.type]}
          </p>

          <h1 className="mt-3 font-display text-4xl font-light tracking-wide text-stone-900">{title}</h1>
          <p className="mt-2 text-stone-500">
            {property.address}, {property.city} ({property.postalCode})
          </p>

          <p className="mt-5 font-display text-3xl font-light text-primary-700">
            {property.priceHidden ? (
              dict.property.priceOnRequest
            ) : (
              <>
                {formatPrice(property.price)}
                {priceUnit && (
                  <span className="text-lg font-normal text-stone-400">{priceUnit}</span>
                )}
              </>
            )}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 no-print">
            <FavoriteButton propertyId={property.id} variant="button" />
            <PrintButton />
            <ShareButtons
              url={`${siteUrl}/${locale}/annonces/${property.slug}`}
              title={title}
            />
          </div>

          {/* Caractéristiques */}
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-stone-200 pt-8 sm:grid-cols-3">
            {specs.map((s) => (
              <div key={s.label}>
                <dt className="text-xs uppercase tracking-wide text-stone-400">
                  {s.label}
                </dt>
                <dd className="mt-0.5 font-medium text-stone-900">{s.value}</dd>
              </div>
            ))}
          </dl>

          {/* Description */}
          <div className="mt-10 border-t border-stone-200 pt-8">
            <h2 className="text-lg font-light uppercase tracking-[0.1em] text-stone-900">
              {dict.property.description}
            </h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-stone-600">
              {description}
            </p>
          </div>

          {/* Équipements */}
          {features.length > 0 && (
            <div className="mt-10 border-t border-stone-200 pt-8">
              <h2 className="text-lg font-light uppercase tracking-[0.1em] text-stone-900">
                {dict.property.amenities}
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {features.map((f) => (
                  <li
                    key={f}
                    className="border border-stone-200 px-3 py-1 text-xs capitalize tracking-wide text-stone-600"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Localisation */}
          {property.lat != null && property.lng != null && (
            <div className="mt-10 border-t border-stone-200 pt-8">
              <h2 className="text-lg font-light uppercase tracking-[0.1em] text-stone-900">
                {dict.property.location}
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                {property.city} ({property.postalCode}) — {dict.property.locationApprox}
              </p>
              <div className="mt-4 no-print">
                <LocationMapView
                  lat={property.lat}
                  lng={property.lng}
                  label={title}
                  loadingText={dict.map.loading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar contact sticky */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {property.owner && (
            <AgentCard
              agent={{
                ...property.owner,
                languages: Array.isArray(property.owner.languages)
                  ? (property.owner.languages as string[])
                  : [],
              }}
              locale={locale}
              dict={dict.agentCard}
            />
          )}
          <div className="no-print">
            {property.status === "SHORT_TERM" ? (
              <Suspense fallback={null}>
                <ReservationForm
                  propertyId={property.id}
                  propertyTitle={title}
                  maxGuests={property.maxGuests}
                />
              </Suspense>
            ) : (
              <ContactForm
                propertyId={property.id}
                propertyTitle={title}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Avis clients */}
      {property.reviews.length > 0 && (
        <section className="mt-16 border-t border-stone-200 pt-10 no-print">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-light uppercase tracking-[0.15em] text-primary-900">
              {dict.property.reviewsHeading}
            </h2>
            {(() => {
              const stats = reviewStats(property.reviews);
              if (!stats) return null;
              return (
                <span className="flex items-center gap-1.5 text-sm text-stone-500">
                  <ReviewStars rating={stats.average} />
                  {dict.property.reviewsCount(stats.average, stats.count)}
                </span>
              );
            })()}
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {property.reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </section>
      )}

      {/* Biens similaires recommandés */}
      {similar.length > 0 && (
        <section className="mt-16 border-t border-stone-200 pt-10 no-print">
          <h2 className="text-2xl font-light uppercase tracking-[0.15em] text-primary-900">
            {dict.property.similar}
          </h2>
          <p className="mt-1 text-stone-500">{dict.property.similarDesc}</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <PropertyCard
                key={p.id}
                property={withTranslatedTitle(p, locale)}
                locale={locale}
                dict={dict}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
