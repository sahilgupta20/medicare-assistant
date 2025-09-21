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
} from "lucide-react";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  // Define navigation items with proper role restrictions
  const navigationItems = [
    {
      name: "Medications",
      href: "/medications",
      icon: Pill,
      roles: ["ADMIN", "SENIOR", "CAREGIVER"], // FAMILY and DOCTOR cannot access
    },
    {
      name: "Family Circle",
      href: "/family",
      icon: Users,
      roles: ["ADMIN", "SENIOR", "CAREGIVER", "FAMILY", "DOCTOR"], // All roles can view
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      roles: ["ADMIN", "DOCTOR", "CAREGIVER"], // Only medical roles and admin
    },
    {
      name: "Family Setup",
      href: "/family-setup",
      icon: Settings,
      roles: ["ADMIN", "SENIOR", "CAREGIVER"], // Only those who can manage family
    },
    {
      name: "Admin Dashboard",
      href: "/admin",
      icon: Shield,
      roles: ["ADMIN"], // Admin only
    },
  ];

  // Filter navigation items based on user role
  const allowedItems = navigationItems.filter((item) =>
    item.roles.includes(user?.role as string)
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "SENIOR":
        return "bg-rose-100 text-rose-800";
      case "FAMILY":
        return "bg-emerald-100 text-emerald-800";
      case "CAREGIVER":
        return "bg-blue-100 text-blue-800";
      case "DOCTOR":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "System Administrator";
      case "SENIOR":
        return "Patient";
      case "FAMILY":
        return "Family Member";
      case "CAREGIVER":
        return "Professional Caregiver";
      case "DOCTOR":
        return "Medical Professional";
      default:
        return "User";
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-rose-400 to-pink-600 p-2 rounded-2xl">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MediCare</span>
            </Link>
          </div>

          {/* Desktop navigation - filtered by role */}
          <div className="hidden md:flex items-center space-x-6">
            {allowedItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {/* User profile with role-based styling */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-500">
                  {getRoleDescription(user?.role || "")}
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${getRoleColor(
                    user?.role || ""
                  )}`}
                >
                  {user?.role}
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-400 to-gray-600 w-10 h-10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile navigation - also filtered by role */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {allowedItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile user info */}
              <div className="px-4 py-3 border-t border-gray-200 mt-4">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {getRoleDescription(user?.role || "")}
                </div>
                <div
                  className={`inline-block text-xs px-2 py-1 rounded-full ${getRoleColor(
                    user?.role || ""
                  )}`}
                >
                  {user?.role}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
