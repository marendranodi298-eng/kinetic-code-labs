import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const verifiedSession = session ? await decrypt(session) : null;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";

  if (isAdminRoute) {
    // If not logged in and requesting a dashboard page, redirect to login
    if (!verifiedSession && !isLoginRoute) {
      const loginUrl = new URL("/admin/login", request.url);
      // Store the requested path to redirect back after successful login
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If logged in and requesting login page, redirect to dashboard
    if (verifiedSession && isLoginRoute) {
      const dashboardUrl = new URL("/admin", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

// Intercept all routes starting with /admin
export const config = {
  matcher: ["/admin/:path*"],
};
