import type { NextAuthConfig } from "next-auth";

/**
 * Config NextAuth *edge-safe* : aucune dépendance Node (pas de bcrypt, pas de
 * Prisma). Elle est importée par le middleware qui tourne sur Edge runtime.
 * Les providers (avec bcrypt) sont ajoutés dans lib/auth.ts, côté Node.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [], // renseignés dans lib/auth.ts
  callbacks: {
    // Propage le rôle et l'id agence/user dans le token puis la session.
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.agencyId = (user as { agencyId?: string }).agencyId;
        token.canManageAll = (user as { canManageAll?: boolean }).canManageAll;
        token.uid = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? session.user.id;
        session.user.role = token.role as string | undefined;
        session.user.agencyId = token.agencyId as string | undefined;
        session.user.canManageAll = token.canManageAll as boolean | undefined;
      }
      return session;
    },
    // Garde-fou supplémentaire pour /admin (le middleware l'utilise).
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = request.nextUrl.pathname.startsWith("/admin");
      if (isOnAdmin) return isLoggedIn;
      return true;
    },
  },
} satisfies NextAuthConfig;
