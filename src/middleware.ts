// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export const middleware = withAuth(function middleware(req) {
  const token = req.nextauth.token;
  const { pathname } = req.nextUrl;

  console.log(
    `🔒 Middleware: ${pathname} | Token: ${!!token} | Role: ${token?.role}`
  );

  // Allow API routes
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow public/static routes
  if (
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    pathname.startsWith("/icon-")
  ) {
    return NextResponse.next();
  }

  // Allow auth routes
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!token) {
    console.log(` No token, redirecting to signin from ${pathname}`);
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  const userRole = token.role as string;

  // Define role permissions
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

  // Unknown role - redirect to signin
  if (!userPermissions) {
    console.log(` Unknown role: ${userRole}, redirecting to signin`);
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Check if user has access to this path
  const isAllowed = userPermissions.allowed.some(
    (allowedPath) =>
      pathname === allowedPath || pathname.startsWith(allowedPath + "/")
  );

  if (!isAllowed) {
    console.log(` ACCESS DENIED: ${userRole} cannot access ${pathname}`);
    console.log(` Redirecting to: ${userPermissions.defaultRedirect}`);
    return NextResponse.redirect(
      new URL(userPermissions.defaultRedirect, req.url)
    );
  }

  // ✅ Access granted - let them through
  console.log(`✅ Access granted: ${userRole} can access ${pathname}`);
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-|sw.js|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico).*)",
  ],
};
