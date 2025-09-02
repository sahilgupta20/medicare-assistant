'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pill, Users, Bell, Heart, Clock, Shield } from 'lucide-react'

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())

  // Update time every second
  useState(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-3 rounded-full">
                <Pill className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">MediCare Assistant</h1>
                <p className="text-gray-600">Your medication companion</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">{currentTime}</div>
              <div className="text-gray-600">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Managing Your Medications Made Simple
          </h2>
          <p className="text-2xl text-gray-600 mb-12 max-w-4xl mx-auto">
            Never miss a dose again with our easy-to-use reminder system designed specifically for you
          </p>
          
          {/* Main Action Buttons */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/medications">
              <div className="bg-white p-12 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border-4 border-transparent hover:border-blue-500">
                <Pill className="h-24 w-24 text-blue-600 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-gray-900 mb-4">My Medications</h3>
                <p className="text-xl text-gray-600">View and manage your daily medications</p>
              </div>
            </Link>

            <Link href="/family">
              <div className="bg-white p-12 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border-4 border-transparent hover:border-green-500">
                <Users className="h-24 w-24 text-green-600 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Family Dashboard</h3>
                <p className="text-xl text-gray-600">Connect with your family caregivers</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-3xl shadow-xl p-12 mb-16">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Designed With You In Mind
          </h3>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="h-10 w-10 text-blue-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Smart Reminders</h4>
              <p className="text-lg text-gray-600">
                Visual and audio alerts that are impossible to miss, with gentle voice notifications
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-10 w-10 text-green-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Family Care</h4>
              <p className="text-lg text-gray-600">
                Your family stays informed and can help monitor your medication schedule
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-purple-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Always Available</h4>
              <p className="text-lg text-gray-600">
                Works offline and syncs when connected. Your health information is always secure
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl font-bold text-blue-600 mb-2">125,000+</div>
            <div className="text-gray-600 text-lg">Deaths prevented by proper medication adherence annually</div>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl font-bold text-green-600 mb-2">40%</div>
            <div className="text-gray-600 text-lg">Of seniors struggle with medication management</div>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl font-bold text-purple-600 mb-2">Simple</div>
            <div className="text-gray-600 text-lg">Large buttons, clear text, easy navigation</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Pill className="h-8 w-8" />
            <span className="text-2xl font-bold">MediCare Assistant</span>
          </div>
          <p className="text-gray-400">
            Built with ❤️ for seniors and their families
          </p>
        </div>
      </footer>
    </div>
  )
}