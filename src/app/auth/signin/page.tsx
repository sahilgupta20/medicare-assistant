// src/app/auth/signin/page.tsx - COMPLETE WITH ALL DEMO USERS
"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Heart,
  Shield,
  Users,
  Pill,
  Stethoscope,
  UserCheck,
} from "lucide-react";

const getDefaultRouteForRole = (role: string): string => {
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

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get callback URL from search params
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // 🎭 ALL DEMO USERS WITH ROLE-BASED ACCESS
  const demoUsers = [
    {
      email: "admin@medicare.com",
      password: "password",
      name: "Admin User",
      role: "ADMIN",
      description: "Full system access & user management",
      icon: Shield,
      color: "from-purple-500 to-indigo-600",
      access: "Everything: Admin, Medications, Family, Analytics, Setup",
    },
    {
      email: "senior@medicare.com",
      password: "password",
      name: "Papa Singh",
      role: "SENIOR",
      description: "Patient - Own medication management",
      icon: Heart,
      color: "from-rose-500 to-pink-600",
      access: "Limited: Medications (full), Family (view-only)",
    },
    {
      email: "family@medicare.com",
      password: "password",
      name: "Raj Singh",
      role: "FAMILY",
      description: "Family member - View health status only",
      icon: Users,
      color: "from-emerald-500 to-green-600",
      access: "Restricted: Family dashboard only (view-only)",
    },
    {
      email: "caregiver@medicare.com",
      password: "password",
      name: "Nurse Johnson",
      role: "CAREGIVER",
      description: "Professional caregiver - Care management",
      icon: UserCheck,
      color: "from-blue-500 to-cyan-600",
      access: "Professional: All except Admin panel",
    },
    {
      email: "doctor@medicare.com",
      password: "password",
      name: "Dr. Smith",
      role: "DOCTOR",
      description: "Medical professional - Analytics & oversight",
      icon: Stethoscope,
      color: "from-indigo-500 to-purple-600",
      access: "Medical: Analytics + Family updates (view-only)",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(formData.email, formData.password);
  };

  const handleDemoLogin = async (user: (typeof demoUsers)[0]) => {
    await performLogin(user.email, user.password);
  };

  const performLogin = async (email: string, password: string) => {
    console.log("🔄 Login attempt:", email);
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("🔄 SignIn result:", result);

      if (result?.error) {
        console.log("❌ Login error:", result.error);
        setError("Invalid email or password");
        return;
      }

      if (result?.ok) {
        console.log("✅ Login success, getting session...");

        // Wait for session to be established
        await new Promise((resolve) => setTimeout(resolve, 100));

        try {
          const session = await getSession();
          console.log("📱 Session after login:", session);

          if (session?.user?.role) {
            const targetUrl = getDefaultRouteForRole(session.user.role);
            console.log(`🎯 Redirecting ${session.user.role} to ${targetUrl}`);

            router.push(targetUrl);
          } else {
            console.log("⚠️ No role found, defaulting to /family");
            router.push("/family");
          }
        } catch (sessionError) {
          console.error("❌ Session fetch error:", sessionError);
          router.push("/family");
        }
      }
    } catch (error) {
      console.error("❌ Login exception:", error);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-rose-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="bg-gradient-to-br from-rose-400 to-pink-600 p-4 rounded-3xl shadow-lg">
              <Pill className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                MediCare Assistant
              </h1>
              <p className="text-gray-600 text-xl">
                Role-Based Access Control Demo
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Choose Your Role to Sign In
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Each user has different access levels. Test the role-based
            restrictions by signing in as different users.
          </p>
        </div>

        {/* Demo Users Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {demoUsers.map((user) => {
            const IconComponent = user.icon;
            return (
              <div
                key={user.email}
                className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
              >
                <div className="text-center mb-4">
                  <div
                    className={`bg-gradient-to-br ${user.color} p-4 rounded-2xl mx-auto w-16 h-16 flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {user.name}
                  </h3>
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : user.role === "SENIOR"
                        ? "bg-rose-100 text-rose-800"
                        : user.role === "FAMILY"
                        ? "bg-emerald-100 text-emerald-800"
                        : user.role === "CAREGIVER"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-indigo-100 text-indigo-800"
                    }`}
                  >
                    {user.role}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-gray-600 text-sm text-center">
                    {user.description}
                  </p>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      Access Level:
                    </p>
                    <p className="text-xs text-gray-600">{user.access}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDemoLogin(user)}
                  disabled={loading}
                  className={`w-full bg-gradient-to-r ${user.color} hover:shadow-lg text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50`}
                >
                  {loading ? "Signing in..." : `Sign in as ${user.name}`}
                </button>

                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">
                    Email: {user.email} | Password: {user.password}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Manual Login Form */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20 max-w-md mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Manual Sign In
            </h3>
            <p className="text-gray-600">Or enter credentials manually</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-gray-900"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-gray-900 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/family"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Continue without signing in →
            </Link>
          </div>
        </div>

        {/* RBAC Testing Instructions */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            🔒 Role-Based Access Control Testing
          </h3>

          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                ✅ What Each Role Can Access:
              </h4>
              <ul className="space-y-1 text-gray-600">
                <li>
                  <strong>ADMIN:</strong> Everything (full system access)
                </li>
                <li>
                  <strong>SENIOR:</strong> Medications + Family (limited)
                </li>
                <li>
                  <strong>FAMILY:</strong> Family dashboard only (view-only)
                </li>
                <li>
                  <strong>CAREGIVER:</strong> All except admin panel
                </li>
                <li>
                  <strong>DOCTOR:</strong> Analytics + Family updates only
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                🧪 Testing Instructions:
              </h4>
              <ol className="space-y-1 text-gray-600 list-decimal list-inside">
                <li>Sign in as different users</li>
                <li>Try accessing blocked URLs directly</li>
                <li>Check navigation menu visibility</li>
                <li>Test UI button restrictions</li>
                <li>Verify redirects work correctly</li>
              </ol>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-sm text-center">
              <strong>🔧 Developer Tip:</strong> Open browser console and run{" "}
              <code>window.testRBAC.runAllTests()</code> for automated RBAC
              testing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
