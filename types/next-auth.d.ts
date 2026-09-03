import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      agencyId?: string;
      canManageAll?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    agencyId?: string;
    canManageAll?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: string;
    agencyId?: string;
    canManageAll?: boolean;
  }
}
