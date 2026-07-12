import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const DEFAULT_SETTINGS: Record<string, string> = {
  min_bid_increment: "50",
  contact_phone_info: "+372 5647 2277",
  contact_phone_tow: "+372 5666 8822",
  contact_email: "romu@romu.ee",
  business_name: "AMJ Autoäri OÜ",
  business_reg: "10615599",
  business_address: "Üksnurme tee 14, Saku 75501",
  business_hours: "E–R 9–17, L–P suletud",
};

export const getSettings = unstable_cache(
  async (): Promise<Record<string, string>> => {
    if (!process.env.DATABASE_URL) return { ...DEFAULT_SETTINGS };
    try {
      const rows = await db.siteSettings.findMany();
      return {
        ...DEFAULT_SETTINGS,
        ...Object.fromEntries(rows.map((row) => [row.key, row.value])),
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },
  ["site-settings"],
  { revalidate: 60, tags: ["settings"] }
);

export async function getMinBidIncrement(): Promise<number> {
  const settings = await getSettings();
  const value = Number(settings.min_bid_increment);
  return Number.isFinite(value) && value > 0 ? value : 50;
}
