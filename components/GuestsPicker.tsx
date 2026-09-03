"use client";

import { useEffect, useRef, useState } from "react";
import { useDict } from "@/lib/i18n/context";

export type Guests = { adults: number; children: number; babies: number };

// Sélecteur de voyageurs façon moderne : adultes / enfants / bébés avec compteurs.
export default function GuestsPicker({
  value,
  onChange,
  className,
}: {
  value: Guests;
  onChange: (g: Guests) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dict = useDict().guestsPicker;

  const ROWS: { key: keyof Guests; label: string; hint: string; min: number }[] = [
    { key: "adults", label: dict.adults, hint: dict.adultsHint, min: 1 },
    { key: "children", label: dict.children, hint: dict.childrenHint, min: 0 },
    { key: "babies", label: dict.babies, hint: dict.babiesHint, min: 0 },
  ];

  function summary(g: Guests): string {
    const total = g.adults + g.children;
    const parts = [dict.travelerCount(total)];
    if (g.babies > 0) parts.push(dict.babyCount(g.babies));
    return parts.join(", ");
  }

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function step(key: keyof Guests, delta: number, min: number) {
    const next = Math.max(min, Math.min(50, value[key] + delta));
    onChange({ ...value, [key]: next });
  }

  return (
    <div ref={ref} className={"relative " + (className ?? "")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input flex w-full items-center justify-between text-start"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">{summary(value)}</span>
        <span className="ms-2 text-stone-400">▾</span>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-30 mt-2 rounded-xl border border-stone-200 bg-white p-2 shadow-lift"
          role="dialog"
        >
          {ROWS.map((r) => (
            <div
              key={r.key}
              className="flex items-center justify-between gap-4 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-stone-900">{r.label}</p>
                <p className="text-xs text-stone-400">{r.hint}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => step(r.key, -1, r.min)}
                  disabled={value[r.key] <= r.min}
                  className="grid h-8 w-8 place-items-center rounded-full border border-stone-300 text-stone-600 disabled:opacity-40"
                  aria-label={`− ${r.label}`}
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-medium">
                  {value[r.key]}
                </span>
                <button
                  type="button"
                  onClick={() => step(r.key, +1, r.min)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-stone-300 text-stone-600"
                  aria-label={`+ ${r.label}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
