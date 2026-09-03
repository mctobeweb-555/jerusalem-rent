import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import UnsubscribeCard from "@/components/UnsubscribeCard";

export const metadata: Metadata = {
  title: "Désinscription",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DesabonnementPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token?.trim();
  const sub = token
    ? await prisma.newsletterSubscriber.findUnique({
        where: { unsubToken: token },
        select: { email: true, active: true },
      })
    : null;

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        {sub ? (
          sub.active ? (
            <UnsubscribeCard token={token as string} email={sub.email} />
          ) : (
            <div className="card p-8 text-center">
              <h1 className="text-xl font-bold">Déjà désinscrit</h1>
              <p className="mt-2 text-stone-500">
                <strong>{sub.email}</strong> ne reçoit déjà plus la newsletter.
              </p>
              <Link href="/" className="btn-outline mt-5 inline-flex">
                Retour à l&apos;accueil
              </Link>
            </div>
          )
        ) : (
          <div className="card p-8 text-center">
            <h1 className="text-xl font-bold">Lien invalide</h1>
            <p className="mt-2 text-stone-500">
              Ce lien de désinscription n&apos;est pas reconnu. Il a peut-être
              déjà été utilisé.
            </p>
            <Link href="/" className="btn-outline mt-5 inline-flex">
              Retour à l&apos;accueil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
