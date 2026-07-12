import { defineRouting } from "next-intl/routing";

export const locales = ["et", "en", "ru", "lv", "lt"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "et",
  // Estonian has no URL prefix, other languages use /en, /ru, /lv, /lt
  localePrefix: "as-needed",
});
