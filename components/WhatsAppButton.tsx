"use client";

import { useState } from "react";
import { useDict } from "@/lib/i18n/context";

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// Bouton flottant WhatsApp : icône fixe en bas à droite, ouvre une bulle avec
// une phrase d'accroche et un CTA vers une conversation WhatsApp pré-remplie.
export default function WhatsAppButton({
  number,
  message,
}: {
  number: string;
  message: string;
}) {
  const [open, setOpen] = useState(false);
  const dict = useDict().whatsapp;
  const digits = number.replace(/\D/g, "");
  const waHref = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 no-print">
      {open && (
        <div className="mb-3 w-72 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lift">
          <div className="flex items-center justify-between gap-2 bg-primary-600 px-4 py-3">
            <div className="flex items-center gap-2 text-white">
              <PhoneIcon className="h-5 w-5" />
              <p className="text-sm font-semibold">{dict.heading}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={dict.closeAria}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            <p className="rounded-xl rounded-tl-sm bg-stone-100 p-3 text-sm text-stone-700">
              {message}
            </p>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              {dict.cta}
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? dict.closeAria : dict.openAria}
        aria-expanded={open}
        className="grid h-14 w-14 place-items-center rounded-full bg-primary-600 text-white shadow-lift transition hover:scale-105 hover:bg-primary-700"
      >
        {open ? (
          <span className="text-xl leading-none">✕</span>
        ) : (
          <PhoneIcon className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
