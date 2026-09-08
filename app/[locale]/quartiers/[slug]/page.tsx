import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PropertyCard from "@/components/PropertyCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import ShortTermSearchBar from "@/components/ShortTermSearchBar";
import ReviewStars from "@/components/ReviewStars";
import { ArrowRightIcon, ArrowLeftIcon } from "@/components/icons";
import { reviewStats } from "@/lib/reviews";
import { getWhatsappConfig } from "@/lib/site-settings";
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

// Visuels des arguments — un par entrée de dict.neighborhoodPage.usp, dans le
// même ordre. Tous fournis par le client (public/brand/usp/) : scènes de vie
// (Chabbat, terrasse, équipe) et photos réelles de jerusalem-rent.com
// (emplacement = Kikar Hamusica à Nahalat Shiva, confort = salon MBH).
const USP_IMAGES = [
  "/brand/usp/chabbat.jpg",
  "/brand/usp/emplacement.jpg",
  "/brand/usp/confort-hotelier.jpg",
  "/brand/usp/terrasses.jpg",
  "/brand/usp/equipe.jpg",
  "/brand/usp/proprete.jpg",
];

// Bannière finale : visuel "de vie" fourni par le client (famille à
// l'arrivée, valises à la main) — répond à la demande initiale d'une photo
// avec des personnes plutôt qu'un intérieur vide.
const CTA_BANNER_IMAGE = "/brand/arrivee-famille.jpg";

async function getNeighborhoodData(name: string, locale: Locale) {
  const [properties, total] = await Promise.all([
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
  ]);
  return { properties, total };
}

