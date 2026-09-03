import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { locales } from "@/lib/i18n/config";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Alternates hreflang : une entrée par langue pour chaque URL, cohérent avec
// le routage /[locale]/… (toutes les langues préfixées, y compris le FR).
function withAlternates(path: string) {
  return Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${path}`]));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let properties: { slug: string; updatedAt: Date }[] = [];
  let agents: { slug: string | null }[] = [];
  try {
    [properties, agents] = await Promise.all([
      prisma.property.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.user.findMany({
        where: { slug: { not: null } },
        select: { slug: true },
      }),
    ]);
  } catch {
    // Base injoignable au build → sitemap limité aux routes statiques.
  }

  const staticPaths: {
    path: string;
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
    priority: number;
  }[] = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "/annonces", changeFrequency: "hourly", priority: 0.9 },
    { path: "/agents", changeFrequency: "weekly", priority: 0.6 },
    { path: "/qui-sommes-nous", changeFrequency: "monthly", priority: 0.4 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.4 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.4 },
  ];

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const s of staticPaths) {
      entries.push({
        url: `${siteUrl}/${locale}${s.path}`,
        changeFrequency: s.changeFrequency,
        priority: s.priority,
        alternates: { languages: withAlternates(s.path) },
      });
    }
    for (const p of properties) {
      entries.push({
        url: `${siteUrl}/${locale}/annonces/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages: withAlternates(`/annonces/${p.slug}`) },
      });
    }
    for (const a of agents) {
      if (!a.slug) continue;
      entries.push({
        url: `${siteUrl}/${locale}/agents/${a.slug}`,
        changeFrequency: "weekly",
        priority: 0.5,
        alternates: { languages: withAlternates(`/agents/${a.slug}`) },
      });
    }
  }

  return entries;
}
