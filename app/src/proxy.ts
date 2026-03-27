import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes: skip i18n, check JWT auth cookie
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";
    const authCookie = request.cookies.get("auth_token");

    if (!authCookie && !isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (authCookie && isLoginPage) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // API proxy: skip i18n
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Public routes: i18n locale detection and routing
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
