"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useDict, useLocale } from "@/lib/i18n/context";
import { localizedHref } from "@/lib/i18n/config";
import { useFavorites } from "@/lib/favorites";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import { PhoneIcon, ChevronDownIcon, HeartIcon } from "@/components/icons";

export default function Header({ phone }: { phone?: string | null }) {
  const [open, setOpen] = useState(false);
  const [quartiersOpen, setQuartiersOpen] = useState(false);
  const [mobileQuartiersOpen, setMobileQuartiersOpen] = useState(false);
  const dict = useDict();
  const locale = useLocale();
  const home = localizedHref(locale, "/");
  const favoris = localizedHref(locale, "/favoris");
  const { ids } = useFavorites();
  const favCount = ids.length;
  const quartiersRef = useRef<HTMLDivElement>(null);

  // Ferme le dropdown "Nos quartiers" au clic en dehors.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (quartiersRef.current && !quartiersRef.current.contains(e.target as Node)) {
        setQuartiersOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/80 backdrop-blur-md">
      <div className="container-page flex h-20 items-center justify-between">
        <Link href={home} className="flex items-center" aria-label="Jerusalem Rent">
          <Image
            src="/brand/logo.png"
            alt="Jerusalem Rent"
            width={519}
            height={125}
            priority
            className="h-14 w-auto"
          />
        </Link>

        {/* Nav desktop — bascule à lg (pas md) : à 768-1023px (toutes les
            tablettes), logo + 3 liens + favoris + langues + CTA téléphone
            n'ont pas la place, le CTA finissait par wrapper sur 2-4 lignes
            (testé jusqu'à ~1100px). Le menu burger reste donc affiché plus
            longtemps, jusqu'à ce qu'il y ait vraiment la place. */}
        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            href={localizedHref(locale, "/annonces")}
            className="rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.1em] text-stone-800 transition hover:bg-stone-100 hover:text-stone-900"
          >
            {dict.nav.ourListings}
          </Link>

          {/* "Nos quartiers" : dropdown listant les quartiers, plutôt qu'un
              simple lien vers l'ancre de la home. */}
          <div className="relative" ref={quartiersRef}>
            <button
              type="button"
              onClick={() => setQuartiersOpen((v) => !v)}
              aria-expanded={quartiersOpen}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.1em] text-stone-800 transition hover:bg-stone-100 hover:text-stone-900"
            >
              {dict.nav.neighborhoods}
              <ChevronDownIcon className={`h-3 w-3 transition-transform ${quartiersOpen ? "rotate-180" : ""}`} />
            </button>
            {quartiersOpen && (
              <div className="absolute start-0 top-full z-50 mt-1 w-64 border border-stone-200 bg-white py-2 shadow-lift">
                {NEIGHBORHOODS.map((n) => (
                  <Link
                    key={n.slug}
                    href={localizedHref(locale, `/annonces?neighborhood=${encodeURIComponent(n.name)}`)}
                    onClick={() => setQuartiersOpen(false)}
                    className="block px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-50 hover:text-primary-700"
                  >
                    {n.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href={localizedHref(locale, "/qui-sommes-nous")}
            className="rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.1em] text-stone-800 transition hover:bg-stone-100 hover:text-stone-900"
          >
            {dict.nav.aboutUs}
          </Link>

          {/* Favoris : icône + pastille de compteur seulement, pas de libellé
              (repris dans le header sur demande explicite, sans texte pour
              rester compact). */}
          <Link
            href={favoris}
            aria-label={dict.nav.favoritesAria(favCount)}
            className="relative ms-1 rounded-lg p-2.5 text-stone-800 transition hover:bg-stone-100 hover:text-primary-700"
          >
            <HeartIcon filled={favCount > 0} className={`h-5 w-5 ${favCount > 0 ? "text-red-500" : ""}`} />
            {favCount > 0 && (
              <span
                className="absolute grid h-4 min-w-[1rem] place-items-center rounded-full bg-primary-600 px-1 text-[10px] font-semibold text-white"
                style={{ top: 2, insetInlineEnd: 2 }}
              >
                {favCount}
              </span>
            )}
          </Link>

          <LanguageSwitcher className="ms-1" />

          {/* CTA unique : le numéro de téléphone tient lieu de bouton de
              réservation (plus de bouton "Réservation" séparé). Repli sur le
              libellé "Réservation" → /annonces si aucun numéro n'est
              configuré dans /admin/settings. */}
          {telHref ? (
            <a
              href={telHref}
              className="btn ms-2 flex items-center gap-2 border-primary-600 px-3 py-2 text-xs uppercase tracking-[0.1em] text-primary-700 hover:bg-primary-600 hover:text-white xl:px-4"
            >
              <PhoneIcon className="h-3.5 w-3.5" />
              {/* Numéro masqué entre lg et xl (1024-1279px) : encore trop
                  juste pour tenir sur une ligne à cette largeur (testé), on
                  ne garde que l'icône ; le texte revient à xl. dir="ltr" :
                  sans ça, le bidi de la page RTL réordonne les chiffres/le
                  "+"/les tirets du numéro (piège classique). */}
              <span dir="ltr" className="hidden xl:inline">
                {phone}
              </span>
            </a>
          ) : (
            <Link
              href={localizedHref(locale, "/annonces")}
              className="btn ms-2 border-primary-600 px-4 py-2 text-xs uppercase tracking-[0.1em] text-primary-700 hover:bg-primary-600 hover:text-white"
            >
              {dict.nav.reservation}
            </Link>
          )}
        </nav>

        {/* Burger mobile */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-stone-800 hover:bg-stone-100 lg:hidden"
          aria-label={dict.nav.openMenu}
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Menu mobile déroulant */}
      {open && (
        <nav className="border-t border-stone-200 bg-white lg:hidden">
          <div className="container-page flex flex-col py-2">
            <Link
              href={localizedHref(locale, "/annonces")}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-100"
            >
              {dict.nav.ourListings}
            </Link>

            {/* "Nos quartiers" : accordéon repliable listant les quartiers. */}
            <button
              type="button"
              onClick={() => setMobileQuartiersOpen((v) => !v)}
              aria-expanded={mobileQuartiersOpen}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-100"
            >
              {dict.nav.neighborhoods}
              <ChevronDownIcon
                className={`h-3.5 w-3.5 transition-transform ${mobileQuartiersOpen ? "rotate-180" : ""}`}
              />
            </button>
            {mobileQuartiersOpen && (
              <div className="ms-3 flex flex-col border-s border-stone-200 ps-3">
                {NEIGHBORHOODS.map((n) => (
                  <Link
                    key={n.slug}
                    href={localizedHref(locale, `/annonces?neighborhood=${encodeURIComponent(n.name)}`)}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 hover:text-primary-700"
                  >
                    {n.name}
                  </Link>
                ))}
              </div>
            )}

            <Link
              href={localizedHref(locale, "/qui-sommes-nous")}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-100"
            >
              {dict.nav.aboutUs}
            </Link>

            <Link
              href={favoris}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-100"
            >
              <HeartIcon filled={favCount > 0} className={`h-4 w-4 ${favCount > 0 ? "text-red-500" : ""}`} />
              {dict.nav.favorites}
              {favCount > 0 && (
                <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-primary-600 px-1 text-xs font-semibold text-white">
                  {favCount}
                </span>
              )}
            </Link>

            <div className="mt-1 px-3 py-1.5">
              <LanguageSwitcher />
            </div>

            {telHref ? (
              <a
                href={telHref}
                onClick={() => setOpen(false)}
                className="btn mt-2 flex items-center justify-center gap-2 border-primary-600 text-primary-700 hover:bg-primary-600 hover:text-white"
              >
                <PhoneIcon className="h-4 w-4" />
                <span dir="ltr">{phone}</span>
              </a>
            ) : (
              <Link
                href={localizedHref(locale, "/annonces")}
                onClick={() => setOpen(false)}
                className="btn mt-2 justify-center border-primary-600 text-primary-700 hover:bg-primary-600 hover:text-white"
              >
                {dict.nav.reservation}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
