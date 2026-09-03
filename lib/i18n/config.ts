export const locales = ["fr", "en", "he"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  he: "עברית",
};

export const LOCALE_SHORT_LABELS: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  he: "HE",
};

const RTL_LOCALES: readonly Locale[] = ["he"];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

/** Préfixe un chemin interne (ex. "/annonces") avec la langue courante. */
export function localizedHref(locale: Locale, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}
