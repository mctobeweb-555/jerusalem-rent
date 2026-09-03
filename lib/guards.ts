import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export type SessionUser = {
  id: string;
  role?: string;
  agencyId?: string;
  canManageAll?: boolean;
};

/**
 * Renvoie l'utilisateur de la session ou null.
 * À utiliser dans les routes /api/admin/* pour répondre 401 si absent.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    role: session.user.role,
    agencyId: session.user.agencyId,
    canManageAll: session.user.canManageAll,
  };
}

// Vrai si l'utilisateur peut gérer toutes les annonces de l'agence.
export function canManageAllProperties(user: SessionUser): boolean {
  return user.role === "ADMIN" || user.canManageAll === true;
}

/**
 * Filtre Prisma limitant l'accès aux annonces :
 * - ADMIN : toutes les annonces de son agence.
 * - AGENT : uniquement ses propres annonces (ownerId).
 */
export function propertyScope(user: SessionUser): Prisma.PropertyWhereInput {
  if (canManageAllProperties(user)) {
    return { agencyId: user.agencyId };
  }
  return { ownerId: user.id };
}

/**
 * Liste des agents (utilisateurs) d'une agence, pour l'assignation d'un bien.
 * Vide si l'utilisateur n'est pas ADMIN.
 */
export async function listAssignableAgents(user: SessionUser) {
  const { prisma } = await import("@/lib/db");
  if (user.role !== "ADMIN" || !user.agencyId) return [];
  return prisma.user.findMany({
    where: { agencyId: user.agencyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Vrai si l'utilisateur a le droit de modifier cette annonce. */
export function canEditProperty(
  user: SessionUser,
  property: { ownerId: string | null; agencyId: string },
): boolean {
  if (canManageAllProperties(user)) return property.agencyId === user.agencyId;
  return property.ownerId === user.id;
}
