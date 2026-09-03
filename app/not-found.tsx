import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <p className="font-display text-6xl font-bold text-primary-600">404</p>
        <h1 className="mt-4 text-2xl font-bold">Page introuvable</h1>
        <p className="mt-2 text-stone-500">
          Le bien ou la page que vous cherchez n'existe plus ou a été déplacé.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-outline">Accueil</Link>
          <Link href="/annonces" className="btn-primary">Voir les annonces</Link>
        </div>
      </div>
    </div>
  );
}
