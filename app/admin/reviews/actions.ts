"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";

async function assertAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") throw new Error("Accès refusé");
  return user;
}

/** Bascule la publication d'un avis (server action). */
export async function toggleReviewPublished(id: string) {
  await assertAdmin();
  const review = await prisma.review.findUniqueOrThrow({
    where: { id },
    select: { published: true },
  });
  await prisma.review.update({
    where: { id },
    data: { published: !review.published },
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

/** Supprime un avis (server action). */
export async function deleteReview(id: string) {
  await assertAdmin();
  await prisma.review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}
