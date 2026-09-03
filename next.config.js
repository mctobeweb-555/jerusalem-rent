/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

// En dev, le bundler Next utilise `eval` (source maps / HMR) → on autorise
// 'unsafe-eval' uniquement en développement. En production, la CSP reste stricte.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com"
  : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com";

// En-têtes de sécurité appliqués à toutes les routes.
// CSP volontairement permissive sur 'unsafe-inline' pour les styles (Tailwind runtime,
// next/image) ; à durcir avec un nonce si besoin en production.
// Indexation coupée tant que le site n'est pas prêt à être découvert par les
// moteurs de recherche (déploiement de test sur .vercel.app, contenu/domaine
// pas encore finalisés). À réactiver en passant ALLOW_INDEXING=true dans les
// variables d'environnement Vercel puis en redéployant.
const allowIndexing = process.env.ALLOW_INDEXING === "true";

const securityHeaders = [
  ...(allowIndexing ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' https://picsum.photos https://fastly.picsum.photos https://*.tile.openstreetmap.org data: blob:",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
