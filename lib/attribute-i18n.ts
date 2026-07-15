/**
 * Translations for the controlled-vocabulary vehicle attribute values
 * (fuel type, gearbox, driven axle, climate, colour, condition, …).
 *
 * These values are stored in the database as single Estonian strings rather
 * than localized JSON, so — unlike the title/description — they are not
 * covered by the Claude auto-translation flow. This dictionary translates the
 * standard values on the fly, deterministically and without an API call, so it
 * also works retroactively for auctions created before this existed.
 *
 * Unknown / free-text values fall back to the original Estonian.
 */

type Locale = "et" | "en" | "ru" | "lv" | "lt";

/** Estonian value (lower-cased) → { en, ru, lv, lt }. */
const DICTIONARY: Record<string, Record<Exclude<Locale, "et">, string>> = {
  // Fuel type
  bensiin: { en: "Petrol", ru: "Бензин", lv: "Benzīns", lt: "Benzinas" },
  diisel: { en: "Diesel", ru: "Дизель", lv: "Dīzelis", lt: "Dyzelinas" },
  elekter: { en: "Electric", ru: "Электро", lv: "Elektrība", lt: "Elektra" },
  hübriid: { en: "Hybrid", ru: "Гибрид", lv: "Hibrīds", lt: "Hibridas" },
  gaas: { en: "Gas / LPG", ru: "Газ", lv: "Gāze", lt: "Dujos" },

  // Gearbox
  manuaal: { en: "Manual", ru: "Механика", lv: "Manuālā", lt: "Mechaninė" },
  automaat: { en: "Automatic", ru: "Автомат", lv: "Automātiskā", lt: "Automatinė" },
  poolautomaat: {
    en: "Semi-automatic",
    ru: "Полуавтомат",
    lv: "Pusautomātiskā",
    lt: "Pusautomatė",
  },

  // Driven axle
  esivedu: {
    en: "Front-wheel drive",
    ru: "Передний привод",
    lv: "Priekšpiedziņa",
    lt: "Priekinių ratų pavara",
  },
  tagavedu: {
    en: "Rear-wheel drive",
    ru: "Задний привод",
    lv: "Aizmugures piedziņa",
    lt: "Galinių ratų pavara",
  },
  nelikvedu: {
    en: "All-wheel drive",
    ru: "Полный привод",
    lv: "Pilnpiedziņa",
    lt: "Visų ratų pavara",
  },

  // Climate control
  kliimaautomaatik: {
    en: "Climate control",
    ru: "Климат-контроль",
    lv: "Klimata kontrole",
    lt: "Klimato kontrolė",
  },
  konditsioneer: {
    en: "Air conditioning",
    ru: "Кондиционер",
    lv: "Kondicionieris",
    lt: "Oro kondicionierius",
  },
  "manuaalne kliima": {
    en: "Manual air conditioning",
    ru: "Ручной кондиционер",
    lv: "Manuālais kondicionieris",
    lt: "Rankinis oro kondicionierius",
  },

  // Colour
  must: { en: "Black", ru: "Чёрный", lv: "Melns", lt: "Juoda" },
  valge: { en: "White", ru: "Белый", lv: "Balts", lt: "Balta" },
  hall: { en: "Grey", ru: "Серый", lv: "Pelēks", lt: "Pilka" },
  hõbedane: { en: "Silver", ru: "Серебристый", lv: "Sudraba", lt: "Sidabrinė" },
  sinine: { en: "Blue", ru: "Синий", lv: "Zils", lt: "Mėlyna" },
  punane: { en: "Red", ru: "Красный", lv: "Sarkans", lt: "Raudona" },
  roheline: { en: "Green", ru: "Зелёный", lv: "Zaļš", lt: "Žalia" },
  kollane: { en: "Yellow", ru: "Жёлтый", lv: "Dzeltens", lt: "Geltona" },
  pruun: { en: "Brown", ru: "Коричневый", lv: "Brūns", lt: "Ruda" },
  beež: { en: "Beige", ru: "Бежевый", lv: "Bēšs", lt: "Smėlio" },
  oranž: { en: "Orange", ru: "Оранжевый", lv: "Oranžs", lt: "Oranžinė" },
  kuldne: { en: "Gold", ru: "Золотой", lv: "Zelta", lt: "Auksinė" },
  lilla: { en: "Purple", ru: "Фиолетовый", lv: "Violets", lt: "Violetinė" },

  // Condition
  uus: { en: "New", ru: "Новый", lv: "Jauns", lt: "Naujas" },
  kasutatud: { en: "Used", ru: "Б/у", lv: "Lietots", lt: "Naudotas" },
  avariiline: { en: "Damaged", ru: "Аварийный", lv: "Bojāts", lt: "Apgadintas" },
  korras: { en: "Good condition", ru: "В порядке", lv: "Labā stāvoklī", lt: "Geros būklės" },
};

function translateToken(token: string, locale: Exclude<Locale, "et">): string {
  const trimmed = token.trim();
  if (!trimmed) return token;
  const hit = DICTIONARY[trimmed.toLowerCase()];
  return hit ? hit[locale] : trimmed;
}

/**
 * Translate a single stored attribute value into the target locale. Compound
 * values separated by commas or slashes (e.g. "Kasutatud, avariiline") are
 * translated token by token. Anything not in the dictionary is returned as-is.
 */
export function translateAttrValue(
  value: string | null | undefined,
  locale: string,
): string | null | undefined {
  if (value == null || locale === "et") return value;
  if (!["en", "ru", "lv", "lt"].includes(locale)) return value;
  const target = locale as Exclude<Locale, "et">;

  // Translate each part of a compound value, normalising spacing around the
  // original separators only. (We must not touch slashes that appear *inside* a
  // translated token, e.g. the Russian "Б/у".)
  return value
    .split(/([,/])/)
    .map((part) => {
      if (part === ",") return ", ";
      if (part === "/") return " / ";
      return translateToken(part, target);
    })
    .join("");
}
