import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    console.log(
      ` [Middleware] Path: ${pathname} | Token: ${!!token} | Role: ${
        token?.role || "none"
      }`
    );

    if (token && (pathname === "/" || pathname.startsWith("/auth/"))) {
      const roleDashboards: Record<string, string> = {
        ADMIN: "/admin",
        SENIOR: "/medications",
        FAMILY: "/family",
        CAREGIVER: "/medications",
        DOCTOR: "/analytics",
      };

      const dashboard = roleDashboards[token.role as string] || "/family";
      console.log(`↪ [Middleware] Redirecting ${token.role} to ${dashboard}`);
      return NextResponse.redirect(new URL(dashboard, req.url));
    }

    // Role-based access control for protected routes
    if (token && !pathname.startsWith("/auth/") && pathname !== "/") {
      const rolePermissions: Record<string, string[]> = {
        ADMIN: [
          "/admin",
          "/medications",
          "/family",
          "/analytics",
          "/family-setup",
        ],
        SENIOR: ["/medications", "/family"],
        FAMILY: ["/family"],
        CAREGIVER: ["/medications", "/family", "/analytics", "/family-setup"],
        DOCTOR: ["/analytics", "/family"],
      };

      const userRole = token.role as string;
      const allowedPaths = rolePermissions[userRole] || ["/family"];

      const hasAccess = allowedPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
      );

      if (!hasAccess) {
        const defaultPaths: Record<string, string> = {
          ADMIN: "/admin",
          SENIOR: "/medications",
          FAMILY: "/family",
          CAREGIVER: "/medications",
          DOCTOR: "/analytics",
        };

        const defaultPath = defaultPaths[userRole] || "/family";
        console.log(
          ` [Middleware] Access denied: ${userRole} cannot access ${pathname}`
        );
        console.log(`↪ [Middleware] Redirecting to ${defaultPath}`);
        return NextResponse.redirect(new URL(defaultPath, req.url));
      }

      console.log(
        ` [Middleware] Access granted: ${userRole} can access ${pathname}`
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow public access to root and auth pages
        if (pathname === "/" || pathname.startsWith("/auth/")) {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon, icons, manifest
     * - sw.js (service worker)
     * - images (png, jpg, jpeg, gif, svg, ico, webp)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon-|sw.js|manifest.json|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp).*)",
  ],
};
