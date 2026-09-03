import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgentBySlug } from "@/lib/agents";
import PropertyCard from "@/components/PropertyCard";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, localizedHref, type Locale } from "@/lib/i18n/config";
import { withTranslatedTitle } from "@/lib/i18n/property-translation";
import { PhoneIcon, MailIcon, GlobeIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const agent = await getAgentBySlug(params.slug, params.locale as Locale);
  if (!agent) return { title: "Not found" };
  const d = getDictionary(params.locale).agentsPage;
  return {
    title: d.detailTitle(agent.name),
    description: d.detailDesc(agent.name, agent.title ?? ""),
    alternates: { canonical: `/${params.locale}/agents/${agent.slug}` },
  };
}

export default async function AgentPage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = getDictionary(locale);
  const d = dict.agentsPage;
  const href = (path: string) => localizedHref(locale, path);

  const agent = await getAgentBySlug(params.slug, params.locale as Locale);
  if (!agent) notFound();

  const count = agent.properties.length;

  return (
    <div className="container-page py-10">
      {/* Fil d'ariane */}
      <nav aria-label={dict.property.breadcrumbHome} className="mb-5 text-sm text-stone-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={href("/")} className="hover:text-primary-600">{dict.property.breadcrumbHome}</Link>
          </li>
          <li aria-hidden>›</li>
          <li>
            <Link href={href("/agents")} className="hover:text-primary-600">{dict.nav.agents}</Link>
          </li>
          <li aria-hidden>›</li>
          <li className="text-stone-700">{agent.name}</li>
        </ol>
      </nav>

      {/* En-tête profil */}
      <header className="card flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
        {agent.avatarUrl ? (
          <Image
            src={agent.avatarUrl}
            alt={agent.name}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-24 w-24 place-items-center rounded-full bg-primary-100 text-2xl font-semibold text-primary-700">
            {initials(agent.name)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium uppercase tracking-wide text-primary-600">
            {agent.title ?? "—"}
          </p>
          <h1 className="mt-1 font-display text-3xl font-light uppercase tracking-[0.06em] text-stone-900">
            {agent.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
            {agent.phone && (
              <a href={`tel:${agent.phone}`} className="flex items-center gap-1.5 hover:text-primary-600">
                <PhoneIcon className="h-4 w-4" /> <span dir="ltr">{agent.phone}</span>
              </a>
            )}
            <a href={`mailto:${agent.email}`} className="flex items-center gap-1.5 hover:text-primary-600">
              <MailIcon className="h-4 w-4" /> {agent.email}
            </a>
          </div>
          {agent.languages.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <GlobeIcon className="h-3.5 w-3.5 text-stone-400" />
              {agent.languages.map((l) => (
                <span key={l} className="badge bg-stone-100 text-xs text-stone-600">
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>

        <span className="badge bg-primary-100 text-primary-700">
          {d.portfolioCount(count)}
        </span>
      </header>

      {/* Biens de l'agent */}
      <div className="mt-16">
        <h2 className="font-display text-2xl font-light uppercase tracking-[0.15em] text-primary-900">
          {d.allProperties(agent.name)}
        </h2>

        {count === 0 ? (
          <div className="card mt-6 grid place-items-center p-12 text-center">
            <p className="text-stone-500">{d.noProperties}</p>
            <Link href={href("/annonces")} className="btn-primary mt-4">
              {d.browseListings}
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agent.properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={withTranslatedTitle(p, locale)}
                locale={locale}
                dict={dict}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
