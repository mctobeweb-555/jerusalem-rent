import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PropertyCard from "@/components/PropertyCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import ShortTermSearchBar from "@/components/ShortTermSearchBar";
import ReviewStars from "@/components/ReviewStars";
import { HeartIcon, PinIcon, CompassIcon, ComfortIcon, SparkleIcon } from "@/components/icons";
import { reviewStats } from "@/lib/reviews";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, localizedHref, type Locale } from "@/lib/i18n/config";
import { withTranslatedTitle } from "@/lib/i18n/property-translation";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const LOCALES: Locale[] = ["fr", "en", "he"];

// Page dédiée par quartier (SEO) : ne change qu'aux annonces/avis, pas à
// chaque requête.
export const revalidate = 300;

export async function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    NEIGHBORHOODS.map((n) => ({ locale, slug: n.slug })),
  );
}

// Icônes des arguments Jerusalem Rent, dans l'ordre de dict.neighborhoodPage.usp.
const USP_ICONS = [HeartIcon, PinIcon, CompassIcon, ComfortIcon, SparkleIcon];

// Photo de la bannière finale : en attendant un visuel dédié "vie sur place"
// (personnes dans un appartement), on reprend l'intérieur de marque le plus
// chaleureux déjà utilisé sur le site.
const CTA_BANNER_IMAGE = "/brand/hero-jerusalem-2.jpg";

