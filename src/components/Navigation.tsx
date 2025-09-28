// src/components/Navigation.tsx - IMPROVED CLEAN VERSION
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Pill,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Heart,
  User,
  Home,
  Bell,
} from "lucide-react";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  // 🎯 CLEAN ROLE-BASED NAVIGATION - User-friendly labels
  // ✅ FIXED: Role-specific navigation labels
  const getNavigationItems = (userRole: string) => {
    switch (userRole) {
      case "ADMIN":
        return [
          { name: "Admin Panel", href: "/admin", icon: Shield },
          { name: "Medications", href: "/medications", icon: Pill },
          { name: "Family", href: "/family", icon: Users },
          { name: "Analytics", href: "/analytics", icon: BarChart3 },
          { name: "Family Management", href: "/family-setup", icon: Settings },
        ];

      case "SENIOR":
        return [
          { name: "My Medications", href: "/medications", icon: Pill },
          { name: "Family Circle", href: "/family", icon: Users },
          { name: "Family Setup", href: "/family-setup", icon: Settings },
        ];

      case "CAREGIVER":
        return [
          { name: "Medications", href: "/medications", icon: Pill },
          { name: "Family", href: "/family", icon: Users },
          { name: "Analytics", href: "/analytics", icon: BarChart3 },
          { name: "Family Overview", href: "/family-setup", icon: Eye },
        ];

      case "FAMILY":
        return [{ name: "Family Dashboard", href: "/family", icon: Users }];

      case "DOCTOR":
        return [
          { name: "Analytics", href: "/analytics", icon: BarChart3 },
          { name: "Patient Updates", href: "/family", icon: Users },
        ];

      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems(user?.role || "");

  const getRoleTheme = (role: string) => {
    switch (role) {
      case "ADMIN":
        return {
          color: "text-purple-700",
          bg: "bg-purple-50",
          accent: "bg-purple-600",
        };
      case "SENIOR":
        return {
          color: "text-rose-700",
          bg: "bg-rose-50",
          accent: "bg-rose-600",
        };
      case "FAMILY":
        return {
          color: "text-emerald-700",
          bg: "bg-emerald-50",
          accent: "bg-emerald-600",
        };
      case "CAREGIVER":
        return {
          color: "text-blue-700",
          bg: "bg-blue-50",
          accent: "bg-blue-600",
        };
      case "DOCTOR":
        return {
          color: "text-indigo-700",
          bg: "bg-indigo-50",
          accent: "bg-indigo-600",
        };
      default:
        return {
          color: "text-gray-700",
          bg: "bg-gray-50",
          accent: "bg-gray-600",
        };
    }
  };

  const theme = getRoleTheme(user?.role || "");

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className={`${theme.accent} p-2 rounded-xl shadow-sm`}>
                <Pill className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">
                MediCare
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? `${theme.bg} ${theme.color} shadow-sm`
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell - only for relevant roles */}
            {(user?.role === "FAMILY" || user?.role === "SENIOR") && (
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
              </button>
            )}

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name}
                </div>
                {/* Simplified role display - only show when necessary */}
                {user?.role === "ADMIN" && (
                  <div className="text-xs text-purple-600 font-medium">
                    Administrator
                  </div>
                )}
              </div>

              <div
                className={`${theme.accent} w-8 h-8 rounded-full flex items-center justify-center shadow-sm`}
              >
                <User className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? `${theme.bg} ${theme.color}`
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile User Info */}
              <div className="px-4 py-3 border-t border-gray-100 mt-4">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {user?.name}
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
