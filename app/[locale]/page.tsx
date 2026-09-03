import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import SearchBar from "@/components/SearchBar";
import ShortTermSearchBar from "@/components/ShortTermSearchBar";
import ReviewCard from "@/components/ReviewCard";
import PropertyCard from "@/components/PropertyCard";
import HeroSlider from "@/components/HeroSlider";
import NeighborhoodsCarousel from "@/components/NeighborhoodsCarousel";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import { HouseIcon, ApartmentIcon, LandIcon, CommercialIcon, ArrowRightIcon, ArrowLeftIcon } from "@/components/icons";
import {
  getSiteMode,
  visibleStatuses,
  getWhatsappConfig,
  getReviewsGeneralized,
} from "@/lib/site-settings";
import { getHomeReviews } from "@/lib/reviews";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, localizedHref, type Locale } from "@/lib/i18n/config";
import { withTranslatedTitle } from "@/lib/i18n/property-translation";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import { notFound } from "next/navigation";

// ISR : dépend de la configuration du site (mode/avis), qui ne change qu'à
// l'édition admin — pas besoin de recalculer à chaque requête.
export const revalidate = 60;

// Photos de marque réutilisées pour les 4 vignettes d'arguments, en attendant
// des visuels dédiés par argument.
const VALUE_IMAGES = [
  "/brand/hero-jerusalem.jpg",
  "/brand/hero-jerusalem-2.jpg",
  "/brand/hero-jerusalem-3.jpg",
  "/brand/hero-jerusalem.jpg",
];

const propertyTypes = ["HOUSE", "APARTMENT", "LAND", "COMMERCIAL"] as const;
const PROPERTY_TYPE_ICONS: Record<(typeof propertyTypes)[number], (props: { className?: string }) => JSX.Element> = {
  HOUSE: HouseIcon,
  APARTMENT: ApartmentIcon,
  LAND: LandIcon,
  COMMERCIAL: CommercialIcon,
};

// Titre de section : petit, léger, majuscule, très espacé — traitement
// hôtellerie de luxe (cf. Four Seasons / Relais & Châteaux).
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl font-light uppercase tracking-[0.15em] text-primary-900">
      {children}
    </h2>
  );
}

