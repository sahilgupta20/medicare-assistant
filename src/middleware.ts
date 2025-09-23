// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export const middleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    console.log(
      `🔒 Middleware: ${pathname} | Token: ${!!token} | Role: ${token?.role}`
    );

    if (pathname.startsWith("/api/")) {
      console.log(`API route allowed: ${pathname}`);
      return NextResponse.next();
    }

    if (
      pathname === "/" ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon") ||
      pathname.includes(".") ||
      pathname.startsWith("/icon-")
    ) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/auth/")) {
      return NextResponse.next();
    }

    if (!token) {
      console.log(` No token, redirecting to signin from ${pathname}`);
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(signInUrl);
    }

    const userRole = token.role as string;

    const rolePermissions = {
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

    const userPermissions =
      rolePermissions[userRole as keyof typeof rolePermissions];

    if (!userPermissions) {
      console.log(`❌ Unknown role: ${userRole}, redirecting to signin`);
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    const isAllowed = userPermissions.allowed.some(
      (allowedPath) =>
        pathname === allowedPath || pathname.startsWith(allowedPath + "/")
    );

    if (!isAllowed) {
      console.log(` ACCESS DENIED: ${userRole} cannot access ${pathname}`);
      console.log(` Allowed paths for ${userRole}:`, userPermissions.allowed);
      console.log(` Redirecting to: ${userPermissions.defaultRedirect}`);

      return NextResponse.redirect(
        new URL(userPermissions.defaultRedirect, req.url)
      );
    }

    if (userRole === "FAMILY" && !pathname.startsWith("/family")) {
      console.log(
        ` FAMILY role blocked from ${pathname} - redirecting to /family`
      );
      return NextResponse.redirect(new URL("/family", req.url));
    }

    if (
      userRole === "DOCTOR" &&
      (pathname.startsWith("/medications") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/family-setup"))
    ) {
      console.log(
        ` DOCTOR role blocked from ${pathname} - redirecting to /analytics`
      );
      return NextResponse.redirect(new URL("/analytics", req.url));
    }

    if (
      userRole === "SENIOR" &&
      (pathname.startsWith("/admin") ||
        pathname.startsWith("/analytics") ||
        pathname.startsWith("/family-setup"))
    ) {
      console.log(
        ` SENIOR role blocked from ${pathname} - redirecting to /medications`
      );
      return NextResponse.redirect(new URL("/medications", req.url));
    }

    console.log(`Access granted: ${userRole} can access ${pathname}`);
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (pathname.startsWith("/api/")) {
          return true;
        }

        if (
          pathname.startsWith("/auth/") ||
          pathname === "/" ||
          pathname.startsWith("/_next") ||
          pathname.includes(".") ||
          pathname.startsWith("/icon-")
        ) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon-|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico).*)",
  ],
};
