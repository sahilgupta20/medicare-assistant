"use client";

import React, { useState } from "react";
import {
  Bell,
  Shield,
  Users,
  Clock,
  Mail,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Phone,
  Activity,
  Calendar,
  TrendingUp,
} from "lucide-react";

export default function MediCareLanding() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showDocs, setShowDocs] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">
              MediCare
            </span>
          </div>
          <a
            href="/auth/signin"
            className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm mb-6">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            Demo Version
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Medication management that works for you
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Intelligent reminders, automated escalation, and family
            coordination. Built to ensure medication adherence for elderly
            patients and chronic care.
          </p>
          <div className="flex gap-4">
            <a
              href="/auth/signin"
              className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </a>
            <button
              onClick={() => setShowDocs(!showDocs)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              {showDocs ? "Hide" : "View"} Documentation
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-8 mt-16 pt-16 border-t border-gray-200">
          <div>
            <div className="text-3xl font-bold text-gray-900">99.8%</div>
            <div className="text-sm text-gray-600 mt-1">Delivery rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">15 min</div>
            <div className="text-sm text-gray-600 mt-1">Avg response</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">4 levels</div>
            <div className="text-sm text-gray-600 mt-1">Escalation</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">24/7</div>
            <div className="text-sm text-gray-600 mt-1">Monitoring</div>
          </div>
        </div>
      </section>

      {showDocs && (
        <section className="bg-blue-50 py-24 border-y border-blue-100">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Quick Start Guide
            </h2>

            <div className="bg-white rounded-lg p-8 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Getting Started
              </h3>
              <ol className="space-y-4 text-gray-700">
                <li className="flex gap-3">
                  <span className="font-semibold text-blue-600">1.</span>
                  <div>
                    <strong>Create your account</strong> - Sign up with your
                    email. You'll get access to the dashboard right away.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-blue-600">2.</span>
                  <div>
                    <strong>Enable notifications</strong> - Allow browser
                    notifications so you never miss a reminder.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-blue-600">3.</span>
                  <div>
                    <strong>Add your medications</strong> - Click "Add
                    Medication", enter details and set reminder times.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-blue-600">4.</span>
                  <div>
                    <strong>Add family members</strong> - Go to Family
                    Management and add emergency contacts.
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>
      )}

      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            Core features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <Bell className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Smart reminders
              </h3>
              <p className="text-gray-600 mb-4">
                Customizable schedules with audio and visual notifications
                across all devices
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Multiple medication support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Timezone-aware scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Browser and system notifications</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <AlertTriangle className="w-8 h-8 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Emergency escalation
              </h3>
              <p className="text-gray-600 mb-4">
                Automatic four-level escalation protocol when medications are
                missed
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Gentle reminders at 15 minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Escalating alerts with audio and flash</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Family notification via email and SMS</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <Users className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Family network
              </h3>
              <p className="text-gray-600 mb-4">
                Connect with caregivers and family members for coordinated care
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Multiple contact management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Priority-based notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Real-time status updates</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <TrendingUp className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Analytics
              </h3>
              <p className="text-gray-600 mb-4">
                Track adherence patterns and share reports with healthcare
                providers
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Comprehensive medication logs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Visual adherence reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Export for medical records</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            How it works
          </h2>
          <p className="text-gray-600 mb-12 max-w-2xl">
            Simple setup with powerful automation to keep you and your loved
            ones safe
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Sign up</h3>
              <p className="text-sm text-gray-600">
                Create your account and configure notification preferences
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Add medications
              </h3>
              <p className="text-sm text-gray-600">
                Input medication details, dosages, and custom schedules
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Connect family
              </h3>
              <p className="text-sm text-gray-600">
                Add emergency contacts and family members for alerts
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Stay protected
              </h3>
              <p className="text-sm text-gray-600">
                Automatic monitoring with escalation if doses are missed
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Start managing medications better
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Free trial with full access to all features
          </p>
          <a
            href="/auth/signin"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
            <ChevronRight className="w-5 h-5 ml-1" />
          </a>
          <p className="text-sm text-gray-500 mt-4">No credit card required</p>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">MediCare</span>
              </div>
              <p className="text-sm text-gray-600">
                Medication management platform
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-12 pt-8 text-sm text-gray-600 text-center">
            2025 MediCare Assistant. Built with Next.js and TypeScript.
          </div>
        </div>
      </footer>
    </div>
  );
}
