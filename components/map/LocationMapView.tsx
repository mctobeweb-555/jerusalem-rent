"use client";

import dynamic from "next/dynamic";

export default function LocationMapView(props: {
  lat: number;
  lng: number;
  label?: string;
  loadingText: string;
}) {
  const { loadingText, ...rest } = props;
  const PropertyLocationMap = dynamic(() => import("./PropertyLocationMap"), {
    ssr: false,
    loading: () => (
      <div className="grid h-72 w-full place-items-center rounded-2xl bg-stone-100 text-sm text-stone-400">
        {loadingText}
      </div>
    ),
  });
  return <PropertyLocationMap {...rest} />;
}
