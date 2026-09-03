import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Jost, Heebo } from "next/font/google";
import { dirFor, isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Deux polices de titrage distinctes : aucune police ne couvre à la fois un
// rendu latin géométrique fin ET l'hébreu. Jost (géométrique, très fine —
// jamais de 700 sur les titres, cf. consigne "plus fin, plus luxe") pour
// FR/EN ; Heebo (même esprit géométrique, pensé pour l'hébreu) pour HE. Le
// bon jeu est sélectionné via la variable CSS --font-display, redéfinie sur
// [dir="rtl"] dans globals.css — aucun composant n'a besoin de connaître la
// langue. Poids volontairement limités à ≤500 : aucun titre ne doit rendre
// en gras (cf. règle globale h1/h2/h3 dans globals.css).
const jost = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-display-latin",
  display: "swap",
});
const heebo = Heebo({
  subsets: ["hebrew"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-display-he",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const OG_LOCALES: Record<Locale, string> = { fr: "fr_FR", en: "en_US", he: "he_IL" };

// Langue de la requête, transmise par le middleware via l'en-tête "x-locale"
// pour les routes sous /[locale] (fr par défaut ailleurs : /admin, /api, /login).
function currentLocale(): Locale {
  const headerLocale = headers().get("x-locale");
  return headerLocale && isLocale(headerLocale) ? headerLocale : defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = currentLocale();
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: dict.meta.home.title,
      template: "%s | Jerusalem Rent",
    },
    description: dict.meta.home.description,
    openGraph: {
      type: "website",
      locale: OG_LOCALES[locale],
      siteName: "Jerusalem Rent",
      url: siteUrl,
    },
    robots: { index: true, follow: true },
  };
}

// Racine minimale : seule app/[locale]/layout.tsx connaît la langue de la
// page (routes /admin, /api, /login n'ont pas de segment de langue et
// restent en français par défaut). Le middleware transmet la langue
// détectée via l'en-tête "x-locale" pour les routes localisées.
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = currentLocale();

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${inter.variable} ${jost.variable} ${heebo.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans">{children}</body>
    </html>
  );
}
