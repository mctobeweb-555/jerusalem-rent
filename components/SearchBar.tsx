"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDict, useLocale } from "@/lib/i18n/context";
import { localizedHref } from "@/lib/i18n/config";

export default function SearchBar({ variant = "card" }: { variant?: "card" | "band" }) {
  const router = useRouter();
  const dict = useDict();
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("FOR_SALE");
  const band = variant === "band";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (city.trim()) params.set("city", city.trim());
    if (status) params.set("status", status);
    router.push(`${localizedHref(locale, "/annonces")}?${params.toString()}`);
  }

  if (band) {
    return (
      <form
        onSubmit={submit}
        // lg (pas sm) : pas assez de place pour les champs en ligne entre
        // 640 et 1023px (cf. ShortTermSearchBar, même correctif).
        className="flex w-full flex-col divide-y divide-stone-200 lg:flex-row lg:items-stretch lg:divide-x lg:divide-y-0"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 px-6 py-3">
          {[
            { v: "FOR_SALE", l: dict.search.buy },
            { v: "FOR_RENT", l: dict.search.rent },
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setStatus(opt.v)}
              className={
                "text-xs font-medium uppercase tracking-[0.1em] transition " +
                (status === opt.v ? "text-primary-700" : "text-stone-400 hover:text-stone-700")
              }
              aria-pressed={status === opt.v}
            >
              {opt.l}
            </button>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-6 py-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-stone-400">
            {dict.search.keywordAria}
          </span>
          <input
            className="border-0 bg-transparent p-0 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:ring-0"
            placeholder={dict.search.keywordPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={dict.search.keywordAria}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-6 py-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-stone-400">
            {dict.search.cityAria}
          </span>
          <input
            className="border-0 bg-transparent p-0 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:ring-0"
            placeholder={dict.search.cityPlaceholder}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label={dict.search.cityAria}
          />
        </div>
        <button
          type="submit"
          className="btn-primary shrink-0 justify-self-stretch rounded-none px-8 py-3 text-xs uppercase tracking-[0.15em]"
        >
          {dict.search.searchBtn}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid w-full gap-3 rounded-2xl bg-white p-3 shadow-lift sm:grid-cols-[1fr_1fr_auto_auto]"
    >
      {/* Acheter / Louer */}
      <div className="flex rounded-xl bg-stone-100 p-1 sm:col-span-2 lg:col-span-1">
        {[
          { v: "FOR_SALE", l: dict.search.buy },
          { v: "FOR_RENT", l: dict.search.rent },
        ].map((opt) => (
          <button
            key={opt.v}
            type="button"
            onClick={() => setStatus(opt.v)}
            className={
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition " +
              (status === opt.v
                ? "bg-white text-primary-700 shadow-sm"
                : "text-stone-500 hover:text-stone-700")
            }
            aria-pressed={status === opt.v}
          >
            {opt.l}
          </button>
        ))}
      </div>

      <input
        className="input sm:col-span-2 lg:col-span-1"
        placeholder={dict.search.keywordPlaceholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label={dict.search.keywordAria}
      />
      <input
        className="input"
        placeholder={dict.search.cityPlaceholder}
        value={city}
        onChange={(e) => setCity(e.target.value)}
        aria-label={dict.search.cityAria}
      />
      <button type="submit" className="btn-primary whitespace-nowrap">
        {dict.search.searchBtn}
      </button>
    </form>
  );
}
