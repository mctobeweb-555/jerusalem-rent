import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, emailLayout, emailEyebrow, emailHeading, emailButton, emailColors } from "@/lib/email";

const bodySchema = z.object({ email: z.string().email() });

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

// POST /api/auth/forgot-password — demande publique d'un lien de
// réinitialisation. Ne révèle jamais si l'email existe (réponse générique
// dans tous les cas), pour ne pas servir d'oracle d'énumération de comptes.
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`forgot-password:${ip}`, 5, 15 * 60_000);
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
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const resetUrl = `${site}/reset-password/${rawToken}`;

    const body = `
${emailEyebrow("Espace professionnel")}
${emailHeading("Réinitialisation de votre mot de passe")}
<p style="margin:0 0 20px;color:${emailColors.INK};line-height:1.6;">Bonjour ${escapeHtml(user.name)},</p>
<p style="margin:0 0 24px;color:${emailColors.INK};line-height:1.6;">Une demande de réinitialisation de mot de passe a été effectuée pour votre compte. Ce lien est valable 1 heure.</p>
<p style="margin:0 0 24px;">${emailButton(resetUrl, "Réinitialiser mon mot de passe")}</p>
<p style="margin:0;color:${emailColors.MUTED};font-size:13px;line-height:1.6;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email : votre mot de passe reste inchangé.</p>`;

    // Best-effort : n'échoue jamais la réponse générique.
    try {
      await sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe — Jerusalem Rent",
        html: emailLayout(body, { preheader: "Lien valable 1 heure." }),
      });
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
