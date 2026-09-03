"use client";

import { createContext, useContext } from "react";
import dynamic from "next/dynamic";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

type I18nValue = { locale: Locale; dict: Dictionary };

const I18nContext = createContext<I18nValue | null>(null);

// Un loader par langue, littéral (import() statique) pour que webpack
// code-splitte chacun en chunk séparé — seul celui de la langue affichée est
// effectivement chargé, au lieu des 3 dictionnaires FR/EN/HE (~88 K de
// source) embarqués dans chaque page quelle que soit la langue active.
const DICT_LOADERS: Record<Locale, () => Promise<Dictionary>> = {
  fr: () => import("@/lib/i18n/dictionaries/fr").then((m) => m.fr),
  en: () => import("@/lib/i18n/dictionaries/en").then((m) => m.en),
  he: () => import("@/lib/i18n/dictionaries/he").then((m) => m.he),
};

// `next/dynamic` plutôt que le hook `use()` (React 19) : ce projet est sur
// React 18, où `use()` n'existe pas encore. `dynamic()` reste résolu côté
// serveur (ssr: true, par défaut) — le chunk de la langue active est donc
// déjà dans le HTML initial (pas de flash de contenu vide), seul le JS
// expédié au navigateur pour l'hydratation ne contient que cette langue.
function makeLocaleProvider(locale: Locale) {
  return dynamic(async () => {
    const dict = await DICT_LOADERS[locale]();
    function Provider({ children }: { children: React.ReactNode }) {
      return (
        <I18nContext.Provider value={{ locale, dict }}>
          {children}
        </I18nContext.Provider>
      );
    }
    return { default: Provider };
  });
}

const LOCALE_PROVIDERS: Record<Locale, ReturnType<typeof makeLocaleProvider>> = {
  fr: makeLocaleProvider("fr"),
  en: makeLocaleProvider("en"),
  he: makeLocaleProvider("he"),
};

// Fournit la langue + le dictionnaire courants aux Client Components sous
// app/[locale]/layout.tsx, sans prop-drilling. Le dictionnaire est chargé
// ICI côté client (jamais reçu en prop depuis le Server Component parent) :
// certaines entrées sont des fonctions (pluriels, interpolation), que React
// ne peut pas sérialiser à travers la frontière serveur → client. Seule
// `locale` (une chaîne) traverse cette frontière. Les Server Components, eux,
// appellent getDictionary(locale) directement (lib/i18n/dictionaries),
// sans passer par ce contexte.
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const LocaleProvider = LOCALE_PROVIDERS[locale];
  return <LocaleProvider>{children}</LocaleProvider>;
}

function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useDict/useLocale must be used within an I18nProvider");
  }
  return ctx;
}

export function useDict(): Dictionary {
  return useI18n().dict;
}

export function useLocale(): Locale {
  return useI18n().locale;
}
