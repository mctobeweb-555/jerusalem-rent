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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseWxr(filePath) {
  const xml = readFileSync(filePath, "utf-8");
  return xml.split("<item>").slice(1).map((s) => s.split("</item>")[0]);
}
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

// Décode les entités HTML les plus courantes dans un <title> WordPress.
function decodeEntities(s) {
  return s
    .replace(/&#8211;/g, "-")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

// Le fichier d'export des annonces (2026-09-02) a été supprimé des
// Téléchargements entre-temps — la correspondance WP post_id -> annonce est
// reconstruite en direct via le site encore en ligne : ?p=<id> redirige vers
// le permalien réel, dont le <title> de page donne le titre de l'annonce
// (identique au champ Property.title en base, importé depuis la même source).
async function resolveTitleFromWpId(wpId) {
  const res = await fetch(`https://jerusalem-rent.com/?p=${wpId}`, { redirect: "follow" });
  if (!res.ok) return null;
  const html = await res.text();
  const m = html.match(/<title>([^<]*)<\/title>/);
  if (!m) return null;
  const raw = decodeEntities(m[1]).replace(/\s*-\s*Jerusalem Rent\s*$/i, "").trim();
  return raw || null;
}

async function main() {
  const dbProps = await prisma.property.findMany({
    where: { neighborhood: { not: null } },
    select: { id: true, title: true },
  });
  const dbByTitle = new Map(dbProps.map((p) => [p.title.trim(), p.id]));

  // --- Parse les avis, déduplique (WPML duplique par langue sans traduire) ---
  const reviewItems = parseWxr(REVIEWS_XML).filter((b) =>
    /<wp:post_type><!\[CDATA\[wpcr3_review\]\]><\/wp:post_type>/.test(b),
  );
  const seen = new Set();
  const uniqueReviews = [];
  for (const r of reviewItems) {
    const name = (meta(r, "wpcr3_review_name") || "").trim();
    const content = (extractTag(r, "content:encoded") || "").trim();
    const key = `${name}|${content}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueReviews.push({
      name,
      content,
      rating: parseInt(meta(r, "wpcr3_review_rating") || "5", 10),
      targetPost: meta(r, "wpcr3_review_post"),
    });
  }
  console.log(`${reviewItems.length} review items -> ${uniqueReviews.length} unique (deduped by name+content).`);

  // --- Résout chaque targetPost distinct en titre, une seule fois par id ---
  const distinctTargets = [...new Set(uniqueReviews.map((r) => r.targetPost).filter(Boolean))];
  console.log(`Resolving ${distinctTargets.length} distinct target post ids via the live site...`);

  const targetTitle = new Map();
  for (const id of distinctTargets) {
    try {
      const title = await resolveTitleFromWpId(id);
      targetTitle.set(id, title);
      console.log(`  ${id} -> ${title ?? "(unresolved)"}`);
    } catch (e) {
      console.warn(`  ${id} -> fetch failed: ${e.message}`);
    }
    await sleep(300);
  }

  // --- Crée les avis liés, ignore ceux dont le titre ne correspond à aucune de nos 50 annonces ---
  let created = 0;
  let noMatch = 0;
  const noMatchTitles = new Set();

  for (const r of uniqueReviews) {
    if (!r.name || !r.content) continue;
    const title = targetTitle.get(r.targetPost);
    const propertyId = title ? dbByTitle.get(title) : undefined;
    if (!propertyId) {
      noMatch++;
      if (title) noMatchTitles.add(title);
      continue;
    }
    const rating = Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5 ? r.rating : 5;
    await prisma.review.create({
      data: {
        propertyId,
        authorName: r.name,
        rating,
        comment: r.content.replace(/\r\n/g, "\n"),
        published: true,
      },
    });
    created++;
  }

  console.log(`\nCreated ${created} reviews. ${noMatch} skipped (title not among our 50 real listings).`);
  if (noMatchTitles.size > 0) {
    console.log("Unmatched titles:", [...noMatchTitles].join(" | "));
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
