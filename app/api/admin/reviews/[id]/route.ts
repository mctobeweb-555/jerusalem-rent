import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import { reviewInputSchema } from "@/lib/validations";
import { sanitizeReviewComment } from "@/lib/reviews";

type Ctx = { params: { id: string } };

// PUT /api/admin/reviews/[id] — mise à jour d'un avis (ADMIN uniquement).
export async function PUT(req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "ADMIN" || !user.agencyId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const target = await prisma.review.findUnique({
    where: { id: params.id },
    select: { id: true, property: { select: { agencyId: true } } },
  });
  if (!target || (target.property && target.property.agencyId !== user.agencyId)) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = reviewInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  if (data.propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { agencyId: true },
    });
    if (!property || property.agencyId !== user.agencyId) {
      return NextResponse.json(
        { error: "Annonce introuvable" },
        { status: 404 },
      );
    }
  }

  const updated = await prisma.review.update({
    where: { id: target.id },
    data: {
      propertyId: data.propertyId || null,
      authorName: data.authorName,
      rating: data.rating,
      comment: sanitizeReviewComment(data.comment),
      avatarUrl: data.avatarUrl || null,
      published: data.published,
    },
    select: { id: true },
  });

  return NextResponse.json(updated);
}
