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
    title: getDictionary(params.locale).meta.cgu,
    robots: { index: false, follow: true },
  };
}

export default function CguPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const d = getDictionary(params.locale).legal.cgu;

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="font-display text-3xl font-light uppercase tracking-[0.1em] text-primary-900">
        {d.title}
      </h1>

      <div className="mt-8 space-y-8 leading-relaxed text-stone-600">
        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.objectHeading}</h2>
          <p className="mt-3">{d.objectBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.accessHeading}</h2>
          <p className="mt-3">{d.accessBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.listingsHeading}</h2>
          <p className="mt-3">{d.listingsBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.formsHeading}</h2>
          <p className="mt-3">{d.formsBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.thirdPartyHeading}</h2>
          <p className="mt-3">{d.thirdPartyBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.ipHeading}</h2>
          <p className="mt-3">{d.ipBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.changesHeading}</h2>
          <p className="mt-3">{d.changesBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.lawHeading}</h2>
          <p className="mt-3">{d.lawBody}</p>
        </section>
      </div>
    </div>
  );
}
