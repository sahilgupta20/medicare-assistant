// lib/emergency-escalation.ts
"use client";

import { toast } from "sonner";

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  relationship: "daughter" | "son" | "spouse" | "caregiver" | "other";
  isEmergencyContact: boolean;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    pushNotification: boolean;
    quietHours: {
      start: string;
      end: string;
    };
    preferred_method?: string;
    daily_summary?: boolean;
    missed_medication?: boolean;
    emergency_only?: boolean;
  };
}

interface MissedMedication {
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  missedAt: Date;
  attemptCount: number;
  lastReminderAt?: Date;
}

interface EscalationLevel {
  level: number;
  name: string;
  delayMinutes: number;
  actions: string[];
  recipients: ("primary" | "emergency" | "all")[];
}

class EmergencyEscalationService {
  private missedMedications = new Map<string, MissedMedication>();
  private escalationTimers = new Map<string, number>();
  private familyMembers: FamilyMember[] = [];

  private escalationLevels: EscalationLevel[] = [
    {
      level: 1,
      name: "Gentle Reminder",
      delayMinutes: 0.25,
      actions: ["gentle_notification", "audio_reminder"],
      recipients: [],
    },
    {
      level: 2,
      name: "Firm Reminder",
      delayMinutes: 0.5,
      actions: ["firm_notification", "louder_audio", "screen_flash"],
      recipients: [],
    },
    {
      level: 3,
      name: "Family Alert",
      delayMinutes: 1,
      actions: ["family_notification", "email_alert"],
      recipients: ["primary"],
    },
    {
      level: 4,
      name: "Emergency Escalation",
      delayMinutes: 1.5,
      actions: ["emergency_notification", "phone_call", "sms_alert"],
      recipients: ["emergency", "all"],
    },
  ];

  constructor() {
    this.familyMembers = [];
    console.log("✅ Emergency escalation service initialized");
  }

  private async loadFamilyMembersFromDatabase(): Promise<FamilyMember[]> {
    try {
      console.log("📥 Loading family members from database...");
      const response = await fetch("/api/family-members");

      if (response.ok) {
        const members = await response.json();
        console.log("Raw database members:", members);

        if (members && members.length > 0) {
          const mappedMembers = members.map((member: any) => {
            let preferences;
            try {
              preferences =
                typeof member.notificationPreferences === "string"
                  ? JSON.parse(member.notificationPreferences)
                  : member.notificationPreferences;
            } catch (e) {
              preferences = {
                email: true,
                sms: true,
                pushNotification: true,
                quietHours: { start: "22:00", end: "07:00" },
              };
            }

            return {
              id: member.id,
              name: member.name,
              email: member.email,
              phone: member.phone,
              relationship: member.relationship.toLowerCase(),
              isEmergencyContact: member.isEmergencyContact,
              notificationPreferences: preferences,
            };
          });

          console.log(
            "✅ Successfully loaded family members:",
            mappedMembers.map((m: any) => m.name)
          );
          return mappedMembers;
        }
      }
    } catch (error) {
      console.error("❌ Error loading family members:", error);
    }

    console.log("⚠️ No family members found in database");
    return [];
  }

  public async testEscalation() {
    console.log("🧪 Testing escalation with database family members...");
    await this.reportMissedMedication(
      "test-med-123",
      "Blood Pressure Medicine",
      "10mg",
      "08:00"
    );
  }

