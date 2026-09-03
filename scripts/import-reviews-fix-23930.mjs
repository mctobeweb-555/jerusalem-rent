import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const PROJECT_DIR = "C:\\Users\\user\\.claude\\Immo\\oximmo";
const REVIEWS_XML = "C:\\Users\\user\\Downloads\\jerusalemrent.WordPress.2026-09-03 (1).xml";

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

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))</${tag}>`);
  const m = block.match(re);
  if (!m) return null;
  return m[1] !== undefined ? m[1] : m[2];
}
function meta(block, key) {
  const re = new RegExp(`<wp:meta_key><!\\[CDATA\\[${key}\\]\\]></wp:meta_key>\\s*<wp:meta_value><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></wp:meta_value>`);
  const m = block.match(re);
  return m ? m[1] : null;
}
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

async function main() {
  const property = await prisma.property.findFirst({ where: { title: "Yismach Melech 33 Apt 2" } });
  if (!property) throw new Error("Property not found");

  const xml = readFileSync(REVIEWS_XML, "utf-8");
  const items = xml.split("<item>").slice(1).map((s) => s.split("</item>")[0]);
  const targetItems = items.filter((b) => meta(b, "wpcr3_review_post") === "23930");

  const seen = new Set();
  let created = 0;
  for (const r of targetItems) {
    const name = (meta(r, "wpcr3_review_name") || "").trim();
    const content = stripHtml(extractTag(r, "content:encoded") || "");
    const key = `${name}|${content}`;
    if (!name || !content || seen.has(key)) continue;
    seen.add(key);
    const rating = parseInt(meta(r, "wpcr3_review_rating") || "5", 10);
    await prisma.review.create({
      data: {
        propertyId: property.id,
        authorName: name,
        rating: Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : 5,
        comment: content,
        published: true,
      },
    });
    created++;
  }
  console.log(`Created ${created} additional reviews for "${property.title}".`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
