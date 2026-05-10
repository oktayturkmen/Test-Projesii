import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: [
    "/account/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};

const PROTECTED_ROUTE_PREFIXES = config.matcher.map((pattern) => pattern.replace("/:path*", ""));

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedPath = PROTECTED_ROUTE_PREFIXES.some((path) => pathname.startsWith(path));

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("reason", "auth_required");

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
