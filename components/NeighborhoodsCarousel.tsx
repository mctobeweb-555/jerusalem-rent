"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { Neighborhood } from "@/lib/neighborhoods";
import { localizedHref, type Locale } from "@/lib/i18n/config";
import { useDict } from "@/lib/i18n/context";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

// Carousel plein écran sur fond marine, un seul slide visible à la fois
// (léger aperçu du précédent/suivant sur les bords), image + carte blanche
// en surimpression — reprend fidèlement la mise en page du carousel
// "Ritz-Carlton Reserve" fourni en référence par l'utilisateur : accroche en
// petites capitales, titre, description, lien souligné, puis contrôles
// Précédent/Suivant + barre de progression + compteur "n / total".
export default function NeighborhoodsCarousel({
  items,
  locale,
  rtl,
  title,
}: {
  items: Neighborhood[];
  locale: Locale;
  rtl: boolean;
  title: string;
}) {
  const dict = useDict();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    direction: rtl ? "rtl" : "ltr",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [count, setCount] = useState(items.length);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setCount(emblaApi.scrollSnapList().length);
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const PrevArrow = rtl ? ArrowRightIcon : ArrowLeftIcon;
  const NextArrow = rtl ? ArrowLeftIcon : ArrowRightIcon;

  return (
    <div className="w-full bg-primary-600 py-14 sm:py-20">
      <div className="container-page mb-10">
        <h2 className="text-center text-3xl font-light uppercase tracking-[0.15em] text-white">
          {title}
        </h2>
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {items.map((n) => (
            <div key={n.slug} className="flex-[0_0_92%] px-2 sm:flex-[0_0_82%] lg:flex-[0_0_74%]">
              <div className="relative">
                <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[21/9]">
                  <Image
                    src={n.image}
                    alt={n.name}
                    fill
                    sizes="(min-width: 640px) 74vw, 92vw"
                    className="object-cover"
                  />
                </div>

                <div className="w-full bg-white px-6 py-8 sm:absolute sm:inset-y-8 sm:right-[6%] sm:flex sm:w-[36%] sm:flex-col sm:justify-center sm:px-10 sm:py-0 sm:shadow-xl">
                  <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-stone-400">
                    Jerusalem
                  </p>
                  <p className="mt-3 font-display text-2xl font-light tracking-wide text-stone-900">
                    {n.name}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-stone-500">
                    {n.tagline[locale]}
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-[0.15em] text-accent-700">
                    {dict.home.neighborhoodCount(n.count)}
                  </p>
                  <Link
                    href={localizedHref(locale, `/annonces?neighborhood=${encodeURIComponent(n.name)}`)}
                    className="mt-6 inline-block w-fit border-b border-primary-700 pb-0.5 text-xs font-medium uppercase tracking-[0.15em] text-primary-700 transition hover:text-primary-900"
                  >
                    {dict.home.neighborhoodCta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page mt-10 flex items-center gap-6">
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          className="flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-white/70 transition hover:text-white"
        >
          <PrevArrow className="h-3 w-3" />
          {dict.home.carouselPrev}
        </button>

        <div className="relative h-px flex-1 bg-white/20">
          <div
            className="absolute inset-y-0 left-0 bg-accent-500 transition-all duration-300 rtl:left-auto rtl:right-0"
            style={{ width: count > 0 ? `${((selectedIndex + 1) / count) * 100}%` : "0%" }}
          />
        </div>

        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          className="flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-white/70 transition hover:text-white"
        >
          {dict.home.carouselNext}
          <NextArrow className="h-3 w-3" />
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-white/40">
        {selectedIndex + 1} / {count}
      </p>
    </div>
  );
}
