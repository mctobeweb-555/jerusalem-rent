import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, defaultLocale, localizedHref, type Locale } from "@/lib/i18n/config";

// Un `not-found.tsx` sous [locale] ne reçoit pas `params` (limite connue de
// l'App Router) — la langue est retrouvée via l'en-tête "x-locale" posé par
// le middleware, même mécanisme que app/layout.tsx::currentLocale().
function currentLocale(): Locale {
  const headerLocale = headers().get("x-locale");
  return headerLocale && isLocale(headerLocale) ? headerLocale : defaultLocale;
}

export function generateMetadata(): Metadata {
  const dict = getDictionary(currentLocale());
  return { title: dict.notFound.title, robots: { index: false, follow: false } };
}

export default function LocaleNotFound() {
  const locale = currentLocale();
  const dict = getDictionary(locale);

  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <p className="font-display text-6xl font-extralight text-primary-200">404</p>
        <h1 className="mt-4 font-display text-2xl font-light uppercase tracking-[0.1em] text-primary-900">
          {dict.notFound.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-stone-500">{dict.notFound.desc}</p>
        <Link href={localizedHref(locale, "/")} className="btn-primary mt-8 inline-flex">
          {dict.notFound.cta}
        </Link>
      </div>
    </div>
  );
}
