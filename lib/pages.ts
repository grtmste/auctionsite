import { db } from "@/lib/db";
import { localized } from "@/lib/utils";

/** Fetch an admin-editable content page (reeglid, kkk, privaatsuspoliitika, teenused) */
export async function getPageContent(
  slug: string,
  locale: string
): Promise<string> {
  try {
    const page = await db.page.findUnique({ where: { slug } });
    return page ? localized(page.content, locale) : "";
  } catch {
    return "";
  }
}
