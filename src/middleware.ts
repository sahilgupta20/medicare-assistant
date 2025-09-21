import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export const middleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Allow NextAuth API routes
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Public routes
    if (
      pathname === "/" ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon")
    ) {
      return NextResponse.next();
    }

    // If no token, redirect to NextAuth signin
    if (!token) {
      console.log(`No token, redirecting to signin from ${pathname}`);
      return NextResponse.redirect(new URL("/api/auth/signin", req.url));
    }

    const userRole = token.role as string;
    console.log(`Middleware: ${userRole} accessing ${pathname}`);

    // FAMILY and DOCTOR can only access /family
    if (
      (userRole === "FAMILY" || userRole === "DOCTOR") &&
      !pathname.startsWith("/family") &&
      !pathname.startsWith("/api")
    ) {
      console.log(
        `Blocking ${userRole} from ${pathname} - redirecting to /family`
      );
      return NextResponse.redirect(new URL("/family", req.url));
    }

    // Block FAMILY/DOCTOR from medications
    if (pathname.startsWith("/medications")) {
      const allowedRoles = ["ADMIN", "SENIOR", "CAREGIVER"];
      if (!allowedRoles.includes(userRole)) {
        console.log(`Blocking ${userRole} from medications`);
        return NextResponse.redirect(new URL("/family", req.url));
      }
    }

    // Block FAMILY/DOCTOR from family-setup
    if (pathname.startsWith("/family-setup")) {
      const allowedRoles = ["ADMIN", "SENIOR", "CAREGIVER"];
      if (!allowedRoles.includes(userRole)) {
        console.log(`Blocking ${userRole} from family-setup`);
        return NextResponse.redirect(new URL("/family", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
