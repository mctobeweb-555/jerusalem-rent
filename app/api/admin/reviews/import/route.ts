import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, propertyScope } from "@/lib/guards";
import { parseCsv } from "@/lib/csv";
import { csvReviewRowSchema } from "@/lib/validations";
import { sanitizeReviewComment } from "@/lib/reviews";

export const runtime = "nodejs";

type RowError = { line: number; message: string };

// POST /api/admin/reviews/import — corps = texte CSV. Crée les avis valides,
// renvoie un rapport (créés + erreurs par ligne). ADMIN uniquement.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "ADMIN" || !user.agencyId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const csvText = await req.text();
  if (!csvText.trim()) {
    return NextResponse.json({ error: "Fichier CSV vide" }, { status: 400 });
  }

  let parsed: ReturnType<typeof parseCsv>;
  try {
    parsed = parseCsv(csvText);
  } catch {
    return NextResponse.json({ error: "CSV illisible" }, { status: 400 });
  }

  if (parsed.rows.length === 0) {
    return NextResponse.json(
      { error: "Aucune ligne de données trouvée." },
      { status: 400 },
    );
  }
  if (parsed.rows.length > 1000) {
    return NextResponse.json(
      { error: "Maximum 1000 lignes par import." },
      { status: 400 },
    );
  }

  // Propriétés de l'agence, indexées par titre (insensible à la casse) pour
  // résoudre la colonne "propertyTitle" du CSV sans aller-retour par ligne.
  const properties = await prisma.property.findMany({
    where: propertyScope(user),
    select: { id: true, title: true },
  });
  const byTitle = new Map(properties.map((p) => [p.title.trim().toLowerCase(), p.id]));

  const errors: RowError[] = [];
  let created = 0;

  for (let i = 0; i < parsed.rows.length; i++) {
    const line = i + 2;
    const check = csvReviewRowSchema.safeParse(parsed.rows[i]);
    if (!check.success) {
      const first = check.error.issues[0];
      errors.push({
        line,
        message: `${first.path.join(".") || "ligne"} : ${first.message}`,
      });
      continue;
    }
    const r = check.data;

    let propertyId: string | null = null;
    const title = r.propertyTitle?.trim();
    if (title) {
      const match = byTitle.get(title.toLowerCase());
      if (!match) {
        errors.push({ line, message: `Annonce introuvable : "${title}"` });
        continue;
      }
      propertyId = match;
    }

    const published = /^(true|1|oui|yes|o)$/i.test((r.published ?? "true").trim());

    try {
      await prisma.review.create({
        data: {
          propertyId,
          authorName: r.authorName,
          rating: r.rating,
          comment: sanitizeReviewComment(r.comment),
          published,
        },
      });
      created += 1;
    } catch {
      errors.push({ line, message: "Erreur d'enregistrement en base." });
    }
  }

  return NextResponse.json({
    total: parsed.rows.length,
    created,
    failed: errors.length,
    errors: errors.slice(0, 100),
  });
}
