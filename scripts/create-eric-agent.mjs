import { readFileSync } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
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

function slugify(input) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const agency = await prisma.agency.findFirst();
  if (!agency) throw new Error("No agency found");

  const existing = await prisma.user.findUnique({ where: { email: "eric@jerusalem-rent.com" } });
  if (existing) {
    console.log("Eric Opland already exists, id:", existing.id);
    await prisma.$disconnect();
    return;
  }

  const base = slugify("Eric Opland");
  let slug = base;
  let attempt = 0;
  while (await prisma.user.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const eric = await prisma.user.create({
    data: {
      name: "Eric Opland",
      email: "eric@jerusalem-rent.com",
      passwordHash,
      role: "AGENT",
      slug,
      phone: "+972 54-546-7330",
      title: "Agent immobilier",
      languages: ["Français", "Anglais", "Hébreu"],
      agencyId: agency.id,
    },
  });
  console.log("Created Eric Opland, id:", eric.id, "slug:", eric.slug);

  // Réassigne les 50 vraies annonces (celles avec un quartier renseigné,
  // donc issues de l'import réel) à Eric — seul agent réel du site.
  const result = await prisma.property.updateMany({
    where: { neighborhood: { not: null } },
    data: { ownerId: eric.id },
  });
  console.log(`Reassigned ${result.count} properties to Eric Opland.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
