// src/app/auth/signin/page.tsx - SIMPLIFIED VERSION
"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Heart, Shield, Users, Pill } from "lucide-react";

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

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const demoUsers = [
    {
      email: "admin@medicare.com",
      password: "password",
      name: "Admin User",
      role: "ADMIN",
      description: "Full system access",
    },
    {
      email: "senior@medicare.com",
      password: "password",
      name: "Papa Singh",
      role: "SENIOR",
      description: "Patient medication management",
    },
    {
      email: "family@medicare.com",
      password: "password",
      name: "Raj Singh",
      role: "FAMILY",
      description: "Family member view",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔄 Manual login attempt:", formData.email);
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      console.log("🔄 Manual SignIn result:", result);

      if (result?.error) {
        console.log("❌ Manual login error:", result.error);
        setError("Invalid email or password");
      } else if (result?.ok) {
        console.log("✅ Manual login success, checking session...");

        // Wait for session to be set, then redirect
        setTimeout(async () => {
          const session = await getSession();
          console.log("📱 Session after manual login:", session);

          if (session?.user?.role) {
            const defaultRoute = getDefaultRouteForRole(session.user.role);
            console.log(
              `🎯 Redirecting ${session.user.role} to ${defaultRoute}`
            );
            window.location.href = defaultRoute;
          } else {
            window.location.href = "/medications";
          }
        }, 500);
      }
    } catch (error) {
      console.error("❌ Manual login exception:", error);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (user: (typeof demoUsers)[0]) => {
    console.log("🔄 Attempting demo login for:", user.name, "Role:", user.role);
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: user.email,
        password: user.password,
        redirect: false, // Don't auto-redirect
      });

      console.log("🔄 SignIn result:", result);

      if (result?.error) {
        console.log("❌ Login error:", result.error);
        setError("Login failed: " + result.error);
      } else if (result?.ok) {
        console.log("✅ Login success, checking session...");

        // Wait for session to be set
        setTimeout(async () => {
          const session = await getSession();
          console.log("📱 Session after login:", session);

          if (session?.user?.role) {
            const defaultRoute = getDefaultRouteForRole(session.user.role);
            console.log(
              `🎯 Redirecting ${session.user.role} to ${defaultRoute}`
            );

            // Force navigation to the correct page
            window.location.href = defaultRoute;
          } else {
            console.log("⚠️ No role found, defaulting to medications");
            window.location.href = "/medications";
          }
        }, 500); // Wait 500ms for session to be fully set
      }
    } catch (error) {
      console.error("❌ Login exception:", error);
      setError("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-rose-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-4 mb-8">
            <div className="bg-gradient-to-br from-rose-400 to-pink-600 p-4 rounded-3xl shadow-lg">
              <Pill className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                MediCare
              </h1>
              <p className="text-gray-600 text-xl">Assistant</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Welcome Back!
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Your caring medication companion is ready to help.
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-10 border border-white/20">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h3>
            <p className="text-gray-600">Click any demo user to login</p>
          </div>

          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">
              Demo Users
            </h4>
            <div className="grid gap-3">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleDemoLogin(user)}
                  disabled={loading}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                    loading
                      ? "opacity-50 cursor-not-allowed"
                      : "border-gray-200 hover:border-blue-300 bg-white hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                      {user.role === "ADMIN" ? (
                        <Shield className="h-5 w-5" />
                      ) : user.role === "SENIOR" ? (
                        <Heart className="h-5 w-5" />
                      ) : (
                        <Users className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Signing you in...</p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/medications"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Continue without signing in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
