import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const PROJECT_DIR = "C:\\Users\\user\\.claude\\Immo\\oximmo";

// --- load .env manually (no dotenv dependency in this project) ---
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

const XML_PATH = "C:\\Users\\user\\Downloads\\jerusalemrent.WordPress.2026-09-02.xml";
const MAX_IMAGES = 24;
const MAX_DIMENSION = 2400;

function slugify(input) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function generateReference() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `OX-${year}-${rand}`;
}
function stripHtml(html) {
  if (!html) return "";
  return html
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
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

const xml = readFileSync(XML_PATH, "utf-8");
const items = xml.split("<item>").slice(1).map((s) => s.split("</item>")[0]);

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
function cats(block, domain) {
  const re = new RegExp(`<category domain="${domain}" nicename="([^"]*)"><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></category>`, "g");
  const out = [];
  let m;
  while ((m = re.exec(block))) out.push({ slug: m[1], name: m[2] });
  return out;
}

const properties = items.filter((b) => /<wp:post_type><!\[CDATA\[property\]\]><\/wp:post_type>/.test(b));
const attachments = items.filter((b) => /<wp:post_type><!\[CDATA\[attachment\]\]><\/wp:post_type>/.test(b));

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

const attByParent = {};
for (const a of attachments) {
  const pp = extractTag(a, "wp:post_parent");
  (attByParent[pp] = attByParent[pp] || []).push(a);
}

async function downloadAndSaveImage(url, destDir) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const extRaw = (url.split(".").pop() || "jpg").toLowerCase().split("?")[0];
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(extRaw) ? (extRaw === "jpeg" ? "jpg" : extRaw) : "jpg";
  let pipeline = sharp(buf)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true });
  if (safeExt === "png") pipeline = pipeline.png({ compressionLevel: 8 });
  else if (safeExt === "webp") pipeline = pipeline.webp({ quality: 82 });
  else pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
  const out = await pipeline.toBuffer();
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${safeExt}`;
  writeFileSync(path.join(destDir, name), out);
  return `/uploads/${name}`;
}

async function mapLimit(list, limit, fn) {
  const results = new Array(list.length);
  let idx = 0;
  async function worker() {
    while (idx < list.length) {
      const i = idx++;
      results[i] = await fn(list[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return results;
}

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: "admin@oximmo.fr" } });
  if (!admin) throw new Error("Admin user not found (admin@oximmo.fr)");

  const uploadsDir = path.join(PROJECT_DIR, "public", "uploads");
  mkdirSync(uploadsDir, { recursive: true });

  const existingSlugs = new Set((await prisma.property.findMany({ select: { slug: true } })).map((p) => p.slug));
  const existingRefs = new Set((await prisma.property.findMany({ select: { reference: true } })).map((p) => p.reference));

  const keys = Object.keys(groups);
  console.log(`Found ${keys.length} property groups to import.`);

  let created = 0;
  let failed = 0;
  let totalImages = 0;
  const errors = [];

  for (const key of keys) {
    const g = groups[key];
    const fr = g.fr;
    const en = g.en;
    const he = g.he;
    if (!fr || !en) {
      failed++;
      errors.push({ key, error: "missing fr or en variant" });
      continue;
    }
    try {
      const title = (extractTag(fr, "title") || "").trim();
      const description = stripHtml(extractTag(fr, "content:encoded")) || "Description a completer.";
      const surface = parseFloat(meta(fr, "fave_property_size") || "0") || 1;
      const bedroomsRaw = meta(fr, "fave_property_bedrooms");
      const bathroomsRaw = meta(fr, "fave_property_bathrooms");
      const bedrooms = bedroomsRaw ? parseInt(bedroomsRaw, 10) : null;
      const bathrooms = bathroomsRaw ? parseInt(bathroomsRaw, 10) : null;
      const capacityStr = meta(fr, "fave_capacity") || meta(en, "fave_capacity") || "";
      const capMatch = capacityStr.match(/\d+/);
      const maxGuests = capMatch ? parseInt(capMatch[0], 10) : null;
      const address = meta(fr, "fave_property_address") || meta(en, "fave_property_address") || "Jerusalem";
      const mapAddress = meta(fr, "fave_property_map_address") || "";
      const postalMatch = mapAddress.match(/\b\d{5,7}\b/);
      const postalCode = postalMatch ? postalMatch[0] : "9100000";
      const latRaw = parseFloat(meta(fr, "houzez_geolocation_lat") || "");
      const lngRaw = parseFloat(meta(fr, "houzez_geolocation_long") || "");
      const featureCats = cats(fr, "property_feature").map((c) => c.name);

      const base = slugify(`${title}-jerusalem`) || "annonce";
      let slug = base;
      let attempt = 0;
      while (existingSlugs.has(slug)) {
        attempt += 1;
        slug = `${base}-${attempt}`;
      }
      existingSlugs.add(slug);

      let reference = generateReference();
      while (existingRefs.has(reference)) reference = generateReference();
      existingRefs.add(reference);

      const langIds = [fr, en, he, g.es].filter(Boolean).map((v) => extractTag(v, "wp:post_id"));
      const seenFiles = new Set();
      const imgUrls = [];
      for (const pid of langIds) {
        for (const a of attByParent[pid] || []) {
          const file = meta(a, "_wp_attached_file");
          if (!file || seenFiles.has(file)) continue;
          seenFiles.add(file);
          const url = extractTag(a, "wp:attachment_url");
          if (url) imgUrls.push(url);
        }
      }
      const capped = imgUrls.slice(0, MAX_IMAGES);

      const downloaded = [];
      await mapLimit(capped, 6, async (url, idx) => {
        try {
          const localUrl = await downloadAndSaveImage(url, uploadsDir);
          downloaded[idx] = { url: localUrl, alt: title, order: idx };
        } catch (e) {
          console.warn(`  image failed (${key}): ${url} -> ${e.message}`);
        }
      });
      const images = downloaded.filter(Boolean);
      totalImages += images.length;

      const property = await prisma.property.create({
        data: {
          slug,
          reference,
          title,
          description,
          type: "APARTMENT",
          status: "SHORT_TERM",
          price: 0,
          priceHidden: true,
          surface,
          bedrooms,
          bathrooms,
          maxGuests,
          address,
          city: "Jerusalem",
          postalCode,
          lat: Number.isFinite(latRaw) ? latRaw : null,
          lng: Number.isFinite(lngRaw) ? lngRaw : null,
          features: featureCats,
          published: true,
          ownerId: admin.id,
          agencyId: admin.agencyId,
          images: { create: images },
        },
      });

      const translations = [];
      const enTitle = (extractTag(en, "title") || "").trim();
      const enDesc = stripHtml(extractTag(en, "content:encoded"));
      if (enTitle && enDesc) {
        translations.push({ propertyId: property.id, locale: "en", title: enTitle, description: enDesc });
      }
      if (he) {
        const heTitle = (extractTag(he, "title") || "").trim();
        const heDesc = stripHtml(extractTag(he, "content:encoded"));
        if (heTitle && heDesc) {
          translations.push({ propertyId: property.id, locale: "he", title: heTitle, description: heDesc });
        }
      }
      if (translations.length) {
        await prisma.propertyTranslation.createMany({ data: translations });
      }

      created += 1;
      console.log(`[${created}/${keys.length}] ${title} -- ${images.length}/${capped.length} photos, ${translations.length} translations`);
    } catch (e) {
      failed += 1;
      errors.push({ key, error: e.message });
      console.error(`FAILED ${key}: ${e.message}`);
    }
  }

  console.log(`\n=== DONE === created: ${created}, failed: ${failed}, total images: ${totalImages}`);
  if (errors.length) {
    console.log("Errors:", JSON.stringify(errors, null, 2));
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
