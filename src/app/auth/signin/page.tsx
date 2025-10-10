"use client";

import { useState, useEffect } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Pill, Loader2 } from "lucide-react";

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
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/medications";

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const targetUrl = getDefaultRouteForRole(session.user.role);
      console.log("Already logged in, redirecting to:", targetUrl);
      window.location.href = targetUrl;
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(formData.email, formData.password);
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

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      if (result?.ok) {
        await new Promise((resolve) => setTimeout(resolve, 100));

        try {
          const session = await getSession();

          if (session?.user?.role) {
            const targetUrl = getDefaultRouteForRole(session.user.role);
            window.location.href = targetUrl; // Changed from router.push
          } else {
            window.location.href = "/family"; // Changed from router.push
          }
        } catch (sessionError) {
          console.error("Session fetch error:", sessionError);
          window.location.href = "/family"; // Changed from router.push
        }
      }
    } catch (error) {
      console.error("Login exception:", error);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Quick login for demo users
  const demoUsers = [
    { email: "admin@medicare.com", name: "Admin User", password: "password" },
    { email: "senior@medicare.com", name: "Papa Singh", password: "password" },
    { email: "family@medicare.com", name: "Raj Singh", password: "password" },
    {
      email: "caregiver@medicare.com",
      name: "Nurse Johnson",
      password: "password",
    },
    { email: "doctor@medicare.com", name: "Dr. Smith", password: "password" },
  ];

  const handleDemoLogin = async (user: (typeof demoUsers)[0]) => {
    setFormData({ email: user.email, password: user.password });
    await performLogin(user.email, user.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-3xl shadow-lg">
              <Pill className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to MediCare
          </h1>
          <p className="text-gray-600">
            Sign in to manage your medications and stay healthy
          </p>
        </div>

        {/* Main Sign In Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-gray-900 transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-gray-900 pr-12 transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo Login Section - Can be removed in production */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-600 text-center mb-4">
              Demo Accounts (for testing):
            </p>
            <div className="grid grid-cols-1 gap-2">
              {demoUsers.slice(0, 3).map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleDemoLogin(user)}
                  disabled={loading}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-gray-500">{user.email}</div>
                </button>
              ))}
            </div>

            {/* Show all demo accounts button */}
            <details className="mt-3">
              <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                Show all demo accounts
              </summary>
              <div className="mt-2 space-y-2">
                {demoUsers.slice(3).map((user) => (
                  <button
                    key={user.email}
                    onClick={() => handleDemoLogin(user)}
                    disabled={loading}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-gray-500">{user.email}</div>
                  </button>
                ))}
              </div>
            </details>
          </div>

          {/* Footer Links */}
          {/* <div className="mt-6 text-center">
            <Link
              href="/family"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Continue as guest →
            </Link>
          </div> */}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Secure medication management for families
          </p>
        </div>
      </div>
    </div>
  );
}
