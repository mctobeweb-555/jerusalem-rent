import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const { GET } = handlers;

// Rate-limit anti-bruteforce sur la soumission du formulaire de connexion
// (callback credentials) — les autres sous-routes NextAuth appelées en POST
// (session, csrf, signout...) ne valident pas de mot de passe et restent libres.
export async function POST(req: NextRequest) {
  if (new URL(req.url).pathname.endsWith("/callback/credentials")) {
    const ip = getClientIp(req);
    const rl = rateLimit(`login:${ip}`, 10, 5 * 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de tentatives de connexion. Réessayez dans quelques minutes." },
        { status: 429 },
      );
    }
  }
  return handlers.POST(req);
}
