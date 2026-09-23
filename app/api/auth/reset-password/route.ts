import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

// POST /api/auth/reset-password — consomme un token valide et écrit le
// nouveau mot de passe. Le token n'est comparé que sous forme de hash
// (jamais stocké en clair) et est marqué "usedAt" pour ne resservir qu'une
// seule fois, même s'il n'a pas encore expiré.
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`reset-password:${ip}`, 10, 15 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Mot de passe invalide (8 caractères minimum)." },
      { status: 400 },
    );
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Ce lien est invalide ou a expiré. Demandez-en un nouveau." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
