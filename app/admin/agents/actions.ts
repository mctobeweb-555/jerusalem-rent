"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";

async function assertAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") throw new Error("Accès refusé");
  return user;
}

/**
 * Supprime un agent (server action, ADMIN uniquement). Les annonces dont il
 * était propriétaire ne sont pas supprimées : `ownerId` repasse à null
 * (ON DELETE SET NULL en base), l'annonce reste visible/assignable à un
 * autre agent depuis sa fiche.
 */
export async function deleteAgent(id: string) {
  const user = await assertAdmin();
  if (id === user.id) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { agencyId: true },
  });
  if (!target || target.agencyId !== user.agencyId) {
    throw new Error("Introuvable.");
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/agents");
}
