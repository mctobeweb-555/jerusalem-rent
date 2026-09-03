import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FavoritesGrid from "@/components/FavoritesGrid";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  return { ...getDictionary(params.locale).meta.favorites, robots: { index: false, follow: true } };
}

export default function FavorisPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = getDictionary(locale);

  return (
    <div className="container-page py-16 sm:py-20">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-light uppercase tracking-[0.15em] text-primary-900">
          {dict.favoritesPage.title}
        </h1>
        <p className="mt-4 text-stone-500">{dict.favoritesPage.subtitle}</p>
      </div>
      <FavoritesGrid />
    </div>
  );
}
