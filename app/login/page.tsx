import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-light uppercase tracking-[0.12em] text-primary-900">
            Espace professionnel
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            Connectez-vous pour gérer vos annonces et vos leads.
          </p>
        </div>

        <Suspense fallback={<div className="card p-6 text-sm text-stone-400">Chargement…</div>}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-stone-500">
          <Link href="/" className="hover:text-primary-600">← Retour au site</Link>
        </p>
      </div>
    </div>
  );
}