async function getFeatured(statuses: string[], locale: Locale) {
  try {
    return await prisma.property.findMany({
      where: { published: true, status: { in: statuses as never } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        translations: locale === "fr" ? undefined : { where: { locale } },
      },
    });
  } catch {
    // Base injoignable (ex. au build sans DB) → on rend une home vide.
    return [];
  }
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDictionary(locale);
  const Arrow = locale === "he" ? ArrowLeftIcon : ArrowRightIcon;

  const mode = await getSiteMode();
  const statuses = visibleStatuses(mode);
  const [featured, reviewsGeneralized, whatsapp] = await Promise.all([
    getFeatured(statuses, locale),
    getReviewsGeneralized(),
    getWhatsappConfig(),
  ]);
  const reviews = await getHomeReviews(mode, reviewsGeneralized);
  const href = (path: string) => localizedHref(locale, path);

  const featuredItems = featured.map((p) => withTranslatedTitle(p, locale));

  return (
    <>
      {/* Bandeau de recherche plein écran, collé au header (façon hôtellerie
          — cf. Marriott/St. Regis) : au-dessus du hero, pas en surimpression. */}
      <section className="w-full border-b border-stone-200 bg-white">
        <div className="container-page">
          {mode.shortTermOnly ? <ShortTermSearchBar variant="band" /> : <SearchBar variant="band" />}
        </div>
      </section>

      {/* Hero */}
      <section className="relative overflow-hidden text-white">
        <HeroSlider />
        <div className="absolute inset-0 bg-black/40" />
        <div className="container-page relative py-28 sm:py-40">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.3em] text-white/80">
            {dict.home.heroBadge}
          </p>
          <h1 className="max-w-3xl text-4xl font-extralight uppercase leading-tight tracking-[0.04em] text-white sm:text-5xl">
            {mode.shortTermOnly ? dict.home.heroTitleShortTerm : dict.home.heroTitleSale}
          </h1>
          <p className="mt-5 max-w-xl text-base font-light text-white/80">
            {mode.shortTermOnly ? dict.home.heroDescShortTerm : dict.home.heroDescSale}
          </p>

          <Link
            href={href("/annonces")}
            className="mt-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/90 hover:text-white"
          >
            {dict.home.discoverApartments}
            <Arrow className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Biens vedettes */}
      <section className="py-16">
        <div className="container-page text-center">
          <SectionHeading>{dict.home.featured}</SectionHeading>
          <Link
            href={href("/annonces")}
            className="mt-3 inline-block text-xs font-medium uppercase tracking-[0.15em] text-primary-600 hover:text-primary-800"
          >
            {dict.common.seeAll}
          </Link>
        </div>

        {featuredItems.length === 0 ? (
          <p className="container-page mt-6 text-stone-500">{dict.home.featuredEmpty}</p>
        ) : (
          <div className="mt-8">
            <FeaturedCarousel
              items={featuredItems.map((p) => ({
                id: p.id,
                card: <PropertyCard property={p} locale={locale} dict={dict} />,
              }))}
              rtl={locale === "he"}
            />
          </div>
        )}
      </section>

      {/* Types de biens (masqué en mode court terme) */}
      {!mode.shortTermOnly && (
        <section className="container-page py-16">
          <SectionHeading>{dict.home.exploreByType}</SectionHeading>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {propertyTypes.map((t) => {
              const Icon = PROPERTY_TYPE_ICONS[t];
              return (
                <Link
                  key={t}
                  href={href(`/annonces?type=${t}`)}
                  className="card group flex items-center gap-4 p-5 transition hover:shadow-lift"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-primary-200 text-primary-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium uppercase tracking-wide text-stone-800 group-hover:text-primary-700">
                    {dict.property.types[t]}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Explorer par quartiers (dans les deux modes) — le titre de section
          vit désormais dans le bloc carousel lui-même (fond marine), le
          texte au-dessus ne garde que l'accroche éditoriale. */}
      <section id="quartiers" className="scroll-mt-20 pb-16 pt-8">
        <div className="container-page max-w-2xl text-center sm:mx-auto">
          <h3 className="font-display text-3xl font-light uppercase leading-[3rem] tracking-wide text-stone-900 sm:text-4xl">
            {dict.home.neighborhoodsIntroTitle}
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-stone-500">
            {dict.home.neighborhoodsIntroText}
          </p>
        </div>
        <div className="mt-16">
          <NeighborhoodsCarousel
            items={NEIGHBORHOODS}
            locale={locale}
            rtl={locale === "he"}
            title={dict.home.exploreByNeighborhood}
          />
        </div>
      </section>

      {/* Derniers avis */}
      {reviews.length > 0 && (
        <section className="container-page py-16">
          <div className="text-center">
            <SectionHeading>
              {mode.shortTermOnly ? dict.home.reviewsShortTerm : dict.home.reviewsGeneral}
            </SectionHeading>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </section>
      )}

      {/* Réservation directe par WhatsApp — entre les avis et la bande de
          valeurs, masqué si aucun numéro n'est configuré dans /admin/settings.
          Bandeau contenu (pas plein écran), sur fond marine — inspiré du
          bandeau de contact Four Seasons (texte + CTA sur une ligne, largeur
          contenue plutôt qu'edge-to-edge). */}
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

      {/* Bande de valeurs, avec photo — même esprit que la page hôtel Ritz-Carlton
          (grandes vignettes image + légende), remplace les 4 pastilles de texte
          seul. Titres/descriptions sortis des images (juste la photo, sans
          texte en surimpression) pour rester lisible avec de vraies légendes.
          Mêmes 3 photos de marque que le hero, réparties en boucle en
          attendant des visuels dédiés par argument. */}
      <section className="pb-10 pt-16">
        <div className="container-page max-w-2xl text-center sm:mx-auto">
          <h3 className="font-display text-3xl font-light leading-[3rem] text-stone-900 sm:text-4xl">
            {dict.home.valuePropsIntroTitle}
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-stone-500">
            {dict.home.valuePropsIntroText}
          </p>
        </div>
        <div className="container-page mt-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {dict.home.valueProps.map((v, i) => (
              <div key={v.title}>
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-900">
                  <Image
                    src={VALUE_IMAGES[i % VALUE_IMAGES.length]}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <p className="mt-4 font-display text-base font-light uppercase tracking-[0.1em] text-stone-900">
                  {v.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{v.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href={href("/qui-sommes-nous")}
              className="btn border-primary-600 px-6 py-2.5 text-xs uppercase tracking-[0.15em] text-primary-700 hover:bg-primary-600 hover:text-white"
            >
              {dict.home.additionalInfo}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
