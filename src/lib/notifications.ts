"use client";

import { emergencyEscalationService } from "./emergency-escalation";

interface MedicationSchedule {
  id: string;
  name: string;
  dosage: string;
  time?: string;
  times?: string[];
  scheduledTime?: string;
  reminderTime?: string;
  timezone?: string;
  reminderMinutesBefore?: number;
}

interface NotificationState {
  permission: NotificationPermission;
  isEnabled: boolean;
  scheduledReminders: Map<string, number>;
  lastTestTime: number;
  missedMedicationTimers: Map<string, number>;
  timezone: string;
}

class MediCareNotificationService {
  private state: NotificationState = {
    permission: "default",
    isEnabled: false,
    scheduledReminders: new Map(),
    lastTestTime: 0,
    missedMedicationTimers: new Map(),
    timezone: "Asia/Kolkata",
  };

  public clearRemindersForMedication(medicationId: string): void {
    if (typeof window === "undefined") return;

    console.log(` Clearing all reminders for medication: ${medicationId}`);

    let remindersCleared = 0;
    let missedTimersCleared = 0;
    this.state.scheduledReminders.forEach((timeoutId, key) => {
      if (key.startsWith(medicationId)) {
        clearTimeout(timeoutId);
        this.state.scheduledReminders.delete(key);
        remindersCleared++;
        console.log(`  Cleared reminder: ${key}`);
      }
    });
    this.state.missedMedicationTimers.forEach((timerId, key) => {
      if (key.includes(medicationId)) {
        clearTimeout(timerId);
        this.state.missedMedicationTimers.delete(key);
        missedTimersCleared++;
        console.log(` Cleared missed timer: ${key}`);
      }
    });

    emergencyEscalationService.medicationTaken(medicationId);

    console.log(
      ` Cleared ${remindersCleared} reminders and ${missedTimersCleared} missed timers for ${medicationId}`
    );
  }

  private createNotificationTone: (() => void) | null = null;
  private initialized: boolean = false;

  private initialize() {
    if (this.initialized || typeof window === "undefined") return;

    this.initialized = true;
    this.initializeAudio();
    this.checkBrowserSupport();
    this.detectTimezone();
    console.log(
      `🔔 Notification service initialized with timezone: ${this.state.timezone}`
    );
  }

