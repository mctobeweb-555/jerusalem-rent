import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { getSessionUser } from "@/lib/guards";

// Écriture sur le système de fichiers → runtime Node (pas Edge).
export const runtime = "nodejs";

// Types d'image autorisés → extension de sortie.
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 Mo

// Plafond de résolution stockée (généreux pour un usage plein écran/hero,
// évite de conserver et de re-servir des photos à leur résolution d'origine
// — un appareil photo/smartphone moderne dépasse largement ce qui est jamais
// affiché sur le site, même en Ken Burns/plein écran).
const MAX_DIMENSION = 2400;

// POST /api/admin/upload — upload d'une image (protégé). multipart/form-data,
// champ "file". Stocke dans public/uploads et renvoie { url }.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Format non autorisé (JPEG, PNG, WebP ou AVIF)." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (5 Mo maximum)." },
      { status: 413 },
    );
  }

  const rawBytes = Buffer.from(await file.arrayBuffer());

  // Redimensionne (plafond MAX_DIMENSION, sans agrandir), auto-oriente selon
  // l'EXIF puis le retire (sharp ne le conserve pas par défaut — bonus vie
  // privée/poids), et ré-encode dans le même format. Décoder réellement le
  // fichier via libvips valide au passage que c'est une vraie image (pas
  // seulement le Content-Type déclaré par le client, falsifiable).
  let bytes: Buffer;
  try {
    let pipeline = sharp(rawBytes).rotate().resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
    switch (ext) {
      case "jpg":
        pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
        break;
      case "png":
        pipeline = pipeline.png({ compressionLevel: 8 });
        break;
      case "webp":
        pipeline = pipeline.webp({ quality: 82 });
        break;
      case "avif":
        pipeline = pipeline.avif({ quality: 60 });
        break;
    }
    bytes = await pipeline.toBuffer();
  } catch {
    return NextResponse.json(
      { error: "Fichier image invalide ou corrompu." },
      { status: 400 },
    );
  }

  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

  // Vercel : le système de fichiers est en lecture seule en production, donc
  // écrire dans public/uploads n'y fonctionne pas et ne persisterait pas
  // entre déploiements de toute façon. Bascule sur Vercel Blob dès que le
  // store est rattaché au projet (token auto-injecté) ; en local (dev, pas
  // de token), on garde l'écriture disque telle quelle.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`uploads/${name}`, bytes, {
        access: "public",
        contentType: file.type,
      });
      return NextResponse.json({ url: blob.url }, { status: 201 });
    } catch {
      return NextResponse.json(
        { error: "Échec de l'enregistrement du fichier." },
        { status: 500 },
      );
    }
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
  } catch {
    return NextResponse.json(
      { error: "Échec de l'enregistrement du fichier." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: `/uploads/${name}` }, { status: 201 });
}
