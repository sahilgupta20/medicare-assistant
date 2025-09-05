// src/app/family/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Heart,
  MessageCircle,
  Phone,
  Plus,
  Shield,
  Calendar,
  TrendingUp
} from 'lucide-react'

type MedicationStatus = {
  medicationName: string
  dosage: string
  scheduledTime: string
  status: 'taken' | 'missed' | 'pending'
  takenAt?: Date
}

type FamilyMember = {
  id: string
  name: string
  email: string
  phone?: string
  relationship: string
  avatar?: string
  isEmergencyContact: boolean
}

type DailyReport = {
  date: string
  totalMedications: number
  takenOnTime: number
  takenLate: number
  missed: number
  adherencePercentage: number
}

export default function FamilyPage() {
  const [seniorName] = useState("Sahil")
  const [todayStatus, setTodayStatus] = useState<MedicationStatus[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [weeklyReport, setWeeklyReport] = useState<DailyReport[]>([])
  const [showAddFamily, setShowAddFamily] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodayStatus()
    fetchFamilyMembers()
    fetchWeeklyReport()
  }, [])

  const fetchTodayStatus = async () => {
    // Mock data - replace with actual API call
    setTodayStatus([
      {
        medicationName: "Blood Pressure Medicine",
        dosage: "10mg",
        scheduledTime: "08:00",
        status: "taken",
        takenAt: new Date()
      },
      {
        medicationName: "Vitamin D",
        dosage: "1000 IU",
        scheduledTime: "12:00",
        status: "pending"
      },
      {
        medicationName: "Heart Medication",
        dosage: "5mg",
        scheduledTime: "20:00",
        status: "pending"
      }
    ])
  }

  const fetchFamilyMembers = async () => {
    // Mock data - replace with actual API call
    setFamilyMembers([
      {
        id: "1",
        name: "Dr. Sarah Johnson",
        email: "sarah@familydoc.com",
        phone: "+1-555-0123",
        relationship: "Primary Doctor",
        isEmergencyContact: true
      },
      {
        id: "2", 
        name: "Priya Sharma",
        email: "priya@email.com",
        phone: "+1-555-0124",
        relationship: "Daughter",
        isEmergencyContact: true
      },
      {
        id: "3",
        name: "Raj Sharma", 
        email: "raj@email.com",
        phone: "+1-555-0125",
        relationship: "Son",
        isEmergencyContact: false
      }
    ])
  }

  const fetchWeeklyReport = async () => {
    // Mock data - replace with actual API call
    const mockData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const total = 3
      const taken = Math.floor(Math.random() * 3) + 1
      
      return {
        date: date.toISOString().split('T')[0],
        totalMedications: total,
        takenOnTime: taken,
        takenLate: Math.random() > 0.7 ? 1 : 0,
        missed: total - taken,
        adherencePercentage: Math.round((taken / total) * 100)
      }
    })
    
    setWeeklyReport(mockData)
    setLoading(false)
  }

  const sendDailyUpdate = async () => {
    // Mock function - implement actual notification to family
    alert("Daily update sent to all family members! 📱")
  }

  const callEmergencyContact = (member: FamilyMember) => {
    if (member.phone) {
      window.location.href = `tel:${member.phone}`
    }
  }

  const overallAdherence = weeklyReport.length > 0 
    ? Math.round(weeklyReport.reduce((sum, day) => sum + day.adherencePercentage, 0) / weeklyReport.length)
    : 0

  const todayTaken = todayStatus.filter(med => med.status === 'taken').length
  const todayTotal = todayStatus.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading family dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-20 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="p-3 hover:bg-blue-100 rounded-2xl transition-all duration-300 group">
                <ArrowLeft className="h-8 w-8 text-gray-600 group-hover:text-blue-600" />
              </Link>
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-400 to-indigo-600 p-4 rounded-3xl shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Family Circle
                  </h1>
                  <p className="text-gray-600 text-lg">Stay connected with {seniorName}'s health</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={sendDailyUpdate}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl text-lg font-semibold flex items-center space-x-2 transition-all duration-300 shadow-lg"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Send Update</span>
              </button>
              
              <button 
                onClick={() => setShowAddFamily(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl text-lg font-semibold flex items-center space-x-2 transition-all duration-300 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Add Family</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Today's Status Overview */}
        <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 rounded-[2.5rem] shadow-2xl p-10 mb-12 border border-white/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-green-400 to-emerald-600 w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-800">Today's Health Status</h2>
                <p className="text-gray-600 text-lg">{seniorName} is doing great today!</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-5xl font-bold text-green-600">{todayTaken}/{todayTotal}</div>
              <div className="text-gray-600">Medications Taken</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {todayStatus.map((med, index) => (
              <div key={index} className={`rounded-2xl p-6 ${
                med.status === 'taken' 
                  ? 'bg-green-100 border-2 border-green-300' 
                  : med.status === 'missed'
                  ? 'bg-red-100 border-2 border-red-300'
                  : 'bg-yellow-100 border-2 border-yellow-300'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold text-gray-800">
                    {med.scheduledTime}
                  </div>
                  <div className={`p-2 rounded-full ${
                    med.status === 'taken' 
                      ? 'bg-green-500' 
                      : med.status === 'missed'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}>
                    {med.status === 'taken' ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : med.status === 'missed' ? (
                      <AlertTriangle className="h-5 w-5 text-white" />
                    ) : (
                      <Clock className="h-5 w-5 text-white" />
                    )}
                  </div>
                </div>
                <div className="font-semibold text-gray-700">{med.medicationName}</div>
                <div className="text-gray-600">{med.dosage}</div>
                {med.takenAt && (
                  <div className="text-sm text-green-600 mt-2">
                    ✓ Taken at {med.takenAt.toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Adherence Chart */}
        <div className="bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/50 rounded-[2.5rem] shadow-2xl p-10 mb-12 border border-white/50">
          <div className="flex items-center space-x-4 mb-8">
            <div className="bg-gradient-to-br from-purple-400 to-indigo-600 w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-800">Weekly Progress</h2>
              <p className="text-gray-600 text-lg">7-day medication adherence: {overallAdherence}%</p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {weeklyReport.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-sm text-gray-600 mb-2">
                  {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                </div>
                <div className={`w-full h-24 rounded-2xl flex items-end justify-center p-2 ${
                  day.adherencePercentage >= 90 ? 'bg-green-200' :
                  day.adherencePercentage >= 70 ? 'bg-yellow-200' : 'bg-red-200'
                }`}>
                  <div className={`w-full rounded-xl ${
                    day.adherencePercentage >= 90 ? 'bg-green-500' :
                    day.adherencePercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} style={{ height: `${day.adherencePercentage}%` }}>
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-800 mt-2">
                  {day.adherencePercentage}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Family Members */}
        <div className="bg-gradient-to-br from-white via-rose-50/30 to-pink-50/50 rounded-[2.5rem] shadow-2xl p-10 border border-white/50">
          <h2 className="text-4xl font-bold text-gray-800 mb-10 text-center">
            Family & Care Team
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {familyMembers.map((member) => (
              <div key={member.id} className="bg-white/80 backdrop-blur-sm border-2 border-rose-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-500 group">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{member.name}</h3>
                  <div className="text-rose-600 font-semibold">{member.relationship}</div>
                  {member.isEmergencyContact && (
                    <div className="inline-flex items-center space-x-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold mt-2">
                      <Shield className="h-4 w-4" />
                      <span>Emergency Contact</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {member.phone && (
                    <button 
                      onClick={() => callEmergencyContact(member)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-2xl text-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-300"
                    >
                      <Phone className="h-5 w-5" />
                      <span>Call</span>
                    </button>
                  )}
                  
                  <a 
                    href={`mailto:${member.email}`}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-2xl text-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-300"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Email</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Family Member Modal */}
      {showAddFamily && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Add Family Member</h3>
            
            <form className="space-y-4">
              <input 
                type="text" 
                placeholder="Full Name"
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
              <input 
                type="email" 
                placeholder="Email Address"
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
              <input 
                type="tel" 
                placeholder="Phone Number"
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
              <select className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none">
                <option>Relationship</option>
                <option>Son</option>
                <option>Daughter</option>
                <option>Spouse</option>
                <option>Doctor</option>
                <option>Caregiver</option>
                <option>Friend</option>
              </select>
              
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-lg">Emergency Contact</span>
              </label>
              
              <div className="flex space-x-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddFamily(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-xl text-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}