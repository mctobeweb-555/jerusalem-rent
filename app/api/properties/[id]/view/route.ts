import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/properties/[id]/view — incrémente le compteur de vues d'une annonce.
// Public. La déduplication par session est faite côté client (sessionStorage) ;
// un rate-limit léger par IP limite les abus.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const ip = getClientIp(req);
  const rl = rateLimit(`view:${ip}:${params.id}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: true }); // silencieux
  }

  try {
    // Compteur total (rapide) + événement horodaté (stats sur période).
    await prisma.$transaction([
      prisma.property.update({
        where: { id: params.id },
        data: { views: { increment: 1 } },
      }),
      prisma.propertyView.create({ data: { propertyId: params.id } }),
    ]);
  } catch {
    // annonce inexistante → on ignore
  }
  return NextResponse.json({ ok: true });
}
