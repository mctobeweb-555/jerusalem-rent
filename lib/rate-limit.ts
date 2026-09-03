// Rate-limit basique en mémoire (fenêtre glissante par IP).
//
// ⚠️ LIMITE CONNUE : le Map vit dans le process. En serverless multi-instances
// ou après un redéploiement, le compteur repart de zéro. Suffisant pour démarrer
// et pour un déploiement mono-instance ; passer à Redis / Upstash pour la prod.

type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param key     identifiant (typiquement l'IP)
 * @param limit   nombre de requêtes autorisées par fenêtre
 * @param windowMs durée de la fenêtre en millisecondes
 */
export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** Extrait une IP raisonnable depuis les en-têtes d'une requête. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

// Nettoyage périodique pour éviter la fuite mémoire.
if (typeof setInterval !== "undefined") {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, hit] of buckets) {
      if (hit.resetAt < now) buckets.delete(key);
    }
  }, 5 * 60_000);
  // Ne pas maintenir le process en vie juste pour ce timer.
  if (typeof interval.unref === "function") interval.unref();
}
