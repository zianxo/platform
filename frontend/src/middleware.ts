import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token");
  const { pathname } = request.nextUrl;

  // Define protected routes pattern
  // Protect /dashboard and all sub-routes, and specific module routes if not under dashboard (but they typically are)
  // Assuming our app structure is /dashboard, /projects, /talent, /clients etc.
  // Wait, if structure is app/(dashboard)/projects... usage is /projects.
  // So we protect specific paths.
  
  const protectedPaths = ["/dashboard", "/projects", "/talent", "/clients", "/contracts", "/invoices", "/documents", "/settings"];
  
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    // Optional: Add redirect param
    // loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - / (landing page)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|$).*)",
  ],
};
