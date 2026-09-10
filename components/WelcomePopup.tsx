"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CloseIcon } from "@/components/icons";
import { useDict, useLocale } from "@/lib/i18n/context";
import { localizedHref } from "@/lib/i18n/config";
import type { WelcomePopup as WelcomePopupData } from "@/lib/site-settings";

// sessionStorage (et non localStorage) : la popup ne se réaffiche pas pendant
// que le visiteur navigue de page en page, mais réapparaît lors d'une
// prochaine visite — c'est le comportement demandé pour une annonce
// d'occasion spéciale.
const SEEN_KEY = "welcome-popup-seen";
const DELAY_MS = 3000;

export default function WelcomePopup({ popup }: { popup: WelcomePopupData }) {
  const [open, setOpen] = useState(false);
  // Piloté une frame après l'ouverture pour déclencher la transition d'entrée.
  const [shown, setShown] = useState(false);
  const dict = useDict();
  const locale = useLocale();
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setShown(false);
    // Laisse la transition de sortie se jouer avant de démonter.
    setTimeout(() => setOpen(false), 200);
  }, []);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Navigation privée ou stockage bloqué : on affiche quand même.
    }
    if (seen) return;

    const timer = setTimeout(() => {
      setOpen(true);
      try {
        // Marqué dès l'ouverture : un rechargement de page ne doit pas la
        // faire réapparaître, même si le visiteur ne l'a pas encore fermée.
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* stockage indisponible */
      }
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Transition d'entrée + focus sur la fermeture + blocage du défilement de
  // la page derrière la popup.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setShown(true));
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  const isInternal = popup.ctaUrl?.startsWith("/") ?? false;

  return (
    <div
      className="no-print fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
    >
      <button
        type="button"
        aria-label={dict.common.close}
        onClick={close}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 motion-reduce:transition-none ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative w-full max-w-[44rem] overflow-hidden bg-white shadow-lift transition-all duration-200 motion-reduce:transition-none ${
          shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label={dict.common.close}
          className="absolute end-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-stone-600 shadow-sm transition hover:bg-white hover:text-primary-700"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {/* Image à côté du texte dès `sm` : la hauteur de la popup devient
            celle de la colonne de texte au lieu de la somme image + texte,
            ce qui évite le défilement interne. Empilé sur mobile, avec une
            image plus basse (16/9) pour la même raison. `max-h`/`overflow`
            restent un filet de sécurité pour un texte très long ou un écran
            très bas (paysage sur mobile). */}
        <div
          className={`max-h-[90vh] overflow-y-auto sm:flex sm:items-stretch ${
            // La hauteur plancher ne sert qu'à donner de l'allure à la colonne
            // image quand le texte est court ; sans image elle laisserait juste
            // un grand vide.
            popup.imageUrl ? "sm:min-h-[19rem]" : ""
          }`}
        >
          {popup.imageUrl && (
            <div className="relative aspect-[16/9] w-full shrink-0 bg-stone-100 sm:aspect-auto sm:w-5/12">
              <Image
                src={popup.imageUrl}
                alt=""
                fill
                sizes="(min-width: 640px) 20rem, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <div
            className={`flex flex-col justify-center px-6 py-7 text-center sm:flex-1 sm:px-9 ${
              // Aligné au début seulement en vis-à-vis de l'image ; centré sur
              // toute la largeur quand la popup est en texte seul.
              popup.imageUrl ? "sm:text-start" : ""
            }`}
          >
            <h2
              id="welcome-popup-title"
              className="font-display text-2xl font-light leading-snug text-stone-900 sm:text-3xl"
            >
              {popup.title}
            </h2>
            {popup.text && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-stone-500">
                {popup.text}
              </p>
            )}
            {popup.ctaLabel && popup.ctaUrl && (
              <div className="mt-7">
                {isInternal ? (
                  <Link
                    href={localizedHref(locale, popup.ctaUrl)}
                    onClick={close}
                    className="btn-primary px-7 py-3 text-xs uppercase tracking-[0.15em]"
                  >
                    {popup.ctaLabel}
                  </Link>
                ) : (
                  <a
                    href={popup.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                    className="btn-primary px-7 py-3 text-xs uppercase tracking-[0.15em]"
                  >
                    {popup.ctaLabel}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
