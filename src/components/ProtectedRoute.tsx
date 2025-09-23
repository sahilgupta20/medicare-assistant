// src/components/ProtectedRoute.tsx - ENHANCED WITH STRICT RBAC
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Loader2, Shield, AlertTriangle } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  fallbackUrl?: string;
  allowUnauthenticated?: boolean;
}

// STRICT ROLE-BASED DEFAULT ROUTES
const getRoleDefaultRoute = (role: string): string => {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "SENIOR":
      return "/medications";
    case "FAMILY":
      return "/family";
    case "CAREGIVER":
      return "/medications";
    case "DOCTOR":
      return "/analytics";
    default:
      return "/family";
  }
};

// 🔒 ROLE PERMISSIONS MATRIX
const rolePermissions = {
  ADMIN: ["/admin", "/medications", "/family", "/analytics", "/family-setup"],
  SENIOR: ["/medications", "/family"],
  FAMILY: ["/family"],
  CAREGIVER: ["/medications", "/family", "/analytics", "/family-setup"],
  DOCTOR: ["/analytics", "/family"],
};

export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  fallbackUrl,
  allowUnauthenticated = false,
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, hasRole, hasAnyRole, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Skip protection for unauthenticated routes
  if (allowUnauthenticated) {
    return <>{children}</>;
  }

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      console.log(" ProtectedRoute: Not authenticated, redirecting to signin");
      router.push("/auth/signin");
      return;
    }

    const userRole = user?.role;

    if (!userRole) {
      console.log(" ProtectedRoute: No user role, redirecting to signin");
      router.push("/auth/signin");
      return;
    }

    const allowedPaths =
      rolePermissions[userRole as keyof typeof rolePermissions] || [];
    const isPathAllowed = allowedPaths.some(
      (allowedPath) =>
        pathname === allowedPath || pathname.startsWith(allowedPath + "/")
    );

    if (!isPathAllowed) {
      const defaultRoute = getRoleDefaultRoute(userRole);
      console.log(` ProtectedRoute: ${userRole} cannot access ${pathname}`);
      console.log(` Redirecting to default route: ${defaultRoute}`);
      router.push(defaultRoute);
      return;
    }

    let hasAccess = true;

    if (requiredRole && !hasRole(requiredRole)) {
      hasAccess = false;
    }

    if (requiredRoles && !hasAnyRole(requiredRoles)) {
      hasAccess = false;
    }

    if (!hasAccess) {
      const defaultRoute = getRoleDefaultRoute(userRole);

      if (fallbackUrl) {
        console.log(
          ` ProtectedRoute: Access denied, redirecting to fallback: ${fallbackUrl}`
        );
        router.push(fallbackUrl);
      } else {
        console.log(
          ` ProtectedRoute: Access denied for ${userRole}, redirecting to default: ${defaultRoute}`
        );
        router.push(defaultRoute);
      }
      return;
    }

    console.log(
      `✅ ProtectedRoute: Access granted for ${userRole} to ${pathname}`
    );
  }, [
    isLoading,
    isAuthenticated,
    requiredRole,
    requiredRoles,
    user?.role,
    pathname,
    router,
    fallbackUrl,
    hasRole,
    hasAnyRole,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <Loader2 className="h-12 w-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading...</p>
          <p className="text-gray-500 text-sm mt-2">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Authentication Required</p>
          <p className="text-gray-500 text-sm mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const userRole = user?.role;
  const allowedPaths =
    rolePermissions[userRole as keyof typeof rolePermissions] || [];
  const isPathAllowed = allowedPaths.some(
    (allowedPath) =>
      pathname === allowedPath || pathname.startsWith(allowedPath + "/")
  );

  if (!isPathAllowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Access Denied</p>
          <p className="text-gray-500 text-sm mt-2">
            {userRole} role cannot access this page
          </p>
          <p className="text-gray-400 text-xs mt-1">Redirecting...</p>
        </div>
      </div>
    );
  }

  let hasAccess = true;
  if (requiredRole && !hasRole(requiredRole)) {
    hasAccess = false;
  }
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    hasAccess = false;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Insufficient Permissions</p>
          <p className="text-gray-500 text-sm mt-2">
            Your {userRole} role doesn't have access to this feature
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
