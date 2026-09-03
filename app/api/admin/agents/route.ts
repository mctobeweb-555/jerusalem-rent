import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import { agentCreateSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

// POST /api/admin/agents — créer un agent/utilisateur (ADMIN uniquement).
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "ADMIN" || !user.agencyId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = agentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Email unique.
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Un utilisateur avec cet email existe déjà." },
      { status: 409 },
    );
  }

  // Slug unique (suffixe si collision).
  const base = slugify(data.name) || "agent";
  let slug = base;
  let attempt = 0;
  while (await prisma.user.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const created = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      slug,
      phone: data.phone || null,
      title: data.title || null,
      avatarUrl: data.avatarUrl || null,
      canManageAll: data.canManageAll ?? false,
      languages: data.languages ?? [],
      agencyId: user.agencyId,
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json(created, { status: 201 });
}
