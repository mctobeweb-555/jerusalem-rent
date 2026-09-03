"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDict, useLocale } from "@/lib/i18n/context";
import { localizedHref } from "@/lib/i18n/config";

export default function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const dict = useDict();
  const locale = useLocale();
  const current = params.get("sort") ?? "recent";

  const OPTIONS: { value: string; label: string }[] = [
    { value: "recent", label: dict.sort.recent },
    { value: "price_asc", label: dict.sort.priceAsc },
    { value: "price_desc", label: dict.sort.priceDesc },
    { value: "surface_desc", label: dict.sort.surfaceDesc },
    { value: "surface_asc", label: dict.sort.surfaceAsc },
  ];

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    if (e.target.value === "recent") next.delete("sort");
    else next.set("sort", e.target.value);
    next.delete("page"); // repart en page 1
    router.push(`${localizedHref(locale, "/annonces")}?${next.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-stone-500">
      <span className="whitespace-nowrap">{dict.sort.label}</span>
      <select
        value={current}
        onChange={onChange}
        className="input w-auto py-2 text-sm"
        aria-label={dict.sort.ariaLabel}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
