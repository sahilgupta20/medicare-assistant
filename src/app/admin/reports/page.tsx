"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3,
  Users,
  Activity,
  TrendingUp,
  Download,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function SystemReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleExport = (format: string) => {
    setLoading(true);
    setTimeout(() => {
      alert(`Reports exported as ${format.toUpperCase()}`);
      setLoading(false);
    }, 1000);
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Link
              href="/admin"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </Link>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                System Reports
              </h1>
              <p className="text-gray-600">Analytics and system insights</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900">156</p>
                  <p className="text-sm text-green-600">
                    ↗ +12% from last month
                  </p>
                </div>
                <Users className="h-12 w-12 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900">142</p>
                  <p className="text-sm text-green-600">
                    ↗ +8% from last month
                  </p>
                </div>
                <Activity className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Adherence Rate
                  </p>
                  <p className="text-3xl font-bold text-gray-900">92%</p>
                  <p className="text-sm text-green-600">
                    ↗ +3% from last month
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Usage Trends
            </h3>
            <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-gray-500">
                Usage trends chart would display here
              </p>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Export Reports
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => handleExport("pdf")}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>Export as PDF</span>
              </button>

              <button
                onClick={() => handleExport("excel")}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>Export as Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
