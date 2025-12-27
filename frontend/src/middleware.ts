import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token");
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  
  // Define domains
  // Adjust these based on your actual domains
  // development: localhost:3000 (admin), app.localhost:3000 (client)
  const isAdmin = hostname.startsWith("admin.") || hostname === "localhost:3000";
  const isClient = hostname.startsWith("app.");

  let pathname = url.pathname;

  // 1. Rewrite for Tenant
  if (isAdmin) {
      if (!pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
          url.pathname = `/admin${pathname}`;
          return NextResponse.rewrite(url);
      }
  } else if (isClient) {
      if (!pathname.startsWith("/client") && !pathname.startsWith("/api")) {
          url.pathname = `/client${pathname}`;
          return NextResponse.rewrite(url);
      }
  }
  
  // 2. Auth Protection (Simplified for now, can be expanded)
  // We can let the layout/page check for auth or do it here.
  // For now, let's keep the rewrite logic as primary.
  
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
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
