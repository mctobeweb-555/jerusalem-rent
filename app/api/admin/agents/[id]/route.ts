import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import { agentUpdateSchema } from "@/lib/validations";

type Ctx = { params: { id: string } };

// PUT /api/admin/agents/[id] — mise à jour d'un agent (ADMIN uniquement).
export async function PUT(req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "ADMIN" || !user.agencyId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, agencyId: true },
  });
  if (!target || target.agencyId !== user.agencyId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = agentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Un admin ne peut pas se retirer à lui-même le rôle ADMIN (évite l'auto-verrouillage).
  if (target.id === user.id && data.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Vous ne pouvez pas modifier votre propre rôle." },
      { status: 400 },
    );
  }

  // Email unique (hors utilisateur courant).
  const emailOwner = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (emailOwner && emailOwner.id !== target.id) {
    return NextResponse.json(
      { error: "Un autre utilisateur utilise déjà cet email." },
      { status: 409 },
    );
  }

  const updateData: Record<string, unknown> = {
    name: data.name,
    email: data.email,
    role: data.role,
    phone: data.phone || null,
    title: data.title || null,
    avatarUrl: data.avatarUrl || null,
    canManageAll: data.canManageAll ?? false,
    languages: data.languages ?? [],
  };
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: updateData,
    select: { id: true, slug: true },
  });

  return NextResponse.json(updated);
}
