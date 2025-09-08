// src/app/test-notifications/page.tsx - Complete Fixed Test Page
'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, TestTube, Clock, CheckCircle2, AlertTriangle, Phone, Zap } from 'lucide-react'
import { notificationService, NotificationService } from '../../lib/notifications'

export default function CompleteNotificationTest() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const [escalationService, setEscalationService] = useState<any>(null)
  
  const [testMedications] = useState([
    {
      id: 'test-med-1',
      name: 'Blood Pressure Medicine',
      dosage: '10mg',
      times: ['08:00', '14:00', '20:00'] // Using your data structure
    },
    {
      id: 'test-med-2', 
      name: 'Heart Medicine',
      dosage: '5mg',
      times: ['09:00', '21:00']
    }
  ])

  // STEP 1 FIX: Load Emergency Escalation Service
  useEffect(() => {
    const loadEscalationService = async () => {
      try {
        addTestResult('Loading emergency escalation service...')
        const { emergencyEscalationService } = await import('../../lib/emergency-escalation')
        
        if (typeof window !== 'undefined') {
          (window as any).escalationService = emergencyEscalationService
          setEscalationService(emergencyEscalationService)
          addTestResult('SUCCESS: Emergency escalation service loaded and exposed to window')
        }
      } catch (error) {
        addTestResult(`ERROR: Failed to load emergency escalation service: ${error.message}`)
      }
    }
    
    loadEscalationService()
    checkCurrentPermission()
  }, [])

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestResults(prev => [`${timestamp}: ${message}`, ...prev])
    console.log(`TEST RESULT: ${message}`)
  }

  const checkCurrentPermission = () => {
    if ('Notification' in window) {
      setIsEnabled(Notification.permission === 'granted')
      addTestResult(`Browser permission: ${Notification.permission}`)
    } else {
      addTestResult('Browser does not support notifications')
    }
  }

  // ORIGINAL TESTS
  const testBasicPermission = async () => {
    addTestResult('Testing basic permission request...')
    
    try {
      const service = NotificationService.getInstance()
      const granted = await service.requestPermission()
      
      setIsEnabled(granted)
      addTestResult(`Permission result: ${granted}`)
      
      if (granted) {
        addTestResult('SUCCESS: Notifications enabled')
      } else {
        addTestResult('FAILED: Permission denied')
      }
    } catch (error) {
      addTestResult(`ERROR: ${error.message}`)
    }
  }

  const testImmediateNotification = async () => {
    addTestResult('Testing immediate notification...')
    
    try {
      const service = NotificationService.getInstance()
      await service.testNotification()
      addTestResult('SUCCESS: Test notification sent')
    } catch (error) {
      addTestResult(`ERROR: ${error.message}`)
    }
  }

  // STEP 2 FIX: Direct scheduling tests to isolate the issue
  const testDirectScheduling = () => {
    addTestResult('Testing direct setTimeout scheduling...')
    
    // Test basic setTimeout works
    setTimeout(() => {
      addTestResult('SUCCESS: Basic setTimeout works')
      
      // Test notification creation
      if (Notification.permission === 'granted') {
        try {
          const notification = new Notification('Direct Test', {
            body: 'This proves setTimeout + Notification works',
            icon: '/favicon.ico'
          })
          
          setTimeout(() => notification.close(), 3000)
          addTestResult('SUCCESS: Direct notification shown')
        } catch (error) {
          addTestResult(`ERROR: Direct notification failed: ${error.message}`)
        }
      } else {
        addTestResult('WARNING: No notification permission for direct test')
      }
    }, 3000) // 3 seconds instead of 10
    
    addTestResult('Direct test scheduled for 3 seconds...')
  }

  const testServiceDirectly = () => {
    addTestResult('Testing service direct method...')
    
    try {
      const service = NotificationService.getInstance()
      
      // Call showMedicationReminder directly
      const testMed = {
        id: 'direct-test',
        name: 'Direct Test Medicine',
        dosage: '1mg',
        times: ['08:00']
      }
      
      service.showMedicationReminder(testMed)
      addTestResult('SUCCESS: Called showMedicationReminder directly')
      
    } catch (error) {
      addTestResult(`ERROR: Direct service test failed: ${error.message}`)
    }
  }

  const testSimpleScheduling = () => {
    addTestResult('Testing simplified scheduling...')
    
    try {
      // Create notification manually with setTimeout
      const notificationTimeout = setTimeout(() => {
        addTestResult('FIRING: Manual notification')
        
        if (Notification.permission === 'granted') {
          const notification = new Notification('Manual Schedule Test', {
            body: 'This notification was scheduled manually',
            icon: '/favicon.ico'
          })
          
          setTimeout(() => notification.close(), 5000)
          addTestResult('SUCCESS: Manual scheduled notification shown')
        }
      }, 5000) // 5 seconds
      
      addTestResult('Manual scheduling set for 5 seconds')
      
    } catch (error) {
      addTestResult(`ERROR: Manual scheduling failed: ${error.message}`)
    }
  }

  const testNotificationPermission = () => {
  addTestResult('Testing notification permission...')
  addTestResult(`Permission status: ${Notification.permission}`)
  
  if (Notification.permission === 'granted') {
    try {
      const testNotif = new Notification('Direct Notification Test', {
        body: 'This is a direct notification test',
        icon: '/favicon.ico'
      })
      addTestResult('SUCCESS: Direct notification created')
      setTimeout(() => testNotif.close(), 3000)
    } catch (error) {
      addTestResult(`ERROR: Direct notification failed: ${error.message}`)
    }
  } else {
    addTestResult('ERROR: Notification permission not granted')
  }
}



  // IMPROVED: Better quick test
 const testQuickReminder = () => {
  addTestResult('Setting up improved quick test reminder (8 seconds)...')
  
  // Instead of creating a time string, let's test direct setTimeout
  const testMed = {
    id: 'quick-test',
    name: 'Quick Test Medicine', 
    dosage: '1 tablet',
    times: ['99:99'] // Invalid time to force direct scheduling
  }
  
  // Manually schedule with setTimeout
  setTimeout(() => {
    addTestResult('MANUAL TIMEOUT FIRED - Testing service notification')
    const service = NotificationService.getInstance()
    service.showMedicationReminder(testMed)
  }, 8000)
  
  addTestResult('Manual 8-second test scheduled')
}

  const testMedicationScheduling = () => {
    addTestResult('Testing medication scheduling...')
    
    try {
      const service = NotificationService.getInstance()
      service.scheduleAllMedicationReminders(testMedications)
      
      const state = service.getNotificationState()
      addTestResult(`SUCCESS: Scheduled ${state.scheduledReminders.size} reminders`)
      addTestResult(`Missed medication timers: ${state.missedMedicationTimers.size}`)
      
    } catch (error) {
      addTestResult(`ERROR: ${error.message}`)
    }
  }

  const testMedicationTaken = () => {
    addTestResult('Testing medication taken functionality...')
    
    try {
      const service = NotificationService.getInstance()
      service.medicationTaken('test-med-1')
      addTestResult('SUCCESS: Medication marked as taken')
    } catch (error) {
      addTestResult(`ERROR: ${error.message}`)
    }
  }

  const testEmergencyEscalation = () => {
    addTestResult('Testing emergency escalation integration...')
    
    try {
      if (escalationService) {
        escalationService.reportMissedMedication(
          'test-escalation',
          'Test Medicine',
          '10mg',
          '08:00'
        )
        addTestResult('SUCCESS: Emergency escalation triggered with loaded service')
      } else if (typeof window !== 'undefined' && (window as any).escalationService) {
        (window as any).escalationService.reportMissedMedication(
          'test-escalation',
          'Test Medicine',
          '10mg',
          '08:00'
        )
        addTestResult('SUCCESS: Emergency escalation triggered with window service')
      } else {
        addTestResult('ERROR: Emergency escalation service not found')
      }
    } catch (error) {
      addTestResult(`ERROR: ${error.message}`)
    }
  }

  const testDatabaseEscalation = async () => {
    addTestResult('Testing escalation with database family members...')
    
    try {
      if (escalationService && escalationService.testEscalation) {
        await escalationService.testEscalation()
        addTestResult('SUCCESS: Database escalation test triggered')
      } else {
        addTestResult('ERROR: testEscalation method not available')
      }
    } catch (error) {
      addTestResult(`ERROR: ${error.message}`)
    }
  }

  const clearAllReminders = () => {
    addTestResult('Clearing all scheduled reminders...')
    
    try {
      const service = NotificationService.getInstance()
      service.clearAllReminders()
      addTestResult('SUCCESS: All reminders cleared')
    } catch (error) {
      addTestResult(`ERROR: ${error.message}`)
    }
  }

  const debugCurrentService = () => {
    addTestResult('Debugging current service state...')
    
    try {
      const service = NotificationService.getInstance()
      const state = service.getNotificationState()
      
      addTestResult(`Service enabled: ${service.isEnabled()}`)
      addTestResult(`Permission: ${state.permission}`)
      addTestResult(`Scheduled reminders: ${state.scheduledReminders.size}`)
      addTestResult(`Missed timers: ${state.missedMedicationTimers.size}`)
      
      // List all scheduled reminders
      let count = 0
      state.scheduledReminders.forEach((timeoutId, key) => {
        addTestResult(`Scheduled ${count++}: ${key} -> ${timeoutId}`)
      })
      
      if (state.scheduledReminders.size === 0) {
        addTestResult('WARNING: No reminders are scheduled')
      }
      
    } catch (error) {
      addTestResult(`DEBUG ERROR: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center space-x-4 mb-8">
            <TestTube className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Complete Notification System Test</h1>
              <p className="text-gray-600">Testing notification scheduling and emergency escalation</p>
            </div>
          </div>

          {/* Permission Status */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isEnabled ? (
                  <Bell className="h-6 w-6 text-green-600" />
                ) : (
                  <BellOff className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    Status: {isEnabled ? 'Enabled' : 'Disabled'}
                  </h3>
                  <p className="text-gray-600">
                    Browser Permission: {typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Escalation Service: {escalationService ? 'Loaded' : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Buttons Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {/* Basic Tests */}
            <button
              onClick={testBasicPermission}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <Bell className="h-5 w-5" />
              <span>Permission</span>
            </button>

            <button
              onClick={testImmediateNotification}
              disabled={!isEnabled}
              className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>Immediate</span>
            </button>

            {/* Direct Tests */}
            <button
              onClick={testDirectScheduling}
              disabled={!isEnabled}
              className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Clock className="h-5 w-5" />
              <span>Direct (3s)</span>
            </button>

            <button
              onClick={testServiceDirectly}
              disabled={!isEnabled}
              className="bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Zap className="h-5 w-5" />
              <span>Service Direct</span>
            </button>

            <button
              onClick={testSimpleScheduling}
              disabled={!isEnabled}
              className="bg-pink-600 text-white px-4 py-3 rounded-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Clock className="h-5 w-5" />
              <span>Manual (5s)</span>
            </button>

            {/* Original Tests */}
            <button
              onClick={testQuickReminder}
              disabled={!isEnabled}
              className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Clock className="h-5 w-5" />
              <span>Quick (8s)</span>
            </button>

            <button
              onClick={testMedicationScheduling}
              disabled={!isEnabled}
              className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <TestTube className="h-5 w-5" />
              <span>Schedule</span>
            </button>

            <button
              onClick={testMedicationTaken}
              className="bg-cyan-600 text-white px-4 py-3 rounded-lg hover:bg-cyan-700 flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>Mark Taken</span>
            </button>

            {/* Escalation Tests */}
            <button
              onClick={testEmergencyEscalation}
              className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
            >
              <AlertTriangle className="h-5 w-5" />
              <span>Escalation</span>
            </button>

            <button
              onClick={testDatabaseEscalation}
              className="bg-red-700 text-white px-4 py-3 rounded-lg hover:bg-red-800 flex items-center justify-center space-x-2"
            >
              <Phone className="h-5 w-5" />
              <span>DB Escalation</span>
            </button>

            {/* Utility */}
            <button
              onClick={debugCurrentService}
              className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2"
            >
              <span>Debug</span>
            </button>

            <button
              onClick={clearAllReminders}
              className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2"
            >
              <span>Clear All</span>
            </button>
          </div>

          {/* Test Medications Display */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Test Medications</h3>
            <div className="grid gap-4">
              {testMedications.map(med => (
                <div key={med.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{med.name}</h4>
                      <p className="text-gray-600">{med.dosage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Times Array:</p>
                      <p className="font-mono text-sm">[{med.times.join(', ')}]</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Results Log */}
          <div className="bg-black rounded-lg p-4">
            <h3 className="text-white text-lg font-semibold mb-4">Test Results Log</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-400">No test results yet. Click buttons above to start testing.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className={`text-sm font-mono ${
                    result.includes('SUCCESS') ? 'text-green-400' :
                    result.includes('ERROR') ? 'text-red-400' :
                    result.includes('WARNING') ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}>
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Testing Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-semibold mb-2">Step-by-Step Testing</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li><strong>Permission:</strong> Click first to enable notifications</li>
              <li><strong>Immediate:</strong> Test instant notification</li>
              <li><strong>Direct (3s):</strong> Test basic setTimeout + notification</li>
              <li><strong>Manual (5s):</strong> Test manual scheduling</li>
              <li><strong>Quick (8s):</strong> Test service scheduling (improved)</li>
              <li><strong>Escalation:</strong> Test emergency system</li>
              <li><strong>Debug:</strong> Check service state</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}