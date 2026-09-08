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
    story: {
      eyebrow: {
        fr: "Au cœur battant de la ville",
        en: "The beating heart of the city",
        he: "הלב הפועם של העיר",
      },
      title: {
        fr: "City Center, l'énergie de Jérusalem au quotidien",
        en: "City Center, Jerusalem's everyday energy",
        he: "מרכז העיר, האנרגיה היומיומית של ירושלים",
      },
      text: {
        fr: "Entre la rue Yafo, les ruelles piétonnes de Ben Yehuda et le célèbre marché de Mahane Yehuda, ce quartier concentre tout ce qui fait vibrer Jérusalem : commerces, cafés, galeries et vie nocturne, à deux pas des lieux les plus emblématiques de la ville. La rue Rav Kook, plus discrète, offre un havre de calme au milieu de cette effervescence.",
        en: "Between Jaffa Street, the pedestrian lanes of Ben Yehuda and the famous Mahane Yehuda Market, this neighborhood concentrates everything that makes Jerusalem come alive: shops, cafés, galleries and nightlife, steps from the city's most iconic sites. The quieter Rav Kook Street offers a calm haven right in the middle of it all.",
        he: "בין רחוב יפו, סמטאות המדרחוב של בן יהודה ושוק מחנה יהודה המפורסם, השכונה הזו מרכזת את כל מה שהופך את ירושלים לתוססת: חנויות, בתי קפה, גלריות וחיי לילה, במרחק צעדים מהאתרים המוכרים ביותר בעיר. רחוב רב קוק השקט יותר מציע מקלט רגוע בלב התסיסה הזו.",
      },
    },
    lifestyle: {
      eyebrow: {
        fr: "Vivre au City Center",
        en: "Living in City Center",
        he: "לגור במרכז העיר",
      },
      title: {
        fr: "Tout Jérusalem à portée de main",
        en: "All of Jerusalem within reach",
        he: "כל ירושלים בהישג יד",
      },
      text: {
        fr: "Depuis nos appartements du City Center, le tramway, les commerces et les meilleures tables de la ville sont à quelques minutes à pied. Un emplacement idéal pour découvrir Jérusalem sans jamais avoir besoin de voiture, entre virées shopping, marché coloré et soirées animées.",
        en: "From our City Center apartments, the light rail, shops and the city's best restaurants are minutes away on foot. An ideal base to discover Jerusalem without ever needing a car, between shopping trips, the colorful market and lively evenings.",
        he: "מהדירות שלנו במרכז העיר, הרכבת הקלה, החנויות והמסעדות הטובות בעיר נמצאות במרחק דקות הליכה. מיקום אידיאלי לגלות את ירושלים בלי צורך ברכב, בין קניות, השוק הצבעוני וערבים תוססים.",
      },
    },
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
    story: {
      eyebrow: {
        fr: "Une avenue légendaire",
        en: "A legendary avenue",
        he: "שדרה אגדית",
      },
      title: {
        fr: "King David Residence, l'élégance intemporelle de Jérusalem",
        en: "King David Residence, Jerusalem's timeless elegance",
        he: "King David Residence, האלגנטיות הנצחית של ירושלים",
      },
      text: {
        fr: "Nichée au pied du mythique hôtel King David — qui a accueilli rois, présidents et artistes depuis 1931 — cette avenue incarne le raffinement discret de Jérusalem. Larges trottoirs ombragés, architecture soignée et remparts de la vieille ville en toile de fond : c'est l'une des adresses les plus prestigieuses de la ville.",
        en: "Nestled at the foot of the legendary King David Hotel — which has hosted kings, presidents and artists since 1931 — this avenue embodies Jerusalem's understated refinement. Wide shaded sidewalks, elegant architecture and Old City walls on the horizon: one of the city's most prestigious addresses.",
        he: "בסמוך למלון המלך דוד האגדי — שאירח מלכים, נשיאים ואמנים מאז 1931 — השדרה הזו מגלמת את העידון המאופק של ירושלים. מדרכות רחבות ומוצלות, אדריכלות מטופחת וחומות העיר העתיקה באופק — אחת הכתובות היוקרתיות ביותר בעיר.",
      },
    },
    lifestyle: {
      eyebrow: {
        fr: "Vivre à King David",
        en: "Living at King David",
        he: "לגור ב-King David",
      },
      title: {
        fr: "Le luxe tranquille, à deux pas de la vieille ville",
        en: "Quiet luxury, steps from the Old City",
        he: "יוקרה שקטה, במרחק צעדים מהעיר העתיקה",
      },
      text: {
        fr: "Nos appartements sur King David Residence offrent le calme d'un quartier résidentiel haut de gamme tout en restant à quinze minutes à pied de la porte de Jaffa et de la vieille ville. Le parc Liberty Bell et ses pelouses sont juste en contrebas, parfaits pour une promenade matinale avant de partir explorer la ville.",
        en: "Our apartments on King David Residence offer the calm of an upscale residential neighborhood while staying a fifteen-minute walk from Jaffa Gate and the Old City. Liberty Bell Park and its lawns are just below, perfect for a morning stroll before setting out to explore.",
        he: "הדירות שלנו ב-King David Residence מציעות את השקט של שכונת מגורים יוקרתית, תוך שמירה על מרחק הליכה של רבע שעה משער יפו והעיר העתיקה. פארק פעמון החירות ומדשאותיו נמצאים ממש למטה, מושלמים לטיול בוקר לפני היציאה לגלות את העיר.",
      },
    },
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
    story: {
      eyebrow: {
        fr: "Le quartier des ambassades",
        en: "The diplomatic quarter",
        he: "רובע השגרירויות",
      },
      title: {
        fr: "Talbieh, l'élégance discrète de Jérusalem",
        en: "Talbieh, Jerusalem's quiet elegance",
        he: "טלביה, האלגנטיות השקטה של ירושלים",
      },
      text: {
        fr: "Rues bordées d'arbres, résidences d'ambassadeurs et villas de caractère : Talbieh est l'un des quartiers résidentiels les plus recherchés de la ville. À deux pas du Théâtre de Jérusalem et du Musée d'Israël, il offre un cadre de vie paisible et verdoyant, tout en restant proche du centre-ville et de la vieille ville.",
        en: "Tree-lined streets, ambassadors' residences and characterful villas: Talbieh is one of the city's most sought-after residential neighborhoods. Steps from the Jerusalem Theatre and the Israel Museum, it offers a peaceful, leafy setting while staying close to downtown and the Old City.",
        he: "רחובות מוצלים, מגורי שגרירים ווילות מלאות אופי: טלביה היא אחת משכונות המגורים המבוקשות ביותר בעיר. במרחק צעדים מתיאטרון ירושלים ומוזיאון ישראל, היא מציעה סביבת מגורים שלווה וירוקה, תוך שמירה על קרבה למרכז העיר ולעיר העתיקה.",
      },
    },
    lifestyle: {
      eyebrow: {
        fr: "Vivre à Talbieh",
        en: "Living in Talbieh",
        he: "לגור בטלביה",
      },
      title: {
        fr: "La sérénité d'un quartier résidentiel de prestige",
        en: "The serenity of a prestige residential quarter",
        he: "השלווה של רובע מגורים יוקרתי",
      },
      text: {
        fr: "Séjourner à Talbieh, c'est profiter du calme d'un quartier verdoyant et sécurisé, tout en gardant un accès rapide aux musées, au centre-ville et aux principaux lieux de culte de Jérusalem. Un choix parfait pour les familles et les séjours prolongés, loin de l'agitation touristique.",
        en: "Staying in Talbieh means enjoying the calm of a green, secure neighborhood while keeping quick access to the museums, downtown and Jerusalem's main holy sites. A perfect choice for families and longer stays, away from the tourist bustle.",
        he: "לשהות בטלביה משמעה ליהנות מהשקט של שכונה ירוקה ובטוחה, תוך שמירה על גישה מהירה למוזיאונים, למרכז העיר ולאתרי הקודש המרכזיים של ירושלים. בחירה מושלמת למשפחות ולשהויות ארוכות, הרחק מהמולת התיירות.",
      },
    },
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
    story: {
      eyebrow: {
        fr: "La colonie allemande",
        en: "The German Colony",
        he: "המושבה הגרמנית",
      },
      title: {
        fr: "Moshava Germanit, le charme templier de Jérusalem",
        en: "Moshava Germanit, Jerusalem's Templer charm",
        he: "מושבה גרמנית, הקסם הטמפלרי של ירושלים",
      },
      text: {
        fr: "Fondée à la fin du XIXe siècle par des colons templiers allemands, la Moshava Germanit a conservé ses maisons de pierre au caractère unique, aujourd'hui bordées de cafés, boutiques et restaurants le long de la rue Emek Refaim. C'est l'un des quartiers les plus prisés des familles jérusalémites, entre patrimoine architectural et art de vivre convivial.",
        en: "Founded in the late 19th century by German Templer settlers, the Moshava Germanit has kept its uniquely characterful stone houses, now lined with cafés, boutiques and restaurants along Emek Refaim Street. It's one of the favorite neighborhoods for Jerusalem families, blending architectural heritage with easygoing living.",
        he: "המושבה הגרמנית, שנוסדה בסוף המאה ה-19 על ידי מתיישבים טמפלרים גרמנים, שימרה את בתי האבן ייחודיי האופי שלה, המוקפים כיום בבתי קפה, בוטיקים ומסעדות לאורך רחוב עמק רפאים. זו אחת השכונות האהובות ביותר על משפחות ירושלמיות, בין מורשת אדריכלית לאורח חיים נינוח.",
      },
    },
    lifestyle: {
      eyebrow: {
        fr: "Vivre à la Moshava",
        en: "Living in the Moshava",
        he: "לגור במושבה",
      },
      title: {
        fr: "L'art de vivre familial, à la jérusalémite",
        en: "Family life, Jerusalem style",
        he: "חיי משפחה, בסגנון ירושלמי",
      },
      text: {
        fr: "Nos appartements dans la Moshava Germanit vous plongent dans le quotidien authentique de Jérusalem : brunch du vendredi sur Emek Refaim, terrasses ombragées et rues calmes bordées de jardins. Un quartier chaleureux, idéal pour les familles et les séjours qui se veulent proches de la vie locale.",
        en: "Our apartments in the Moshava Germanit place you at the heart of authentic Jerusalem living: Friday brunch on Emek Refaim, shaded terraces and quiet garden-lined streets. A warm neighborhood, ideal for families and stays that want to feel close to local life.",
        he: "הדירות שלנו במושבה הגרמנית מכניסות אתכם ללב היומיום הירושלמי האותנטי: ארוחת בוקר של יום שישי בעמק רפאים, מרפסות מוצלות ורחובות שקטים מוקפי גינות. שכונה חמימה, אידיאלית למשפחות ולשהויות שרוצות להרגיש קרובות לחיים המקומיים.",
      },
    },
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
    story: {
      eyebrow: {
        fr: "L'adresse la plus exclusive",
        en: "The most exclusive address",
        he: "הכתובת הבלעדית ביותר",
      },
      title: {
        fr: "Waldorf Astoria, le sommet du prestige à Jérusalem",
        en: "Waldorf Astoria, the height of prestige in Jerusalem",
        he: "וולדורף אסטוריה, שיא היוקרה בירושלים",
      },
      text: {
        fr: "Juste à côté du somptueux hôtel Waldorf Astoria — installé dans l'ancien Palace Hotel historique — ce secteur incarne le luxe absolu à Jérusalem. À deux pas de Mamilla et de la porte de Jaffa, c'est l'adresse rêvée pour un séjour d'exception, entre architecture remarquable et service cinq étoiles à portée de main.",
        en: "Right next to the sumptuous Waldorf Astoria hotel — housed in the historic Palace Hotel building — this area embodies absolute luxury in Jerusalem. Steps from Mamilla and Jaffa Gate, it's the dream address for an exceptional stay, with outstanding architecture and five-star service close at hand.",
        he: "ממש ליד מלון וולדורף אסטוריה המפואר — הממוקם במבנה ההיסטורי של מלון פאלאס — האזור הזה מגלם את היוקרה המוחלטת בירושלים. במרחק צעדים ממאמילה ומשער יפו, זו הכתובת החלומית לשהות יוצאת דופן, עם אדריכלות מרשימה ושירות חמישה כוכבים בהישג יד.",
      },
    },
    lifestyle: {
      eyebrow: {
        fr: "Vivre près du Waldorf Astoria",
        en: "Living near the Waldorf Astoria",
        he: "לגור ליד וולדורף אסטוריה",
      },
      title: {
        fr: "Un séjour digne des plus grandes adresses",
        en: "A stay worthy of the finest addresses",
        he: "שהות הראויה לכתובות הגדולות ביותר",
      },
      text: {
        fr: "Nos appartements dans ce secteur offrent tout le prestige de l'emplacement, avec l'intimité et l'espace d'un vrai chez-soi. La promenade Mamilla, ses boutiques de luxe et la vieille ville sont accessibles à pied, pour un séjour alliant confort résidentiel et adresse d'exception.",
        en: "Our apartments in this area offer all the prestige of the location, with the privacy and space of a real home. The Mamilla promenade, its luxury boutiques and the Old City are all within walking distance, for a stay combining residential comfort with an exceptional address.",
        he: "הדירות שלנו באזור מציעות את כל היוקרה של המיקום, עם הפרטיות והמרחב של בית אמיתי. שדרת ממילא, חנויות היוקרה שלה והעיר העתיקה נגישות ברגל, לשהות המשלבת נוחות מגורים עם כתובת יוצאת דופן.",
      },
    },
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
    story: {
      eyebrow: {
        fr: "La promenade chic",
        en: "The chic promenade",
        he: "השדרה השיקית",
      },
      title: {
        fr: "Mamilla, où la ville moderne rencontre la vieille ville",
        en: "Mamilla, where modern Jerusalem meets the Old City",
        he: "ממילא, המפגש בין ירושלים המודרנית לעיר העתיקה",
      },
      text: {
        fr: "Avec sa promenade piétonne bordée de boutiques de luxe et de restaurants, face aux remparts de la vieille ville, Mamilla est le point de rencontre entre le Jérusalem contemporain et son histoire millénaire. La porte de Jaffa et la Tour de David sont à quelques pas, offrant un accès direct au cœur historique de la ville.",
        en: "With its pedestrian promenade lined with luxury boutiques and restaurants, facing the Old City walls, Mamilla is where contemporary Jerusalem meets its ancient history. Jaffa Gate and the Tower of David are steps away, giving direct access to the city's historic heart.",
        he: "עם שדרת ההולכי הרגל שלה, מוקפת בוטיקים יוקרתיים ומסעדות, מול חומות העיר העתיקה, ממילא היא נקודת המפגש בין ירושלים העכשווית להיסטוריה בת אלפי השנים שלה. שער יפו ומגדל דוד נמצאים במרחק צעדים, ומעניקים גישה ישירה ללב ההיסטורי של העיר.",
      },
    },
    lifestyle: {
      eyebrow: {
        fr: "Vivre à Mamilla",
        en: "Living in Mamilla",
        he: "לגור בממילא",
      },
      title: {
        fr: "Le meilleur des deux Jérusalem, à votre porte",
        en: "The best of both Jerusalems, at your door",
        he: "הטוב משתי הירושלים, ממש ליד הבית",
      },
      text: {
        fr: "Séjourner à Mamilla, c'est profiter d'un emplacement unique : shopping et gastronomie raffinée d'un côté, ruelles de la vieille ville et lieux saints de l'autre. Nos appartements du secteur vous placent au centre de cette double expérience, à distance de marche de tout ce que Jérusalem a de plus emblématique.",
        en: "Staying in Mamilla means enjoying a unique location: shopping and fine dining on one side, Old City lanes and holy sites on the other. Our apartments in the area put you at the center of this double experience, within walking distance of everything Jerusalem is famous for.",
        he: "לשהות בממילא משמעה ליהנות ממיקום ייחודי: קניות וגסטרונומיה משובחת מצד אחד, סמטאות העיר העתיקה ואתרי קודש מהצד השני. הדירות שלנו באזור ממקמות אתכם במרכז החוויה הכפולה הזו, במרחק הליכה מכל מה שירושלים ידועה בו.",
      },
    },
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
    story: {
      eyebrow: {
        fr: "Le quartier des artistes",
        en: "The artists' quarter",
        he: "רובע האמנים",
      },
      title: {
        fr: "Yemin Moshe, la carte postale de Jérusalem",
        en: "Yemin Moshe, Jerusalem's postcard neighborhood",
        he: "ימין משה, גלויית הנוף של ירושלים",
      },
      text: {
        fr: "Fondé en 1891 autour du célèbre moulin à vent de Montefiore, Yemin Moshe est l'un des quartiers les plus pittoresques de Jérusalem. Ses ruelles pavées, ses maisons de pierre couvertes de bougainvilliers et ses galeries d'art offrent une vue imprenable sur les remparts de la vieille ville et le mont Sion.",
        en: "Founded in 1891 around the famous Montefiore windmill, Yemin Moshe is one of Jerusalem's most picturesque neighborhoods. Its cobbled lanes, bougainvillea-covered stone houses and art galleries offer sweeping views of the Old City walls and Mount Zion.",
        he: "ימין משה, שנוסדה ב-1891 סביב טחנת הרוח המפורסמת של מונטיפיורי, היא אחת השכונות הציוריות ביותר בירושלים. סמטאותיה המרוצפות, בתי האבן המכוסים בבוגנוויליה וגלריות האמנות שלה מציעים נוף פנורמי לחומות העיר העתיקה ולהר ציון.",
      },
    },
    lifestyle: {
      eyebrow: {
        fr: "Vivre à Yemin Moshe",
        en: "Living in Yemin Moshe",
        he: "לגור בימין משה",
      },
      title: {
        fr: "Un tableau vivant, entre art et histoire",
        en: "A living painting, between art and history",
        he: "ציור חי, בין אמנות להיסטוריה",
      },
      text: {
        fr: "Séjourner à Yemin Moshe, c'est se réveiller face à la vieille ville, flâner dans des ruelles dignes d'une carte postale et découvrir les galeries d'artistes locaux. Un cadre exceptionnel, à quelques minutes à pied de la porte de Jaffa et du quartier de Mamilla.",
        en: "Staying in Yemin Moshe means waking up facing the Old City, wandering postcard-worthy lanes and discovering local artists' galleries. An exceptional setting, minutes on foot from Jaffa Gate and the Mamilla quarter.",
        he: "לשהות בימין משה משמעה להתעורר מול העיר העתיקה, לשוטט בסמטאות ציוריות ולגלות גלריות של אמנים מקומיים. סביבה יוצאת דופן, במרחק דקות הליכה משער יפו ורובע ממילא.",
      },
    },
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
    story: {
      eyebrow: {
        fr: "Discrétion et raffinement",
        en: "Discretion and refinement",
        he: "צניעות ועידון",
      },
      title: {
        fr: "Ben Meimon, le calme au cœur de la ville",
        en: "Ben Meimon, calm at the heart of the city",
        he: "בן מימון, השקט בלב העיר",
      },
      text: {
        fr: "Rue résidentielle paisible entre Talbieh et le parc Liberty Bell, Ben Meimon offre un cadre de vie discret et raffiné, loin de l'agitation touristique tout en restant à distance de marche du centre-ville, du parc et des grands musées de Jérusalem.",
        en: "A quiet residential street between Talbieh and Liberty Bell Park, Ben Meimon offers a discreet, refined setting away from the tourist bustle, while staying within walking distance of downtown, the park and Jerusalem's major museums.",
        he: "רחוב מגורים שקט בין טלביה לפארק פעמון החירות, בן מימון מציע סביבת מגורים צנועה ומעודנת הרחק מהמולת התיירות, תוך שמירה על מרחק הליכה ממרכז העיר, מהפארק ומהמוזיאונים הגדולים של ירושלים.",
      },
    },
    lifestyle: {
      eyebrow: {
        fr: "Vivre à Ben Meimon",
        en: "Living in Ben Meimon",
        he: "לגור בבן מימון",
      },
      title: {
        fr: "Un pied-à-terre au calme, jamais isolé",
        en: "A quiet pied-à-terre, never isolated",
        he: "בית זמני שקט, לעולם לא מבודד",
      },
      text: {
        fr: "Nos appartements de Ben Meimon offrent la tranquillité d'une rue résidentielle huppée, avec le parc Liberty Bell pour prolongement naturel. Une base idéale pour un séjour reposant, à quelques minutes à pied des quartiers les plus animés de la ville.",
        en: "Our Ben Meimon apartments offer the tranquility of an upscale residential street, with Liberty Bell Park as a natural extension. An ideal base for a restful stay, minutes on foot from the city's liveliest neighborhoods.",
        he: "הדירות שלנו בבן מימון מציעות את השלווה של רחוב מגורים יוקרתי, עם פארק פעמון החירות כהמשך טבעי. בסיס אידיאלי לשהות מרגיעה, במרחק דקות הליכה מהשכונות התוססות ביותר בעיר.",
      },
    },
  },
];
