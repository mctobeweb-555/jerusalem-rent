import type { Prisma } from "@prisma/client";
import { canManageAllProperties, type SessionUser } from "@/lib/guards";

export type LeadFilterParams = {
  property?: string;
  agent?: string;
  status?: string;
  category?: string; // sale | rent | short
  q?: string;
  from?: string;
  to?: string;
};

export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED"];

// Familles de statuts d'annonce par catégorie de lead.
export const CATEGORY_STATUSES: Record<string, string[]> = {
  sale: ["FOR_SALE", "SOLD"],
  rent: ["FOR_RENT", "RENTED"],
  short: ["SHORT_TERM"],
};

/**
 * Construit le filtre Prisma des leads à partir des paramètres de recherche,
 * en respectant le périmètre de l'utilisateur (toute l'agence ou ses propres
 * annonces uniquement). Partagé entre la page /admin/leads et l'export CSV
 * pour garantir que l'export correspond exactement à l'affichage filtré.
 */
export function buildLeadWhere(
  user: SessionUser,
  params: LeadFilterParams,
): Prisma.LeadWhereInput {
  const manageAll = canManageAllProperties(user);
  const conditions: Prisma.LeadWhereInput[] = [];

  // Scoping : gestion de toute l'agence ou seulement ses annonces.
  if (manageAll) {
    conditions.push({
      OR: [{ property: { agencyId: user.agencyId } }, { propertyId: null }],
    });
  } else {
    conditions.push({ property: { ownerId: user.id } });
  }

  // Recherche texte (nom, email, message).
  if (params.q) {
    conditions.push({
      OR: [
        { name: { contains: params.q, mode: "insensitive" } },
        { email: { contains: params.q, mode: "insensitive" } },
        { message: { contains: params.q, mode: "insensitive" } },
      ],
    });
  }

  // Plage de dates (createdAt).
  if (params.from || params.to) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (params.from) createdAt.gte = new Date(params.from);
    if (params.to) {
      const end = new Date(params.to);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    conditions.push({ createdAt });
  }

  // Filtre par annonce.
  if (params.property) conditions.push({ propertyId: params.property });

  // Filtre par agent (via l'annonce liée). Réservé aux gestionnaires globaux.
  if (params.agent && manageAll) {
    conditions.push({ property: { owner: { slug: params.agent } } });
  }

  // Filtre par statut du lead.
  if (params.status && LEAD_STATUSES.includes(params.status)) {
    conditions.push({ status: params.status as never });
  }

  // Filtre par catégorie (via le statut de l'annonce liée).
  if (params.category && CATEGORY_STATUSES[params.category]) {
    conditions.push({
      property: { status: { in: CATEGORY_STATUSES[params.category] as never } },
    });
  }

  return { AND: conditions };
}
