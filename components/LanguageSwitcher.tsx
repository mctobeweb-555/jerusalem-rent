"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, LOCALE_SHORT_LABELS, type Locale } from "@/lib/i18n/config";
import { useDict, useLocale } from "@/lib/i18n/context";

// Sélecteur compact FR / EN / HE dans un petit encadré (segmented control),
// pour bien distinguer la langue active des deux autres — remplace l'ancien
// <select> avec les noms complets des langues.
export default function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const locale = useLocale();
  const dict = useDict();

  function switchTo(next: Locale) {
    if (next === locale) return;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
    const rest = pathname.split("/").slice(2).join("/");
    router.push(`/${next}${rest ? `/${rest}` : ""}`);
  }

  return (
    <div
      role="group"
      aria-label={dict.languageSwitcher.label}
      className={"inline-flex items-center rounded-lg border border-stone-300 p-0.5 " + (className ?? "")}
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          aria-pressed={l === locale}
          className={
            "rounded-[5px] px-2 py-1 text-xs font-medium tracking-wide transition " +
            (l === locale
              ? "bg-primary-600 text-white"
              : "text-stone-600 hover:text-stone-900")
          }
        >
          {LOCALE_SHORT_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
