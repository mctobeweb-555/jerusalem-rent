"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useDict, useLocale } from "@/lib/i18n/context";

type GalleryImage = { url: string; alt: string };

export default function Gallery({ images }: { images: GalleryImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dict = useDict().property;
  const rtl = useLocale() === "he";

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length)),
    [images.length],
  );
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i + 1) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, close, prev, next]);

  if (images.length === 0) {
    return (
      <div className="grid aspect-[16/10] place-items-center bg-stone-100 text-stone-400">
        {dict.noPhoto}
      </div>
    );
  }

  const [main, ...rest] = images;
  const hasRest = rest.length > 0;

  return (
    <>
      {/* Une seule photo → pleine largeur ; sinon → mosaïque 2/1. */}
      {!hasRest ? (
        <button
          type="button"
          onClick={() => setOpenIndex(0)}
          className="relative block aspect-[16/9] w-full overflow-hidden bg-stone-100"
        >
          <Image
            src={main.url}
            alt={main.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover transition hover:scale-[1.02]"
          />
        </button>
      ) : (
        <div className="grid gap-3 sm:h-[420px] sm:grid-cols-[2fr_1fr]">
          <button
            type="button"
            onClick={() => setOpenIndex(0)}
            className="relative aspect-[4/3] overflow-hidden bg-stone-100 sm:aspect-auto sm:h-full"
          >
            <Image
              src={main.url}
              alt={main.alt}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 66vw"
              className="object-cover transition hover:scale-[1.02]"
            />
          </button>

          <div className="grid grid-rows-2 gap-3">
            {rest.slice(0, 2).map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => setOpenIndex(i + 1)}
                className="relative aspect-[4/3] overflow-hidden bg-stone-100 sm:aspect-auto"
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition hover:scale-[1.02]"
                />
                {/* Sur la 2ᵉ vignette, afficher le compteur restant. */}
                {i === 1 && images.length > 3 && (
                  <span className="absolute inset-0 grid place-items-center bg-black/45 text-lg font-semibold text-white">
                    +{images.length - 3}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={dict.galleryAlt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute end-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label={dict.galleryClose}
          >
            ✕
          </button>

          {images.length > 1 && (
            <>
              {/* "Précédent"/"Suivant" en position logique (début/fin de la
                  direction de lecture) — le chevron pointe vers l'intérieur
                  de la lecture, donc s'inverse aussi en RTL. */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute start-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
                aria-label={dict.galleryPrev}
              >
                {rtl ? "›" : "‹"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute end-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:end-16"
                aria-label={dict.galleryNext}
              >
                {rtl ? "‹" : "›"}
              </button>
            </>
          )}

          <div
            className="relative h-[80vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[openIndex].url}
              alt={images[openIndex].alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <p className="absolute bottom-4 text-sm text-white/70">
            {openIndex + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
