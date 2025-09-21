"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const user = session?.user;

  const hasRole = (role: string): boolean => {
    if (!user?.role) return false;
    return user.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role as string);
  };

  const handleSignOut = async () => {
    try {
      console.log("🔄 Starting logout process...");

      // Method 1: Try NextAuth signOut with no redirect first
      await signOut({
        redirect: false, // Don't auto-redirect, we'll handle it manually
      });

      console.log("✅ NextAuth signOut completed");

      // Method 2: Clear any additional browser storage
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log("✅ Browser storage cleared");
      } catch (storageError) {
        console.log("⚠️ Could not clear storage:", storageError);
      }

      // Method 3: Wait a moment for session to clear, then redirect
      setTimeout(() => {
        console.log("🎯 Redirecting to signin page");
        window.location.href = "/auth/signin";
      }, 100);
    } catch (error) {
      console.error("❌ Sign out error:", error);

      // Fallback: Force clear everything and redirect
      try {
        localStorage.clear();
        sessionStorage.clear();

        // Clear all cookies
        document.cookie.split(";").forEach(function (c) {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(
              /=.*/,
              "=;expires=" + new Date().toUTCString() + ";path=/"
            );
        });

        console.log("🔄 Forced cleanup completed, redirecting...");
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }

      window.location.href = "/auth/signin";
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    signOut: handleSignOut,
    session,
    status,
  };
}

export const getDefaultRouteForRole = (role: string): string => {
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
      return "/medications";
  }
};
