// Enhanced notification service with sound and better scheduling
// src/lib/notifications.ts (updated version)

interface AudioOptions {
  volume: number
  loop: boolean
  fade: boolean
}

export class NotificationService {
  private static instance: NotificationService
  private permission: NotificationPermission = 'default'
  private audioContext: AudioContext | null = null
  private reminderAudio: HTMLAudioElement | null = null
  private activeTimeouts = new Map<string, number>()

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  constructor() {
    this.initializeAudio()
  }

  private initializeAudio() {
    // Create a gentle chime sound for seniors
    this.reminderAudio = new Audio()
    this.reminderAudio.volume = 0.7
    this.reminderAudio.loop = false
    
    // Create a data URL for a gentle chime sound
    this.createChimeSound()
  }

  private createChimeSound() {
    // Create a gentle, pleasant chime sound using Web Audio API
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.log('Web Audio API not supported')
      }
    }
  }

  private async playGentleChime() {
    if (!this.audioContext) return

    try {
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Create a gentle chime sequence
      const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5 - pleasant chord
      const duration = 0.8
      const now = this.audioContext.currentTime

      frequencies.forEach((freq, index) => {
        const oscillator = this.audioContext!.createOscillator()
        const gainNode = this.audioContext!.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext!.destination)
        
        oscillator.frequency.setValueAtTime(freq, now + index * 0.2)
        oscillator.type = 'sine'
        
        // Gentle fade in and out
        gainNode.gain.setValueAtTime(0, now + index * 0.2)
        gainNode.gain.linearRampToValueAtTime(0.1, now + index * 0.2 + 0.1)
        gainNode.gain.linearRampToValueAtTime(0, now + index * 0.2 + duration)
        
        oscillator.start(now + index * 0.2)
        oscillator.stop(now + index * 0.2 + duration)
      })
    } catch (error) {
      console.log('Audio playback failed:', error)
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    const permission = await Notification.requestPermission()
    this.permission = permission
    
    return permission === 'granted'
  }

  async showMedicationReminder(
    medicationId: string,
    medicationName: string, 
    dosage: string, 
    time: string
  ): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) return
    }

    // Play gentle chime sound
    await this.playGentleChime()

    const notificationOptions = {
      body: `Time to take ${medicationName} (${dosage})`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `medication-${medicationId}-${time}`,
      requireInteraction: true,
      silent: false, // Allow the chime sound we created
      data: {
        medicationId,
        medicationName,
        dosage,
        time,
        url: '/medications'
      }
    }

    // Try Service Worker notification first
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        if (registration) {
          await registration.showNotification(`💊 Medicine Time!`, {
            ...notificationOptions,
            actions: [
              { action: 'taken', title: '✅ I took this' },
              { action: 'snooze', title: '⏰ Remind me in 10 minutes' }
            ]
          })
          
          // Schedule auto-dismiss after 5 minutes if no action
          setTimeout(() => {
            this.dismissNotification(`medication-${medicationId}-${time}`)
          }, 5 * 60 * 1000)

          return
        }
      } catch (error) {
        console.log('Service Worker notification failed:', error)
      }
    }

    // Fallback to basic notification
    const notification = new Notification(`💊 Medicine Time!`, notificationOptions)

    notification.onclick = () => {
      window.focus()
      notification.close()
      if (window.location.pathname !== '/medications') {
        window.location.href = '/medications'
      }
    }

    // Auto-close after 5 minutes
    setTimeout(() => {
      notification.close()
    }, 5 * 60 * 1000)
  }

  private async dismissNotification(tag: string) {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      const notifications = await registration.getNotifications({ tag })
      notifications.forEach(notification => notification.close())
    }
  }

  scheduleAllMedicationReminders(medications: Array<{
    id: string
    name: string
    dosage: string
    times: string
  }>): void {
    // Clear existing reminders
    this.clearAllReminders()

    medications.forEach(med => {
      const times = med.times.split(',').map(t => t.trim())
      times.forEach(time => {
        this.scheduleSingleReminder(med.id, med.name, med.dosage, time)
      })
    })
  }

  private scheduleSingleReminder(
    medicationId: string,
    medicationName: string,
    dosage: string,
    time: string
  ): void {
    const [hours, minutes] = time.split(':').map(Number)
    const now = new Date()
    
    // Schedule for today
    let scheduledTime = new Date()
    scheduledTime.setHours(hours, minutes, 0, 0)
    
    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    const timeUntilReminder = scheduledTime.getTime() - now.getTime()
    const reminderKey = `${medicationId}-${time}`

    const timeoutId = window.setTimeout(() => {
      this.showMedicationReminder(medicationId, medicationName, dosage, time)
      // Reschedule for next day
      this.scheduleSingleReminder(medicationId, medicationName, dosage, time)
    }, timeUntilReminder)

    this.activeTimeouts.set(reminderKey, timeoutId)

    console.log(`📅 Scheduled ${medicationName} reminder for ${time} (in ${Math.round(timeUntilReminder / 1000 / 60)} minutes)`)
  }

  clearAllReminders(): void {
    this.activeTimeouts.forEach(timeoutId => {
      window.clearTimeout(timeoutId)
    })
    this.activeTimeouts.clear()
  }

  clearMedicationReminders(medicationId: string): void {
    const keysToDelete: string[] = []
    this.activeTimeouts.forEach((timeoutId, key) => {
      if (key.startsWith(medicationId)) {
        window.clearTimeout(timeoutId)
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => this.activeTimeouts.delete(key))
  }

  async testNotification(): Promise<void> {
    await this.showMedicationReminder('test-123', 'Test Medicine', '10mg', '12:00')
  }

  // Emergency notification for missed medications
  async showMissedMedicationAlert(medicationName: string, timesMissed: number): Promise<void> {
    if (this.permission !== 'granted') return

    await this.playGentleChime()
    
    const notification = new Notification(`⚠️ Medication Check`, {
      body: `You might have missed ${medicationName}. Please check your medication schedule.`,
      icon: '/icon-192.png',
      tag: `missed-${medicationName}`,
      requireInteraction: true,
      data: { url: '/medications' }
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
      window.location.href = '/medications'
    }
  }
}