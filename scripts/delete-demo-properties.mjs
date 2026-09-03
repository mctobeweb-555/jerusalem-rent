import { readFileSync, unlinkSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const PROJECT_DIR = "C:\\Users\\user\\.claude\\Immo\\oximmo";
const envContent = readFileSync(path.join(PROJECT_DIR, ".env"), "utf-8");
for (const line of envContent.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) {
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[m[1]] = val;
  }
}

const prisma = new PrismaClient();

async function main() {
  // Les 11 biens de démo = ceux sans quartier renseigné (les 50 vrais en ont tous un).
  const demoProps = await prisma.property.findMany({
    where: { neighborhood: null },
    include: { images: true, _count: { select: { leads: true, reviews: true } } },
  });

  console.log(`Found ${demoProps.length} demo properties to delete.`);
  for (const p of demoProps) {
    console.log(`- ${p.title} (${p.city}) : ${p.images.length} images, ${p._count.leads} leads (conservés, propertyId->null), ${p._count.reviews} avis liés`);
  }

  let deletedImages = 0;
  for (const p of demoProps) {
    for (const img of p.images) {
      if (img.url.startsWith("/uploads/")) {
        const filePath = path.join(PROJECT_DIR, "public", img.url.replace(/^\//, ""));
        try {
          unlinkSync(filePath);
          deletedImages++;
        } catch {
          // fichier déjà absent ou hors uploads (ex. picsum) : rien à faire
        }
      }
    }
    await prisma.property.delete({ where: { id: p.id } });
  }

  console.log(`\nDeleted ${demoProps.length} properties, ${deletedImages} local image files removed.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
