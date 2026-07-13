import { db } from "@/lib/db";
import { translateHtml, translationAvailable } from "@/lib/translate";

const BASE = "https://www.romu.ee";
const PAGE_SLUGS = ["reeglid", "teenused", "kkk", "privaatsuspoliitika"] as const;
const OTHER_LANGS = ["en", "ru", "lv", "lt"] as const;

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "et,en;q=0.8",
};

async function fetchPage(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    headers: FETCH_HEADERS,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Fetch ${path} failed: HTTP ${res.status}`);
  return res.text();
}

/**
 * Extract the main WordPress content area from a page. Looks for the
 * entry-content container and balances nested divs to find its end.
 */
function extractMainContent(html: string): string | null {
  const markers = [
    /<div[^>]*class="[^"]*\bentry-content\b[^"]*"[^>]*>/i,
    /<div[^>]*class="[^"]*\bpage-content\b[^"]*"[^>]*>/i,
    /<article[^>]*>/i,
    /<main[^>]*>/i,
  ];
  for (const marker of markers) {
    const match = marker.exec(html);
    if (!match) continue;
    const start = match.index + match[0].length;
    const isDiv = match[0].startsWith("<div");
    const openTag = isDiv ? /<div\b/gi : match[0].startsWith("<article") ? /<article\b/gi : /<main\b/gi;
    const closeTag = isDiv ? /<\/div>/gi : match[0].startsWith("<article") ? /<\/article>/gi : /<\/main>/gi;

    // Balance nested tags to find the matching close
    let depth = 1;
    let position = start;
    while (depth > 0 && position < html.length) {
      openTag.lastIndex = position;
      closeTag.lastIndex = position;
      const nextOpen = openTag.exec(html);
      const nextClose = closeTag.exec(html);
      if (!nextClose) return null;
      if (nextOpen && nextOpen.index < nextClose.index) {
        depth++;
        position = nextOpen.index + nextOpen[0].length;
      } else {
        depth--;
        position = nextClose.index + nextClose[0].length;
      }
    }
    const inner = html.slice(start, position - (isDiv ? 6 : 0));
    if (inner.replace(/<[^>]+>/g, "").trim().length > 50) return inner;
  }
  return null;
}

/** Keep only safe structural markup; drop scripts, styles, attributes. */
function sanitize(html: string): string {
  let out = html;
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style[\s\S]*?<\/style>/gi, "");
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<img[^>]*>/gi, "");
  out = out.replace(/<(iframe|form|input|button|svg|noscript)[\s\S]*?<\/\1>/gi, "");

  const allowed = new Set([
    "h1", "h2", "h3", "h4", "p", "ul", "ol", "li",
    "strong", "b", "em", "i", "a", "br", "blockquote", "table", "thead",
    "tbody", "tr", "td", "th",
  ]);
  out = out.replace(/<\/?([a-z0-9]+)((?:\s[^<>]*)?)>/gi, (full, tag: string, attrs: string) => {
    const lower = tag.toLowerCase();
    if (!allowed.has(lower)) return "";
    const isClose = full.startsWith("</");
    if (isClose) return `</${lower}>`;
    if (lower === "a") {
      const href = /href="([^"]*)"/i.exec(attrs)?.[1] ?? "";
      return href ? `<a href="${href}">` : "<a>";
    }
    if (lower === "br") return "<br/>";
    return `<${lower}>`;
  });

  // Collapse whitespace and empty paragraphs
  out = out.replace(/<p>\s*(?:&nbsp;)?\s*<\/p>/gi, "");
  out = out.replace(/\n{3,}/g, "\n\n").trim();
  return out;
}

/** Discover the site logo and insurance partner logo URLs from the homepage. */
function extractMedia(homeHtml: string): Record<string, string> {
  const found: Record<string, string> = {};
  const images = [...homeHtml.matchAll(/<img[^>]+>/gi)].map((m) => m[0]);

  const absolutize = (src: string) =>
    src.startsWith("http") ? src : `${BASE}${src.startsWith("/") ? "" : "/"}${src}`;

  for (const img of images) {
    const src = /src="([^"]+)"/i.exec(img)?.[1];
    if (!src) continue;
    const haystack = img.toLowerCase() + " " + src.toLowerCase();
    if (!found.logo_url && /logo/.test(haystack) && !/(bta|gjensidige|seesam|ergo)/.test(haystack)) {
      found.logo_url = absolutize(src);
    }
    if (!found.partner_bta_url && /bta/.test(haystack)) {
      found.partner_bta_url = absolutize(src);
    }
    if (!found.partner_gjensidige_url && /gjensidige/.test(haystack)) {
      found.partner_gjensidige_url = absolutize(src);
    }
    if (!found.partner_seesam_url && /seesam/.test(haystack)) {
      found.partner_seesam_url = absolutize(src);
    }
  }
  return found;
}

/** For the FAQ page, normalize question headings to <h3> so the accordion works. */
function normalizeFaqHeadings(html: string): string {
  return html
    .replace(/<h([124])>/gi, "<h3>")
    .replace(/<\/h[124]>/gi, "</h3>");
}

export interface RomuImportResult {
  pages: Record<string, string>; // slug -> status
  media: Record<string, string>;
  translated: string[];
  errors: string[];
}

/**
 * Import content pages, the logo and partner logos from romu.ee (the
 * operator's own existing website) and optionally auto-translate the
 * content into EN/RU/LV/LT via the Claude API.
 */
export async function importFromRomu(options: { translate: boolean }): Promise<RomuImportResult> {
  const result: RomuImportResult = { pages: {}, media: {}, translated: [], errors: [] };

  /* Content pages */
  for (const slug of PAGE_SLUGS) {
    try {
      const html = await fetchPage(`/${slug}/`);
      const main = extractMainContent(html);
      if (!main) {
        result.pages[slug] = "sisu ei leitud";
        result.errors.push(`${slug}: põhisisu ei õnnestunud tuvastada`);
        continue;
      }
      let clean = sanitize(main);
      if (slug === "kkk") clean = normalizeFaqHeadings(clean);

      const content: Record<string, string> = { et: clean };

      if (options.translate && translationAvailable()) {
        for (const lang of OTHER_LANGS) {
          try {
            content[lang] = await translateHtml(clean, lang);
            result.translated.push(`${slug} → ${lang}`);
          } catch {
            result.errors.push(`${slug}: tõlge keelde ${lang} ebaõnnestus`);
          }
        }
      }

      await db.page.upsert({
        where: { slug },
        create: { slug, content },
        update: { content },
      });
      result.pages[slug] = "imporditud";
    } catch (error) {
      result.pages[slug] = "viga";
      result.errors.push(`${slug}: ${error instanceof Error ? error.message : "tundmatu viga"}`);
    }
  }

  /* Logo + partner logos from the homepage */
  try {
    const home = await fetchPage("/");
    const media = extractMedia(home);
    for (const [key, value] of Object.entries(media)) {
      await db.siteSettings.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
      result.media[key] = value;
    }
    if (Object.keys(media).length === 0) {
      result.errors.push("Logosid ei õnnestunud avalehelt tuvastada");
    }
  } catch (error) {
    result.errors.push(
      `Avaleht: ${error instanceof Error ? error.message : "tundmatu viga"}`
    );
  }

  return result;
}
