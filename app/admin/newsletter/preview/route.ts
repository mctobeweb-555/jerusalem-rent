import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/guards";
import { buildNewsletterHtml } from "@/lib/newsletter";

// GET /admin/newsletter/preview — aperçu HTML de la newsletter (ADMIN).
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const html = await buildNewsletterHtml({
    // Lien d'exemple : illustre l'emplacement, sans token réel (aperçu admin).
    unsubscribeUrl: `${site}/desabonnement?token=apercu`,
  });
  if (!html) {
    return new NextResponse(
      "<p style='font-family:sans-serif;padding:24px'>Aucune annonce publiée à afficher.</p>",
      { headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
