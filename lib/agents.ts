import { prisma } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";

// Champs de profil public d'un agent.
const agentProfileSelect = {
  id: true,
  slug: true,
  name: true,
  email: true,
  phone: true,
  title: true,
  avatarUrl: true,
  languages: true,
} as const;

// Normalise le champ Json `languages` en tableau de chaînes.
function toLanguages(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/**
 * Annuaire : tous les utilisateurs pouvant porter des biens, avec le nombre
 * d'annonces publiées. Triés par volume décroissant puis nom.
 */
export async function listAgents() {
  const users = await prisma.user.findMany({
    select: {
      ...agentProfileSelect,
      _count: {
        select: { properties: { where: { published: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return users
    .map((u) => ({
      id: u.id,
      slug: u.slug,
      name: u.name,
      email: u.email,
      phone: u.phone,
      title: u.title,
      avatarUrl: u.avatarUrl,
      languages: toLanguages(u.languages),
      publishedCount: u._count.properties,
    }))
    .sort((a, b) => b.publishedCount - a.publishedCount || a.name.localeCompare(b.name));
}

/** Un agent par son slug, avec ses annonces publiées (photo principale). */
export async function getAgentBySlug(slug: string, locale: Locale = "fr") {
  const agent = await prisma.user.findUnique({
    where: { slug },
    select: {
      ...agentProfileSelect,
      properties: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          translations: locale === "fr" ? undefined : { where: { locale } },
        },
      },
    },
  });
  if (!agent) return null;
  return { ...agent, languages: toLanguages(agent.languages) };
}
