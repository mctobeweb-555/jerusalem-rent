"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDict, useLocale } from "@/lib/i18n/context";
import { localizedHref } from "@/lib/i18n/config";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";

export type AgentFilterOption = { slug: string; name: string };

// Filtres du listing. Les valeurs sont poussées dans l'URL (?city=…) pour rester
// crawlables et partageables.
export default function Filters({
  agents = [],
  shortTerm = false,
}: {
  agents?: AgentFilterOption[];
  shortTerm?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const dict = useDict();
  const locale = useLocale();
  const annonces = localizedHref(locale, "/annonces");

  const [keyword, setKeyword] = useState(params.get("q") ?? "");
  const [neighborhood, setNeighborhood] = useState(params.get("neighborhood") ?? "");
  const [priceMin, setPriceMin] = useState(params.get("priceMin") ?? "");
  const [priceMax, setPriceMax] = useState(params.get("priceMax") ?? "");
  const [surfaceMin, setSurfaceMin] = useState(params.get("surfaceMin") ?? "");
  const [roomsMin, setRoomsMin] = useState(params.get("roomsMin") ?? "");
  const [guests, setGuests] = useState(params.get("guests") ?? "");
  const [agent, setAgent] = useState(params.get("agent") ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    // On conserve status et les dates de séjour s'ils existent déjà.
    for (const key of ["status", "checkIn", "checkOut"]) {
      const v = params.get(key);
      if (v) next.set(key, v);
    }
    // Les filtres prix sont saisis en EUROS puis convertis en centimes.
    const map: Record<string, string> = {
      q: keyword.trim(),
      neighborhood,
      priceMin: priceMin ? String(Math.round(Number(priceMin) * 100)) : "",
      priceMax: priceMax ? String(Math.round(Number(priceMax) * 100)) : "",
      surfaceMin: surfaceMin.trim(),
      roomsMin: roomsMin.trim(),
      guests: guests.trim(),
      agent: agent.trim(),
    };
    for (const [k, v] of Object.entries(map)) {
      if (v) next.set(k, v);
    }
    router.push(`${annonces}?${next.toString()}`);
  }

  function reset() {
    setKeyword("");
    setNeighborhood("");
    setPriceMin("");
    setPriceMax("");
    setSurfaceMin("");
    setRoomsMin("");
    setGuests("");
    setAgent("");
    const status = params.get("status");
    router.push(status ? `${annonces}?status=${status}` : annonces);
  }

  return (
    <form
      onSubmit={apply}
      className="card sticky top-24 space-y-4 p-5"
      aria-label={dict.filters.ariaLabel}
    >
      <div>
        <label className="label" htmlFor="f-keyword">{dict.filters.city}</label>
        <input
          id="f-keyword"
          className="input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={dict.filters.cityPlaceholder}
        />
      </div>

      <div>
        <label className="label" htmlFor="f-neighborhood">{dict.filters.type}</label>
        <select
          id="f-neighborhood"
          className="input"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
        >
          <option value="">{dict.filters.allTypes}</option>
          {NEIGHBORHOODS.map((n) => (
            <option key={n.slug} value={n.name}>
              {n.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="label">{dict.filters.budget}</span>
        <div className="flex gap-2">
          <input
            className="input"
            type="number"
            min={0}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder={dict.filters.priceMin}
            aria-label={dict.filters.priceMinAria}
          />
          <input
            className="input"
            type="number"
            min={0}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder={dict.filters.priceMax}
            aria-label={dict.filters.priceMaxAria}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="f-surface">{dict.filters.surfaceMin}</label>
        <input
          id="f-surface"
          className="input"
          type="number"
          min={0}
          value={surfaceMin}
          onChange={(e) => setSurfaceMin(e.target.value)}
          placeholder={dict.filters.surfaceMinPlaceholder}
        />
      </div>

      <div>
        <label className="label" htmlFor="f-rooms">
          {shortTerm ? dict.filters.bedroomsMin : dict.filters.roomsMin}
        </label>
        <input
          id="f-rooms"
          className="input"
          type="number"
          min={0}
          value={roomsMin}
          onChange={(e) => setRoomsMin(e.target.value)}
          placeholder={dict.filters.roomsPlaceholder}
        />
      </div>

      {shortTerm && (
        <div>
          <label className="label" htmlFor="f-guests">{dict.filters.guests}</label>
          <input
            id="f-guests"
            className="input"
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            placeholder={dict.filters.guestsPlaceholder}
          />
        </div>
      )}

      {agents.length > 0 && (
        <div>
          <label className="label" htmlFor="f-agent">{dict.filters.agent}</label>
          <select
            id="f-agent"
            className="input"
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
          >
            <option value="">{dict.filters.allAgents}</option>
            {agents.map((a) => (
              <option key={a.slug} value={a.slug}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1">
          {dict.filters.apply}
        </button>
        <button type="button" onClick={reset} className="btn-outline">
          {dict.filters.reset}
        </button>
      </div>
    </form>
  );
}
