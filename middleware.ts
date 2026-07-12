import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes: require an ADMIN session (authoritative check happens
  // again server-side in the admin layout)
  if (pathname.startsWith("/admin")) {
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
    if (!token || token.role !== "ADMIN") {
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
