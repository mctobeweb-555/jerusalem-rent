"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";

// Barre minimale de l'espace admin : logo + accès au site + déconnexion.
export default function AdminTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="flex items-center gap-2" aria-label="Administration Jerusalem Rent">
          <Image
            src="/brand/logo.png"
            alt="Jerusalem Rent"
            width={519}
            height={125}
            priority
            className="h-8 w-auto"
          />
          <span className="text-sm font-normal text-stone-400">admin</span>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline px-3.5 py-2 text-sm"
          >
            Aller sur le site ↗
          </a>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-xl px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </header>
  );
}
