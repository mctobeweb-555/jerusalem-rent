import { PrismaClient, type PropertyType, type ListingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Seed = {
  title: string;
  description: string;
  type: PropertyType;
  status: ListingStatus;
  priceEuros: number;
  surface: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  address: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
  features: string[];
  imageSeeds: string[];
};

const properties: Seed[] = [
  {
    title: "Maison familiale avec jardin",
    description:
      "Belle maison de 1990 entièrement rénovée, lumineuse, au calme dans un quartier résidentiel recherché. Grand séjour ouvert sur une cuisine équipée, quatre chambres, un bureau et un jardin arboré exposé sud. Garage double et cave.",
    type: "HOUSE",
    status: "FOR_SALE",
    priceEuros: 489000,
    surface: 165,
    rooms: 6,
    bedrooms: 4,
    bathrooms: 2,
    address: "12 rue des Tilleuls",
    city: "Nantes",
    postalCode: "44000",
    lat: 47.2184,
    lng: -1.5536,
    features: ["jardin", "garage", "cave", "cuisine équipée", "double vitrage"],
    imageSeeds: ["oximmo-nantes-1", "oximmo-nantes-2", "oximmo-nantes-3"],
  },
  {
    title: "Appartement T3 lumineux hypercentre",
    description:
      "Au 3ᵉ étage avec ascenseur, appartement traversant de 72 m² offrant un double séjour, deux chambres et un balcon avec vue dégagée. Charme de l'ancien : parquet, moulures, cheminée. Proche commerces et transports.",
    type: "APARTMENT",
    status: "FOR_SALE",
    priceEuros: 315000,
    surface: 72,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    floor: 3,
    address: "8 place du Marché",
    city: "Lyon",
    postalCode: "69002",
    lat: 45.764,
    lng: 4.8357,
    features: ["ascenseur", "balcon", "parquet", "cheminée"],
    imageSeeds: ["oximmo-lyon-1", "oximmo-lyon-2"],
  },
  {
    title: "Studio meublé proche université",
    description:
      "Studio de 24 m² entièrement meublé et équipé, idéal étudiant ou investisseur. Kitchenette, salle d'eau récente, rangements optimisés. Faibles charges, très bon rendement locatif.",
    type: "APARTMENT",
    status: "FOR_RENT",
    priceEuros: 620,
    surface: 24,
    rooms: 1,
    bedrooms: 1,
    bathrooms: 1,
    floor: 2,
    address: "45 avenue de la Faculté",
    city: "Toulouse",
    postalCode: "31000",
    lat: 43.6047,
    lng: 1.4442,
    features: ["meublé", "proche transports", "faibles charges"],
    imageSeeds: ["oximmo-toulouse-1"],
  },
  {
    title: "Villa contemporaine avec piscine",
    description:
      "Architecture d'exception sur 1 200 m² de terrain paysager. Vastes volumes baignés de lumière, cinq chambres dont une suite parentale, piscine chauffée, pool-house et double garage. Prestations haut de gamme.",
    type: "HOUSE",
    status: "FOR_SALE",
    priceEuros: 1250000,
    surface: 280,
    rooms: 8,
    bedrooms: 5,
    bathrooms: 3,
    address: "3 chemin des Oliviers",
    city: "Aix-en-Provence",
    postalCode: "13100",
    lat: 43.5297,
    lng: 5.4474,
    features: ["piscine", "garage", "domotique", "climatisation", "terrasse"],
    imageSeeds: ["oximmo-aix-1", "oximmo-aix-2", "oximmo-aix-3", "oximmo-aix-4"],
  },
  {
    title: "Terrain constructible viabilisé",
    description:
      "Beau terrain plat de 650 m², viabilisé et libre de constructeur, dans un lotissement calme. Certificat d'urbanisme opérationnel favorable. Idéal pour un projet de maison individuelle.",
    type: "LAND",
    status: "FOR_SALE",
    priceEuros: 138000,
    surface: 650,
    address: "Lieu-dit Les Chênes",
    city: "Bordeaux",
    postalCode: "33000",
    lat: 44.8378,
    lng: -0.5792,
    features: ["viabilisé", "libre de constructeur", "plat"],
    imageSeeds: ["oximmo-bordeaux-1"],
  },
  {
    title: "Local commercial pied d'immeuble",
    description:
      "Local commercial de 95 m² avec vitrine sur rue passante, actuellement aménagé en boutique. Belle visibilité, réserve et sanitaires. Fort passage piéton, emplacement n°1.",
    type: "COMMERCIAL",
    status: "FOR_RENT",
    priceEuros: 1800,
    surface: 95,
    address: "22 rue de la République",
    city: "Marseille",
    postalCode: "13001",
    lat: 43.2965,
    lng: 5.3698,
    features: ["vitrine", "emplacement n°1", "climatisation"],
    imageSeeds: ["oximmo-marseille-1", "oximmo-marseille-2"],
  },
  {
    title: "Appartement neuf avec terrasse",
    description:
      "Dans une résidence récente aux normes RT2020, T4 de 88 m² avec une terrasse de 20 m² plein sud. Cuisine ouverte équipée, deux places de parking en sous-sol. Livré, jamais habité.",
    type: "APARTMENT",
    status: "FOR_SALE",
    priceEuros: 429000,
    surface: 88,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    floor: 4,
    address: "1 allée des Jardins",
    city: "Rennes",
    postalCode: "35000",
    lat: 48.1173,
    lng: -1.6778,
    features: ["neuf", "terrasse", "parking", "ascenseur", "RT2020"],
    imageSeeds: ["oximmo-rennes-1", "oximmo-rennes-2"],
  },
  {
    title: "Maison de ville rénovée",
    description:
      "Charmante maison de ville sur trois niveaux, entièrement restaurée avec des matériaux de qualité. Trois chambres, une cour intérieure au calme et des combles aménageables. Aucun travaux à prévoir.",
    type: "HOUSE",
    status: "SOLD",
    priceEuros: 268000,
    surface: 112,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 1,
    address: "17 rue Basse",
    city: "Lille",
    postalCode: "59000",
    lat: 50.6292,
    lng: 3.0573,
    features: ["cour", "combles", "rénovée"],
    imageSeeds: ["oximmo-lille-1", "oximmo-lille-2"],
  },
];

async function main() {
  console.log("🌱 Seed Jerusalem Rent…");

  // Repart d'une base propre (ordre : dépendances d'abord).
  await prisma.lead.deleteMany();
  await prisma.image.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
  await prisma.agency.deleteMany();

  const agency = await prisma.agency.create({
    data: { name: "Jerusalem Rent" },
  });

  const passwordHash = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Administrateur Jerusalem Rent",
      email: "admin@oximmo.fr",
      passwordHash,
      role: "ADMIN",
      slug: slugify("Administrateur Jerusalem Rent"),
      phone: "01 84 80 00 00",
      title: "Directeur d'agence",
      avatarUrl: "https://picsum.photos/seed/oximmo-agent-admin/200/200",
      agencyId: agency.id,
    },
  });

  // Agents (mot de passe identique pour la démo).
  const agentSeeds = [
    {
      name: "Julie Lefèvre",
      email: "julie@oximmo.fr",
      phone: "06 12 34 56 78",
      title: "Conseillère immobilière",
      avatar: "oximmo-agent-julie",
    },
    {
      name: "Marc Dubois",
      email: "marc@oximmo.fr",
      phone: "06 98 76 54 32",
      title: "Négociateur senior",
      avatar: "oximmo-agent-marc",
    },
    {
      name: "Amélie Rousseau",
      email: "amelie@oximmo.fr",
      phone: "06 45 67 89 01",
      title: "Conseillère immobilière",
      avatar: "oximmo-agent-amelie",
    },
  ];

  const agents = [];
  for (const a of agentSeeds) {
    const agent = await prisma.user.create({
      data: {
        name: a.name,
        email: a.email,
        passwordHash,
        role: "AGENT",
        slug: slugify(a.name),
        phone: a.phone,
        title: a.title,
        avatarUrl: `https://picsum.photos/seed/${a.avatar}/200/200`,
        agencyId: agency.id,
      },
    });
    agents.push(agent);
  }

  // Tous les interlocuteurs possibles (admin + agents) pour la répartition.
  const owners = [...agents, admin];

  let i = 0;
  for (const p of properties) {
    const owner = owners[i % owners.length]!;
    i += 1;
    const slugBase = slugify(`${p.title}-${p.city}`);
    const year = new Date().getFullYear();
    const reference = `OX-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

    await prisma.property.create({
      data: {
        slug: slugBase,
        reference,
        title: p.title,
        description: p.description,
        type: p.type,
        status: p.status,
        price: Math.round(p.priceEuros * 100), // centimes
        surface: p.surface,
        rooms: p.rooms ?? null,
        bedrooms: p.bedrooms ?? null,
        bathrooms: p.bathrooms ?? null,
        floor: p.floor ?? null,
        address: p.address,
        city: p.city,
        postalCode: p.postalCode,
        lat: p.lat,
        lng: p.lng,
        features: p.features,
        published: true,
        ownerId: owner.id,
        agencyId: agency.id,
        images: {
          create: p.imageSeeds.map((seed, i) => ({
            url: `https://picsum.photos/seed/${seed}/1200/800`,
            alt: `${p.title} — photo ${i + 1}`,
            order: i,
          })),
        },
      },
    });
  }

  // Quelques leads de démonstration.
  const firstProperty = await prisma.property.findFirst();
  await prisma.lead.createMany({
    data: [
      {
        name: "Camille Durand",
        email: "camille.durand@example.com",
        phone: "0612345678",
        message: "Bonjour, ce bien est-il toujours disponible pour une visite ?",
        propertyId: firstProperty?.id ?? null,
        status: "NEW",
      },
      {
        name: "Yanis Mercier",
        email: "yanis.mercier@example.com",
        phone: "0698765432",
        message: "Je souhaiterais un rendez-vous cette semaine.",
        propertyId: firstProperty?.id ?? null,
        status: "CONTACTED",
      },
    ],
  });

  const count = await prisma.property.count();
  const userCount = await prisma.user.count();
  console.log(
    `✅ ${count} annonces, 1 agence, ${userCount} utilisateurs (1 admin + ${agents.length} agents). Connexion : admin@oximmo.fr / Admin123!`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
