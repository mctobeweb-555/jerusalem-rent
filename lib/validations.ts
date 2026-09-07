import { z } from "zod";

// --- Enums (miroir Prisma, pour valider les entrées sans importer @prisma/client
//     côté client) ---
export const propertyTypeEnum = z.enum([
  "HOUSE",
  "APARTMENT",
  "LAND",
  "COMMERCIAL",
]);
export const listingStatusEnum = z.enum([
  "FOR_SALE",
  "FOR_RENT",
  "SHORT_TERM",
  "SOLD",
  "RENTED",
]);
export const leadStatusEnum = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CLOSED",
]);

// --- Recherche / listing public (GET /api/properties) ---
// coerce car les query params arrivent en string.
export const propertySearchSchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    city: z.string().trim().max(120).optional(),
    neighborhood: z.string().trim().max(120).optional(),
    type: propertyTypeEnum.optional(),
    status: listingStatusEnum.optional(),
    priceMin: z.coerce.number().int().nonnegative().optional(),
    priceMax: z.coerce.number().int().nonnegative().optional(),
    surfaceMin: z.coerce.number().nonnegative().optional(),
    roomsMin: z.coerce.number().int().nonnegative().optional(),
    // Court terme : voyageurs + dates de séjour.
    guests: z.coerce.number().int().min(1).max(50).optional(),
    checkIn: z.string().trim().max(10).optional(),
    checkOut: z.string().trim().max(10).optional(),
    // Filtre par agent : slug de l'agent responsable.
    agent: z.string().trim().max(80).optional(),
    // Bounding box carte (« rechercher dans cette zone »).
    latMin: z.coerce.number().min(-90).max(90).optional(),
    latMax: z.coerce.number().min(-90).max(90).optional(),
    lngMin: z.coerce.number().min(-180).max(180).optional(),
    lngMax: z.coerce.number().min(-180).max(180).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    perPage: z.coerce.number().int().min(1).max(48).default(12),
    // Tri des résultats.
    sort: z
      .enum(["recent", "price_asc", "price_desc", "surface_desc", "surface_asc"])
      .default("recent"),
  });
// Pas de .strict() ici : un paramètre d'URL imprévu (tracking, extension
// navigateur, futur champ non encore branché) ne doit jamais faire échouer
// toute la recherche — il doit juste être ignoré. `.strict()` provoquait
// exactement ça silencieusement (repli total sur les valeurs par défaut,
// aucun filtre appliqué) dès qu'un champ imprévu était présent.

export type PropertySearch = z.infer<typeof propertySearchSchema>;

// URL d'image : accepte une URL absolue http(s) OU un chemin relatif du site
// (ex. /uploads/…, produit par l'upload local).
export const imageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine(
    (v) => /^https?:\/\/.+/i.test(v) || v.startsWith("/"),
    "URL d'image invalide (http(s)://… ou /uploads/…)",
  );

// --- Image (sous-objet de Property) ---
const imageInputSchema = z.object({
  url: imageUrlSchema,
  alt: z.string().trim().min(1).max(200),
  order: z.number().int().min(0).max(100).default(0),
});

// --- Traduction d'annonce (EN/HE) — vide = pas de traduction, repli sur le FR. ---
const propertyTranslationInputSchema = z.object({
  title: z.string().trim().max(160).optional().or(z.literal("")),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  // Équipements traduits, saisie façon CSV ("Wifi, Equipped kitchen") comme
  // le champ features principal. Vide = repli sur les équipements FR.
  features: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
});

// --- Création / édition d'annonce (admin) ---
// price attendu en CENTIMES (Int).
export const propertyInputSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(8000),
    translations: z
      .object({
        en: propertyTranslationInputSchema.optional(),
        he: propertyTranslationInputSchema.optional(),
      })
      .optional(),
    type: propertyTypeEnum,
    status: listingStatusEnum,
    price: z.number().int().nonnegative().max(1_000_000_000_00),
    surface: z.number().positive().max(1_000_000),
    rooms: z.number().int().min(0).max(100).nullable().optional(),
    bedrooms: z.number().int().min(0).max(100).nullable().optional(),
    bathrooms: z.number().int().min(0).max(100).nullable().optional(),
    floor: z.number().int().min(-5).max(200).nullable().optional(),
    maxGuests: z.number().int().min(0).max(100).nullable().optional(),
    address: z.string().trim().min(1).max(240),
    city: z.string().trim().min(1).max(120),
    // Quartier éditorial (lib/neighborhoods.ts) — libre, pas de contrainte
    // d'enum pour rester tolérant si la liste des quartiers évolue.
    neighborhood: z.string().trim().max(120).optional().or(z.literal("")),
    postalCode: z.string().trim().min(2).max(12),
    lat: z.number().min(-90).max(90).nullable().optional(),
    lng: z.number().min(-180).max(180).nullable().optional(),
    features: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
    images: z.array(imageInputSchema).max(30).default([]),
    published: z.boolean().default(false),
    // Masque le prix côté public ("Prix sur demande"). L'admin le voit toujours.
    priceHidden: z.boolean().default(false),
    // Agent responsable. Réservé aux ADMIN côté logique ; ignoré pour un AGENT.
    ownerId: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .strict();

