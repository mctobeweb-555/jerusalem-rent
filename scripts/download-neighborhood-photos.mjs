import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import sharp from "sharp";

const PROJECT_DIR = "C:\\Users\\user\\.claude\\Immo\\oximmo";
const DEST_DIR = path.join(PROJECT_DIR, "public", "brand", "neighborhoods");
const MAX_DIMENSION = 2000;

// slug de sortie -> URL source (mapping fourni par l'utilisateur)
const PHOTOS = {
  "nahalat-shiva": "https://jerusalem-rent.com/wp-content/uploads/2020/08/nahalat-shiva.jpg",
  "city-center-rav-kook": "https://jerusalem-rent.com/wp-content/uploads/2020/08/city-center-rav-kook.jpg",
  "king-david-residence": "https://jerusalem-rent.com/wp-content/uploads/2020/08/king-david-residence.jpg",
  "talbieh": "https://jerusalem-rent.com/wp-content/uploads/2020/08/talbieh.jpg",
  "yemin-moshe": "https://jerusalem-rent.com/wp-content/uploads/2020/08/yemin-moche.jpg",
  "waldorf-astoria": "https://jerusalem-rent.com/wp-content/uploads/2020/08/waldorf-astoria.jpg",
  "moshava-germanit": "https://jerusalem-rent.com/wp-content/uploads/2020/08/moshava-germanit.jpg",
  "mamilla": "https://jerusalem-rent.com/wp-content/uploads/2020/08/139575295413-248-large-560x373-1.jpg",
};

// Image non identifiée par l'utilisateur, téléchargée à part pour inspection
// (pas utilisée pour un quartier tant qu'on ne sait pas ce que c'est).
const UNKNOWN = { name: "img-ext-1-UNKNOWN", url: "https://jerusalem-rent.com/wp-content/uploads/2020/11/img-ext-1.jpg" };

async function downloadAndSave(name, url, destDir) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const out = await sharp(buf)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  const filePath = path.join(destDir, `${name}.jpg`);
  writeFileSync(filePath, out);
  return { name, url, originalSize: buf.length, originalDims: `${meta.width}x${meta.height}`, savedBytes: out.length, filePath };
}

async function main() {
  mkdirSync(DEST_DIR, { recursive: true });
  const results = [];
  for (const [slug, url] of Object.entries(PHOTOS)) {
    try {
      const r = await downloadAndSave(slug, url, DEST_DIR);
      results.push(r);
      console.log(`OK  ${slug} <- ${url} (${r.originalDims}, ${(r.savedBytes / 1024).toFixed(0)} Ko)`);
    } catch (e) {
      console.error(`FAIL ${slug}: ${e.message}`);
    }
  }

  // Image mystère : téléchargée dans un dossier temporaire pour inspection,
  // PAS dans public/brand/neighborhoods (pas encore su à quoi elle sert).
  const tmpDir = path.join(PROJECT_DIR, "..", "_tmp_unknown_image");
  mkdirSync(tmpDir, { recursive: true });
  try {
    const r = await downloadAndSave(UNKNOWN.name, UNKNOWN.url, tmpDir);
    console.log(`OK  (inspection) ${UNKNOWN.name} <- ${UNKNOWN.url} (${r.originalDims}) -> ${r.filePath}`);
  } catch (e) {
    console.error(`FAIL unknown image: ${e.message}`);
  }

  console.log(`\nDone. ${results.length}/${Object.keys(PHOTOS).length} neighborhood photos saved to ${DEST_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
