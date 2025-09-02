'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Pill, Users, Bell, Heart, Clock, Shield, Sun, Moon, Coffee } from 'lucide-react'

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [userName] = useState("Sarah") // Mock user name
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return { text: "Good morning", icon: Sun, color: "text-amber-600" }
    if (hour < 17) return { text: "Good afternoon", icon: Coffee, color: "text-orange-600" }
    return { text: "Good evening", icon: Moon, color: "text-indigo-600" }
  }

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-rose-200 to-pink-300 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full opacity-40 animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-28 h-28 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full opacity-35 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Header with personality */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="bg-gradient-to-br from-rose-400 to-pink-600 p-4 rounded-3xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <Pill className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-white animate-ping"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                  MediCare Assistant
                </h1>
                <p className="text-gray-600 text-lg font-medium">Your caring medication companion</p>
              </div>
            </div>
            
            <div className="text-right bg-white/50 rounded-3xl p-6 backdrop-blur-sm shadow-lg border border-white/30">
              <div className="flex items-center space-x-2 mb-2">
                <GreetingIcon className={`h-6 w-6 ${greeting.color}`} />
                <span className={`text-lg font-semibold ${greeting.color}`}>{greeting.text}, {userName}!</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">{currentTime.toLocaleTimeString()}</div>
              <div className="text-gray-600">{currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Warm welcome message */}
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
            Never worry about forgetting your medicine again. We're here to gently remind you and keep your family connected to your wellness journey. 💝
          </p>
        </div>
        
        {/* Main Action Cards with enhanced design */}
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto mb-20">
          <Link href="/medications" className="group">
            <div className="relative overflow-hidden">
              <div className="bg-gradient-to-br from-white to-rose-50 p-12 rounded-[2.5rem] shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer border border-rose-100 group-hover:border-rose-300 transform group-hover:-translate-y-2">
                <div className="relative z-10">
                  <div className="bg-gradient-to-br from-rose-400 to-pink-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Pill className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-4xl font-bold text-gray-800 mb-6 group-hover:text-rose-600 transition-colors">
                    My Medicines
                  </h3>
                  <p className="text-xl text-gray-600 leading-relaxed">
                    See all your medicines in one simple place. Large pictures, clear instructions, and gentle reminders.
                  </p>
                </div>
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]"></div>
              </div>
            </div>
          </Link>

          <Link href="/family" className="group">
            <div className="relative overflow-hidden">
              <div className="bg-gradient-to-br from-white to-emerald-50 p-12 rounded-[2.5rem] shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer border border-emerald-100 group-hover:border-emerald-300 transform group-hover:-translate-y-2">
                <div className="relative z-10">
                  <div className="bg-gradient-to-br from-emerald-400 to-green-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-4xl font-bold text-gray-800 mb-6 group-hover:text-emerald-600 transition-colors">
                    Family Circle
                  </h3>
                  <p className="text-xl text-gray-600 leading-relaxed">
                    Stay connected with loved ones who care about your health. Share updates and get support.
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]"></div>
              </div>
            </div>
          </Link>
        </div>

        {/* Features with warm, human touch */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 rounded-[3rem] shadow-2xl p-16 mb-20 border border-white/50 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, #6366f1 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
          </div>
          
          <div className="relative z-10">
            <h3 className="text-5xl font-bold text-center text-gray-800 mb-4">
              Made with Love for You
            </h3>
            <p className="text-center text-xl text-gray-600 mb-16 max-w-2xl mx-auto">
              Every feature is thoughtfully designed to make your daily routine easier and more joyful
            </p>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center group">
                <div className="relative mx-auto mb-8 w-24 h-24">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-blue-400 to-indigo-600 w-24 h-24 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                    <Bell className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-400 rounded-full animate-pulse"></div>
                </div>
                <h4 className="text-3xl font-bold text-gray-800 mb-6">Gentle Reminders</h4>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Soft chimes and friendly messages that won't startle you. Like having a caring friend nearby.
                </p>
              </div>

              <div className="text-center group">
                <div className="relative mx-auto mb-8 w-24 h-24">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-200 to-pink-300 rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-rose-400 to-pink-600 w-24 h-24 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                    <Heart className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <h4 className="text-3xl font-bold text-gray-800 mb-6">Family Love</h4>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Your children and grandchildren can see you're doing well, giving everyone peace of mind.
                </p>
              </div>

              <div className="text-center group">
                <div className="relative mx-auto mb-8 w-24 h-24">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-green-300 rounded-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-emerald-400 to-green-600 w-24 h-24 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                    <Shield className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <h4 className="text-3xl font-bold text-gray-800 mb-6">Always There</h4>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Works even when the internet is slow. Your health information stays private and secure.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Impact stats with human stories */}
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-white/70 backdrop-blur-sm p-10 rounded-3xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 group">
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform">
              125,000+
            </div>
            <div className="text-gray-700 text-lg font-medium">
              Lives saved each year with proper medication care
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm p-10 rounded-3xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 group">
            <div className="text-5xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform">
              2 in 5
            </div>
            <div className="text-gray-700 text-lg font-medium">
              Seniors need help managing their daily medicines
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm p-10 rounded-3xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 group">
            <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform">
              Simple
            </div>
            <div className="text-gray-700 text-lg font-medium">
              No tiny buttons or confusing menus here
            </div>
          </div>
        </div>
      </div>

      {/* Warm, personal footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16 mt-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/20 to-purple-900/20"></div>
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="bg-gradient-to-br from-rose-400 to-pink-600 p-3 rounded-2xl">
              <Pill className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold">MediCare Assistant</span>
          </div>
          <p className="text-gray-300 text-xl mb-4">
            Built with care, love, and understanding
          </p>
          <p className="text-gray-400">
            For seniors and the families who love them ❤️
          </p>
        </div>
      </footer>
    </div>
  )
}