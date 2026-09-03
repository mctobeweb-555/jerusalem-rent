"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser, canEditProperty } from "@/lib/guards";

async function assertCanEdit(id: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifié");
  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, ownerId: true, agencyId: true, published: true },
  });
  if (!property) throw new Error("Introuvable");
  if (!canEditProperty(user, property)) throw new Error("Accès refusé");
  return property;
}

/** Bascule la publication d'une annonce (server action). */
export async function togglePublish(id: string) {
  const property = await assertCanEdit(id);
  await prisma.property.update({
    where: { id },
    data: { published: !property.published },
  });
  revalidatePath("/admin/properties");
  revalidatePath("/admin");
}

/** Supprime une annonce (server action). */
export async function deleteProperty(id: string) {
  await assertCanEdit(id);
  await prisma.property.delete({ where: { id } });
  revalidatePath("/admin/properties");
  revalidatePath("/admin");
}
