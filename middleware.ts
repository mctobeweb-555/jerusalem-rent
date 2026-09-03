import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

// Middleware edge-safe : n'utilise que authConfig (pas de bcrypt/Prisma).
// La protection réelle des pages /admin est aussi refaite dans app/admin/layout.tsx.
const { auth } = NextAuth(authConfig);

const PUBLIC_FILE = /\.[a-zA-Z0-9]+$/;

// Langue préférée : cookie posé par le sélecteur de langue, sinon Accept-Language.
function pickLocale(req: NextRequest): string {
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

  const header = req.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const lang = part.trim().split(";")[0]?.slice(0, 2).toLowerCase();
    if (lang && isLocale(lang)) return lang;
  }
  return defaultLocale;
}

function localeMiddleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const segment = pathname.split("/")[1] ?? "";

  if (isLocale(segment)) {
    // Route déjà localisée → transmet la langue aux Server Components (root
    // layout notamment, pour <html lang/dir>) via un header de requête.
    const headers = new Headers(req.headers);
    headers.set("x-locale", segment);
    return NextResponse.next({ request: { headers } });
  }

  // Pas de préfixe de langue → redirection vers la langue préférée.
  const locale = pickLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

// Routes non localisées : admin (auth NextAuth), api, login, désabonnement,
// et fichiers statiques.
export default async function middleware(req: NextRequest, ctx: unknown) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    // Comportement inchangé : NextAuth applique authConfig.callbacks.authorized.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (auth as any)(req, ctx);
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/desabonnement") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/_next") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  return localeMiddleware(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
