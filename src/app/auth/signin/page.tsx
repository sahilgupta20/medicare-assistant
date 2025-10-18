"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Pill, Loader2 } from "lucide-react";

export default function SignInPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(formData.email, formData.password);
  };

  const performLogin = async (email: string, password: string) => {
    console.log(" Attempting login for:", email);
    setLoading(true);
    setError("");

    try {
      // Use NextAuth's built-in redirect - it handles everything correctly
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/", // NextAuth will redirect here, then middleware takes over
        redirect: true,
      });

      // This code only runs if there's an error (redirect: true prevents reaching here on success)
      if (result?.error) {
        console.error(" Login failed:", result.error);
        setError("Invalid email or password");
        setLoading(false);
      }
    } catch (error) {
      console.error(" Login exception:", error);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const demoUsers = [
    {
      email: "admin@medicare.com",
      name: "Admin User",
      password: "password",
      role: "ADMIN",
    },
    {
      email: "senior@medicare.com",
      name: "Papa Singh",
      password: "password",
      role: "SENIOR",
    },
    {
      email: "family@medicare.com",
      name: "Raj Singh",
      password: "password",
      role: "FAMILY",
    },
    {
      email: "caregiver@medicare.com",
      name: "Nurse Johnson",
      password: "password",
      role: "CAREGIVER",
    },
    {
      email: "doctor@medicare.com",
      name: "Dr. Smith",
      password: "password",
      role: "DOCTOR",
    },
  ];

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
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none bg-white text-gray-900 transition-all"
                placeholder="Enter your email"
                disabled={loading}
                autoComplete="email"
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
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none bg-white text-gray-900 pr-12 transition-all"
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={loading}
                  tabIndex={-1}
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-shake">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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

          {/* Demo Login Section */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-600 text-center mb-4 font-medium">
              Quick Demo Login:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => performLogin(user.email, user.password)}
                  disabled={loading}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-gray-500 text-xs">{user.email}</div>
                    </div>
                    <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {user.role}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            🔒 Secure medication management for families
          </p>
        </div>
      </div>
    </div>
  );
}
