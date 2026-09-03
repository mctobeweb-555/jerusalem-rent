// Vérification Cloudflare Turnstile — OPTIONNELLE.
// Si TURNSTILE_SECRET_KEY n'est pas défini, on considère la vérif comme réussie
// (utile en local / démo). En prod, renseigner la clé pour activer l'anti-spam.

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileEnabled(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

export async function verifyTurnstile(
  token: string | undefined,
  ip?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // désactivé → on laisse passer

  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // En cas d'erreur réseau, on refuse par prudence (fail-closed).
    return false;
  }
}
