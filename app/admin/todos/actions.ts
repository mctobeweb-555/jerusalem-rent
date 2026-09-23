"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";

const MAX_LENGTH = 500;

export async function createTodo(text: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user || !user.agencyId) {
    return { ok: false, error: "Accès refusé" };
  }

  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Le message est vide." };
  if (trimmed.length > MAX_LENGTH) {
    return { ok: false, error: `Message trop long (${MAX_LENGTH} caractères max).` };
  }

  await prisma.todo.create({
    data: { text: trimmed, authorId: user.id, agencyId: user.agencyId },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/todos");
  return { ok: true };
}

// Tableau partagé par toute l'agence : n'importe quel agent peut supprimer
// une ligne (pas seulement son auteur), une fois la tâche faite.
export async function deleteTodo(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user || !user.agencyId) {
    return { ok: false, error: "Accès refusé" };
  }

  const todo = await prisma.todo.findUnique({ where: { id }, select: { agencyId: true } });
  if (!todo || todo.agencyId !== user.agencyId) {
    return { ok: false, error: "Introuvable." };
  }

  await prisma.todo.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/admin/todos");
  return { ok: true };
}
