import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSiteMode } from "@/lib/site-settings";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { isLocale, localizedHref, type Locale } from "@/lib/i18n/config";
import { ChevronDownIcon } from "@/components/icons";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  return getDictionary(params.locale).meta.faq;
}

// Dépend de la config du site (vente/location/court terme) → pas de prerender statique.
export const dynamic = "force-dynamic";

type QA = { q: string; a: React.ReactNode };

function faqItems(
  mode: Awaited<ReturnType<typeof getSiteMode>>,
  dict: Dictionary,
  locale: Locale,
): QA[] {
  const f = dict.faq.items;
  const items: QA[] = [
    { q: f.visit.q, a: f.visit.a },
    { q: f.upToDate.q, a: f.upToDate.a },
    { q: f.favorites.q, a: f.favorites.a },
  ];

  if (mode.showSale) {
    items.push({ q: f.sale.q, a: f.sale.a });
  }
  if (mode.showRent) {
    items.push({ q: f.rent.q, a: f.rent.a });
  }
  if (mode.showShortTerm) {
    items.push(
      { q: f.shortTermCheckin.q, a: f.shortTermCheckin.a },
      { q: f.shortTermDeposit.q, a: f.shortTermDeposit.a },
    );
  }

  items.push({ q: f.contactDirect.q, a: f.contactDirect.a });

  return items;
}

export default async function FaqPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dict = getDictionary(locale);
  const mode = await getSiteMode();
  const items = faqItems(mode, dict, locale);

  return (
    <div className="container-page max-w-3xl py-16 sm:py-20">
      <h1 className="font-display text-3xl font-light uppercase tracking-[0.15em] text-primary-900">
        {dict.faq.title}
      </h1>
      <p className="mt-4 text-stone-500">
        {dict.faq.subtitle}{" "}
        <Link href={localizedHref(locale, "/contact")} className="text-primary-600 hover:text-primary-700">
          {dict.faq.contactLinkText}
        </Link>
        .
      </p>

      <div className="mt-10 space-y-3">
        {items.map((item) => (
          <details key={item.q} className="card group p-5">
            <summary className="cursor-pointer list-none font-medium text-stone-900 marker:content-none">
              <span className="flex items-center justify-between gap-4">
                {item.q}
                <ChevronDownIcon className="h-4 w-4 shrink-0 text-stone-400 transition group-open:rotate-180" />
              </span>
            </summary>
            <p className="mt-3 leading-relaxed text-stone-600">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
