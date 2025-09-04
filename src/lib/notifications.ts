// Notification service for medication reminders

// Extend the Notification interface to include actions (for browsers that support it)
interface NotificationOptions {
  body?: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  actions?: NotificationAction[]
}

interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export class NotificationService {
  private static instance: NotificationService
  private permission: NotificationPermission = 'default'

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
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

  async showMedicationReminder(medicationName: string, dosage: string, time: string): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) return
    }

    // Basic notification options without actions (for regular notifications)
    const basicNotificationOptions = {
      body: `${medicationName} - ${dosage} at ${time}`,
      icon: '/icon-192.png',
      tag: `medication-${medicationName}-${time}`, // Prevent duplicates
      requireInteraction: true, // Keep notification until user interacts
    }

    // Try to use Service Worker notification first (supports actions)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        if (registration) {
          // Use service worker notification with actions
          await registration.showNotification(`Time for your medicine! ⏰`, {
            ...basicNotificationOptions,
            actions: [
              {
                action: 'taken',
                title: 'I took this'
              },
              {
                action: 'snooze',
                title: 'Remind me in 10 minutes'
              }
            ]
          })
          console.log('✅ Service Worker notification shown with actions')
          return
        }
      } catch (error) {
        console.log('⚠️ Service Worker notification failed, falling back to basic notification')
      }
    }

    // Fallback to basic notification (no actions)
    const notification = new Notification(`Time for your medicine! ⏰`, basicNotificationOptions)

    // Auto-close after 30 seconds if not interacted with
    setTimeout(() => {
      notification.close()
    }, 30000)

    notification.onclick = () => {
      window.focus()
      notification.close()
      // Navigate to medications page
      if (window.location.pathname !== '/medications') {
        window.location.href = '/medications'
      }
    }

    console.log('✅ Basic notification shown (no actions)')
    return Promise.resolve()
  }

  scheduleMedicationReminder(medicationId: string, medicationName: string, dosage: string, time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    const now = new Date()
    const scheduledTime = new Date()
    scheduledTime.setHours(hours, minutes, 0, 0)

    // If the time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    const timeUntilReminder = scheduledTime.getTime() - now.getTime()

    const timeoutId: number = window.setTimeout(() => {
      this.showMedicationReminder(medicationName, dosage, time)
      
      // Schedule for tomorrow
      this.scheduleMedicationReminder(medicationId, medicationName, dosage, time)
    }, timeUntilReminder) as number

    console.log(`Scheduled reminder for ${medicationName} at ${time} (in ${Math.round(timeUntilReminder / 1000 / 60)} minutes)`)
    
    return timeoutId
  }

  cancelReminder(timeoutId: number): void {
    window.clearTimeout(timeoutId)
  }

  async testNotification(): Promise<void> {
    await this.showMedicationReminder('Test Medicine', '10mg', '12:00')
  }
}