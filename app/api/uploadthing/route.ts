import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

/**
 * Normalise UPLOADTHING_TOKEN. The dashboard's "Quick Copy" gives it as
 *   UPLOADTHING_TOKEN='eyJ...'
 * and it's easy to paste the surrounding quotes (or the whole line) into the
 * Vercel value by mistake — which makes the SDK reject it as "Invalid token".
 * Strip a stray prefix, surrounding quotes and whitespace so a slightly
 * mis-pasted value still works.
 */
function cleanToken(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const token = value
    .trim()
    .replace(/^UPLOADTHING_TOKEN\s*=\s*/i, "") // stray "UPLOADTHING_TOKEN=" prefix
    .replace(/^['"]|['"]$/g, "") // surrounding single/double quotes
    .trim();
  return token || undefined;
}

const token = cleanToken(process.env.UPLOADTHING_TOKEN);

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  ...(token ? { config: { token } } : {}),
});
