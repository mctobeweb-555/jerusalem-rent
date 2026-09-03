# Jerusalem Rent — Plateforme immobilière (base OxImmo)

Site d'annonces immobilières complet : **Next.js 14 (App Router) · TypeScript · Tailwind · Prisma/PostgreSQL · NextAuth v5 · Zod**.

Front public (recherche, listing filtré, fiches SEO), **espace admin** pour gérer les annonces et les leads.

## Prérequis
- Node.js 20+ (testé sur Node 22)
- Une base **PostgreSQL**

Base locale rapide via Docker :
```bash
docker run --name oximmo-db -e POSTGRES_PASSWORD=oximmo -e POSTGRES_DB=oximmo -p 5432:5432 -d postgres:16
```

## Installation
```bash
npm install
cp .env.example .env      # puis renseigner DATABASE_URL et AUTH_SECRET
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Générer un secret NextAuth :
```bash
openssl rand -base64 32
```

Le site tourne sur http://localhost:3000.

## Compte de démonstration
Après le seed :
- **Email** : `admin@oximmo.fr`
- **Mot de passe** : `Admin123!`
- Espace pro : http://localhost:3000/login → http://localhost:3000/admin

⚠️ **Avant toute mise en production** : changer ce mot de passe (ou supprimer
le compte de seed et en recréer un) — il est en clair dans ce fichier et dans
`prisma/seed.ts`, donc trivialement devinable si le dépôt est un jour partagé
ou publié.

## Scripts
| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (`prisma generate` + `next build`) |
| `npm start` | Serveur de production |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:push` | `prisma db push` (sans migration) |
| `npm run db:seed` | Peuple la base (1 agence, 1 admin, 8 biens, 2 leads) |
| `npm run db:studio` | Prisma Studio |

## Architecture & choix
- **Prix en centimes** (`Int`) partout, jamais de flottant monétaire.
- **Auth NextAuth v5 splittée** : `lib/auth.config.ts` (edge-safe, pour le middleware) + `lib/auth.ts` (providers + `bcrypt`, côté Node). Nécessaire car `bcrypt` ne tourne pas sur l'Edge runtime.
- **Scoping des rôles** : `Property.ownerId` permet à un **AGENT** de ne voir/éditer que ses annonces ; un **ADMIN** gère toute l'agence. Voir `lib/guards.ts`.
- **Zod `.strict()`** sur toutes les entrées d'API (rejet des champs inconnus → 400).
- **Anti-spam leads** : honeypot (réponse `ok:true` silencieuse) + rate-limit IP + **Turnstile optionnel** (ignoré si `TURNSTILE_SECRET_KEY` absent).
- **SEO** : ISR sur l'accueil (`revalidate=300`), `generateMetadata`, JSON-LD `RealEstateListing`, `sitemap.ts` dynamique, `robots.ts`, pagination en `<Link>` crawlable.
- **En-têtes de sécurité** (`next.config.js`) : CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS.

## Limites connues (pistes prod)
- **Rate-limit en mémoire** (`Map`) : à remplacer par Redis/Upstash en serverless multi-instances.
- **Images par URL** : l'admin saisit des URLs. Ajouter un upload (S3 / UploadThing) pour un usage réel.
- Renseigner les vraies clés **Turnstile** en production pour activer l'anti-robot.
