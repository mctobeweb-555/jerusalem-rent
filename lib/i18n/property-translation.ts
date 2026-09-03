import type { Locale } from "@/lib/i18n/config";

type Translatable = {
  title: string;
  description?: string;
  translations?: { locale: string; title: string; description: string }[];
};

type TranslatableFeatures = {
  features?: unknown; // Json sur Property, tableau de chaînes en pratique
  translations?: { locale: string; features?: unknown }[];
};

/** Équipements traduits pour `locale`, avec repli sur la liste FR source
 * (Property.features) si absente/vide pour cette langue. */
export function translateFeatures<T extends TranslatableFeatures>(
  property: T,
  locale: Locale,
): string[] {
  const base = Array.isArray(property.features) ? (property.features as string[]) : [];
  if (locale === "fr") return base;
  const t = property.translations?.find((tr) => tr.locale === locale);
  const translated = Array.isArray(t?.features) ? (t!.features as string[]) : [];
  return translated.length > 0 ? translated : base;
}

/** Titre/description traduits pour `locale`, avec repli sur le français source. */
export function translateProperty<T extends Translatable>(
  property: T,
  locale: Locale,
): { title: string; description: string | undefined } {
  if (locale === "fr") return { title: property.title, description: property.description };
  const t = property.translations?.find((tr) => tr.locale === locale);
  return {
    title: t?.title || property.title,
    description: t?.description || property.description,
  };
}

/** Applique translateProperty et fusionne le titre traduit dans l'objet (pour PropertyCard). */
export function withTranslatedTitle<T extends Translatable>(property: T, locale: Locale): T {
  return { ...property, title: translateProperty(property, locale).title };
}
