"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCookieConsent, writeCookieConsent } from "@/lib/cookie-consent";
import { useDict, useLocale } from "@/lib/i18n/context";
import { localizedHref } from "@/lib/i18n/config";

// Bandeau de consentement cookies (conforme CNIL). Aucun cookie de mesure
// d'audience n'est câblé à ce jour (voir /confidentialite) : le bandeau pose
// déjà le choix pour anticiper un futur outil analytics sans revalidation.
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const dict = useDict().cookie;
  const locale = useLocale();

  useEffect(() => {
    if (readCookieConsent() === null) setVisible(true);
  }, []);

  function choose(analytics: boolean) {
    writeCookieConsent(analytics);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white shadow-lift no-print">
      <div className="container-page flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          {dict.message}{" "}
          <Link
            href={localizedHref(locale, "/confidentialite")}
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            {dict.learnMore}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => choose(false)} className="btn-outline">
            {dict.refuse}
          </button>
          <button type="button" onClick={() => choose(true)} className="btn-primary">
            {dict.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
