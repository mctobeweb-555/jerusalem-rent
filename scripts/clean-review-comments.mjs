import { readFileSync } from "fs";
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

// Nettoie un commentaire d'avis : retire les balises HTML résiduelles
// (<p>, <div>, <i>, style="...") issues de l'export WordPress, décode les
// entités courantes, normalise les retours à la ligne/espaces.
function cleanComment(raw) {
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201c")
    .replace(/&#8221;/g, "\u201d")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

async function main() {
  const reviews = await prisma.review.findMany({ select: { id: true, comment: true } });
  let updated = 0;
  for (const r of reviews) {
    const cleaned = cleanComment(r.comment);
    if (cleaned !== r.comment) {
      await prisma.review.update({ where: { id: r.id }, data: { comment: cleaned } });
      updated++;
    }
  }
  console.log(`Checked ${reviews.length} reviews, cleaned ${updated}.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
