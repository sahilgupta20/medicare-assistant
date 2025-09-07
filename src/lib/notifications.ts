// src/lib/notifications.ts - UPDATED with Emergency Escalation Integration
"use client";

import { emergencyEscalationService } from './emergency-escalation';

interface MedicationSchedule {
  id: string;
  name: string;
  dosage: string;
  time?: string;
  times?: string[]; // YOUR DATA USES THIS!
  scheduledTime?: string;
  reminderTime?: string;
  timezone?: string;
}

interface NotificationState {
  permission: NotificationPermission;
  isEnabled: boolean;
  scheduledReminders: Map<string, number>;
  lastTestTime: number;
  missedMedicationTimers: Map<string, number>; // NEW: Track missed medication timers
}

class MediCareNotificationService {
  private state: NotificationState = {
    permission: 'default',
    isEnabled: false,
    scheduledReminders: new Map(),
    lastTestTime: 0,
    missedMedicationTimers: new Map() // NEW
  };

  private createNotificationTone: (() => void) | null = null;
  private initialized: boolean = false;

  private initialize() {
    if (this.initialized || typeof window === 'undefined') return;
    
    this.initialized = true;
    this.initializeAudio();
    this.checkBrowserSupport();
  }

  private initializeAudio() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      this.createNotificationTone = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      };
    } catch (error) {
      console.warn('⚠️ Audio initialization failed:', error);
      this.createNotificationTone = () => {
        console.log('🔊 *Gentle notification beep*');
      };
    }
  }

  private checkBrowserSupport(): boolean {
    if (typeof window === 'undefined') return false;
    
    if (!('Notification' in window)) {
      console.error('❌ Browser does not support notifications');
      return false;
    }

    return true;
  }

  async requestPermission(): Promise<boolean> {
    this.initialize();
    
    if (typeof window === 'undefined') {
      console.warn('⚠️ Not in browser environment');
      return false;
    }

    console.log('🔔 Requesting notification permission...');

    if (!this.checkBrowserSupport()) {
      throw new Error('Notifications not supported in this browser');
    }

    try {
      const permission = await Notification.requestPermission();
      this.state.permission = permission;

      console.log('📋 Permission result:', permission);

      if (permission === 'granted') {
        this.state.isEnabled = true;
        console.log('✅ Notifications enabled successfully');
        await this.showTestNotification();
        return true;
      } else {
        this.showFallbackAlert('Please allow notifications to receive medication reminders.');
        return false;
      }
    } catch (error) {
      console.error('💥 Permission request failed:', error);
      this.showFallbackAlert('Error requesting notification permission. Using alerts instead.');
      return false;
    }
  }

  private async showTestNotification(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const now = Date.now();
    
    if (now - this.state.lastTestTime < 3000) {
      console.log('⏰ Test notification rate limited');
      this.showFallbackAlert('Test notification rate limited. Please wait 3 seconds.');
      return;
    }
    
    this.state.lastTestTime = now;

    try {
      if (this.state.permission === 'granted') {
        const notification = new Notification('🧪 MediCare Test', {
          body: 'Notification system is working! You will receive medication reminders.',
          icon: this.createPillIcon(),
          tag: 'test-notification',
          requireInteraction: false,
          silent: false
        });

        setTimeout(() => {
          notification.close();
        }, 5000);

        this.playNotificationSound();
        console.log('✅ Test notification sent successfully');
      } else {
        throw new Error('Permission not granted');
      }
    } catch (error) {
      console.warn('⚠️ Browser notification failed, using fallback:', error);
      this.showFallbackAlert('🧪 Test Alert: MediCare notifications are working!');
      this.playNotificationSound();
    }
  }

  scheduleReminders(medications: MedicationSchedule[]): void {
    this.initialize();
    
    if (typeof window === 'undefined') return;

    console.log(`📅 Scheduling ${medications.length} medication reminders`);
    this.clearAllReminders();

    medications.forEach(medication => {
      this.scheduleSingleReminder(medication);
    });

    console.log(`✅ ${this.state.scheduledReminders.size} reminders scheduled`);
  }

  // UPDATED: Enhanced medication reminder scheduling with escalation integration
  private scheduleSingleReminder(medication: MedicationSchedule): void {
    if (typeof window === 'undefined') return;

    try {
      console.log('📋 Scheduling medication:', medication);
      
      // Check for 'times' array first (YOUR DATA STRUCTURE)
      let timeData = medication.times || medication.time || medication.scheduledTime || medication.reminderTime;
      
      if (!timeData) {
        console.warn(`⚠️ No time field found for ${medication.name}. Available fields:`, Object.keys(medication));
        return;
      }

      let timeString: string;
      
      // Handle times array (your data uses this!)
      if (Array.isArray(timeData)) {
        if (timeData.length === 0) {
          console.warn(`⚠️ Empty times array for ${medication.name}`);
          return;
        }
        timeString = timeData[0]; // Use first time
        console.log(`📅 Found times array for ${medication.name}:`, timeData);
      } else {
        timeString = timeData;
      }

      if (typeof timeString !== 'string') {
        console.warn(`⚠️ Invalid time format for ${medication.name}:`, timeString);
        return;
      }

      // Handle time formats without colon
      if (!timeString.includes(':')) {
        if (/^\d{1,2}$/.test(timeString)) {
          timeString = timeString.padStart(2, '0') + ':00';
        } else if (/^\d{3,4}$/.test(timeString)) {
          timeString = timeString.padStart(4, '0');
          timeString = timeString.slice(0, 2) + ':' + timeString.slice(2);
        } else {
          console.warn(`⚠️ Cannot parse time format for ${medication.name}:`, timeString);
          return;
        }
      }

      const [hours, minutes] = timeString.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn(`⚠️ Invalid time values for ${medication.name}: ${hours}:${minutes}`);
        return;
      }
      
      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);

      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      const timeUntilReminder = targetTime.getTime() - now.getTime();
      const minutesUntil = Math.round(timeUntilReminder / (1000 * 60));

      console.log(`📅 ${medication.name} scheduled in ${minutesUntil} minutes (${targetTime.toLocaleTimeString()})`);

      // Schedule the medication reminder
      const timeoutId = window.setTimeout(() => {
        this.showMedicationReminder(medication);
        
        // NEW: Schedule missed medication detection
        this.scheduleMissedMedicationCheck(medication, timeString);
        
        // Schedule for next day (recurring)
        this.scheduleSingleReminder(medication);
      }, timeUntilReminder);

      this.state.scheduledReminders.set(medication.id, timeoutId);

    } catch (error) {
      console.error(`❌ Failed to schedule reminder for ${medication.name}:`, error);
    }
  }

  // NEW: Schedule missed medication detection and escalation
  private scheduleMissedMedicationCheck(medication: MedicationSchedule, scheduledTime: string): void {
    const missedCheckDelay = 15 * 60 * 1000; // 15 minutes

    const missedTimerId = window.setTimeout(() => {
      // Check if medication was taken
      if (!this.wasMedicationTaken(medication.id)) {
        console.log(`🚨 Medication missed: ${medication.name} at ${scheduledTime}`);
        
        // Start emergency escalation
        emergencyEscalationService.reportMissedMedication(
          medication.id,
          medication.name,
          medication.dosage || '1 dose',
          scheduledTime
        );
      }
    }, missedCheckDelay);

    this.state.missedMedicationTimers.set(medication.id, missedTimerId);
  }

  // NEW: Check if medication was taken (this should integrate with your tracking system)
  private wasMedicationTaken(medicationId: string): boolean {
    // TODO: Integrate with your medication tracking database
    // For now, return false to trigger escalation in testing
    // In production, this should check your database for recent medication intake
    
    console.log(`🔍 Checking if medication ${medicationId} was taken...`);
    
    // This should query your database for medication intake records
    // from the last 15 minutes for this specific medication
    return false; // Temporarily return false for testing
  }

  async showMedicationReminder(medication: MedicationSchedule): Promise<void> {
    this.initialize();
    
    if (typeof window === 'undefined') return;

    console.log(`💊 Showing reminder for ${medication.name}`);

    const title = '💊 Medication Reminder';
    const body = `Time to take ${medication.name} (${medication.dosage})`;

    try {
      if (this.state.permission === 'granted') {
        const notification = new Notification(title, {
          body: body,
          icon: this.createPillIcon(),
          tag: `medication-${medication.id}`,
          requireInteraction: true,
          silent: false
        });

        notification.onclick = () => {
          console.log(`📱 User clicked notification for ${medication.name}`);
          this.markMedicationTaken(medication.id);
          notification.close();
        };

        this.playNotificationSound();
      } else {
        throw new Error('No notification permission');
      }
    } catch (error) {
      console.warn('⚠️ Browser notification failed for medication reminder:', error);
      this.showFallbackAlert(`💊 MEDICATION TIME!\n\n${medication.name} (${medication.dosage})\n\nTap OK when taken.`);
      this.playNotificationSound();
    }
  }

  // UPDATED: Enhanced medication taken tracking with escalation integration
  markMedicationTaken(medicationId: string): void {
    console.log(`✅ Medication ${medicationId} marked as taken`);
    
    // Clear missed medication timer
    const missedTimerId = this.state.missedMedicationTimers.get(medicationId);
    if (missedTimerId) {
      clearTimeout(missedTimerId);
      this.state.missedMedicationTimers.delete(medicationId);
      console.log(`⏰ Cancelled missed medication check for ${medicationId}`);
    }
    
    // Notify escalation service that medication was taken
    emergencyEscalationService.medicationTaken(medicationId);
    
    // TODO: Update your database with medication intake record
    // This should log to your medication tracking database
  }

  private showFallbackAlert(message: string): void {
    if (typeof window === 'undefined') return;
    
    console.log('🚨 Showing fallback alert:', message);
    alert(message);
  }

  private playNotificationSound(): void {
    if (typeof window === 'undefined') return;
    
    try {
      if (this.createNotificationTone) {
        this.createNotificationTone();
        console.log('🔊 Playing notification sound');
      }
    } catch (error) {
      console.warn('⚠️ Audio notification failed:', error);
    }
  }

  private createPillIcon(): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="20" y="40" width="60" height="20" rx="10" fill="#3b82f6"/><rect x="30" y="35" width="40" height="30" rx="15" fill="#60a5fa"/><circle cx="45" cy="50" r="3" fill="white"/><circle cx="55" cy="50" r="3" fill="white"/></svg>`;
    
    try {
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    } catch (error) {
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }
  }

  clearAllReminders(): void {
    if (typeof window === 'undefined') return;
    
    this.state.scheduledReminders.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.state.scheduledReminders.clear();
    
    // NEW: Clear missed medication timers too
    this.state.missedMedicationTimers.forEach(timerId => {
      clearTimeout(timerId);
    });
    this.state.missedMedicationTimers.clear();
    
    console.log('🧹 All reminders and escalation timers cleared');
  }

  // Public API methods
  async enableNotifications(): Promise<boolean> {
    return await this.requestPermission();
  }

  async testNotifications(): Promise<void> {
    if (this.state.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }
    await this.showTestNotification();
  }

  // Backwards compatibility
  scheduleAllMedicationReminders(medications: MedicationSchedule[]): void {
    this.scheduleReminders(medications);
  }

  async testNotification(): Promise<void> {
    return await this.testNotifications();
  }

  getNotificationState(): NotificationState {
    return { ...this.state };
  }

  isEnabled(): boolean {
    return this.state.isEnabled && this.state.permission === 'granted';
  }

  // NEW: Public method to manually mark medication as taken (for your UI buttons)
  public medicationTaken(medicationId: string): void {
    this.markMedicationTaken(medicationId);
  }
}

// Service instance creation
let serviceInstance: MediCareNotificationService | null = null;

function getNotificationService(): MediCareNotificationService {
  if (!serviceInstance) {
    serviceInstance = new MediCareNotificationService();
  }
  return serviceInstance;
}

// Exports
export const notificationService = typeof window !== 'undefined' ? getNotificationService() : null;

export const NotificationService = {
  getInstance: () => getNotificationService()
};

export default typeof window !== 'undefined' ? getNotificationService() : null;