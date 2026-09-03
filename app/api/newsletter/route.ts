import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newsletterSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/newsletter — inscription publique à la newsletter.
// Idempotent : un email déjà inscrit renvoie ok sans erreur.
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`nl:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email invalide", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { email, honeypot } = parsed.data;

  // Honeypot rempli → bot : on répond ok silencieusement sans enregistrer.
  if (honeypot && honeypot.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const normalized = email.toLowerCase();

  // Upsert : réinscrit (active) sans dupliquer, efface une éventuelle
  // désinscription antérieure.
  await prisma.newsletterSubscriber.upsert({
    where: { email: normalized },
    update: { active: true, unsubscribedAt: null },
    create: { email: normalized },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
