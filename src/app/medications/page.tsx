"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { AlertTriangle } from "lucide-react";
import {
  ArrowLeft,
  Plus,
  Pill,
  Clock,
  Camera,
  Trash2,
  Edit3,
  CheckCircle2,
  Loader2,
  Bell,
  BellOff,
  Save,
  X,
} from "lucide-react";
import {
  notificationService,
  NotificationService,
} from "../../lib/notifications";
import { emergencyEscalationService } from "../../lib/emergency-escalation";
import VoiceInterface from "../../components/VoiceInterface";
import { voiceInterfaceService } from "../../lib/voice-interface";
import { useSession } from "next-auth/react";

type Medication = {
  id: string;
  name: string;
  dosage: string;
  description?: string;
  times: string | string[];
  color?: string;
  shape?: string;
  photoUrl?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
};

type MedicationFormData = {
  name: string;
  dosage: string;
  description: string;
  color: string;
  shape: string;
  times: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userName] = useState("John");
  const [takenMedications, setTakenMedications] = useState<Set<string>>(
    new Set()
  );
  const [currentIST, setCurrentIST] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const { data: session, status } = useSession();
  const user = session?.user;
  const [editingMedication, setEditingMedication] = useState<Medication | null>(
    null
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<MedicationFormData>({
    name: "",
    dosage: "",
    description: "",
    color: "",
    shape: "",
    times: ["08:00"],
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    isActive: true,
  });

  const getTimesArray = (times: string | string[]): string[] => {
    if (Array.isArray(times)) return times;
    if (typeof times === "string") return times.split(",").map((t) => t.trim());
    return [];
  };

  const getCurrentIST = () => {
    return new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatTimeForIST = (timeString: string) => {
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
  };

  useEffect(() => {
    const updateIST = () => setCurrentIST(getCurrentIST());
    updateIST();
    const interval = setInterval(updateIST, 1000);
    return () => clearInterval(interval);
  }, []);

  const permissions = {
    canAddMedications:
      user?.role === "ADMIN" ||
      user?.role === "SENIOR" ||
      user?.role === "CAREGIVER",
    canEditMedications:
      user?.role === "ADMIN" ||
      user?.role === "SENIOR" ||
      user?.role === "CAREGIVER",
    canDeleteMedications: user?.role === "ADMIN" || user?.role === "CAREGIVER",
    canMarkTaken:
      user?.role === "ADMIN" ||
      user?.role === "SENIOR" ||
      user?.role === "CAREGIVER",
    canViewMedications: true,
    isViewOnly: user?.role === "FAMILY" || user?.role === "DOCTOR",
  };

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      window.location.href = "/auth/signin";
      return;
    }
  }, [status]);

  useEffect(() => {
    if (user) {
      fetchMedications();
      fetchTakenMedications();
      checkNotificationPermission();
    }
  }, [user]);

  useEffect(() => {
    if (medications.length > 0) {
      const setupVoice = async () => {
        if (!window.voiceInterfaceSetup) {
          window.voiceInterfaceSetup = true;
          const { integrateVoiceWithMedications } = await import(
            "../../lib/voice-interface"
          );
          integrateVoiceWithMedications(medications, takenMedications);
        }
      };
      setupVoice();
    }
  }, [medications]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).testEmergencyEscalation = () => {
        console.log("Starting emergency escalation test...");
        emergencyEscalationService.reportMissedMedication(
          "cmf56aanx0003unv4zzl88tqw",
          "Blood Pressure Medicine",
          "10mg",
          "08:00"
        );
      };
      (window as any).escalationService = emergencyEscalationService;
    }
  }, []);
  const [remindersScheduled, setRemindersScheduled] = useState(false);
  const lastMedicationCount = useRef(0);

  useEffect(() => {
    if (medications.length !== lastMedicationCount.current) {
      lastMedicationCount.current = medications.length;
      setRemindersScheduled(false);
    }

    if (medications.length > 0 && notificationsEnabled && !remindersScheduled) {
      console.log(
        "🔔 Auto-scheduling reminders for",
        medications.length,
        "medications"
      );

      const timeoutId = setTimeout(() => {
        scheduleAllReminders();
        setRemindersScheduled(true);
      }, 1000);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [medications.length, notificationsEnabled, remindersScheduled]);

  const fetchMedications = async () => {
    try {
      const response = await fetch("/api/medications");
      if (response.ok) {
        const data = await response.json();

        const normalizedData = data.map((med: any) => ({
          ...med,
          times: Array.isArray(med.times)
            ? med.times
            : typeof med.times === "string"
            ? med.times.split(",").map((t: string) => t.trim())
            : [],
        }));

        console.log("✅ Medications normalized:", normalizedData.length);
        console.log("📋 First med times:", normalizedData[0]?.times);
        setMedications(normalizedData);
      }
    } catch (error) {
      console.error("Error fetching medications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTakenMedications = async () => {
    try {
      const response = await fetch("/api/medication-logs");
      if (response.ok) {
        const logs = await response.json();
        const today = new Date().toDateString();

        const todayTaken = logs
          .filter((log: any) => {
            const logDate = new Date(log.scheduledFor).toDateString();
            return logDate === today && log.status === "TAKEN";
          })
          .map((log: any) => {
            const scheduledDate = new Date(log.scheduledFor);
            const timeString = scheduledDate.toTimeString().slice(0, 5);
            return `${log.medicationId}-${timeString}`;
          });

        console.log("Today taken medications:", todayTaken);
        setTakenMedications(new Set(todayTaken));
      }
    } catch (error) {
      console.error("Error fetching taken medications:", error);
    }
  };

  const checkNotificationPermission = () => {
    if ("Notification" in window) {
      const permission = Notification.permission;
      console.log(" Current notification permission:", permission);
      setNotificationsEnabled(permission === "granted");
    }
  };

  const enableNotifications = async () => {
    console.log(" Bell button clicked!");

    try {
      const notificationService = NotificationService.getInstance();

      if (!notificationService) {
        alert("Notification service not available. Please refresh the page.");
        return;
      }

      const granted = await notificationService.requestPermission();
      setNotificationsEnabled(granted);

      if (granted && medications.length > 0) {
        scheduleAllReminders();
        await notificationService.testNotifications();
        alert(
          "Notifications enabled! You'll receive reminders at scheduled times."
        );
      } else if (!granted) {
        alert("Please allow notifications in browser settings.");
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      alert("Failed to enable notifications.");
    }
  };

  const scheduleAllReminders = async () => {
    if (isScheduling) {
      console.log("Already scheduling, skipping...");
      return;
    }

    setIsScheduling(true);
    console.log(" Scheduling all reminders...");

    medications.forEach((med) => {
      console.log(` ${med.name}:`);
      console.log(`  - times type: ${typeof med.times}`);
      console.log(`  - times value:`, med.times);
      console.log(`  - is array: ${Array.isArray(med.times)}`);
    });

    const notificationService = NotificationService.getInstance();
    if (!notificationService) {
      setIsScheduling(false);
      return;
    }

    // Convert times to array format before scheduling
    const medicationsForScheduling = medications.map((med) => ({
      ...med,
      times: Array.isArray(med.times)
        ? med.times
        : med.times.split(",").map((t) => t.trim()),
    }));

    notificationService.scheduleReminders(medicationsForScheduling);
    console.log(" All reminders scheduled!");

    setTimeout(() => setIsScheduling(false), 1000);
  };

  const validateForm = (
    medication: MedicationFormData
  ): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!medication.name.trim()) errors.name = "Medication name is required";
    if (!medication.dosage.trim()) errors.dosage = "Dosage is required";
    if (medication.times.length === 0)
      errors.times = "At least one time is required";
    if (!medication.startDate) errors.startDate = "Start date is required";
    return errors;
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingMedication && !permissions.canAddMedications) {
      alert("You do not have permission to add medications");
      return;
    }

    if (editingMedication && !permissions.canEditMedications) {
      alert("You do not have permission to edit medications");
      return;
    }

    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const url = editingMedication
        ? `/api/medications?id=${editingMedication.id}`
        : "/api/medications";
      const method = editingMedication ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          times: formData.times.join(","),
        }),
      });

      if (response.ok) {
        await fetchMedications();
        resetForm();
        alert(editingMedication ? "Medication updated!" : "Medication added!");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to save medication"}`);
      }
    } catch (error) {
      console.error("Error saving medication:", error);
      alert("Failed to save medication");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMedication = async (id: string) => {
    if (!permissions.canDeleteMedications) {
      alert("You do not have permission to delete medications");
      return;
    }

    if (!confirm("Are you sure you want to remove this medication?")) return;

    try {
      const response = await fetch(`/api/medications?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchMedications();
        alert("Medication deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting medication:", error);
      alert("Failed to delete medication");
    }
  };

  const handleEditMedication = (medication: Medication) => {
    if (!permissions.canEditMedications) {
      alert("You do not have permission to edit medications");
      return;
    }

    setEditingMedication(medication);
    const timesArray = getTimesArray(medication.times);

    setFormData({
      name: medication.name,
      dosage: medication.dosage,
      description: medication.description || "",
      color: medication.color || "",
      shape: medication.shape || "",
      times: timesArray,
      startDate: medication.startDate || new Date().toISOString().split("T")[0],
      endDate: medication.endDate || "",
      isActive: medication.isActive !== undefined ? medication.isActive : true,
    });
    setFormErrors({});
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      dosage: "",
      description: "",
      color: "",
      shape: "",
      times: ["08:00"],
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      isActive: true,
    });
    setFormErrors({});
    setShowAddForm(false);
    setEditingMedication(null);
  };

  const handleMarkTaken = async (
    medicationId: string,
    scheduledTime: string
  ) => {
    if (!permissions.canMarkTaken) {
      alert("You do not have permission to mark medications as taken");
      return;
    }

    try {
      console.log(
        ` Marking medication ${medicationId} as taken at ${scheduledTime}`
      );

      const scheduledDateTime = new Date();
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const response = await fetch("/api/medication-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId,
          status: "TAKEN",
          scheduledFor: scheduledDateTime.toISOString(),
        }),
      });

      if (response.ok) {
        const takenKey = `${medicationId}-${scheduledTime}`;
        setTakenMedications((prev) => new Set([...prev, takenKey]));

        const notificationService = NotificationService.getInstance();
        if (notificationService) {
          await notificationService.markMedicationTaken(
            medicationId,
            scheduledTime
          );
        }

        if (emergencyEscalationService) {
          emergencyEscalationService.medicationTaken(medicationId);
        }

        if (voiceInterfaceService) {
          voiceInterfaceService.updateMedications(
            medications.flatMap((med) => {
              const timesArray = getTimesArray(med.times);
              return timesArray.map((time) => ({
                id: `${med.id}-${time}`,
                name: med.name,
                dosage: med.dosage,
                times: [time],
                isTaken:
                  takenMedications.has(`${med.id}-${time}`) ||
                  takenKey === `${med.id}-${time}`,
              }));
            })
          );
        }

        console.log(
          `✅ Successfully marked ${medicationId} as taken at ${scheduledTime}`
        );
        alert("Medication marked as taken! Great job staying healthy!");
      } else {
        const errorData = await response.json();
        console.error("Failed to save medication log:", errorData);
        alert("Failed to save. Please try again.");
      }
    } catch (error) {
      console.error("Error logging medication:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const addTimeSlot = () => {
    setFormData((prev) => ({
      ...prev,
      times: [...prev.times, "08:00"],
    }));
  };

  const removeTimeSlot = (index: number) => {
    if (formData.times.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (index: number, newTime: string) => {
    setFormData((prev) => ({
      ...prev,
      times: prev.times.map((time, i) => (i === index ? newTime : time)),
    }));
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading your medications...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full opacity-30"></div>
          <div className="absolute bottom-40 left-32 w-20 h-20 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full opacity-40"></div>
        </div>

        <header className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-20 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Link
                  href="/"
                  className="p-3 hover:bg-rose-100 rounded-2xl transition-all duration-300 group"
                >
                  <ArrowLeft className="h-8 w-8 text-gray-600 group-hover:text-rose-600" />
                </Link>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="bg-gradient-to-br from-rose-400 to-pink-600 p-4 rounded-3xl shadow-lg">
                      <Pill className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-green-400 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {medications.length}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                      My Medicine Cabinet
                    </h1>
                    <p className="text-gray-600 text-lg">
                      {permissions.isViewOnly
                        ? "View medications and schedules"
                        : `Taking care of yourself today, ${userName}`}
                      <br />
                      <span className="text-sm">Current IST: {currentIST}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Logged in as: {user?.name} ({user?.role})
                      {permissions.isViewOnly && " - View Only Access"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={enableNotifications}
                  className={`p-3 rounded-2xl transition-all duration-300 ${
                    notificationsEnabled
                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600"
                  }`}
                  title={
                    notificationsEnabled
                      ? "Notifications enabled"
                      : "Enable notifications"
                  }
                >
                  {notificationsEnabled ? (
                    <Bell className="h-6 w-6" />
                  ) : (
                    <BellOff className="h-6 w-6" />
                  )}
                </button>

                <div className="flex items-center space-x-4">
                  {permissions.canAddMedications ? (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl text-xl font-semibold flex items-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group"
                    >
                      <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
                      <span>Add New Medicine</span>
                    </button>
                  ) : (
                    <div className="text-sm text-gray-500 bg-gray-100 px-4 py-3 rounded-2xl font-medium">
                      View-only access ({user?.role})
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {permissions.isViewOnly && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>View-Only Access:</strong> You can view medications
                    but cannot make changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 pt-6">
          <VoiceInterface
            medications={medications}
            takenMedications={takenMedications}
            onMedicationTaken={(medicationId) => {
              const time = medicationId.split("-")[1];
              const medId = medicationId.split("-")[0];
              if (time) handleMarkTaken(medId, time);
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* 🔧 FIXED: Today's Schedule Section */}
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 rounded-[2.5rem] shadow-2xl p-10 mb-12 border border-white/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20 rounded-[2.5rem]"></div>

            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-gradient-to-br from-blue-400 to-indigo-600 w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-gray-800">
                    Today's Schedule
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Your medications for today
                  </p>
                </div>
              </div>

              {medications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Pill className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-600 mb-2">
                    No medications yet
                  </h3>
                  <p className="text-gray-500">
                    Add your first medication to get started
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {medications.flatMap((med) => {
                    // 🔧 FIX: Use helper function
                    const timesArray = getTimesArray(med.times);

                    return timesArray.map((time) => {
                      const trimmedTime = time.trim();
                      const takenKey = `${med.id}-${trimmedTime}`;
                      const isTaken = takenMedications.has(takenKey);

                      return (
                        <div
                          key={takenKey}
                          className={`rounded-3xl p-8 relative overflow-hidden group hover:shadow-lg transition-all duration-300 ${
                            isTaken
                              ? "bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300"
                              : "bg-gradient-to-r from-rose-100 to-pink-100 border-2 border-rose-300"
                          }`}
                        >
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
                                <Clock
                                  className={`h-6 w-6 ${
                                    isTaken ? "text-green-600" : "text-rose-600"
                                  }`}
                                />
                                <div
                                  className={`text-3xl font-bold ${
                                    isTaken ? "text-green-800" : "text-rose-800"
                                  }`}
                                >
                                  {trimmedTime} ({formatTimeForIST(trimmedTime)}
                                  )
                                </div>
                              </div>
                              <div
                                className={`text-xl font-semibold mb-2 ${
                                  isTaken ? "text-green-700" : "text-rose-700"
                                }`}
                              >
                                {med.name} - {med.dosage}
                              </div>
                              {med.description && (
                                <div
                                  className={`${
                                    isTaken ? "text-green-600" : "text-rose-600"
                                  }`}
                                >
                                  {med.description}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center">
                              {isTaken ? (
                                <div className="bg-green-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold flex items-center space-x-2">
                                  <CheckCircle2 className="h-6 w-6" />
                                  <span>Taken!</span>
                                </div>
                              ) : permissions.canMarkTaken ? (
                                <button
                                  onClick={() =>
                                    handleMarkTaken(med.id, trimmedTime)
                                  }
                                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 shadow-lg transform hover:scale-105"
                                >
                                  I took this
                                </button>
                              ) : (
                                <div className="bg-gray-300 text-gray-600 px-8 py-4 rounded-2xl text-lg font-semibold">
                                  View Only ({user?.role})
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-white via-emerald-50/30 to-green-50/50 rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/20 to-green-100/20 rounded-[2.5rem]"></div>

            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-gray-800 mb-10 text-center">
                Your Medicine Cabinet
              </h2>

              {medications.length === 0 ? (
                <div className="text-center py-12">
                  <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-xl text-gray-500">
                    Start by adding your first medication
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {medications.map((med, index) => {
                    const timesArray = getTimesArray(med.times);

                    return (
                      <div
                        key={med.id}
                        className={`bg-white/80 backdrop-blur-sm border-2 rounded-3xl p-8 hover:shadow-xl transition-all duration-500 group relative overflow-hidden ${
                          index % 2 === 0
                            ? "border-rose-200 hover:border-rose-300"
                            : "border-emerald-200 hover:border-emerald-300"
                        }`}
                      >
                        <div className="absolute top-4 right-4 flex space-x-2">
                          {permissions.canEditMedications && (
                            <button
                              onClick={() => handleEditMedication(med)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all duration-300"
                              title="Edit medication"
                            >
                              <Edit3 className="h-5 w-5" />
                            </button>
                          )}
                          {permissions.canDeleteMedications && (
                            <button
                              onClick={() => handleDeleteMedication(med.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all duration-300"
                              title="Delete medication"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                          {!permissions.canEditMedications &&
                            !permissions.canDeleteMedications && (
                              <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                View Only
                              </div>
                            )}
                        </div>

                        <div className="mb-8">
                          <h3 className="text-3xl font-bold text-gray-800 mb-3">
                            {med.name}
                          </h3>
                          <div className="flex items-center space-x-4 mb-4">
                            <span
                              className={`px-4 py-2 rounded-2xl text-lg font-semibold ${
                                index % 2 === 0
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {med.dosage}
                            </span>
                          </div>

                          {med.description && (
                            <p className="text-gray-600 mb-4">
                              {med.description}
                            </p>
                          )}

                          <div className="space-y-2 mb-6">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>
                                <strong>Times (IST):</strong>
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {timesArray.map((time) => {
                                const timeFormatted = time.trim();
                                const time12Hour =
                                  formatTimeForIST(timeFormatted);

                                return (
                                  <span
                                    key={timeFormatted}
                                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                                  >
                                    {timeFormatted} ({time12Hour})
                                  </span>
                                );
                              })}
                            </div>
                            {(med.color || med.shape) && (
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                {med.color && (
                                  <span>
                                    <strong>Color:</strong> {med.color}
                                  </span>
                                )}
                                {med.shape && (
                                  <span>
                                    <strong>Shape:</strong> {med.shape}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">
                            Add photo of medication
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                      {editingMedication
                        ? "Edit Medication"
                        : "Add New Medication"}
                    </h2>
                    <button
                      onClick={resetForm}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="h-5 w-5 text-gray-500" />
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
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className={`w-full p-4 text-lg border-2 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-gray-900 placeholder-gray-500 ${
                          formErrors.name ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="e.g., Blood Pressure Medicine"
                      />
                      {formErrors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xl font-medium text-gray-700 mb-2">
                        Dosage *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.dosage}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            dosage: e.target.value,
                          }))
                        }
                        className={`w-full p-4 text-lg border-2 rounded-xl focus:border-blue-500 focus:outline-none ${
                          formErrors.dosage
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="e.g., 10mg, 1 tablet"
                      />
                      {formErrors.dosage && (
                        <p className="text-red-500 text-sm mt-1">
                          {formErrors.dosage}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xl font-medium text-gray-700 mb-2">
                        Instructions
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-gray-900 placeholder-gray-500"
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
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              color: e.target.value,
                            }))
                          }
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
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              shape: e.target.value,
                            }))
                          }
                          className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                          placeholder="e.g., Round, Oval"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xl font-medium text-gray-700 mb-2">
                        When to take? * (Current time: {currentIST.slice(0, 5)}{" "}
                        IST)
                      </label>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                          Quick presets:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: "Morning (8:00)", time: "08:00" },
                            { label: "Afternoon (12:00)", time: "12:00" },
                            { label: "Evening (18:00)", time: "18:00" },
                            { label: "Night (22:00)", time: "22:00" },
                          ].map((preset) => (
                            <button
                              key={preset.time}
                              type="button"
                              onClick={() => {
                                if (!formData.times.includes(preset.time)) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    times: [...prev.times, preset.time],
                                  }));
                                }
                              }}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg text-sm transition-colors"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        {formData.times.map((time, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5 text-blue-600" />
                              <span className="font-medium">
                                Time {index + 1}:
                              </span>
                            </div>

                            <select
                              value={time.split(":")[0]}
                              onChange={(e) => {
                                const newHour = e.target.value.padStart(2, "0");
                                const currentMinute =
                                  time.split(":")[1] || "00";
                                const newTime = `${newHour}:${currentMinute}`;
                                updateTimeSlot(index, newTime);
                              }}
                              className="p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option
                                  key={i}
                                  value={i.toString().padStart(2, "0")}
                                >
                                  {i.toString().padStart(2, "0")}
                                </option>
                              ))}
                            </select>

                            <span className="text-xl font-bold text-gray-600">
                              :
                            </span>

                            <select
                              value={time.split(":")[1] || "00"}
                              onChange={(e) => {
                                const currentHour = time.split(":")[0] || "08";
                                const newMinute = e.target.value;
                                const newTime = `${currentHour}:${newMinute}`;
                                updateTimeSlot(index, newTime);
                              }}
                              className="p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                            >
                              {Array.from({ length: 12 }, (_, i) => {
                                const minute = (i * 5)
                                  .toString()
                                  .padStart(2, "0");
                                return (
                                  <option key={minute} value={minute}>
                                    {minute}
                                  </option>
                                );
                              })}
                            </select>

                            <span className="text-gray-600">
                              ({time} IST - {formatTimeForIST(time)})
                            </span>

                            {formData.times.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTimeSlot(index)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Remove this time"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addTimeSlot}
                          className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 p-4 rounded-xl text-gray-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="h-5 w-5" />
                          Add Another Time
                        </button>
                      </div>

                      {formErrors.times && (
                        <p className="text-red-500 text-sm mt-1">
                          {formErrors.times}
                        </p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xl font-medium text-gray-700 mb-2">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                            }))
                          }
                          className={`w-full p-4 text-lg border-2 rounded-xl focus:border-blue-500 focus:outline-none ${
                            formErrors.startDate
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {formErrors.startDate && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.startDate}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xl font-medium text-gray-700 mb-2">
                          End Date (optional)
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                            }))
                          }
                          className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isActive: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isActive"
                        className="text-xl font-medium text-gray-700"
                      >
                        Active medication
                      </label>
                    </div>

                    <div className="flex space-x-4 pt-6">
                      <button
                        type="button"
                        onClick={resetForm}
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
                            {editingMedication ? "Updating..." : "Adding..."}
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5 mr-2" />
                            {editingMedication
                              ? "Update Medication"
                              : "Add Medication"}
                          </>
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
    </>
  );
}
