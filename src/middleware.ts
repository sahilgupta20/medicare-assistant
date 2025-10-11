// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    console.log(
      `🔒 Middleware: ${pathname} | Token: ${!!token} | Role: ${token?.role}`
    );

    // If user is authenticated and trying to access auth pages, redirect to their dashboard
    if (token && pathname.startsWith("/auth/")) {
      const userRole = token.role as string;
      const roleRedirects: Record<string, string> = {
        ADMIN: "/admin",
        SENIOR: "/medications",
        FAMILY: "/family",
        CAREGIVER: "/medications",
        DOCTOR: "/analytics",
      };

      const redirectPath = roleRedirects[userRole] || "/medications";
      console.log(
        `🔄 Already authenticated, redirecting ${userRole} to: ${redirectPath}`
      );
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    // User is authenticated, check role-based access
    if (token) {
      const userRole = token.role as string;

      const rolePermissions: Record<
        string,
        { allowed: string[]; defaultRedirect: string }
      > = {
        ADMIN: {
          allowed: [
            "/admin",
            "/medications",
            "/family",
            "/analytics",
            "/family-setup",
          ],
          defaultRedirect: "/admin",
        },
        SENIOR: {
          allowed: ["/medications", "/family"],
          defaultRedirect: "/medications",
        },
        FAMILY: {
          allowed: ["/family"],
          defaultRedirect: "/family",
        },
        CAREGIVER: {
          allowed: ["/medications", "/family", "/analytics", "/family-setup"],
          defaultRedirect: "/medications",
        },
        DOCTOR: {
          allowed: ["/analytics", "/family"],
          defaultRedirect: "/analytics",
        },
      };

      const userPermissions = rolePermissions[userRole];

      if (!userPermissions) {
        console.log(`⚠️ Unknown role: ${userRole}`);
        return NextResponse.redirect(new URL("/auth/signin", req.url));
      }

      const isAllowed = userPermissions.allowed.some(
        (allowedPath) =>
          pathname === allowedPath || pathname.startsWith(allowedPath + "/")
      );

      if (!isAllowed) {
        console.log(`🚫 ACCESS DENIED: ${userRole} cannot access ${pathname}`);
        console.log(`↪️ Redirecting to: ${userPermissions.defaultRedirect}`);
        return NextResponse.redirect(
          new URL(userPermissions.defaultRedirect, req.url)
        );
      }

      console.log(`✅ Access granted: ${userRole} can access ${pathname}`);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Always allow auth pages
        if (pathname.startsWith("/auth/")) {
          return true;
        }

        // All other pages require authentication
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
    "/((?!api|_next/static|_next/image|favicon.ico|icon-|sw.js|manifest.json|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp).*)",
  ],
};
