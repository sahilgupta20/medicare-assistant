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
  TrendingUp,
  Bell,
  RefreshCw
} from 'lucide-react'


type MedicationStatus = {
  id: string
  medicationName: string
  dosage: string
  scheduledTime: string
  status: 'taken' | 'missed' | 'pending'
  takenAt?: Date
  missedSince?: string 
}

type ActiveAlert = {
  id: string
  medicationId: string
  medicationName: string
  scheduledTime: string
  missedTime: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  escalationLevel: number
  alertMessage: string
}

type FamilyMember = {
  id: string
  name: string
  email: string
  phone?: string
  relationship: string
  avatar?: string
  isEmergencyContact: boolean
  role: 'primary' | 'secondary' | 'observer'
  notificationPreferences: {
    daily_summary: boolean
    missed_medication: boolean
    emergency_only: boolean
  }
}

export default function FamilyPage() {
  const [seniorName] = useState("John")
  const [todayStatus, setTodayStatus] = useState<MedicationStatus[]>([])
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    fetchRealTimeData()
    

    const interval = setInterval(() => {
      fetchRealTimeData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchRealTimeData = async () => {
    try {
      await Promise.all([
        fetchTodayMedicationStatus(),
        fetchActiveAlerts(),
        fetchFamilyMembers()
      ])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching real-time data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayMedicationStatus = async () => {
    try {
      const [medicationsResponse, logsResponse] = await Promise.all([
        fetch('/api/medications'),
        fetch('/api/medication-logs')
      ])

      if (medicationsResponse.ok && logsResponse.ok) {
        const medications = await medicationsResponse.json()
        const logs = await logsResponse.json()
        
        const today = new Date().toDateString()
        
        const todayMedications = medications.flatMap((med: any) => 
          med.times.split(',').map((time: string) => {
            const medicationKey = `${med.id}-${time.trim()}`
            const todayLog = logs.find((log: any) => {
              const logDate = new Date(log.scheduledFor).toDateString()
              const logTime = new Date(log.scheduledFor).toTimeString().slice(0, 5)
              return logDate === today && log.medicationId === med.id && logTime === time.trim()
            })

            return {
              id: medicationKey,
              medicationName: med.name,
              dosage: med.dosage,
              scheduledTime: time.trim(),
              status: todayLog?.status === 'TAKEN' ? 'taken' : 
                      todayLog?.status === 'MISSED' ? 'missed' : 'pending',
              takenAt: todayLog?.takenAt ? new Date(todayLog.takenAt) : undefined
            }
          })
        )

        setTodayStatus(todayMedications)
      }
    } catch (error) {
      console.error('Error fetching medication status:', error)
    }
  }

  const fetchActiveAlerts = async () => {
  try {
    const response = await fetch('/api/emergency-alerts');
    if (response.ok) {
      const alerts = await response.json();
      
      const activeAlertsOnly = alerts
        .filter(alert => alert.status === 'active')
        .map(alert => ({
          id: alert.id,
          medicationId: alert.medicationId,
          medicationName: alert.medication?.name || 'Unknown Medication',
          scheduledTime: new Date(alert.createdAt).toLocaleTimeString(),
          missedTime: 'Recently',
          severity: alert.severity,
          alertType: alert.alertType,
          alertMessage: alert.message
        }));
      
      setActiveAlerts(activeAlertsOnly);
    }
  } catch (error) {
    console.error('Error fetching alerts:', error);
    setActiveAlerts([]);
  }
};

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch('/api/family-members')
      if (response.ok) {
        const members = await response.json()
        setFamilyMembers(members)
      }
    } catch (error) {
      console.error('Error fetching family members:', error)
      // Keep existing mock data
      setFamilyMembers([
        {
          id: "1",
          name: "Dr. Sarah Johnson",
          email: "sarah@familydoc.com",
          phone: "+1-555-0123",
          relationship: "Primary Doctor",
          isEmergencyContact: true,
          role: 'observer',
          notificationPreferences: {
            daily_summary: false,
            missed_medication: false,
            emergency_only: true
          }
        },
        {
          id: "2", 
          name: "Priya Sharma",
          email: "priya@email.com",
          phone: "+1-555-0124",
          relationship: "Daughter",
          isEmergencyContact: true,
          role: 'primary',
          notificationPreferences: {
            daily_summary: true,
            missed_medication: true,
            emergency_only: false
          }
        }
      ])
    }
  }

  // family dashboardup - date the handleAlertAction function:
const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'call' | 'escalate') => {
  try {
    console.log(`Performing action: ${action} on alert: ${alertId}`);
    
    const response = await fetch(`/api/emergency-alerts/${alertId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Alert action result:', result);
      
      if (action === 'acknowledge') {
        setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
        
  
        alert(`Alert resolved successfully. The family has acknowledged that the medication issue has been addressed.`);
      } else if (action === 'call') {
        alert('Calling Sahil about missed medication...');

      }
      
 
      await fetchActiveAlerts();
    } else {
      alert('Failed to process alert action. Please try again.');
    }
  } catch (error) {
    console.error('Error handling alert action:', error);
    alert('Error processing alert. Please try again.');
  }
};

  const sendDailyUpdate = async () => {
    try {
      const response = await fetch('/api/send-family-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'daily_summary',
          medicationStatus: todayStatus,
          seniorName
        })
      })

      if (response.ok) {
        alert("Daily update sent to all family members!")
      }
    } catch (error) {
      console.error('Error sending daily update:', error)
      alert("Failed to send update. Please try again.")
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'medium': return 'bg-orange-100 border-orange-300 text-orange-800'
      case 'high': return 'bg-red-100 border-red-300 text-red-800'
      case 'critical': return 'bg-red-200 border-red-400 text-red-900'
      default: return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const todayTaken = todayStatus.filter(med => med.status === 'taken').length
  const todayTotal = todayStatus.length
  const todayMissed = todayStatus.filter(med => med.status === 'missed').length

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
              <Link href="/medications" className="p-3 hover:bg-blue-100 rounded-2xl transition-all duration-300 group">
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
                  <p className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={fetchRealTimeData}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-2xl transition-all duration-300"
                title="Refresh data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              
              <button 
                onClick={sendDailyUpdate}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl text-lg font-semibold flex items-center space-x-2 transition-all duration-300 shadow-lg"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Send Update</span>
              </button>
              
              <Link 
                href="/family-setup"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl text-lg font-semibold flex items-center space-x-2 transition-all duration-300 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Manage Family</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Active Emergency Alerts */}
        {activeAlerts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="h-6 w-6 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">
                Active Alerts ({activeAlerts.length})
              </h2>
            </div>
            
            <div className="space-y-4">
              {activeAlerts.map(alert => (
                <div key={alert.id} className={`border-2 rounded-2xl p-6 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">{alert.medicationName}</h3>
                        <span className="px-2 py-1 bg-white bg-opacity-50 rounded-full text-xs font-medium">
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="mb-2">{alert.alertMessage}</p>
                      <p className="text-sm opacity-90">
                        Scheduled for {alert.scheduledTime} • Missed {alert.missedTime}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAlertAction(alert.id, 'call')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <Phone className="h-4 w-4" />
                        <span>Call {seniorName}</span>
                      </button>
                      <button
                        onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Resolve</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Status Overview */}
        <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 rounded-[2.5rem] shadow-2xl p-10 mb-12 border border-white/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-green-400 to-emerald-600 w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-800">Today's Health Status</h2>
                <p className="text-gray-600 text-lg">
                  {todayMissed === 0 ? `${seniorName} is doing great today!` : 
                   todayMissed === 1 ? `${seniorName} missed 1 medication today` :
                   `${seniorName} missed ${todayMissed} medications today`}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-5xl font-bold ${todayMissed === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {todayTaken}/{todayTotal}
              </div>
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

        {/* Family Members - Updated with notification preferences */}
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
                  
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {member.isEmergencyContact && (
                      <span className="inline-flex items-center space-x-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                        <Shield className="h-3 w-3" />
                        <span>Emergency</span>
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      member.role === 'primary' ? 'bg-blue-100 text-blue-700' :
                      member.role === 'secondary' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {member.phone && (
                    <button 
                      onClick={() => window.location.href = `tel:${member.phone}`}
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
    </div>
  )
}