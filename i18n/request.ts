import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { getDbTranslations } from "@/lib/translations";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;

  // Admin-managed translation overrides from the database (best-effort:
  // falls back to file messages when the DB is unreachable, e.g. at build time)
  let overrides: Record<string, string> = {};
  try {
    overrides = await getDbTranslations(locale);
  } catch {
    overrides = {};
  }

  // Merge dot-notation DB keys (e.g. "nav.home") into the nested messages object
  const merged = structuredClone(messages) as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides)) {
    const parts = key.split(".");
    let node: Record<string, unknown> = merged;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof node[parts[i]] !== "object" || node[parts[i]] === null) {
        node[parts[i]] = {};
      }
      node = node[parts[i]] as Record<string, unknown>;
    }
    node[parts[parts.length - 1]] = value;
  }

  return { locale, messages: merged as never };
});
