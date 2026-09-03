import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import { leadStatusUpdateSchema } from "@/lib/validations";

type Ctx = { params: { id: string } };

// PATCH /api/admin/leads/[id] — mise à jour du statut d'un lead (protégé).
export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      property: { select: { agencyId: true, ownerId: true } },
    },
  });
  if (!lead) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  // Scoping : un AGENT ne gère que les leads liés à ses annonces.
  // Les leads non rattachés à un bien restent réservés aux ADMIN.
  if (user.role !== "ADMIN") {
    const linkedToAgent = lead.property?.ownerId === user.id;
    if (!linkedToAgent) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  } else if (lead.property && lead.property.agencyId !== user.agencyId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = leadStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Statut invalide", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await prisma.lead.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
    select: { id: true, status: true },
  });

  return NextResponse.json(updated);
}
