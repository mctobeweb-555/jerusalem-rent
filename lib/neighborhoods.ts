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
// Bloc éditorial (eyebrow + titre + texte) — utilisé deux fois sur la page
// SEO dédiée à un quartier (`/[locale]/quartiers/[slug]`). Optionnel : tant
// qu'un quartier n'a pas sa rédaction dédiée, la page retombe sur un texte
// générique (cf. app/[locale]/quartiers/[slug]/page.tsx).
export type NeighborhoodEditorial = {
  eyebrow: Record<Locale, string>;
  title: Record<Locale, string>;
  text: Record<Locale, string>;
};

export type Neighborhood = {
  slug: string;
  name: string;
  tagline: Record<Locale, string>;
  image: string;
  count: number;
  // Histoire/caractère du quartier (1er bloc éditorial de la page dédiée).
  story?: NeighborhoodEditorial;
  // Vivre dans le quartier / expérience de séjour (2ᵉ bloc éditorial).
  lifestyle?: NeighborhoodEditorial;
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
    story: {
      eyebrow: {
        fr: "Quartier historique",
        en: "Historic quarter",
        he: "רובע היסטורי",
      },
      title: {
        fr: "Nahalat Shiva, l'âme artistique de Jérusalem",
        en: "Nahalat Shiva, the artistic soul of Jerusalem",
        he: "נחלת שבעה, הנשמה האמנותית של ירושלים",
      },
      text: {
        fr: "Fondé en 1869, Nahalat Shiva fut l'un des tout premiers quartiers bâtis hors des remparts de la vieille ville. Aujourd'hui, ses ruelles pavées et ses cours intérieures abritent galeries d'art, ateliers d'artisans et terrasses animées jusque tard le soir. À deux pas de la rue Ben Yehuda et du marché Mahane Yehuda, c'est l'adresse idéale pour vivre Jérusalem au rythme de ses habitants, entre pierre centenaire et effervescence contemporaine.",
        en: "Founded in 1869, Nahalat Shiva was one of the very first neighborhoods built outside the Old City walls. Today, its cobbled lanes and inner courtyards are home to art galleries, artisan workshops and terraces buzzing late into the evening. Just steps from Ben Yehuda Street and Mahane Yehuda Market, it's the perfect address to experience Jerusalem at the pace of its residents — where century-old stone meets contemporary energy.",
        he: "נחלת שבעה, שנוסדה ב-1869, הייתה אחת השכונות הראשונות שנבנו מחוץ לחומות העיר העתיקה. כיום, סמטאותיה המרוצפות וחצרותיה הפנימיות מארחות גלריות אמנות, סדנאות אומנים ומרפסות קפה תוססות עד השעות הקטנות. במרחק דקות הליכה מרחוב בן יהודה ומשוק מחנה יהודה, זהו המקום המושלם לחוות את ירושלים בקצב תושביה — במפגש בין אבן ירושלמית עתיקת יומין לתוסס העכשווי.",
      },
    },
    lifestyle: {
      eyebrow: {
        fr: "Vivre à Nahalat Shiva",
        en: "Living in Nahalat Shiva",
        he: "לגור בנחלת שבעה",
      },
      title: {
        fr: "Un pied-à-terre au cœur de la ville qui ne dort jamais",
        en: "A pied-à-terre in the heart of the city that never sleeps",
        he: "בית זמני בלב העיר שלא ישנה לעולם",
      },
      text: {
        fr: "Nos appartements à Nahalat Shiva conjuguent le charme de l'architecture ottomane — voûtes en pierre, hauts plafonds, patios ombragés — avec tout le confort moderne d'une location de prestige. Le matin, un café sur une terrasse ensoleillée ; le soir, les meilleures tables et bars à vin de la ville à quelques minutes à pied. Une base parfaite pour explorer Jérusalem sans jamais avoir besoin d'une voiture.",
        en: "Our apartments in Nahalat Shiva combine the charm of Ottoman-era architecture — stone vaults, high ceilings, shaded courtyards — with all the modern comfort you'd expect from a prestige rental. Coffee on a sunlit terrace in the morning; the city's best restaurants and wine bars a short walk away in the evening. The perfect base to explore Jerusalem without ever needing a car.",
        he: "הדירות שלנו בנחלת שבעה משלבות את קסמה של האדריכלות העות'מאנית — קמרונות אבן, תקרות גבוהות, חצרות מוצלות — עם כל הנוחות המודרנית המצופה משכירות יוקרתית. בבוקר, כוס קפה במרפסת שטופת שמש; בערב, המסעדות וברי היין הטובים בעיר במרחק הליכה קצרה. בסיס מושלם לגלות את ירושלים בלי צורך ברכב.",
      },
    },
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
