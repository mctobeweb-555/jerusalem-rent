import Link from "next/link";
import { cn } from "@/lib/utils";
import { localizedHref, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

// Pagination crawlable : de vrais <Link href="?page=N">, pas de JS-only.
export default function Pagination({
  current,
  totalPages,
  baseParams,
  locale,
  dict,
}: {
  current: number;
  totalPages: number;
  baseParams: Record<string, string>;
  locale: Locale;
  dict: Dictionary["pagination"];
}) {
  if (totalPages <= 1) return null;

  function hrefFor(page: number): string {
    const params = new URLSearchParams(baseParams);
    params.set("page", String(page));
    return `${localizedHref(locale, "/annonces")}?${params.toString()}`;
  }

  // Fenêtre de pages avec ellipses.
  const pages: (number | "…")[] = [];
  const push = (p: number | "…") => pages.push(p);
  const window = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - current) <= window) {
      push(p);
    } else if (pages[pages.length - 1] !== "…") {
      push("…");
    }
  }

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-1.5"
      aria-label={dict.ariaLabel}
    >
      {current > 1 && (
        <Link href={hrefFor(current - 1)} className="btn-outline px-3 py-2" rel="prev">
          {dict.previous}
        </Link>
      )}

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-stone-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === current ? "page" : undefined}
            className={cn(
              "grid h-10 min-w-10 place-items-center rounded-xl px-3 text-sm font-medium transition",
              p === current
                ? "bg-primary-600 text-white shadow-sm"
                : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
            )}
          >
            {p}
          </Link>
        ),
      )}

      {current < totalPages && (
        <Link href={hrefFor(current + 1)} className="btn-outline px-3 py-2" rel="next">
          {dict.next}
        </Link>
      )}
    </nav>
  );
}