async function getNeighborhoodData(name: string, locale: Locale) {
  const [properties, total, reviews] = await Promise.all([
    prisma.property.findMany({
      where: { published: true, neighborhood: name },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        translations: locale === "fr" ? undefined : { where: { locale } },
      },
    }),
    prisma.property.count({ where: { published: true, neighborhood: name } }),
    prisma.review.findMany({
      where: { published: true, property: { neighborhood: name, published: true } },
      select: { rating: true },
    }),
  ]);
  return { properties, total, stats: reviewStats(reviews) };
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const n = NEIGHBORHOODS.find((x) => x.slug === params.slug);
  if (!n) return {};
  const dict = getDictionary(params.locale);
  const title = dict.meta.neighborhood.title(n.name);
  const description = dict.meta.neighborhood.description(n.name);
  return {
    title,
    description,
    alternates: { canonical: `/${params.locale}/quartiers/${n.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: `${siteUrl}${n.image}` }],
    },
  };
}

export default async function NeighborhoodPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const n = NEIGHBORHOODS.find((x) => x.slug === params.slug);
  if (!n) notFound();

  const dict = getDictionary(locale);
  const href = (path: string) => localizedHref(locale, path);
  const rtl = locale === "he";

  const { properties, total, stats } = await getNeighborhoodData(n.name, locale);
  const items = properties.map((p) => withTranslatedTitle(p, locale));

  const story = n.story ?? {
    eyebrow: { fr: dict.neighborhoodPage.heroEyebrow, en: dict.neighborhoodPage.heroEyebrow, he: dict.neighborhoodPage.heroEyebrow },
    title: { fr: n.name, en: n.name, he: n.name },
    text: {
      fr: dict.neighborhoodPage.storyFallbackText(n.name),
      en: dict.neighborhoodPage.storyFallbackText(n.name),
      he: dict.neighborhoodPage.storyFallbackText(n.name),
    },
  };
  const lifestyle = n.lifestyle ?? {
    eyebrow: {
      fr: dict.neighborhoodPage.lifestyleFallbackEyebrow,
      en: dict.neighborhoodPage.lifestyleFallbackEyebrow,
      he: dict.neighborhoodPage.lifestyleFallbackEyebrow,
    },
    title: {
      fr: dict.neighborhoodPage.lifestyleFallbackTitle,
      en: dict.neighborhoodPage.lifestyleFallbackTitle,
      he: dict.neighborhoodPage.lifestyleFallbackTitle,
    },
    text: {
      fr: dict.neighborhoodPage.lifestyleFallbackText(n.name),
      en: dict.neighborhoodPage.lifestyleFallbackText(n.name),
      he: dict.neighborhoodPage.lifestyleFallbackText(n.name),
    },
  };

  return (
    <>
      {/* Hero plein écran : photo du quartier, nom, slogan. */}
      <section className="relative overflow-hidden text-white">
        <div className="relative h-[60vh] min-h-[420px] w-full sm:h-[70vh]">
          <Image
            src={n.image}
            alt={n.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        </div>
        <div className="container-page absolute inset-0 flex flex-col justify-end pb-14">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-white/80">
            {dict.neighborhoodPage.heroEyebrow}
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-extralight uppercase leading-tight tracking-[0.04em] text-white sm:text-6xl">
            {n.name}
          </h1>
          <p className="mt-5 max-w-xl text-base font-light text-white/85">{n.tagline[locale]}</p>
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-white/70">
            {dict.neighborhoodPage.apartmentsAvailable(total)}
          </p>
        </div>
      </section>

      {/* Bandeau de recherche, quartier pré-sélectionné — même bandeau que la home. */}
      <section className="w-full border-b border-stone-200 bg-white">
        <div className="container-page">
          <ShortTermSearchBar variant="band" defaultNeighborhood={n.name} />
        </div>
      </section>

      {/* Bloc éditorial 1 : histoire / caractère du quartier. */}
      <section className="container-page py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary-600">
            {story.eyebrow[locale]}
          </p>
          <h2 className="mt-3 font-display text-3xl font-light leading-[2.75rem] text-stone-900 sm:text-4xl">
            {story.title[locale]}
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-stone-500 sm:text-base">{story.text[locale]}</p>
        </div>
      </section>

      {/* Carousel des annonces du quartier. */}
      <section className="pb-16 sm:pb-20">
        <div className="container-page text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary-600">
            {dict.neighborhoodPage.listingsEyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl font-light uppercase tracking-[0.1em] text-primary-900">
            {dict.neighborhoodPage.listingsTitle(n.name)}
          </h2>
        </div>

        {items.length === 0 ? (
          <p className="container-page mt-6 text-center text-stone-500">
            {dict.neighborhoodPage.listingsEmpty}
          </p>
        ) : (
          <div className="mt-10">
            <FeaturedCarousel
              items={items.map((p) => ({
                id: p.id,
                card: <PropertyCard property={p} locale={locale} dict={dict} />,
              }))}
              rtl={rtl}
            />
          </div>
        )}
      </section>

      {/* Bloc éditorial 2 : vivre / séjourner dans le quartier. */}
      <section className="bg-stone-50 py-16 sm:py-20">
        <div className="container-page mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary-600">
            {lifestyle.eyebrow[locale]}
          </p>
          <h2 className="mt-3 font-display text-3xl font-light leading-[2.75rem] text-stone-900 sm:text-4xl">
            {lifestyle.title[locale]}
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-stone-500 sm:text-base">{lifestyle.text[locale]}</p>
        </div>
      </section>

      {/* Arguments Jerusalem Rent. */}
      <section className="container-page py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary-600">
            {dict.neighborhoodPage.uspEyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl font-light uppercase tracking-[0.1em] text-primary-900">
            {dict.neighborhoodPage.uspTitle}
          </h2>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {dict.neighborhoodPage.usp.map((item, i) => {
            const Icon = USP_ICONS[i % USP_ICONS.length];
            return (
              <div key={item.title} className="text-center sm:text-start">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-primary-200 text-primary-700 sm:mx-0">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-base font-light uppercase tracking-[0.08em] text-stone-900">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bannière finale : photo + logo + accroche + CTA + avis. */}
      <section className="relative overflow-hidden text-white">
        <div className="relative min-h-[420px] w-full sm:min-h-[480px]">
          <Image
            src={CTA_BANNER_IMAGE}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>
        <div className="container-page absolute inset-0 flex flex-col items-center justify-center text-center">
          <Image src="/brand/logo.png" alt="Jerusalem Rent" width={220} height={53} className="h-12 w-auto brightness-0 invert sm:h-14" />
          <p className="mt-8 text-xs font-medium uppercase tracking-[0.25em] text-white/80">
            {dict.neighborhoodPage.ctaEyebrow}
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-extralight uppercase tracking-[0.04em] text-white sm:text-4xl">
            {dict.neighborhoodPage.ctaTitlePrefix}
            {n.name}
          </h2>
          <p className="mt-4 max-w-md text-sm font-light text-white/85">{dict.neighborhoodPage.ctaText}</p>

          {stats && (
            <div className="mt-5 flex items-center gap-2">
              <ReviewStars rating={stats.average} />
              <span className="text-xs text-white/80">{dict.property.reviewsCount(stats.average, stats.count)}</span>
            </div>
          )}

          <Link
            href={href(`/annonces?neighborhood=${encodeURIComponent(n.name)}`)}
            className="btn-primary mt-8 rounded-none px-8 py-3 text-xs uppercase tracking-[0.15em]"
          >
            {dict.neighborhoodPage.ctaButton}
          </Link>
        </div>
      </section>
    </>
  );
}
