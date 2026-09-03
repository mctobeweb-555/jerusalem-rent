import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, localizedHref } from "@/lib/i18n/config";
import PhotoGalleryStrip from "@/components/PhotoGalleryStrip";

// Photos de marque réutilisées en attendant de vraies photos éditoriales
// (façade, intérieurs, quartier) — même logique de placeholder que sur la home.
const IMG = {
  hero: "/brand/hero-jerusalem-2.jpg",
  a: "/brand/hero-jerusalem.jpg",
  b: "/brand/hero-jerusalem-3.jpg",
  c: "/brand/hero-jerusalem-2.jpg",
  band: "/brand/hero-jerusalem.jpg",
};

// Galerie de fin de page — les 3 photos de marque en rotation, en attendant
// de vrais visuels (une entrée par vignette, l'ordre crée l'alternance).
const GALLERY_IMAGES = [
  "/brand/hero-jerusalem.jpg",
  "/brand/hero-jerusalem-2.jpg",
  "/brand/hero-jerusalem-3.jpg",
  "/brand/hero-jerusalem-2.jpg",
  "/brand/hero-jerusalem.jpg",
  "/brand/hero-jerusalem-3.jpg",
];

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  return getDictionary(params.locale).meta.about;
}

// Colonne de texte d'un bloc éditorial : accroche fine + grand titre + texte.
function SectionText({
  eyebrow,
  heading,
  text,
}: {
  eyebrow: string;
  heading: string;
  text: string;
}) {
  return (
    <div className="max-w-md">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary-600">
        {eyebrow}
      </p>
      <h2 className="mt-5 font-display text-4xl font-light leading-[1.15] text-stone-900 sm:text-5xl">
        {heading}
      </h2>
      <p className="mt-6 leading-relaxed text-stone-600">{text}</p>
    </div>
  );
}

// Paire d'images qui se chevauchent, décalées verticalement — motif central
// des pages "about" de référence (Ritz-Carlton, Waldorf Astoria) : une grande
// image portrait, une seconde plus petite en débord, séparées par un liseré
// blanc. `flip` inverse le côté du débord (alternance d'un bloc à l'autre).
function ImagePair({ main, accent, flip = false }: { main: string; accent: string; flip?: boolean }) {
  return (
    <div className="relative pb-16 sm:pb-24">
      <div
        className={`relative aspect-[4/5] w-[82%] overflow-hidden bg-stone-100 ${
          flip ? "ms-auto" : ""
        }`}
      >
        <Image src={main} alt="" fill sizes="(min-width: 1024px) 42vw, 82vw" className="object-cover" />
      </div>
      <div
        className={`absolute bottom-0 aspect-square w-[52%] overflow-hidden bg-stone-100 ring-[10px] ring-white ${
          flip ? "start-0" : "end-0"
        }`}
      >
        <Image src={accent} alt="" fill sizes="(min-width: 1024px) 26vw, 52vw" className="object-cover" />
      </div>
    </div>
  );
}