  private detectTimezone() {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log(`⏰ Detected timezone: ${userTimezone}`);

      if (userTimezone === "Asia/Kolkata" || userTimezone === "Asia/Calcutta") {
        this.state.timezone = "Asia/Kolkata";
        console.log("✅ Using IST timezone");
      } else {
        console.log(
          `ℹ️ User timezone (${userTimezone}) differs from IST, using user timezone`
        );
        this.state.timezone = userTimezone;
      }
    } catch (error) {
      console.warn("⚠️ Timezone detection failed using IST default");
      this.state.timezone = "Asia/Kolkata";
    }
  }

  private initializeAudio() {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      this.createNotificationTone = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(
          600,
          audioContext.currentTime + 0.1
        );

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          0.2,
          audioContext.currentTime + 0.05
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      };
    } catch (error) {
      console.warn("⚠️ Audio initialization failed:", error);
      this.createNotificationTone = () => {
        console.log("🔔 *Gentle notification beep*");
      };
    }
  }

  private checkBrowserSupport(): boolean {
    if (typeof window === "undefined") return false;

    if (!("Notification" in window)) {
      console.error("❌ Browser does not support notifications");
      return false;
    }

    return true;
  }

  async requestPermission(): Promise<boolean> {
    this.initialize();

    if (typeof window === "undefined") {
      console.warn("⚠️ Not in browser environment");
      return false;
    }

    console.log("🔔 Requesting notification permission...");

    if (!this.checkBrowserSupport()) {
      throw new Error("Notifications not supported in this browser");
    }

    try {
      const permission = await Notification.requestPermission();
      this.state.permission = permission;

      console.log("📝 Permission result:", permission);

      if (permission === "granted") {
        this.state.isEnabled = true;
        console.log("✅ Notifications enabled successfully");
        await this.showTestNotification();
        return true;
      } else {
        console.log(
          "⚠️ Notification permission denied, will use console logs only"
        );
        return false;
      }
    } catch (error) {
      console.error("❌ Permission request failed:", error);
      console.log("ℹ️ Using console notifications only");
      return false;
    }
  }

  private async showTestNotification(): Promise<void> {
    if (typeof window === "undefined") return;

    const now = Date.now();

    if (now - this.state.lastTestTime < 3000) {
      console.log("⏳ Test notification rate limited");
      return;
    }

    this.state.lastTestTime = now;
    const currentIST = this.getCurrentIST();

    try {
      if (this.state.permission === "granted") {
        const notification = new Notification(
          "✅ MediCare Test - IST Enabled",
          {
            body: `Notification system working! Current IST time: ${currentIST}`,
            icon: this.createPillIcon(),
            tag: "test-notification",
            requireInteraction: false,
            silent: false,
          }
        );

        setTimeout(() => {
          notification.close();
        }, 5000);

        this.playNotificationSound();
        console.log("✅ Test notification sent successfully with IST time");
      } else {
        console.log(
          `ℹ️ Test: Notifications not permitted - using console only`
        );
      }
    } catch (error) {
      console.warn("⚠️ Browser notification failed:", error);
      console.log(`ℹ️ Console notification: MediCare test at ${currentIST}`);
      this.playNotificationSound();
    }
  }

  scheduleReminders(medications: MedicationSchedule[]): void {
    this.initialize();

    if (typeof window === "undefined") return;

    console.log(
      `📅 Scheduling ${medications.length} medication reminders for ${this.state.timezone}`
    );
    this.clearAllReminders();

    medications.forEach((medication) => {
      this.scheduleSingleReminder(medication);
    });

    console.log(`✅ ${this.state.scheduledReminders.size} reminders scheduled`);
    this.logScheduleSummary();
  }

  private scheduleSingleReminder(medication: MedicationSchedule): void {
    if (typeof window === "undefined") return;

    try {
      console.log("📋 Scheduling medication:", medication);

      let timeData =
        medication.times ||
        medication.time ||
        medication.scheduledTime ||
        medication.reminderTime;

      if (!timeData) {
        console.warn(
          `⚠️ No time field found for ${medication.name}. Available fields:`,
          Object.keys(medication)
        );
        return;
      }

      let timeStrings: string[] = [];

      if (Array.isArray(timeData)) {
        timeStrings = timeData.filter(
          (time) => time && typeof time === "string"
        );
      } else if (typeof timeData === "string") {
        timeStrings = timeData
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      } else {
        console.warn(
          `⚠️ Invalid time format for ${medication.name}:`,
          timeData
        );
        return;
      }

      if (timeStrings.length === 0) {
        console.warn(`⚠️ No valid times found for ${medication.name}`);
        return;
      }

      console.log(
        `📝 Found ${timeStrings.length} time slots for ${medication.name}:`,
        timeStrings
      );

      timeStrings.forEach((timeString) => {
        this.scheduleTimeSlot(medication, timeString);
      });
    } catch (error) {
      console.error(
        `❌ Failed to schedule reminder for ${medication.name}:`,
        error
      );
    }
  }

  private scheduleTimeSlot(
    medication: MedicationSchedule,
    timeString: string
  ): void {
    try {
      let cleanTime = timeString.trim();

      if (!cleanTime.includes(":")) {
        if (/^\d{1,2}$/.test(cleanTime)) {
          cleanTime = cleanTime.padStart(2, "0") + ":00";
        } else if (/^\d{3,4}$/.test(cleanTime)) {
          cleanTime = cleanTime.padStart(4, "0");
          cleanTime = cleanTime.slice(0, 2) + ":" + cleanTime.slice(2);
        }
      }

      const [hours, minutes] = cleanTime.split(":").map(Number);

      if (
        isNaN(hours) ||
        isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        console.warn(
          `⚠️ Invalid time values for ${medication.name}: ${cleanTime}`
        );
        return;
      }

      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);

      if (targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
        console.log(
          `⏭️ Time ${hours}:${minutes} has passed today, scheduling for tomorrow`
        );
      } else {
        console.log(`⏰ Time ${hours}:${minutes} is later today`);
      }

      const timeUntilReminder = targetTime.getTime() - now.getTime();
      const minutesUntil = Math.round(timeUntilReminder / (1000 * 60));

      console.log(
        `📍 ${medication.name} at ${cleanTime} (${
          this.state.timezone
        }): reminder in ${minutesUntil} minutes (${targetTime.toLocaleString(
          "en-IN",
          { timeZone: this.state.timezone }
        )})`
      );

      // Schedule the medication reminder
      const timeoutId = window.setTimeout(() => {
        console.log(`🔔 REMINDER TIME: ${medication.name} at ${cleanTime}`);
        this.showMedicationReminder(medication, cleanTime);

        // Schedule missed medication check IMMEDIATELY after reminder
        this.scheduleMissedMedicationCheck(medication, cleanTime, targetTime);

        // Reschedule for next day
        setTimeout(() => {
          this.scheduleTimeSlot(medication, timeString);
        }, 1000);
      }, timeUntilReminder);

      const reminderKey = `${medication.id}-${cleanTime}`;
      this.state.scheduledReminders.set(reminderKey, timeoutId);
      console.log(`✅ Scheduled reminder: ${reminderKey}`);
    } catch (error) {
      console.error(
        `❌ Failed to schedule time slot ${timeString} for ${medication.name}:`,
        error
      );
    }
  }

  private scheduleMissedMedicationCheck(
    medication: MedicationSchedule,
    timeSlot: string,
    scheduledTime: Date
  ): void {
    // const missedCheckDelay = 15 * 60 * 1000; // 15 minutes
    const missedCheckDelay = 2 * 60 * 1000; // 2 minutesy
    const checkTime = scheduledTime.getTime() + missedCheckDelay;
    const now = Date.now();

    if (checkTime <= now) {
      console.log(
        `⏭️ Skipping missed check for past time: ${medication.name} at ${timeSlot}`
      );
      return;
    }

    const timeUntilCheck = checkTime - now;
    console.log(
      `⏰ Scheduling missed check for ${
        medication.name
      } at ${timeSlot} in ${Math.round(timeUntilCheck / 1000 / 60)} minutes`
    );

    const missedTimerId = window.setTimeout(async () => {
      console.log(
        `🔍 CHECKING: Did user take ${medication.name} at ${timeSlot}?`
      );

      const wasTaken = await this.checkMedicationStatus(
        medication.id,
        timeSlot,
        scheduledTime
      );

      if (!wasTaken) {
        console.log(`⚠️ MEDICATION MISSED: ${medication.name} at ${timeSlot}`);
        console.log(`🚨 Starting emergency escalation for ${medication.name}`);

        try {
          emergencyEscalationService.reportMissedMedication(
            medication.id,
            medication.name,
            medication.dosage || "1 dose",
            timeSlot
          );
          console.log(`✅ Emergency escalation started for ${medication.name}`);
        } catch (error) {
          console.error("❌ Failed to trigger emergency escalation:", error);
        }
      } else {
        console.log(
          `✅ Medication confirmed taken: ${medication.name} at ${timeSlot}`
        );
      }
    }, timeUntilCheck);

    const missedKey = `missed-${medication.id}-${timeSlot}`;
    this.state.missedMedicationTimers.set(missedKey, missedTimerId);
    console.log(`✅ Scheduled missed check: ${missedKey}`);
  }

  private async checkMedicationStatus(
    medicationId: string,
    timeSlot: string,
    scheduledTime: Date
  ): Promise<boolean> {
    try {
      // Convert scheduledTime to date string (YYYY-MM-DD)
      const dateString = scheduledTime.toISOString().split("T")[0];

      console.log(
        ` Checking medication status: ${medicationId} at ${timeSlot} on ${dateString}`
      );

      const queryParams = new URLSearchParams({
        medicationId: medicationId,
        date: dateString,
        time: timeSlot,
        status: "TAKEN",
      });

      const response = await fetch(
        `/api/medication-logs?${queryParams.toString()}`
      );

      if (response.ok) {
        const logs = await response.json();
        console.log(`📋 Found ${logs.length} logs for ${medicationId}`);

        if (logs.length > 0) {
          const takenLog = logs.find(
            (log: any) =>
              log.status === "TAKEN" && log.medicationId === medicationId
          );

          if (takenLog) {
            console.log(` Found TAKEN log:`, takenLog.id);
            return true;
          }
        }

        console.log(` No TAKEN log found for ${medicationId} at ${timeSlot}`);
        return false;
      } else {
        console.error(" API error:", response.statusText);
        return false;
      }
    } catch (error) {
      console.error(" Error checking medication status from database:", error);
      return false;
    }
  }

  // 🔧 FIXED: Update in showMedicationReminder() method

  async showMedicationReminder(
    medication: MedicationSchedule,
    timeSlot?: string
  ): Promise<void> {
    this.initialize();

    if (typeof window === "undefined") return;

    console.log(
      `🔔 Showing reminder for ${medication.name} at ${timeSlot || "now"}`
    );

    const currentTime = this.getCurrentIST();
    const title = "💊 Medication Time!";
    const body = timeSlot
      ? `Time to take ${medication.name} (${medication.dosage}) - Scheduled for ${timeSlot}`
      : `Time to take ${medication.name} (${medication.dosage}) - Current time: ${currentTime}`;

    try {
      const hasPermission =
        typeof Notification !== "undefined" &&
        Notification.permission === "granted";

      if (hasPermission) {
        const notification = new Notification(title, {
          body: body,
          icon: this.createPillIcon(),
          tag: `medication-${medication.id}${timeSlot ? "-" + timeSlot : ""}`,
          requireInteraction: true,
          silent: false,
          data: {
            medicationId: medication.id,
            timeSlot: timeSlot || "",
            scheduledTime: new Date().toISOString(),
          },
        });

        // 🔧 FIX: Capture timeSlot in a constant BEFORE the onclick
        const capturedTimeSlot = timeSlot;

        notification.onclick = async () => {
          console.log(
            ` User clicked notification for ${medication.name} at ${
              capturedTimeSlot || "unknown"
            }`
          );

          // 🔧 FIX: Pass capturedTimeSlot instead of timeSlot
          await this.markMedicationTaken(medication.id, capturedTimeSlot);
          notification.close();

          if (window) {
            window.focus();
          }
        };

        setTimeout(() => {
          notification.close();
        }, 30000);

        this.playNotificationSound();
        console.log(`✅ Browser notification shown for ${medication.name}`);
      } else {
        console.log(`\n${"=".repeat(50)}`);
        console.log(` MEDICATION REMINDER`);
        console.log(`${"=".repeat(50)}`);
        console.log(`Medicine: ${medication.name}`);
        console.log(`Dosage: ${medication.dosage}`);
        console.log(`Time: ${timeSlot || currentTime}`);
        console.log(`${"=".repeat(50)}\n`);

        this.playNotificationSound();
        this.createVisualNotification(medication, timeSlot);
      }
    } catch (error) {
      console.warn(" Notification error:", error);
      console.log(
        ` REMINDER: ${medication.name} (${medication.dosage}) at ${
          timeSlot || currentTime
        }`
      );
      this.playNotificationSound();
      this.createVisualNotification(medication, timeSlot);
    }
  }

  private createVisualNotification(
    medication: MedicationSchedule,
    timeSlot?: string
  ): void {
    if (typeof window === "undefined") return;

    const existing = document.getElementById("medicare-notification-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "medicare-notification-overlay";

    // 🔧 FIX: Store timeSlot in data attribute
    overlay.setAttribute("data-medication-id", medication.id);
    overlay.setAttribute("data-time-slot", timeSlot || "");

    overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    z-index: 10000;
    min-width: 300px;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;

    const content = `
    <div style="display: flex; align-items: start; gap: 15px;">
      <div style="font-size: 32px;">💊</div>
      <div style="flex: 1;">
        <div style="font-weight: bold; font-size: 18px; margin-bottom: 8px;">
          Medication Time!
        </div>
        <div style="font-size: 14px; margin-bottom: 4px;">
          ${medication.name} (${medication.dosage})
        </div>
        <div style="font-size: 12px; opacity: 0.9;">
          Scheduled: ${timeSlot || this.getCurrentIST()}
        </div>
        <button 
          id="medicare-notification-dismiss"
          style="
            margin-top: 12px;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            width: 100%;
          "
        >
          ✓ I'll take it now
        </button>
      </div>
      <button 
        id="medicare-notification-close"
        style="
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 20px;
          padding: 0;
          width: 24px;
          height: 24px;
        "
      >
        ×
      </button>
    </div>
  `;

    overlay.innerHTML = content;

    const style = document.createElement("style");
    style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
    document.head.appendChild(style);

    document.body.appendChild(overlay);

    const autoClose = setTimeout(() => {
      if (overlay.parentNode) {
        overlay.style.animation = "slideIn 0.3s ease-out reverse";
        setTimeout(() => overlay.remove(), 300);
      }
    }, 30000);

    const closeBtn = document.getElementById("medicare-notification-close");
    const dismissBtn = document.getElementById("medicare-notification-dismiss");

    const removeNotification = () => {
      clearTimeout(autoClose);
      overlay.style.animation = "slideIn 0.3s ease-out reverse";
      setTimeout(() => overlay.remove(), 300);
    };

    closeBtn?.addEventListener("click", removeNotification);

    // 🔧 FIX: Get timeSlot from the overlay's data attribute
    dismissBtn?.addEventListener("click", async () => {
      const savedTimeSlot = overlay.getAttribute("data-time-slot") || undefined;
      const medId = overlay.getAttribute("data-medication-id") || medication.id;

      console.log(
        `👆 Dismiss clicked for ${medId} at ${savedTimeSlot || "current time"}`
      );

      // 🔧 FIX: Pass the savedTimeSlot
      await this.markMedicationTaken(medId, savedTimeSlot);
      removeNotification();
    });

    console.log(
      ` Visual notification displayed for ${medication.name} at ${
        timeSlot || "now"
      }`
    );
  }

  async markMedicationTaken(
    medicationId: string,
    timeSlot?: string
  ): Promise<void> {
    console.log(
      ` Medication ${medicationId} marked as taken${
        timeSlot ? " at " + timeSlot : " (no timeSlot provided)"
      }`
    );

    // Cancel the missed medication timer
    const missedKey = timeSlot
      ? `missed-${medicationId}-${timeSlot}`
      : medicationId;
    const missedTimerId = this.state.missedMedicationTimers.get(missedKey);
    if (missedTimerId) {
      clearTimeout(missedTimerId);
      this.state.missedMedicationTimers.delete(missedKey);
      console.log(` Cancelled missed medication check for ${medicationId}`);
    }

    // Save to database
    try {
      const now = new Date();
      let scheduledFor: Date;

      if (timeSlot) {
        const [hours, minutes] = timeSlot.split(":").map(Number);
        scheduledFor = new Date();
        scheduledFor.setHours(hours, minutes, 0, 0);
        console.log(
          `📅 Using scheduled time: ${timeSlot} (${scheduledFor.toISOString()})`
        );
      } else {
        // Fallback: use current time (not ideal, but better than nothing)
        scheduledFor = now;
        console.warn(
          ` No timeSlot provided, using current time: ${scheduledFor.toISOString()}`
        );
      }

      const logData = {
        medicationId: medicationId,
        scheduledFor: scheduledFor.toISOString(),
        status: "TAKEN",
        notes: "Marked as taken via notification",
      };

      console.log(" Saving medication log to database:", logData);

      const response = await fetch("/api/medication-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logData),
      });

      if (response.ok) {
        const savedLog = await response.json();
        console.log(" Medication log saved successfully:", savedLog.id);
      } else {
        const errorData = await response.json();
        console.error(" Failed to save medication log:", errorData);
      }
    } catch (error) {
      console.error(" Error saving medication log to database:", error);
    }

    // Notify emergency escalation service
    emergencyEscalationService.medicationTaken(medicationId);
    console.log(
      ` Notified escalation service: medication ${medicationId} taken`
    );
  }

  private playNotificationSound(): void {
    if (typeof window === "undefined") return;

    try {
      if (this.createNotificationTone) {
        this.createNotificationTone();
        console.log("🔊 Playing notification sound");
      }
    } catch (error) {
      console.warn("⚠️ Audio notification failed:", error);
    }
  }

  private createPillIcon(): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="pillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect x="20" y="40" width="60" height="20" rx="10" fill="url(#pillGradient)"/>
      <rect x="30" y="35" width="40" height="30" rx="15" fill="#60a5fa"/>
      <circle cx="45" cy="50" r="3" fill="white"/>
      <circle cx="55" cy="50" r="3" fill="white"/>
    </svg>`;

    try {
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    } catch (error) {
      return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }
  }

  clearAllReminders(): void {
    if (typeof window === "undefined") return;

    this.state.scheduledReminders.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.state.scheduledReminders.clear();

    this.state.missedMedicationTimers.forEach((timerId) => {
      clearTimeout(timerId);
    });
    this.state.missedMedicationTimers.clear();

    console.log("🧹 All reminders and escalation timers cleared");
  }

  public getCurrentIST(): string {
    return new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  public formatTimeForIST(timeString: string): string {
    try {
      const [hours, minutes] = timeString.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);

      return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (error) {
      return timeString;
    }
  }

  public logScheduleSummary(): void {
    console.log("\n📊 MEDICATION SCHEDULE SUMMARY");
    console.log("=====================================");
    console.log(
      `Current time (${this.state.timezone}): ${this.getCurrentIST()}`
    );
    console.log(`Active reminders: ${this.state.scheduledReminders.size}`);
    console.log(
      `Missed medication timers: ${this.state.missedMedicationTimers.size}`
    );

    if (this.state.scheduledReminders.size > 0) {
      console.log("\n📅 Scheduled reminders:");
      this.state.scheduledReminders.forEach((timerId, key) => {
        console.log(`   ${key} (Timer ID: ${timerId})`);
      });
    }

    if (this.state.missedMedicationTimers.size > 0) {
      console.log("\n⏰ Missed medication checks:");
      this.state.missedMedicationTimers.forEach((timerId, key) => {
        console.log(`   ${key} (Timer ID: ${timerId})`);
      });
    }

    console.log("=====================================\n");
  }

  async enableNotifications(): Promise<boolean> {
    return await this.requestPermission();
  }

  async testNotifications(): Promise<void> {
    if (this.state.permission !== "granted") {
      const granted = await this.requestPermission();
      if (!granted) return;
    }
    await this.showTestNotification();
  }

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
    return this.state.isEnabled && this.state.permission === "granted";
  }

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
export const notificationService =
  typeof window !== "undefined" ? getNotificationService() : null;

export const NotificationService = {
  getInstance: () => getNotificationService(),
};

export default typeof window !== "undefined" ? getNotificationService() : null;
