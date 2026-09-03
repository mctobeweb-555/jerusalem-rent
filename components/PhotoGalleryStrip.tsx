"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

// Bande photo horizontale façon galerie Ritz-Carlton : suite d'images 3:2
// qui défile à la souris/au doigt, avec un décalage vertical alterné d'une
// vignette à l'autre (c'est ce décalage qui donne le rythme "posé à la main"
// plutôt qu'une grille régulière).
//
// Défilement natif (overflow-x + scroll-snap) plutôt qu'une 3ᵉ instance
// d'Embla : pas de JS de positionnement, donc rien qui puisse entrer en
// conflit avec les décalages, et le geste tactile/trackpad est celui du
// navigateur. Les flèches ne font qu'un `scrollBy` sur le conteneur.
export default function PhotoGalleryStrip({
  images,
  rtl,
  prevLabel,
  nextLabel,
}: {
  images: string[];
  rtl: boolean;
  prevLabel: string;
  nextLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByPage(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    // En RTL, scrollLeft décroît vers la droite : on inverse le signe pour que
    // « suivant » avance toujours dans le sens de lecture.
    const amount = track.clientWidth * 0.8 * direction * (rtl ? -1 : 1);
    track.scrollBy({ left: amount, behavior: "smooth" });
  }

  const PrevArrow = rtl ? ArrowRightIcon : ArrowLeftIcon;
  const NextArrow = rtl ? ArrowLeftIcon : ArrowRightIcon;

  return (
    <div className="w-full">
      <div
        ref={trackRef}
        className="hide-scrollbar flex snap-x snap-mandatory items-start gap-4 overflow-x-auto scroll-smooth pb-4 ps-4 sm:gap-6 sm:ps-6 lg:ps-[max(2rem,calc((100vw-90rem)/2+2rem))]"
      >
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className={`relative aspect-[3/2] w-[72%] shrink-0 snap-start overflow-hidden bg-stone-100 sm:w-[42%] lg:w-[30%] ${
              i % 2 === 1 ? "sm:mt-12" : ""
            }`}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 42vw, 72vw"
              className="object-cover"
            />
          </div>
        ))}
        {/* Marge de fin, pour que la dernière vignette ne colle pas au bord. */}
        <div className="w-4 shrink-0 sm:w-6" aria-hidden />
      </div>

      <div className="container-page mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label={prevLabel}
          onClick={() => scrollByPage(-1)}
          className="grid h-10 w-10 shrink-0 place-items-center border border-stone-300 text-stone-700 transition hover:border-primary-600 hover:text-primary-700"
        >
          <PrevArrow className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={nextLabel}
          onClick={() => scrollByPage(1)}
          className="grid h-10 w-10 shrink-0 place-items-center border border-stone-300 text-stone-700 transition hover:border-primary-600 hover:text-primary-700"
        >
          <NextArrow className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
