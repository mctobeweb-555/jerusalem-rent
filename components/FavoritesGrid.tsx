"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFavorites } from "@/lib/favorites";
import PropertyCard from "@/components/PropertyCard";
import { localizedHref } from "@/lib/i18n/config";
import { useDict, useLocale } from "@/lib/i18n/context";
import { HeartIcon } from "@/components/icons";

type CardItem = React.ComponentProps<typeof PropertyCard>["property"];

export default function FavoritesGrid() {
  const dict = useDict();
  const locale = useLocale();
  const { ids } = useFavorites();
  const [items, setItems] = useState<CardItem[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (ids.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setItems(null); // état de chargement
    fetch(`/api/properties/by-ids?ids=${encodeURIComponent(key)}&locale=${locale}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setItems(d.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, locale]);

  if (items === null) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: Math.min(ids.length, 6) }).map((_, i) => (
          <div key={i} className="card h-72 animate-pulse bg-stone-100" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card grid place-items-center p-14 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-stone-100">
          <HeartIcon className="h-7 w-7 text-stone-400" />
        </div>
        <h2 className="mt-4 font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
          {dict.favoritesPage.emptyTitle}
        </h2>
        <p className="mt-1 max-w-sm text-sm text-stone-500">{dict.favoritesPage.emptyDesc}</p>
        <Link href={localizedHref(locale, "/annonces")} className="btn-primary mt-5">
          {dict.favoritesPage.browse}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <PropertyCard key={p.id} property={p} locale={locale} dict={dict} />
      ))}
    </div>
  );
}
