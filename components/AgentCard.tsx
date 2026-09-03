import Image from "next/image";
import Link from "next/link";
import { localizedHref, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { PhoneIcon, MailIcon, GlobeIcon } from "@/components/icons";

export type AgentInfo = {
  slug: string | null;
  name: string;
  email: string;
  phone: string | null;
  title: string | null;
  avatarUrl: string | null;
  languages?: string[];
};

// Initiales pour le fallback d'avatar.
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AgentCard({
  agent,
  locale,
  dict,
}: {
  agent: AgentInfo;
  locale: Locale;
  dict: Dictionary["agentCard"];
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
        {dict.yourContact}
      </p>
      <div className="mt-3 flex items-center gap-3">
        {agent.avatarUrl ? (
          <Image
            src={agent.avatarUrl}
            alt={agent.name}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-100 font-semibold text-primary-700">
            {initials(agent.name)}
          </span>
        )}
        <div className="min-w-0">
          {agent.slug ? (
            <Link
              href={localizedHref(locale, `/agents/${agent.slug}`)}
              className="block truncate font-display text-base font-light uppercase tracking-[0.04em] text-stone-900 hover:text-primary-600"
            >
              {agent.name}
            </Link>
          ) : (
            <p className="truncate font-display text-base font-light uppercase tracking-[0.04em] text-stone-900">
              {agent.name}
            </p>
          )}
          <p className="truncate text-sm text-stone-500">
            {agent.title ?? dict.defaultTitle}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {agent.phone && (
          <a
            href={`tel:${agent.phone}`}
            className="flex items-center gap-2 text-stone-600 hover:text-primary-600"
          >
            <PhoneIcon className="h-4 w-4 shrink-0" />
            <span dir="ltr">{agent.phone}</span>
          </a>
        )}
        <a
          href={`mailto:${agent.email}`}
          className="flex items-center gap-2 text-stone-600 hover:text-primary-600"
        >
          <MailIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{agent.email}</span>
        </a>
      </div>

      {agent.languages && agent.languages.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-stone-100 pt-3">
          <GlobeIcon className="h-3.5 w-3.5 shrink-0 text-stone-400" />
          {agent.languages.map((l) => (
            <span key={l} className="badge bg-stone-100 text-xs text-stone-600">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
