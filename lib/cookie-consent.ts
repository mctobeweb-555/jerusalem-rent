const KEY = "oximmo:cookie-consent";

export type CookieConsent = { analytics: boolean; decidedAt: string };

/** Lit le consentement stocké, ou null si aucun choix n'a encore été fait. */
export function readCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.analytics !== "boolean") return null;
    return parsed as CookieConsent;
  } catch {
    return null;
  }
}

export function writeCookieConsent(analytics: boolean): void {
  try {
    const value: CookieConsent = { analytics, decidedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // localStorage indisponible (navigation privée…) → le bandeau se
    // réaffichera à la prochaine visite, sans casser le site.
  }
}

/**
 * Vrai si l'utilisateur a autorisé les cookies de mesure d'audience.
 * Aucun outil d'analytics n'est câblé à ce jour (voir /confidentialite) —
 * ce helper sert de point d'accroche pour en ajouter un plus tard sans
 * repasser par le bandeau de consentement.
 */
export function hasAnalyticsConsent(): boolean {
  return readCookieConsent()?.analytics === true;
}
