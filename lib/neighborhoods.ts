import type { Locale } from "@/lib/i18n/config";

// Quartiers mis en avant sur jerusalem-rent.com — liste éditoriale, triée
// par nombre de biens décroissant sur le site de référence. Les noms sont
// des noms propres (identiques dans les 3 langues) ; les accroches sont
// traduites. Photos réelles par quartier (public/brand/neighborhoods/,
// fournies par l'utilisateur depuis jerusalem-rent.com, retraitées via
// sharp) — Ben Meimon reste sur la photo hero principale du site (pas de
// photo dédiée fournie). `count` = nombre d'appartements affiché sur le
// carousel — pas de granularité par quartier en base aujourd'hui, valeurs
// indicatives cohérentes avec le tri décroissant, à remplacer par un vrai
// comptage si besoin (le champ `Property.neighborhood` existe désormais).
export type Neighborhood = {
  slug: string;
  name: string;
  tagline: Record<Locale, string>;
  image: string;
  count: number;
};

export const NEIGHBORHOODS: Neighborhood[] = [
  {
    slug: "nahalat-shiva",
    name: "Nahalat Shiva",
    tagline: {
      fr: "Ruelles pavées, ateliers d'artistes et cafés animés au cœur de la ville.",
      en: "Cobbled lanes, artisan studios and lively cafés in the heart of the city.",
      he: "סמטאות מרוצפות, סדנאות אמנים ובתי קפה תוססים בלב העיר.",
    },
    image: "/brand/neighborhoods/nahalat-shiva.jpg",
    count: 14,
  },
  {
    slug: "city-center-rav-kook",
    name: "City Center / Rav Kook",
    tagline: {
      fr: "L'adresse la plus centrale, à deux pas de tout ce que Jérusalem offre.",
      en: "The most central address, steps from everything Jerusalem has to offer.",
      he: "הכתובת המרכזית ביותר, במרחק צעדים מכל מה שירושלים מציעה.",
    },
    image: "/brand/neighborhoods/city-center-rav-kook.jpg",
    count: 11,
  },
  {
    slug: "king-david-residence",
    name: "King David Residence",
    tagline: {
      fr: "Une avenue emblématique, au pied de l'hôtel King David.",
      en: "An iconic avenue, at the foot of the King David Hotel.",
      he: "שדרה איקונית, למרגלות מלון המלך דוד.",
    },
    image: "/brand/neighborhoods/king-david-residence.jpg",
    count: 9,
  },
  {
    slug: "talbieh",
    name: "Talbieh",
    tagline: {
      fr: "Quartier résidentiel élégant, ambassades et rues bordées d'arbres.",
      en: "An elegant residential district of embassies and tree-lined streets.",
      he: "שכונת מגורים אלגנטית עם שגרירויות ורחובות מוצלים.",
    },
    image: "/brand/neighborhoods/talbieh.jpg",
    count: 8,
  },
  {
    slug: "moshava-germanit",
    name: "Moshava Germanit",
    tagline: {
      fr: "Maisons templières de caractère, terrasses et cafés familiaux.",
      en: "Characterful Templer houses, terraces and family-friendly cafés.",
      he: "בתי טמפלרים מלאי אופי, מרפסות ובתי קפה משפחתיים.",
    },
    image: "/brand/neighborhoods/moshava-germanit.jpg",
    count: 7,
  },
  {
    slug: "waldorf-astoria",
    name: "Waldorf Astoria",
    tagline: {
      fr: "L'adresse ultra-prestigieuse, juste à côté de l'hôtel Waldorf Astoria.",
      en: "The ultra-prestigious address, right next to the Waldorf Astoria hotel.",
      he: "הכתובת היוקרתית ביותר, ממש לצד מלון וולדורף אסטוריה.",
    },
    image: "/brand/neighborhoods/waldorf-astoria.jpg",
    count: 6,
  },
  {
    slug: "mamilla",
    name: "Mamilla",
    tagline: {
      fr: "Promenade commerçante chic face aux remparts de la vieille ville.",
      en: "A chic shopping promenade facing the Old City walls.",
      he: "שדרת קניות שיקית מול חומות העיר העתיקה.",
    },
    image: "/brand/neighborhoods/mamilla.jpg",
    count: 5,
  },
  {
    slug: "yemin-moshe",
    name: "Yemin Moshe",
    tagline: {
      fr: "Quartier d'artistes pittoresque, moulin à vent et vue sur la vieille ville.",
      en: "A picturesque artists' quarter, windmill and views over the Old City.",
      he: "רובע אמנים ציורי, טחנת רוח ונוף לעיר העתיקה.",
    },
    image: "/brand/neighborhoods/yemin-moshe.jpg",
    count: 4,
  },
  {
    slug: "ben-meimon",
    name: "Ben Meimon",
    tagline: {
      fr: "Rue paisible et raffinée, à deux pas du parc Liberty Bell.",
      en: "A quiet, refined street, just steps from Liberty Bell Park.",
      he: "רחוב שקט ומהודר, במרחק צעדים מפארק פעמון החירות.",
    },
    // Photo hero principale du site (aucune photo dédiée fournie pour ce quartier).
    image: "/brand/hero-jerusalem.jpg",
    count: 3,
  },
];
