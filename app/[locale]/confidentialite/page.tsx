import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  return {
    title: getDictionary(params.locale).meta.confidentialite,
    robots: { index: false, follow: true },
  };
}

export default function ConfidentialitePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const d = getDictionary(locale).legal.privacy;
  const dateStr = new Date().toLocaleDateString(
    locale === "fr" ? "fr-FR" : locale === "he" ? "he-IL" : "en-US",
  );

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="font-display text-3xl font-light uppercase tracking-[0.1em] text-primary-900">
        {d.title}
      </h1>
      <p className="mt-3 text-sm text-stone-400">{d.lastUpdated(dateStr)}</p>

      <div className="mt-8 space-y-8 leading-relaxed text-stone-600">
        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.controllerHeading}</h2>
          <p className="mt-3">{d.controllerBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.dataHeading}</h2>
          <ul className="mt-3 list-disc space-y-2 ps-5">
            {d.dataItems.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong> — {item.desc}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.purposeHeading}</h2>
          <p className="mt-3">{d.purposeBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.retentionHeading}</h2>
          <p className="mt-3">{d.retentionBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.recipientsHeading}</h2>
          <p className="mt-3">{d.recipientsBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.rightsHeading}</h2>
          <p className="mt-3">{d.rightsBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.cookiesHeading}</h2>
          <p className="mt-3">{d.cookiesBody1}</p>
          <p className="mt-3">{d.cookiesBody2}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.securityHeading}</h2>
          <p className="mt-3">{d.securityBody}</p>
        </section>
      </div>
    </div>
  );
}
