import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "./types";
import { fr } from "./fr";
import { en } from "./en";
import { he } from "./he";

export type { Dictionary } from "./types";

const dictionaries: Record<Locale, Dictionary> = { fr, en, he };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