// Avis tous quartiers confondus — la bannière finale parle de la marque
// Jerusalem Rent, pas du quartier (cf. retour utilisateur).
async function getSiteReviewStats() {
  const reviews = await prisma.review.findMany({
    where: { published: true, property: { published: true } },
    select: { rating: true },
  });
  return reviewStats(reviews);
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

// Bloc éditorial centré : surtitre fin doré, grand titre très léger, texte
// en mesure étroite. Beaucoup d'air autour — c'est ce rapport
// titre/blanc/texte qui donne le rendu « magazine » des sites de référence.
function Editorial({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mx-auto max-w-[46rem] text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-accent-700">
        {eyebrow}
      </p>
      <h2 className="mt-6 font-display text-4xl font-extralight leading-[1.12] text-stone-900 sm:text-5xl lg:text-[3.5rem]">
        {title}
      </h2>
      <p className="mt-8 text-base leading-[1.9] text-stone-500 sm:text-lg">{text}</p>
    </div>
  );
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
  const Arrow = rtl ? ArrowLeftIcon : ArrowRightIcon;

  const [{ properties, total }, stats, whatsapp] = await Promise.all([
    getNeighborhoodData(n.name, locale),
    getSiteReviewStats(),
    getWhatsappConfig(),
  ]);
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
      {/* Hero plein écran : photo du quartier, nom, slogan, nb d'appartements. */}
      <section className="relative overflow-hidden text-white">
        <div className="relative h-[68vh] min-h-[460px] w-full sm:h-[78vh]">
          <Image
            src={n.image}
            alt={n.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
        </div>
        <div className="container-page absolute inset-0 flex flex-col justify-end pb-16 sm:pb-20">
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.35em] text-white/75">
            {dict.neighborhoodPage.heroEyebrow}
          </p>
          <h1 className="max-w-4xl font-display text-5xl font-extralight uppercase leading-[1.05] tracking-[0.03em] text-white sm:text-7xl">
            {n.name}
          </h1>
          <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-white/85 sm:text-lg">
            {n.tagline[locale]}
          </p>
          <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.25em] text-white/65">
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
      <section className="container-page py-14 sm:py-20">
        <Editorial
          eyebrow={story.eyebrow[locale]}
          title={story.title[locale]}
          text={story.text[locale]}
        />
      </section>

      {/* Carousel des annonces du quartier. */}
      <section className="pb-14 sm:pb-20">
        <div className="container-page text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-accent-700">
            {dict.neighborhoodPage.listingsEyebrow}
          </p>
          <h2 className="mt-6 font-display text-4xl font-extralight leading-[1.12] text-stone-900 sm:text-5xl">
            {dict.neighborhoodPage.listingsTitle(n.name)}
          </h2>
        </div>

        {items.length === 0 ? (
          <p className="container-page mt-8 text-center text-stone-500">
            {dict.neighborhoodPage.listingsEmpty}
          </p>
        ) : (
          <div className="mt-14">
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
      <section className="bg-stone-50 py-14 sm:py-20">
        <div className="container-page">
          <Editorial
            eyebrow={lifestyle.eyebrow[locale]}
            title={lifestyle.title[locale]}
            text={lifestyle.text[locale]}
          />
        </div>
      </section>

      {/* Réservation directe par WhatsApp — même bandeau que la home. */}
      {whatsapp && (
        <section className="py-12">
          <div className="container-page">
            <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 bg-primary-600 px-6 py-6 sm:flex-row sm:gap-8 sm:px-10">
              <p className="text-center text-sm text-white/90 sm:text-start">
                {dict.home.whatsappCtaText}
              </p>
              <a
                href={`https://wa.me/${whatsapp.number.replace(/\D/g, "")}?text=${encodeURIComponent(whatsapp.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn shrink-0 border-white/50 px-5 py-2 text-xs uppercase tracking-[0.15em] text-white hover:bg-white hover:text-primary-700"
              >
                {dict.home.whatsappCtaButton}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Arguments Jerusalem Rent, en cartes visuelles : image + pastille de
          marque, puis panneau blanc en débord sur la photo (motif repris de
          la référence fournie par le client). */}
      <section className="container-page py-14 sm:py-20">
        <div className="mx-auto max-w-[46rem] text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-accent-700">
            {dict.neighborhoodPage.uspEyebrow}
          </p>
          <h2 className="mt-6 font-display text-4xl font-extralight leading-[1.12] text-stone-900 sm:text-5xl">
            {dict.neighborhoodPage.uspTitle}
          </h2>
        </div>

        <div className="mt-16 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:gap-x-12">
          {dict.neighborhoodPage.usp.map((item, i) => (
            <article key={item.title} className="group">
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                <Image
                  src={USP_IMAGES[i % USP_IMAGES.length]}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 45vw, 100vw"
                  className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                />
                <span className="absolute start-0 top-0 m-5 bg-primary-600 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white">
                  Jerusalem Rent
                </span>
              </div>
              <div className="relative z-10 -mt-14 me-auto w-[88%] bg-white p-7 sm:p-9">
                <h3 className="font-display text-2xl font-light leading-snug text-stone-900 sm:text-[1.7rem]">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-[1.85] text-stone-500">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Bannière finale : marque Jerusalem Rent (pas le quartier — demande
          explicite utilisateur), avis tous quartiers confondus, CTA vers
          toutes les annonces. */}
      <section className="relative overflow-hidden text-white">
        <div className="relative min-h-[560px] w-full sm:min-h-[620px]">
          <Image src={CTA_BANNER_IMAGE} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/25" />
          <div
            className={`absolute inset-0 ${
              rtl
                ? "bg-gradient-to-l from-black/85 via-black/55 to-transparent"
                : "bg-gradient-to-r from-black/85 via-black/55 to-transparent"
            }`}
          />
        </div>

        <div className="container-page absolute inset-0 flex items-center">
          <div className="max-w-xl">
            {/* logo-white.png, pas logo.png + `brightness-0 invert` : le logo
                source a un disque opaque quasi-blanc derrière l'emblème
                (invisible sur fond blanc, mais qui rend comme une pastille
                blanche pleine sur une photo). La variante blanche est générée
                avec un alpha recalculé, fond réellement transparent. */}
            <Image
              src="/brand/logo-white.png"
              alt="Jerusalem Rent"
              width={220}
              height={53}
              className="h-12 w-auto sm:h-14"
            />
            <p className="mt-9 text-[11px] font-medium uppercase tracking-[0.3em] text-white/75">
              {dict.neighborhoodPage.ctaEyebrow}
            </p>
            <h2 className="mt-5 font-display text-4xl font-extralight leading-[1.1] text-white sm:text-5xl">
              {dict.neighborhoodPage.ctaTitle}
            </h2>
            <p className="mt-6 text-base font-light leading-relaxed text-white/85">
              {dict.neighborhoodPage.ctaText}
            </p>

            {stats && (
              <div className="mt-7 flex items-center gap-3">
                <ReviewStars rating={stats.average} />
                <span className="text-xs text-white/75">
                  {dict.property.reviewsCount(stats.average, stats.count)}
                </span>
              </div>
            )}

            <Link
              href={href("/annonces")}
              className="btn mt-10 border-white/70 px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-primary-700"
            >
              {dict.neighborhoodPage.ctaButton}
              <Arrow className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