  private async createEmergencyAlert(
    medicationId: string,
    medicationName: string,
    severity: string,
    message: string,
    level: number
  ) {
    try {
      const response = await fetch("/api/emergency-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId,
          medicationName,
          alertType: "missed_dose",
          severity,
          message,
          escalationLevel: level,
        }),
      });

      if (response.ok) {
        const alert = await response.json();
        console.log("✅ Emergency alert created in database:", alert.id);
        return alert;
      }
    } catch (error) {
      console.error("❌ Failed to create emergency alert:", error);
    }
  }

  async reportMissedMedication(
    medicationId: string,
    medicationName: string,
    dosage: string,
    scheduledTime: string
  ) {
    console.log(`⚠️ Medication missed: ${medicationName} at ${scheduledTime}`);

    const missedMed: MissedMedication = {
      medicationId,
      medicationName,
      dosage,
      scheduledTime,
      missedAt: new Date(),
      attemptCount: 0,
    };

    this.missedMedications.set(medicationId, missedMed);
    await this.startEscalation(medicationId);
  }

  private async startEscalation(medicationId: string) {
    const missedMed = this.missedMedications.get(medicationId);
    if (!missedMed) return;

    console.log(`🚀 Starting escalation for ${missedMed.medicationName}`);
    await this.executeEscalationLevel(medicationId, 1);
  }

  private async executeEscalationLevel(medicationId: string, level: number) {
    const missedMed = this.missedMedications.get(medicationId);
    const escalationLevel = this.escalationLevels[level - 1];

    if (!missedMed || !escalationLevel) return;

    console.log(
      `📢 Executing escalation level ${level}: ${escalationLevel.name} for ${missedMed.medicationName}`
    );

    missedMed.attemptCount = level;
    missedMed.lastReminderAt = new Date();

    // Create database alert
    await this.createEmergencyAlert(
      missedMed.medicationId,
      missedMed.medicationName,
      escalationLevel.level >= 3 ? "high" : "medium",
      `${missedMed.medicationName} missed at ${missedMed.scheduledTime}`,
      level
    );

    // Execute all actions for this level
    for (const action of escalationLevel.actions) {
      await this.executeAction(action, missedMed);
    }

    // Notify family if needed
    if (escalationLevel.recipients.length > 0) {
      await this.notifyFamily(missedMed, escalationLevel);
    }

    // 🔧 FIX: Schedule next level IMMEDIATELY, don't wait for user interaction
    if (level < this.escalationLevels.length) {
      const nextLevel = this.escalationLevels[level];
      const delayMs = nextLevel.delayMinutes * 60 * 1000;

      console.log(
        `⏰ Next escalation level ${level + 1} scheduled in ${
          nextLevel.delayMinutes
        } minutes`
      );

      const timerId = window.setTimeout(() => {
        if (this.missedMedications.has(medicationId)) {
          console.log(`⏰ Timer fired: Moving to level ${level + 1}`);
          this.executeEscalationLevel(medicationId, level + 1);
        }
      }, delayMs);

      this.escalationTimers.set(medicationId, timerId);
    }
  }

  private async executeAction(action: string, missedMed: MissedMedication) {
    console.log(
      `🎯 Executing action: ${action} for ${missedMed.medicationName}`
    );

    switch (action) {
      case "gentle_notification":
        await this.showGentleReminder(missedMed);
        break;
      case "firm_notification":
        await this.showFirmReminder(missedMed);
        break;
      case "audio_reminder":
        await this.playGentleAudio();
        break;
      case "louder_audio":
        await this.playLouderAudio();
        break;
      case "screen_flash":
        await this.flashScreen();
        break;
      case "family_notification":
        break;
      case "emergency_notification":
        await this.showEmergencyNotification(missedMed);
        break;
      case "phone_call":
        await this.initiatePhoneCall(missedMed);
        break;
      case "sms_alert":
        await this.sendSMSAlert(missedMed);
        break;
      case "email_alert":
        await this.sendEmailAlert(missedMed);
        break;
    }
  }

  private async notifyFamily(
    missedMed: MissedMedication,
    escalationLevel: EscalationLevel
  ) {
    console.log(
      `👨‍👩‍👧‍👦 Notifying family members for escalation level ${escalationLevel.level}`
    );

    const familyMembers = await this.loadFamilyMembersFromDatabase();
    console.log(
      "Active family members for notifications:",
      familyMembers.map((m) => `${m.name} (${m.email})`)
    );

    const recipients = this.getFamilyRecipients(
      escalationLevel.recipients,
      familyMembers
    );
    console.log(
      "Notification recipients:",
      recipients.map((r) => r.name)
    );

    for (const member of recipients) {
      if (this.isInQuietHours(member)) {
        console.log(
          `🔇 Skipping notification to ${member.name} due to quiet hours`
        );
        continue;
      }

      await this.sendRealNotification(member, missedMed, escalationLevel);
    }
  }

  private async sendRealNotification(
    member: any,
    missedMed: MissedMedication,
    escalationLevel: EscalationLevel
  ) {
    try {
      const message = this.createFamilyMessage(
        member,
        missedMed,
        escalationLevel
      );

      console.log(
        `📧 Sending notification to ${member.name} at ${member.email}`
      );

      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyMember: member,
          message,
          urgency: escalationLevel.level >= 3 ? "high" : "medium",
          medicationDetails: {
            name: missedMed.medicationName,
            dosage: missedMed.dosage,
            scheduledTime: missedMed.scheduledTime,
            status: "missed",
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Notification sent to ${member.name}:`, result);
      }
    } catch (error) {
      console.error(`❌ Failed to send notification to ${member.name}:`, error);
    }
  }

  private getFamilyRecipients(
    recipientTypes: ("primary" | "emergency" | "all")[],
    familyMembers: any[]
  ): any[] {
    let recipients: any[] = [];

    for (const type of recipientTypes) {
      switch (type) {
        case "primary":
          const primary = familyMembers.find((m) => m.isEmergencyContact);
          if (primary) recipients.push(primary);
          break;
        case "emergency":
          recipients.push(...familyMembers.filter((m) => m.isEmergencyContact));
          break;
        case "all":
          recipients.push(...familyMembers);
          break;
      }
    }

    return recipients.filter(
      (member, index, arr) => arr.findIndex((m) => m.id === member.id) === index
    );
  }

  private isInQuietHours(member: FamilyMember): boolean {
    if (!member || !member.notificationPreferences) {
      return false;
    }
    const quietHours = member.notificationPreferences?.quietHours || {
      start: "22:00",
      end: "07:00",
    };
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const quietStart = this.timeStringToNumber(quietHours.start);
    const quietEnd = this.timeStringToNumber(quietHours.end);

    if (quietStart > quietEnd) {
      return currentTime >= quietStart || currentTime <= quietEnd;
    } else {
      return currentTime >= quietStart && currentTime <= quietEnd;
    }
  }

  private timeStringToNumber(timeString: string): number {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 100 + minutes;
  }

  private createFamilyMessage(
    member: FamilyMember,
    missedMed: MissedMedication,
    escalationLevel: EscalationLevel
  ): string {
    const relationship = member.relationship === "daughter" ? "Papa" : "Dad";
    const urgency = escalationLevel.level >= 3 ? "🚨 URGENT: " : "💊 ";

    return `${urgency}${relationship} missed his ${missedMed.medicationName} (${missedMed.dosage}) at ${missedMed.scheduledTime}. This is attempt #${missedMed.attemptCount}. Please check on him.`;
  }

  // 🔧 FIX: Use NON-BLOCKING notifications with AUTO-CLOSE
  private async showGentleReminder(missedMed: MissedMedication) {
    if (typeof window === "undefined") return;

    const message = `💊 Gentle reminder: Please take your ${missedMed.medicationName} (${missedMed.dosage})`;
    console.log("🔔", message);

    try {
      if (Notification.permission === "granted") {
        const notification = new Notification("Medication Reminder", {
          body: message,
          icon: "/icon-192.png",
          tag: `gentle-${missedMed.medicationId}`,
          requireInteraction: false,
        });

        // Auto-close after 30 seconds
        setTimeout(() => {
          notification.close();
        }, 30000);
      }
    } catch (error) {
      console.warn("Gentle reminder notification failed:", error);
    }
    toast.info(`💊 ${missedMed.medicationName}`, {
      description: `Time to take your ${missedMed.dosage}`,
      duration: 30000,
    });
  }

  private async showFirmReminder(missedMed: MissedMedication) {
    if (typeof window === "undefined") return;

    const message = `⚠️ IMPORTANT: You missed your ${missedMed.medicationName}. Please take it now!`;
    console.log("🔔", message);

    try {
      if (Notification.permission === "granted") {
        const notification = new Notification("MISSED MEDICATION", {
          body: message,
          icon: "/icon-192.png",
          tag: `firm-${missedMed.medicationId}`,
          requireInteraction: false, // Changed to false so it can auto-close
        });

        // Auto-close after 30 seconds
        setTimeout(() => {
          notification.close();
        }, 30000);
      }
    } catch (error) {
      console.warn("Firm reminder notification failed:", error);
    }
    toast.warning(`⚠️ MISSED: ${missedMed.medicationName}`, {
      description: `Please take your ${missedMed.dosage} now!`,
      duration: 30000,
    });
  }

  private async showEmergencyNotification(missedMed: MissedMedication) {
    if (typeof window === "undefined") return;

    const message = `🚨 URGENT: Multiple missed medications detected. Family has been notified. Please take ${missedMed.medicationName} immediately!`;
    console.log("🚨", message);

    try {
      if (Notification.permission === "granted") {
        const notification = new Notification("EMERGENCY ALERT", {
          body: message,
          icon: "/icon-192.png",
          tag: `emergency-${missedMed.medicationId}`,
          requireInteraction: false, // Changed to false so it can auto-close
        });

        // Auto-close after 45 seconds (longer for emergency)
        setTimeout(() => {
          notification.close();
        }, 45000);
      }
    } catch (error) {
      console.warn("Emergency notification failed:", error);
    }
    toast.error(`🚨 URGENT: ${missedMed.medicationName}`, {
      description: `Family notified. Please take ${missedMed.dosage} immediately!`,
      duration: 45000,
    });
  }

  private async playGentleAudio() {
    console.log("🔊 Playing gentle audio reminder");
  }

  private async playLouderAudio() {
    console.log("🔊 Playing louder audio reminder");
  }

  private async flashScreen() {
    if (typeof window === "undefined") return;
    console.log("⚡ Flashing screen for attention");

    const flashDiv = document.createElement("div");
    flashDiv.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(255, 0, 0, 0.3); z-index: 9999; pointer-events: none;
      animation: flash 0.5s ease-in-out 3;
    `;

    const style = document.createElement("style");
    style.textContent = `@keyframes flash { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }`;
    document.head.appendChild(style);
    document.body.appendChild(flashDiv);

    setTimeout(() => {
      document.body.removeChild(flashDiv);
      document.head.removeChild(style);
    }, 1500);
  }

  private async initiatePhoneCall(missedMed: MissedMedication) {
    console.log(
      `📞 Initiating emergency phone call for ${missedMed.medicationName}`
    );
  }

  private async sendSMSAlert(missedMed: MissedMedication) {
    console.log(`📱 Sending SMS alerts for ${missedMed.medicationName}`);
  }

  private async sendEmailAlert(missedMed: MissedMedication) {
    console.log(`📧 Sending email alerts for ${missedMed.medicationName}`);
  }

  medicationTaken(medicationId: string) {
    console.log(`✅ Medication taken: ${medicationId}`);
    this.missedMedications.delete(medicationId);

    const timerId = this.escalationTimers.get(medicationId);
    if (timerId) {
      clearTimeout(timerId);
      this.escalationTimers.delete(medicationId);
      console.log(`🚫 Cancelled escalation timer for ${medicationId}`);
    }
  }

  addFamilyMember(member: FamilyMember) {
    this.familyMembers.push(member);
    console.log(`👤 Added family member: ${member.name}`);
  }

  getActiveMissedMedications(): MissedMedication[] {
    return Array.from(this.missedMedications.values());
  }

  getFamilyMembers(): FamilyMember[] {
    return this.familyMembers;
  }
}

export const emergencyEscalationService = new EmergencyEscalationService();

export function integrateMedicationTracking() {
  console.log("✅ Emergency escalation system ready for integration");
}

//  Expose to window for testing in browser console
if (typeof window !== "undefined") {
  (window as any).testEscalation = () => {
    console.log(" Starting escalation test from console...");
    emergencyEscalationService.testEscalation();
  };
  (window as any).escalationService = emergencyEscalationService;
  console.log(
    " Test functions available: window.testEscalation() or window.escalationService"
  );
}
