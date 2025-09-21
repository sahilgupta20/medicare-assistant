"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  fallbackUrl?: string;
  allowUnauthenticated?: boolean;
}

// Role-based default routes
const getDefaultRouteForRole = (role: string): string => {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "SENIOR":
      return "/medications";
    case "FAMILY":
      return "/family"; // Raj Singh should go here
    case "CAREGIVER":
      return "/medications";
    case "DOCTOR":
      return "/analytics";
    default:
      return "/medications";
  }
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

  if (allowUnauthenticated) {
    return <>{children}</>;
  }

  useEffect(() => {
    if (isLoading) return;

    // Check authentication first
    if (!isAuthenticated) {
      console.log("❌ Not authenticated, redirecting to signin");
      router.push("/auth/signin");
      return;
    }

    // Check role permissions
    let hasAccess = true;

    if (requiredRole && !hasRole(requiredRole)) {
      hasAccess = false;
    }

    if (requiredRoles && !hasAnyRole(requiredRoles)) {
      hasAccess = false;
    }

    // If user doesn't have access, redirect to their appropriate page
    if (!hasAccess) {
      const userRole = user?.role;

      if (fallbackUrl) {
        console.log(
          `❌ Access denied, redirecting to fallback: ${fallbackUrl}`
        );
        router.push(fallbackUrl);
      } else if (userRole) {
        const defaultRoute = getDefaultRouteForRole(userRole);
        console.log(
          `❌ Access denied for ${userRole}, redirecting to default: ${defaultRoute}`
        );
        router.push(defaultRoute);
      } else {
        console.log(
          "❌ Access denied, redirecting to medications (no role found)"
        );
        router.push("/medications");
      }
      return;
    }

    // Debug: Log successful access
    console.log(`✅ Access granted for role: ${user?.role}`);
  }, [
    isLoading,
    isAuthenticated,
    requiredRole,
    requiredRoles,
    user?.role,
    router,
    fallbackUrl,
    hasRole,
    hasAnyRole,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Final check: Don't render if user doesn't have access
  let hasAccess = true;
  if (requiredRole && !hasRole(requiredRole)) {
    hasAccess = false;
  }
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    hasAccess = false;
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
