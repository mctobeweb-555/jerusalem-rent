"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import GuestsPicker, { type Guests } from "@/components/GuestsPicker";
import { useDict } from "@/lib/i18n/context";

type State = "idle" | "sending" | "sent" | "error";

// Préremplissage éventuel depuis la recherche (?checkIn=&checkOut=&adults=...).
// Lu ici via useSearchParams (client) plutôt que reçu en prop depuis la page
// serveur — la fiche annonce peut ainsi rester statique/ISR (generateStaticParams)
// sans dépendre de `searchParams`, qui forcerait tout le rendu en dynamique.
function useDefaultsFromQuery() {
  const params = useSearchParams();
  const get = (k: string) => params.get(k) ?? undefined;
  const toInt = (v?: string) => {
    const n = v ? parseInt(v, 10) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };
  const hasGuestParams =
    get("adults") || get("children") || get("babies") || get("guests");
  return {
    checkIn: get("checkIn"),
    checkOut: get("checkOut"),
    guests: hasGuestParams
      ? {
          adults: toInt(get("adults")) ?? toInt(get("guests")) ?? 1,
          children: toInt(get("children")) ?? 0,
          babies: toInt(get("babies")) ?? 0,
        }
      : undefined,
  };
}

// Formulaire de demande de réservation (mode court terme) : dates + voyageurs.
export default function ReservationForm({
  propertyId,
  propertyTitle,
  maxGuests,
}: {
  propertyId?: string;
  propertyTitle?: string;
  maxGuests?: number | null;
}) {
  const dict = useDict().reservationForm;
  const defaults = useDefaultsFromQuery();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState(defaults.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(defaults.checkOut ?? "");
  const [guests, setGuests] = useState<Guests>(
    defaults.guests ?? { adults: 1, children: 0, babies: 0 },
  );

  const today = new Date().toISOString().slice(0, 10);
  const totalGuests = guests.adults + guests.children;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    // Contrôle capacité (adultes + enfants ; les bébés ne comptent pas).
    if (maxGuests && totalGuests > maxGuests) {
      setError(dict.capacityError(maxGuests));
      setState("idle");
      return;
    }

    const payload: Record<string, string> = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: String(data.get("message") ?? "Demande de réservation."),
      honeypot: String(data.get("company") ?? ""),
      checkIn: String(data.get("checkIn") ?? ""),
      checkOut: String(data.get("checkOut") ?? ""),
      guests: String(totalGuests),
      adults: String(guests.adults),
      children: String(guests.children),
      babies: String(guests.babies),
    };
    if (propertyId) payload.propertyId = propertyId;

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Envoi impossible");
      setState("sent");
      form.reset();
    } catch {
      setState("error");
      setError(dict.genericError);
    }
  }

  if (state === "sent") {
    return (
      <div className="card p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-100 text-primary-700">
          ✓
        </div>
        <h3 className="mt-3 font-display text-lg font-light uppercase tracking-[0.1em]">
          {dict.sentTitle}
        </h3>
        <p className="mt-1 text-sm text-stone-500">{dict.sentDesc}</p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="btn-outline mt-4"
        >
          {dict.newRequest}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <div>
        <h3 className="font-display text-lg font-light uppercase tracking-[0.1em]">
          {dict.heading}
        </h3>
        {propertyTitle && (
          <p className="mt-1 text-sm text-stone-500">{dict.for(propertyTitle)}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="checkIn">{dict.checkIn} *</label>
          <input
            id="checkIn"
            name="checkIn"
            type="date"
            required
            min={today}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="checkOut">{dict.checkOut} *</label>
          <input
            id="checkOut"
            name="checkOut"
            type="date"
            required
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">{dict.guestsLabel(maxGuests)}</label>
        <GuestsPicker value={guests} onChange={setGuests} />
      </div>

      <div>
        <label className="label" htmlFor="name">{dict.name} *</label>
        <input id="name" name="name" required minLength={2} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="email">{dict.email} *</label>
        <input id="email" name="email" type="email" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="phone">{dict.phone}</label>
        <input id="phone" name="phone" type="tel" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="message">{dict.message}</label>
        <textarea id="message" name="message" rows={3} className="input resize-y" />
      </div>

      {/* Honeypot anti-spam */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Ne pas remplir</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={state === "sending"}
      >
        {state === "sending" ? dict.sending : dict.submit}
      </button>
    </form>
  );
}
