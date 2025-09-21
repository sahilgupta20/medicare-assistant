"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, TrendingUp, Activity, Users } from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRoles={["ADMIN", "DOCTOR", "CAREGIVER"]}>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-4 rounded-3xl shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Analytics Dashboard
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Healthcare insights and medication trends
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-500">Viewing as</div>
                <div className="text-xl font-bold text-gray-900">
                  {user?.name}
                </div>
                <div className="text-sm text-indigo-600 font-medium">
                  {user?.role}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Adherence Rate
                  </p>
                  <p className="text-2xl font-bold text-green-600">92%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Patients</p>
                  <p className="text-2xl font-bold text-blue-600">156</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Meds
                  </p>
                  <p className="text-2xl font-bold text-purple-600">324</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Alerts Today
                  </p>
                  <p className="text-2xl font-bold text-red-600">7</p>
                </div>
                <BarChart3 className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {user?.role === "DOCTOR"
                ? "Patient Analytics"
                : "System Analytics"}
            </h2>
            <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-gray-500">Analytics charts would go here</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
