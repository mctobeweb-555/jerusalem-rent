import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const PROJECT_DIR = "C:\\Users\\user\\.claude\\Immo\\oximmo";
const XML_PATH = "C:\\Users\\user\\Downloads\\jerusalemrent.WordPress.2026-09-02.xml";

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

function slugify(input) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Doit matcher lib/neighborhoods.ts (dupliqué ici volontairement : script
// autonome hors du graphe de modules Next/TS).
const NEIGHBORHOOD_NAMES = [
  "Nahalat Shiva",
  "City Center / Rav Kook",
  "King David Residence",
  "Talbieh",
  "Moshava Germanit",
  "Waldorf Astoria",
  "Mamilla",
  "Yemin Moshe",
  "Ben Meimon",
];
const bySlug = new Map(NEIGHBORHOOD_NAMES.map((n) => [slugify(n), n]));

const xml = readFileSync(XML_PATH, "utf-8");
const items = xml.split("<item>").slice(1).map((s) => s.split("</item>")[0]);

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))</${tag}>`);
  const m = block.match(re);
  if (!m) return null;
  return m[1] !== undefined ? m[1] : m[2];
}
function catsOf(block, domain) {
  const re = new RegExp(`<category domain="${domain}" nicename="([^"]*)"><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></category>`, "g");
  const out = [];
  let m;
  while ((m = re.exec(block))) out.push({ slug: m[1], name: m[2] });
  return out;
}

const properties = items.filter((b) => /<wp:post_type><!\[CDATA\[property\]\]><\/wp:post_type>/.test(b));

function groupKeyOf(p) {
  const link = extractTag(p, "link") || "";
  const m = link.match(/\/property\/([^/?]+)\//);
  return m ? m[1] : null;
}
function langOf(p) {
  const link = extractTag(p, "link") || "";
  return (link.match(/[?&]lang=([a-z]+)/) || [, "en"])[1];
}

const groups = {};
for (const p of properties) {
  const k = groupKeyOf(p);
  if (!k) continue;
  groups[k] = groups[k] || {};
  groups[k][langOf(p)] = p;
}

async function main() {
  const allProps = await prisma.property.findMany({ select: { id: true, slug: true, title: true } });
  let updated = 0;
  let noMatch = 0;
  let noArea = 0;

  for (const key of Object.keys(groups)) {
    const fr = groups[key].fr;
    const en = groups[key].en;
    if (!fr || !en) continue;
    // Le nom du quartier en FR est parfois traduit ("Résidence King David",
    // "Centre ville / Rav Kook") alors que NEIGHBORHOOD_NAMES garde les noms
    // propres tels qu'affichés sur le site (anglais) — on matche sur la
    // variante EN de la taxonomie, pas la FR.
    const areaCats = catsOf(en, "property_area");
    if (areaCats.length === 0) {
      noArea++;
      continue;
    }
    const wpAreaSlug = slugify(areaCats[0].name);
    const neighborhood = bySlug.get(wpAreaSlug);
    if (!neighborhood) {
      console.warn(`No neighborhood match for area "${areaCats[0].name}" (key=${key})`);
      noMatch++;
      continue;
    }

    // Retrouve la propriété correspondante en base par slug (le slug DB =
    // slugify(title-jerusalem), reconstruit ici pour matcher.
    const title = (extractTag(fr, "title") || "").trim();
    const expectedSlug = slugify(`${title}-jerusalem`);
    const dbProp = allProps.find((p) => p.slug === expectedSlug || p.slug.startsWith(expectedSlug));
    if (!dbProp) {
      console.warn(`No DB property found for slug "${expectedSlug}" (title="${title}")`);
      noMatch++;
      continue;
    }

    await prisma.property.update({ where: { id: dbProp.id }, data: { neighborhood } });
    updated++;
  }

  console.log(`Updated: ${updated}, no area in source: ${noArea}, no match: ${noMatch}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
