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
    title: getDictionary(params.locale).meta.mentionsLegales,
    robots: { index: false, follow: true },
  };
}

export default function MentionsLegalesPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const d = getDictionary(params.locale).legal.mentions;

  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="font-display text-3xl font-light uppercase tracking-[0.1em] text-primary-900">
        {d.title}
      </h1>

      <div className="mt-8 space-y-8 leading-relaxed text-stone-600">
        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.editorHeading}</h2>
          <p className="mt-3 whitespace-pre-line">{d.editorBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.hostingHeading}</h2>
          <p className="mt-3">{d.hostingBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.activityHeading}</h2>
          <ul className="mt-3 list-disc space-y-1 ps-5">
            {d.activityItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-stone-400">{d.activityNote}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.ipHeading}</h2>
          <p className="mt-3">{d.ipBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.dataHeading}</h2>
          <p className="mt-3">{d.dataBody}</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
            {d.mediationHeading}</h2>
          <p className="mt-3">{d.mediationBody}</p>
        </section>
      </div>
    </div>
  );
}
