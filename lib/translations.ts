import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/**
 * Admin-managed translation overrides stored in the Translation table.
 * Cached for 60s and revalidated by tag when the admin saves changes.
 */
export const getDbTranslations = unstable_cache(
  async (language: string): Promise<Record<string, string>> => {
    if (!process.env.DATABASE_URL) return {};
    const rows = await db.translation.findMany({ where: { language } });
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  },
  ["db-translations"],
  { revalidate: 60, tags: ["translations"] }
);
