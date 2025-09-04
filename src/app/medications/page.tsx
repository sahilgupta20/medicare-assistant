'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Pill, Clock, Camera, Trash2, Edit, CheckCircle2, Loader2, Bell, BellOff } from 'lucide-react'
import { NotificationService } from '../../lib/notifications'



type Medication = {
  id: string
  name: string
  dosage: string
  description?: string
  times: string
  color?: string
  shape?: string
  photoUrl?: string
}

type MedicationFormData = {
  name: string
  dosage: string
  description: string
  color: string
  shape: string
  times: string[]
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userName] = useState("Sahil")
  const [takenMedications, setTakenMedications] = useState<Set<string>>(new Set())
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [reminderTimeouts, setReminderTimeouts] = useState<Map<string, number>>(new Map())

  const [formData, setFormData] = useState<MedicationFormData>({
    name: '',
    dosage: '',
    description: '',
    color: '',
    shape: '',
    times: []
  })

  useEffect(() => {
  fetchMedications()
  fetchTakenMedications()
  checkNotificationPermission()
  testBrowserSupport()
}, [])

  const fetchMedications = async () => {
    try {
      const response = await fetch('/api/medications')
      if (response.ok) {
        const data = await response.json()
        setMedications(data)
      }
    } catch (error) {
      console.error('Error fetching medications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTakenMedications = async () => {
    try {
      const response = await fetch('/api/medication-logs')
      if (response.ok) {
        const logs = await response.json()
        const today = new Date().toDateString()
        
        // Get logs from today that were marked as taken
        const todayTaken = logs
          .filter((log: any) => {
            const logDate = new Date(log.scheduledFor).toDateString()
            return logDate === today && log.status === 'TAKEN'
          })
          .map((log: any) => {
            const scheduledDate = new Date(log.scheduledFor)
            const timeString = scheduledDate.toTimeString().slice(0, 5) // "HH:MM" format
            return `${log.medicationId}-${timeString}`
          })
        
        console.log('Today taken medications:', todayTaken) // Debug log
        setTakenMedications(new Set(todayTaken))
      }
    } catch (error) {
      console.error('Error fetching taken medications:', error)
    }
  }

  const checkNotificationPermission = () => {
  if ('Notification' in window) {
    setNotificationsEnabled(Notification.permission === 'granted')
  }
}

const testBrowserSupport = () => {
  console.log('🌐 Browser support check:')
  console.log('- Notifications supported:', 'Notification' in window)
  console.log('- Current permission:', Notification.permission)
  console.log('- Service Worker supported:', 'serviceWorker' in navigator)
}

const enableNotifications = async () => {
  console.log('Bell button clicked!') // Debug 
  
  try {
    console.log('📋 Current permission:', Notification.permission)
    const notificationService = NotificationService.getInstance()
    console.log(' NotificationService created') // Debug 
    
    const granted = await notificationService.requestPermission()
    console.log(' Permission result:', granted) // Debug 
    
    setNotificationsEnabled(granted)
    
    if (granted) {
      scheduleAllReminders()
      await notificationService.testNotification()
      console.log(' Test notification should have appeared') // Debug 
    }
  } catch (error) {
    console.error(' Error in enableNotifications:', error)
  }
}

const scheduleAllReminders = () => {
  const notificationService = NotificationService.getInstance()
  const newTimeouts = new Map<string, number>()
  
  medications.forEach(med => {
    med.times.split(',').forEach(time => {
      const timeoutId = notificationService.scheduleMedicationReminder(
        med.id,
        med.name,
        med.dosage,
        time.trim()
      )
      newTimeouts.set(`${med.id}-${time}`, timeoutId)
    })
  })
  
  setReminderTimeouts(newTimeouts)
}

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.dosage) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          times: formData.times.join(',')
        })
      })

      if (response.ok) {
        await fetchMedications()
        setShowAddForm(false)
        setFormData({
          name: '',
          dosage: '',
          description: '',
          color: '',
          shape: '',
          times: []
        })
      }
    } catch (error) {
      console.error('Error adding medication:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMedication = async (id: string) => {
    if (!confirm('Are you sure you want to remove this medication?')) return

    try {
      const response = await fetch(`/api/medications?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchMedications()
      }
    } catch (error) {
      console.error('Error deleting medication:', error)
    }
  }

  const handleMarkTaken = async (medicationId: string, scheduledTime: string) => {
    try {
      // Create a proper datetime for today at the scheduled time  
      const scheduledDateTime = new Date()
      const [hours, minutes] = scheduledTime.split(':').map(Number)
      scheduledDateTime.setHours(hours, minutes, 0, 0)

      console.log('🔍 Debug - Original time:', scheduledTime)
      console.log('🔍 Debug - Created datetime:', scheduledDateTime.toISOString())

      const response = await fetch('/api/medication-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicationId,
          status: 'TAKEN',
          scheduledFor: scheduledDateTime.toISOString()
        })
      })

      if (response.ok) {
        const takenKey = `${medicationId}-${scheduledTime}`
        console.log('✅ Marking as taken:', takenKey)
        setTakenMedications(prev => new Set([...prev, takenKey]))
        alert('✅ Medication marked as taken! Great job staying healthy!')
      } else {
        const errorData = await response.json()
        console.error('API error:', errorData)
        alert('❌ Something went wrong. Please try again.')
      }
    } catch (error) {
      console.error('Error logging medication:', error)
      alert('❌ Something went wrong. Please try again.')
    }
  }

  const handleTimeToggle = (time: string) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.includes(time) 
        ? prev.times.filter(t => t !== time)
        : [...prev.times, time]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading your medications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full opacity-30"></div>
        <div className="absolute bottom-40 left-32 w-20 h-20 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full opacity-40"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-20 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="p-3 hover:bg-rose-100 rounded-2xl transition-all duration-300 group">
                <ArrowLeft className="h-8 w-8 text-gray-600 group-hover:text-rose-600" />
              </Link>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="bg-gradient-to-br from-rose-400 to-pink-600 p-4 rounded-3xl shadow-lg">
                    <Pill className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 bg-green-400 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{medications.length}</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                    My Medicine Cabinet
                  </h1>
                  <p className="text-gray-600 text-lg">Taking care of yourself today, {userName}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={enableNotifications}
                className={`p-3 rounded-2xl transition-all duration-300 ${
                  notificationsEnabled 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600'
                }`}
                title={notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
              >
                {notificationsEnabled ? <Bell className="h-6 w-6" /> : <BellOff className="h-6 w-6" />}
              </button>
              
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl text-xl font-semibold flex items-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group"
              >
                <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
                <span>Add New Medicine</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Today's Medicine Schedule */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 rounded-[2.5rem] shadow-2xl p-10 mb-12 border border-white/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20 rounded-[2.5rem]"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-8">
              <div className="bg-gradient-to-br from-blue-400 to-indigo-600 w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-gray-800">Today's Schedule</h2>
                <p className="text-gray-600 text-lg">Your medications for today</p>
              </div>
            </div>
            
            {medications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Pill className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-600 mb-2">No medications yet</h3>
                <p className="text-gray-500">Add your first medication to get started</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {medications.flatMap(med => 
                  med.times.split(',').map(time => {
                    const takenKey = `${med.id}-${time}`
                    const isTaken = takenMedications.has(takenKey)
                    
                    return (
                      <div key={takenKey} className={`rounded-3xl p-8 relative overflow-hidden group hover:shadow-lg transition-all duration-300 ${
                        isTaken 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300'
                          : 'bg-gradient-to-r from-rose-100 to-pink-100 border-2 border-rose-300'
                      }`}>
                        {isTaken && (
                          <div className="absolute top-4 right-4">
                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>TAKEN</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Clock className={`h-6 w-6 ${isTaken ? 'text-green-600' : 'text-rose-600'}`} />
                              <div className={`text-3xl font-bold ${isTaken ? 'text-green-800' : 'text-rose-800'}`}>
                                {time}
                              </div>
                            </div>
                            <div className={`text-xl font-semibold mb-2 ${isTaken ? 'text-green-700' : 'text-rose-700'}`}>
                              {med.name} - {med.dosage}
                            </div>
                            {med.description && (
                              <div className={`${isTaken ? 'text-green-600' : 'text-rose-600'}`}>
                                {med.description}
                              </div>
                            )}
                          </div>
                          
                          {isTaken ? (
                            <div className="bg-green-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold flex items-center space-x-2">
                              <CheckCircle2 className="h-6 w-6" />
                              <span>Taken!</span>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleMarkTaken(med.id, time)}
                              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 shadow-lg transform hover:scale-105"
                            >
                              I took this
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* All Medications Cabinet */}
        <div className="bg-gradient-to-br from-white via-emerald-50/30 to-green-50/50 rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/20 to-green-100/20 rounded-[2.5rem]"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-gray-800 mb-10 text-center">
              Your Medicine Cabinet
            </h2>
            
            {medications.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500">Start by adding your first medication</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {medications.map((med, index) => (
                  <div key={med.id} className={`bg-white/80 backdrop-blur-sm border-2 rounded-3xl p-8 hover:shadow-xl transition-all duration-500 group relative overflow-hidden ${
                    index % 2 === 0 ? 'border-rose-200 hover:border-rose-300' : 'border-emerald-200 hover:border-emerald-300'
                  }`}>
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all duration-300">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMedication(med.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all duration-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="mb-8">
                      <h3 className="text-3xl font-bold text-gray-800 mb-3">{med.name}</h3>
                      <div className="flex items-center space-x-4 mb-4">
                        <span className={`px-4 py-2 rounded-2xl text-lg font-semibold ${
                          index % 2 === 0 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {med.dosage}
                        </span>
                      </div>
                      
                      {med.description && (
                        <p className="text-gray-600 mb-4">{med.description}</p>
                      )}
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span><strong>Times:</strong> {med.times.split(',').join(', ')}</span>
                        </div>
                        {(med.color || med.shape) && (
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {med.color && <span><strong>Color:</strong> {med.color}</span>}
                            {med.shape && <span><strong>Shape:</strong> {med.shape}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Photo placeholder */}
                    <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Add photo of medication</p>
                      <button className="mt-2 text-blue-600 hover:text-blue-700 font-medium">
                        Take Photo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add New Medication Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Add New Medication</h2>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={handleAddMedication} className="space-y-6">
                  <div>
                    <label className="block text-xl font-medium text-gray-700 mb-2">
                      Medication Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., Blood Pressure Medicine"
                    />
                  </div>

                  <div>
                    <label className="block text-xl font-medium text-gray-700 mb-2">
                      Dosage *
                    </label>
                    <input 
                      type="text" 
                      required
                      value={formData.dosage}
                      onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                      className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., 10mg, 1 tablet"
                    />
                  </div>

                  <div>
                    <label className="block text-xl font-medium text-gray-700 mb-2">
                      Instructions
                    </label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                      rows={3}
                      placeholder="e.g., Take with food, morning only"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xl font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <input 
                        type="text" 
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., Blue, White"
                      />
                    </div>

                    <div>
                      <label className="block text-xl font-medium text-gray-700 mb-2">
                        Shape
                      </label>
                      <input 
                        type="text" 
                        value={formData.shape}
                        onChange={(e) => setFormData(prev => ({ ...prev, shape: e.target.value }))}
                        className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., Round, Oval"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xl font-medium text-gray-700 mb-2">
                      When to take (select times)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['06:00', '08:00', '12:00', '18:00', '20:00', '22:00'].map(time => (
                        <label key={time} className={`flex items-center space-x-2 p-3 border-2 rounded-xl hover:border-blue-300 cursor-pointer transition-colors ${
                          formData.times.includes(time) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}>
                          <input 
                            type="checkbox" 
                            checked={formData.times.includes(time)}
                            onChange={() => handleTimeToggle(time)}
                            className="w-5 h-5" 
                          />
                          <span className="text-lg">{time}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-4 px-6 rounded-xl text-xl font-semibold hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-xl text-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Adding...
                        </>
                      ) : (
                        'Add Medication'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}