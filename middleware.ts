import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin & vendor routes: require the appropriate role. The authoritative
  // check happens again server-side in each area's layout.
  if (pathname.startsWith("/admin") || pathname.startsWith("/vendor")) {
    // The cookie name depends on whether the site is served over https,
    // so check both variants (Vercel/https vs local/self-hosted http)
    const token =
      (await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie: true,
      })) ??
      (await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie: false,
      }));

    const isAdminArea = pathname.startsWith("/admin");
    const allowed = isAdminArea
      ? token?.role === "ADMIN"
      : token?.role === "VENDOR" || token?.role === "ADMIN";

    if (!allowed) {
      const loginUrl = new URL("/logi-sisse", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip api routes, static files and Next internals
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