export type PropertyInput = z.infer<typeof propertyInputSchema>;

// --- Import CSV d'annonces (admin) ---
// Une ligne = des chaînes ; on nettoie/coerce. Le prix est en EUROS dans le CSV.
const emptyToUndef = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;
const optInt = z.preprocess(
  emptyToUndef,
  z.coerce.number().int().min(-5).max(1000).optional(),
);
const optFloat = z.preprocess(emptyToUndef, z.coerce.number().optional());

export const csvPropertyRowSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(8000),
  type: propertyTypeEnum,
  status: listingStatusEnum,
  price: z.coerce.number().nonnegative().max(1_000_000_000), // euros
  surface: z.coerce.number().positive().max(1_000_000),
  rooms: optInt,
  bedrooms: optInt,
  bathrooms: optInt,
  floor: optInt,
  maxGuests: optInt,
  address: z.string().trim().min(1).max(240),
  city: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(2).max(12),
  lat: optFloat,
  lng: optFloat,
  features: z.string().optional(), // "jardin;garage;piscine"
  images: z.string().optional(), // "url1;url2"
  published: z.string().optional(), // "true"/"oui"/"1"
  priceHidden: z.string().optional(), // "true"/"oui"/"1"
});

export type CsvPropertyRow = z.infer<typeof csvPropertyRowSchema>;

// --- Lead (POST /api/leads, public) ---
export const leadInputSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    message: z.string().trim().min(5).max(4000),
    propertyId: z.string().trim().max(40).optional().or(z.literal("")),
    // Demande de réservation (court terme) — optionnels.
    checkIn: z.string().trim().max(10).optional().or(z.literal("")),
    checkOut: z.string().trim().max(10).optional().or(z.literal("")),
    guests: z.coerce.number().int().min(1).max(50).optional(),
    adults: z.coerce.number().int().min(0).max(50).optional(),
    children: z.coerce.number().int().min(0).max(50).optional(),
    babies: z.coerce.number().int().min(0).max(50).optional(),
    // honeypot : doit rester vide (les bots le remplissent). On accepte tout de
    // même une valeur au niveau du schéma pour pouvoir répondre « ok:true »
    // silencieusement dans la logique (sans révéler la détection au bot).
    honeypot: z.string().max(200).optional(),
    // jeton Turnstile (facultatif si non configuré côté serveur).
    turnstileToken: z.string().max(4096).optional().or(z.literal("")),
  })
  .strict();

export type LeadInput = z.infer<typeof leadInputSchema>;

// --- Inscription newsletter (public) ---
export const newsletterSchema = z
  .object({
    email: z.string().trim().email().max(200),
    // honeypot : doit rester vide (bots). Accepté au schéma, filtré en logique.
    honeypot: z.string().max(200).optional(),
  })
  .strict();

// --- Mise à jour statut lead (admin) ---
export const leadStatusUpdateSchema = z
  .object({
    status: leadStatusEnum,
  })
  .strict();

// --- Création d'un agent / utilisateur (admin) ---
export const agentCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    password: z.string().min(8).max(200),
    role: z.enum(["AGENT", "ADMIN"]).default("AGENT"),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    title: z.string().trim().max(120).optional().or(z.literal("")),
    avatarUrl: imageUrlSchema.optional().or(z.literal("")),
    canManageAll: z.boolean().optional(),
    languages: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
  })
  .strict();

export type AgentCreateInput = z.infer<typeof agentCreateSchema>;

// --- Avis client (admin uniquement — pas de dépôt public) ---
// propertyId vide = avis général (témoignage non lié à une annonce).
export const reviewInputSchema = z
  .object({
    propertyId: z.string().trim().max(40).optional().or(z.literal("")),
    authorName: z.string().trim().min(2).max(120),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().min(5).max(2000),
    avatarUrl: imageUrlSchema.optional().or(z.literal("")),
    published: z.boolean().default(true),
  })
  .strict();

export type ReviewInput = z.infer<typeof reviewInputSchema>;

// --- Import CSV d'avis (admin) ---
// propertyTitle vide = avis général. published: "true"/"oui"/"1" comme le
// reste du projet (cf. csvPropertyRowSchema).
export const csvReviewRowSchema = z.object({
  propertyTitle: z.string().trim().max(160).optional(),
  authorName: z.string().trim().min(2).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(2000),
  published: z.string().optional(),
});
export type CsvReviewRow = z.infer<typeof csvReviewRowSchema>;

// --- Mise à jour d'un agent (admin). Mot de passe optionnel (vide = inchangé). ---
export const agentUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    role: z.enum(["AGENT", "ADMIN"]),
    password: z.string().min(8).max(200).optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    title: z.string().trim().max(120).optional().or(z.literal("")),
    avatarUrl: imageUrlSchema.optional().or(z.literal("")),
    canManageAll: z.boolean().optional(),
    languages: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
  })
  .strict();
