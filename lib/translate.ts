import Anthropic from "@anthropic-ai/sdk";

const LANG_NAMES: Record<string, string> = {
  et: "Estonian",
  en: "English",
  ru: "Russian",
  lv: "Latvian",
  lt: "Lithuanian",
};

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
}

export function translationAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Translate an HTML fragment, preserving all markup exactly. */
export async function translateHtml(
  html: string,
  targetLang: string
): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("ANTHROPIC_API_KEY_MISSING");

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    system:
      "You are a professional translator for an Estonian car auction website. " +
      "Translate the user's HTML content into the requested language. " +
      "Preserve ALL HTML tags and structure exactly as they are — translate only the human-readable text. " +
      "Keep company names, phone numbers, e-mail addresses, prices and registration codes unchanged. " +
      "Use natural, professional wording appropriate for a business website. " +
      "Respond with ONLY the translated HTML, no explanations.",
    messages: [
      {
        role: "user",
        content: `Translate into ${LANG_NAMES[targetLang] ?? targetLang}:\n\n${html}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("TRANSLATE_FAILED");
  return block.text.trim();
}

/** Translate a batch of short UI strings. Returns key -> translated value. */
export async function translateStrings(
  strings: Record<string, string>,
  targetLang: string
): Promise<Record<string, string>> {
  const client = getClient();
  if (!client) throw new Error("ANTHROPIC_API_KEY_MISSING");

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    system:
      "You translate UI strings for an Estonian car auction website. " +
      "The user sends a JSON object mapping keys to Estonian strings. " +
      `Respond with ONLY a valid JSON object with the same keys and values translated into ${
        LANG_NAMES[targetLang] ?? targetLang
      }. ` +
      "Keep placeholders like {amount}, {count} or {step} unchanged. No explanations, no markdown fences.",
    messages: [{ role: "user", content: JSON.stringify(strings) }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("TRANSLATE_FAILED");

  const text = block.text.trim().replace(/^```(json)?/, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(text) as Record<string, string>;
  const result: Record<string, string> = {};
  for (const key of Object.keys(strings)) {
    if (typeof parsed[key] === "string") result[key] = parsed[key];
  }
  return result;
}
