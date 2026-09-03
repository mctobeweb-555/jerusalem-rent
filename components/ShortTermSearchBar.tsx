"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import GuestsPicker, { type Guests } from "@/components/GuestsPicker";
import { useDict, useLocale } from "@/lib/i18n/context";
import { localizedHref } from "@/lib/i18n/config";

// Légende compacte au-dessus d'un champ (même structure pour tous les champs
// afin qu'ils aient tous la même hauteur, quel que soit leur contenu).
function Field({
  label,
  band,
  children,
}: {
  label: string;
  band?: boolean;
  children: React.ReactNode;
}) {
  if (band) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-6 py-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-stone-400">{label}</span>
        {children}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="px-0.5 text-xs font-medium text-stone-400">{label}</span>
      {children}
    </div>
  );
}

// Barre de recherche « courte durée » : ville + dates + voyageurs.
// variant "card" = carte flottante arrondie (usage historique dans le hero) ;
// "band" = bandeau plein écran plat, collé au header (façon Marriott/St. Regis).
export default function ShortTermSearchBar({ variant = "card" }: { variant?: "card" | "band" }) {
  const router = useRouter();
  const dict = useDict();
  const locale = useLocale();
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState<Guests>({
    adults: 1,
    children: 0,
    babies: 0,
  });

  const today = new Date().toISOString().slice(0, 10);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("status", "SHORT_TERM");
    if (city.trim()) params.set("city", city.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    const total = guests.adults + guests.children;
    if (total > 0) params.set("guests", String(total));
    params.set("adults", String(guests.adults));
    params.set("children", String(guests.children));
    params.set("babies", String(guests.babies));
    router.push(`${localizedHref(locale, "/annonces")}?${params.toString()}`);
  }

  const band = variant === "band";
  const inputClass = band
    ? "border-0 bg-transparent p-0 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:ring-0"
    : "input";

  return (
    <form
      onSubmit={submit}
      className={
        band
          ? // lg (pas sm) : à 640-1023px, 4 champs + bouton en ligne n'ont pas
            // assez de place (testé à 768px : champs tronqués/superposés) —
            // reste empilé jusqu'à ce qu'il y ait vraiment la place.
            "flex w-full flex-col divide-y divide-stone-200 lg:flex-row lg:items-stretch lg:divide-x lg:divide-y-0"
          : "grid w-full items-end gap-3 rounded-2xl bg-white p-3 shadow-lift sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr_auto]"
      }
    >
      <Field label={dict.search.destination} band={band}>
        <input
          className={inputClass}
          placeholder={dict.search.cityPlaceholder}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label={dict.search.destination}
        />
      </Field>

      <Field label={dict.search.checkIn} band={band}>
        <input
          className={inputClass}
          type="date"
          min={today}
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          aria-label={dict.search.checkInAria}
        />
      </Field>

      <Field label={dict.search.checkOut} band={band}>
        <input
          className={inputClass}
          type="date"
          min={checkIn || today}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          aria-label={dict.search.checkOutAria}
        />
      </Field>

      <Field label={dict.search.guests} band={band}>
        <GuestsPicker value={guests} onChange={setGuests} />
      </Field>

      <button
        type="submit"
        className={
          band
            ? "btn-primary shrink-0 justify-self-stretch rounded-none px-8 py-3 text-xs uppercase tracking-[0.15em] sm:rounded-none"
            : "btn-primary whitespace-nowrap"
        }
      >
        {dict.search.searchBtn}
      </button>
    </form>
  );
}
