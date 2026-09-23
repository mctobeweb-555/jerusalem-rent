import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-light uppercase tracking-[0.12em] text-primary-900">
            Mot de passe oublié
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            Indiquez votre email, nous vous envoyons un lien de réinitialisation.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-6 text-center text-sm text-stone-500">
          <Link href="/login" className="hover:text-primary-600">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
