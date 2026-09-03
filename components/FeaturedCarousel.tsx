"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useDict } from "@/lib/i18n/context";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import type { ReactNode } from "react";

// Carousel "bleed" pour les biens en vedette — même mécanique que
// NeighborhoodsCarousel (Embla, plusieurs cartes visibles + aperçu de la
// suivante). Les cartes (`PropertyCard`, Server Component) sont rendues par
// l'appelant et reçues déjà construites via `items[].card` — ce composant ne
// fait qu'orchestrer le carousel, pour ne pas tirer PropertyCard (next/image,
// FavoriteButton, formatage prix…) dans le bundle client de la home. `dict`
// n'est jamais reçu en prop non plus (piège RSC connu) : il vient de
// `useDict()` (I18nProvider, déjà posé par le layout parent), qui ne charge
// que le dictionnaire de la langue active — jamais `getDictionary()`
// directement, qui embarquerait les 3 langues dans ce bundle client.
export default function FeaturedCarousel({
  items,
  rtl,
}: {
  items: { id: string; card: ReactNode }[];
  rtl: boolean;
}) {
  const dict = useDict();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    direction: rtl ? "rtl" : "ltr",
    slidesToScroll: 1,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const PrevArrow = rtl ? ArrowRightIcon : ArrowLeftIcon;
  const NextArrow = rtl ? ArrowLeftIcon : ArrowRightIcon;

  return (
    <div className="w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 ps-4 sm:gap-6 sm:ps-6 lg:ps-[max(2rem,calc((100vw-90rem)/2+2rem))]">
          {items.map((item) => (
            <div key={item.id} className="flex-[0_0_82%] sm:flex-[0_0_46%] lg:flex-[0_0_31%]">
              {item.card}
            </div>
          ))}
        </div>
      </div>

      {scrollSnaps.length > 1 && (
        <div className="container-page mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label={dict.home.carouselPrev}
            onClick={() => emblaApi?.scrollPrev()}
            className="grid h-10 w-10 shrink-0 place-items-center border border-stone-300 text-stone-700 transition hover:border-primary-600 hover:text-primary-700"
          >
            <PrevArrow className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            {scrollSnaps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={dict.home.carouselGoTo(i + 1)}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === selectedIndex ? "w-6 bg-primary-700" : "w-1.5 bg-stone-300"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label={dict.home.carouselNext}
            onClick={() => emblaApi?.scrollNext()}
            className="grid h-10 w-10 shrink-0 place-items-center border border-stone-300 text-stone-700 transition hover:border-primary-600 hover:text-primary-700"
          >
            <NextArrow className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
