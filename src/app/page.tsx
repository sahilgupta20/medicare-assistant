"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Pill, Users, Bell, Heart, Shield, Sun } from "lucide-react";

const getDefaultRouteForRole = (role: string): string => {
  switch (role) {
    case "ADMIN":
      return "/medications";
    case "SENIOR":
      return "/medications";
    case "FAMILY":
      return "/family";
    case "CAREGIVER":
      return "/medications";
    case "DOCTOR":
      return "/family";
    default:
      return "/family";
  }
};

export default function HomePage() {
  const router = useRouter();
  const [showLandingPage, setShowLandingPage] = useState(false);
  const { data: session, status } = useSession();
  const user = session?.user;

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setShowLandingPage(true);
      const timer = setTimeout(() => {
        window.location.href = "/api/auth/signin";
      }, 2000);

      return () => clearTimeout(timer);
    } else if (user?.role) {
      // User is authenticated, redirect based on role
      const defaultRoute = getDefaultRouteForRole(user.role);
      console.log(`🎯 Redirecting ${user.role} to ${defaultRoute}`);
      router.push(defaultRoute);
    } else {
      console.log("⚠️ Authenticated user without role, redirecting to family");
      router.push("/family");
    }
  }, [status, user?.role, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl">Loading MediCare Assistant...</p>
          <p className="text-gray-500 text-sm mt-2">
            Checking your authentication...
          </p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (status === "unauthenticated" && showLandingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-rose-200 to-pink-300 rounded-full opacity-30"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full opacity-40"></div>
          <div className="absolute bottom-32 left-1/4 w-28 h-28 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full opacity-35"></div>
        </div>

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="bg-gradient-to-br from-rose-400 to-pink-600 p-4 rounded-3xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <Pill className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                    MediCare Assistant
                  </h1>
                  <p className="text-gray-600 text-lg font-medium">
                    Your caring medication companion
                  </p>
                </div>
              </div>

              <div className="text-right bg-white/50 rounded-3xl p-6 backdrop-blur-sm shadow-lg border border-white/30">
                <div className="flex items-center space-x-2 mb-2">
                  <Sun className="h-6 w-6 text-amber-600" />
                  <span className="text-lg font-semibold text-amber-600">
                    Welcome!
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  Sign in to get started
                </div>
                <div className="text-gray-600">Redirecting to sign in...</div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-16 relative">
            <div className="inline-block relative">
              <h2 className="text-6xl font-bold text-gray-800 mb-6 relative z-10">
                Taking care of your health,
                <span className="block text-transparent bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 bg-clip-text">
                  one pill at a time
                </span>
              </h2>
              <div className="absolute inset-0 bg-gradient-to-r from-rose-200 to-purple-200 blur-3xl opacity-30 rounded-full"></div>
            </div>
            <p className="text-2xl text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed">
              Never worry about forgetting your medicine again. We're here to
              gently remind you and keep your family connected to your wellness
              journey.
            </p>

            <div className="mt-8">
              <Link
                href="/auth/signin"
                className="inline-block bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-2xl font-bold px-12 py-6 rounded-3xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Get Started - Sign In
              </Link>
              <p className="text-gray-500 mt-4">
                Automatically redirecting in a moment...
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto mb-20 opacity-75">
            <div className="group">
              <div className="relative overflow-hidden">
                <div className="bg-gradient-to-br from-white to-rose-50 p-12 rounded-[2.5rem] shadow-2xl border border-rose-100">
                  <div className="relative z-10">
                    <div className="bg-gradient-to-br from-rose-400 to-pink-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                      <Pill className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-4xl font-bold text-gray-800 mb-6">
                      My Medicines
                    </h3>
                    <p className="text-xl text-gray-600 leading-relaxed">
                      See all your medicines in one simple place. Large
                      pictures, clear instructions, and gentle reminders.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="relative overflow-hidden">
                <div className="bg-gradient-to-br from-white to-emerald-50 p-12 rounded-[2.5rem] shadow-2xl border border-emerald-100">
                  <div className="relative z-10">
                    <div className="bg-gradient-to-br from-emerald-400 to-green-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-4xl font-bold text-gray-800 mb-6">
                      Family Circle
                    </h3>
                    <p className="text-xl text-gray-600 leading-relaxed">
                      Stay connected with loved ones who care about your health.
                      Share updates and get support.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 max-w-4xl mx-auto shadow-lg border border-white/30">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Designed for Every Family Member
              </h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4">
                <div className="bg-blue-100 w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Pill className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-800">Seniors</h4>
                <p className="text-sm text-gray-600">
                  Manage medications easily
                </p>
              </div>
              <div className="text-center p-4">
                <div className="bg-green-100 w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-800">Family</h4>
                <p className="text-sm text-gray-600">
                  Stay connected & informed
                </p>
              </div>
              <div className="text-center p-4">
                <div className="bg-purple-100 w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-800">Caregivers</h4>
                <p className="text-sm text-gray-600">Professional care tools</p>
              </div>
              <div className="text-center p-4">
                <div className="bg-red-100 w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <h4 className="font-semibold text-gray-800">Doctors</h4>
                <p className="text-sm text-gray-600">Medical oversight</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="bg-gradient-to-br from-rose-400 to-pink-600 p-3 rounded-2xl">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">MediCare Assistant</span>
            </div>
            <p className="text-gray-300 text-lg">
              Built with care, love, and understanding
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Secure • Private • Family-Focused
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}
