"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MapMarker, Bbox } from "./PropertyMap";
import { localizedHref } from "@/lib/i18n/config";
import { useDict, useLocale } from "@/lib/i18n/context";

export default function MapView({
  markers,
  bbox,
}: {
  markers: MapMarker[];
  bbox?: Bbox | null;
}) {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const dict = useDict();
  const locale = useLocale();
  const annonces = localizedHref(locale, "/annonces");

  // Leaflet manipule `window` → chargement client uniquement (ssr:false).
  const PropertyMap = dynamic(() => import("./PropertyMap"), {
    ssr: false,
    loading: () => (
      <div className="grid h-[440px] w-full place-items-center rounded-2xl bg-stone-100 text-sm text-stone-400">
        {dict.map.loading}
      </div>
    ),
  });

  function clearZone() {
    const params = new URLSearchParams(window.location.search);
    for (const k of ["latMin", "latMax", "lngMin", "lngMax", "page"]) {
      params.delete(k);
    }
    const qs = params.toString();
    router.push(qs ? `${annonces}?${qs}` : annonces);
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {dict.map.locatedCount(markers.length)}
          {bbox && (
            <span className="ms-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
              {dict.map.zoneActive}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {bbox && (
            <button
              type="button"
              onClick={clearZone}
              className="btn-outline px-3 py-1.5 text-xs"
            >
              {dict.map.clearZone}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="btn-outline px-3 py-1.5 text-xs"
          >
            {open ? dict.map.hideMap : dict.map.showMap}
          </button>
        </div>
      </div>
      {open && <PropertyMap markers={markers} bbox={bbox} locale={locale} dict={dict} />}
      {open && <p className="mt-2 text-xs text-stone-400">{dict.map.hint}</p>}
    </section>
  );
}
