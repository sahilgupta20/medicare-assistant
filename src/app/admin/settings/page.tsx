"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Bell, Shield, Save, ArrowLeft } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function SystemSettingsPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    systemName: "MediCare Assistant",
    timezone: "Asia/Kolkata",
    emailNotifications: true,
    smsNotifications: true,
    emergencyAlerts: true,
    sessionTimeout: 24,
    autoBackup: true,
  });

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully!");
    }, 1000);
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </Link>
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  System Settings
                </h1>
                <p className="text-gray-600">Configure system preferences</p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>

          {/* Settings Sections */}
          <div className="grid gap-8">
            {/* General Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                General Settings
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Name
                  </label>
                  <input
                    type="text"
                    value={settings.systemName}
                    onChange={(e) =>
                      setSettings({ ...settings, systemName: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) =>
                      setSettings({ ...settings, timezone: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">
                      America/New_York (EST)
                    </option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <Bell className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  Notification Settings
                </h3>
              </div>
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emailNotifications: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="text-gray-700">Email Notifications</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smsNotifications: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="text-gray-700">SMS Notifications</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.emergencyAlerts}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emergencyAlerts: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="text-gray-700">Emergency Alerts</span>
                </label>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  Security Settings
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (hours)
                  </label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sessionTimeout: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.autoBackup}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          autoBackup: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="text-gray-700">Enable Auto Backup</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