export default function QuiSommesNousPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDictionary(locale);
  const d = dict.about;
  const [s1, s2, s3] = d.sections;

  return (
    <>
      {/* Hero pleine largeur */}
      <section className="relative overflow-hidden text-white">
        <div className="relative h-[60vh] min-h-[420px] w-full">
          <Image src={IMG.hero} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/45" />
        </div>
        <div className="absolute inset-0 flex items-center">
          <div className="container-page">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/80">
              {d.heroEyebrow}
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-extralight uppercase leading-tight tracking-[0.04em] text-white sm:text-6xl">
              {d.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Chapeau éditorial */}
      <section className="container-page py-24 sm:py-32">
        <p className="mx-auto max-w-3xl text-center font-display text-xl font-light leading-relaxed text-stone-700 sm:text-2xl">
          {d.intro}
        </p>
      </section>

      {/* Chiffres clés — sans encadré, simples filets fins */}
      <section className="container-page">
        <div className="grid divide-y divide-stone-200 border-y border-stone-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {dict.home.trustStats.map((s) => (
            <div key={s.k} className="px-6 py-10 text-center">
              <p className="font-display text-4xl font-extralight text-primary-700 sm:text-5xl">
                {s.k}
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.15em] text-stone-500">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bloc 1 — texte à gauche, paire d'images à droite */}
      {s1 && (
        <section className="container-page py-24 sm:py-32">
          <div className="grid items-center gap-x-16 gap-y-14 lg:grid-cols-2">
            <SectionText eyebrow={s1.eyebrow} heading={s1.heading} text={s1.text} />
            <ImagePair main={IMG.a} accent={IMG.b} />
          </div>
        </section>
      )}

      {/* Bande photo pleine largeur */}
      <section className="relative h-[42vh] min-h-[280px] w-full overflow-hidden">
        <Image src={IMG.band} alt="" fill sizes="100vw" className="object-cover" />
      </section>

      {/* Bloc 2 — image large à gauche, texte à droite */}
      {s2 && (
        <section className="container-page py-24 sm:py-32">
          <div className="grid items-center gap-x-16 gap-y-14 lg:grid-cols-2">
            <div className="relative aspect-[5/4] w-full overflow-hidden bg-stone-100">
              <Image src={IMG.c} alt="" fill sizes="(min-width: 1024px) 48vw, 100vw" className="object-cover" />
            </div>
            <div className="lg:ps-8">
              <SectionText eyebrow={s2.eyebrow} heading={s2.heading} text={s2.text} />
            </div>
          </div>
        </section>
      )}

      {/* Citation, bande marine pleine largeur */}
      <section className="bg-primary-600 py-24 sm:py-32">
        <div className="container-page mx-auto max-w-3xl text-center">
          <p className="font-display text-2xl font-light leading-relaxed text-white sm:text-3xl">
            {d.quote}
          </p>
          <p className="mt-8 text-xs uppercase tracking-[0.25em] text-white/50">
            {d.quoteAuthor}
          </p>
        </div>
      </section>

      {/* Bloc 3 — paire d'images à gauche (débord inversé), texte à droite */}
      {s3 && (
        <section className="container-page py-24 sm:py-32">
          <div className="grid items-center gap-x-16 gap-y-14 lg:grid-cols-2">
            <ImagePair main={IMG.b} accent={IMG.a} flip />
            <div className="lg:ps-8">
              <SectionText eyebrow={s3.eyebrow} heading={s3.heading} text={s3.text} />
            </div>
          </div>
        </section>
      )}

      {/* Valeurs — liste numérotée éditoriale, sans cartes */}
      <section className="container-page pb-24 sm:pb-32">
        <h2 className="text-center text-2xl font-light uppercase tracking-[0.15em] text-primary-900">
          {d.valuesHeading}
        </h2>
        <div className="mt-16 grid gap-x-12 gap-y-12 sm:grid-cols-3">
          {d.values.map((v, i) => (
            <div key={v.title} className="border-t border-stone-300 pt-6">
              <p className="font-display text-sm font-light tracking-[0.2em] text-accent-700">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-display text-xl font-light text-stone-900">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-500">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Appel à l'action — bande marine pleine largeur */}
      <section className="bg-primary-600 py-20">
        <div className="container-page flex flex-col items-center gap-8 text-center">
          <div>
            <h2 className="font-display text-2xl font-light text-white sm:text-3xl">
              {d.teamHeading}
            </h2>
            <p className="mt-3 text-white/70">{d.teamDesc}</p>
          </div>
          <Link
            href={localizedHref(locale, "/agents")}
            className="btn border-white/50 px-6 py-2.5 text-xs uppercase tracking-[0.15em] text-white hover:bg-white hover:text-primary-700"
          >
            {d.teamCta}
          </Link>
        </div>
      </section>

      {/* Galerie photo — respire entre la bande marine ci-dessus et celle de
          la newsletter en pied de page (deux aplats marine sinon collés). */}
      <section className="py-20">
        <div className="container-page">
          <h2 className="text-center text-2xl font-light uppercase tracking-[0.15em] text-primary-900">
            {d.galleryHeading}
          </h2>
        </div>
        <div className="mt-12">
          <PhotoGalleryStrip
            images={GALLERY_IMAGES}
            rtl={locale === "he"}
            prevLabel={dict.home.carouselPrev}
            nextLabel={dict.home.carouselNext}
          />
        </div>
      </section>
    </>
  );
}
