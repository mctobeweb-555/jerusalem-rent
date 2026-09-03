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
  const props = await prisma.property.findMany({
    where: { slug: { in: ["maavar-beit-haknesset-3-jerusalem", "maavar-beit-haknesset-6-jerusalem"] } },
    include: { images: true },
  });
  console.log(`Found ${props.length} test properties to remove.`);
  for (const p of props) {
    for (const img of p.images) {
      const filePath = path.join(PROJECT_DIR, "public", img.url.replace(/^\//, ""));
      try {
        unlinkSync(filePath);
      } catch {
        // already gone, ignore
      }
    }
    await prisma.propertyTranslation.deleteMany({ where: { propertyId: p.id } });
    await prisma.property.delete({ where: { id: p.id } });
    console.log("Deleted:", p.title);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
