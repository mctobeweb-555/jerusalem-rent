import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-light uppercase tracking-[0.12em] text-primary-900">
            Nouveau mot de passe
          </h1>
        </div>

        <ResetPasswordForm token={params.token} />

        <p className="mt-6 text-center text-sm text-stone-500">
          <Link href="/login" className="hover:text-primary-600">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
