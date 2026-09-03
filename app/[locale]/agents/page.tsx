import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listAgents } from "@/lib/agents";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, localizedHref } from "@/lib/i18n/config";
import { GlobeIcon } from "@/components/icons";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  return getDictionary(params.locale).meta.agents;
}

export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AgentsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const d = getDictionary(locale).agentsPage;
  const agents = await listAgents();

  return (
    <div className="container-page py-16 sm:py-20">
      <div className="mb-12 text-center">
        <h1 className="font-display text-3xl font-light uppercase tracking-[0.15em] text-primary-900">
          {d.title}
        </h1>
        <p className="mt-4 text-stone-500">{d.subtitle}</p>
      </div>

      {agents.length === 0 ? (
        <p className="text-stone-500">{d.empty}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const href = agent.slug ? localizedHref(locale, `/agents/${agent.slug}`) : null;
            const card = (
              <>
                <div className="flex items-center gap-4">
                  {agent.avatarUrl ? (
                    <Image
                      src={agent.avatarUrl}
                      alt={agent.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
                      {initials(agent.name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-stone-900">
                      {agent.name}
                    </p>
                    <p className="truncate text-sm text-stone-500">
                      {agent.title ?? "—"}
                    </p>
                    {agent.languages.length > 0 && (
                      <p className="mt-1 flex items-center gap-1 truncate text-xs text-stone-400">
                        <GlobeIcon className="h-3 w-3 shrink-0" /> {agent.languages.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
                  <span className="badge bg-primary-100 text-primary-700">
                    {d.propertyCount(agent.publishedCount)}
                  </span>
                  {href && (
                    <span className="text-sm font-semibold text-primary-600">
                      {d.viewPortfolio}
                    </span>
                  )}
                </div>
              </>
            );

            return href ? (
              <Link
                key={agent.id}
                href={href}
                className="card block p-5 transition hover:shadow-lift"
              >
                {card}
              </Link>
            ) : (
              <div key={agent.id} className="card p-5">
                {card}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
