import { db } from "@/lib/db";
import etMessages from "@/messages/et.json";
import { translationAvailable } from "@/lib/translate";
import { TranslationEditor } from "./translation-editor";

export const dynamic = "force-dynamic";

const PAGE_SLUGS = ["reeglid", "kkk", "privaatsuspoliitika", "teenused"];

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else if (value && typeof value === "object") {
      Object.assign(out, flatten(value as Record<string, unknown>, path));
    }
  }
  return out;
}

export default async function TranslationsPage() {
  const [dbTranslations, pages] = await Promise.all([
    db.translation.findMany(),
    db.page.findMany({ where: { slug: { in: PAGE_SLUGS } } }),
  ]);

  // All known keys with their Estonian file defaults
  const defaults = flatten(etMessages as unknown as Record<string, unknown>);

  const overrides: Record<string, Record<string, string>> = {};
  for (const row of dbTranslations) {
    overrides[row.key] ??= {};
    overrides[row.key][row.language] = row.value;
  }

  const pageContents: Record<string, Record<string, string>> = {};
  for (const slug of PAGE_SLUGS) {
    const page = pages.find((p) => p.slug === slug);
    const content: Record<string, string> = { et: "", en: "", ru: "", lv: "", lt: "" };
    if (page?.content && typeof page.content === "object") {
      for (const [lang, value] of Object.entries(page.content as Record<string, unknown>)) {
        if (typeof value === "string") content[lang] = value;
      }
    }
    pageContents[slug] = content;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tõlked</h1>
      <TranslationEditor
        defaults={defaults}
        overrides={overrides}
        pageContents={pageContents}
        canAutoTranslate={translationAvailable()}
      />
    </div>
  );
}
