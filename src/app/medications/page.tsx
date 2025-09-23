"use client";

import { useState, useEffect } from "react";
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
  times: string;
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

// interface CurrentUser {
//   id: string;
//   role: "admin" | "caregiver" | "family" | "senior";
//   name: string;
// }

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
  const [reminderTimeouts, setReminderTimeouts] = useState<Map<string, number>>(
    new Map()
  );

  // Role-based access control

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

  interface TimeSlot {
    id: string;
    hour: number;
    minute: number;
    enabled: boolean;
  }

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

  // Update IST time every second
  useEffect(() => {
    const updateIST = () => setCurrentIST(getCurrentIST());
    updateIST();
    const interval = setInterval(updateIST, 1000);
    return () => clearInterval(interval);
  }, []);

  // useEffect(() => {
  //   setCurrentUser({
  //     id: "user123",
  //     role: "admin",
  //     name: "Sahil",
  //   });
  // }, []);

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
    if (status === "loading") return; // Still loading
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
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).escalationService = emergencyEscalationService;
      console.log("Escalation service exposed to window");
    }
  }, []);

  useEffect(() => {
    if (medications.length > 0 && notificationsEnabled) {
      console.log(
        "Auto-scheduling reminders for",
        medications.length,
        "medications"
      );
      const timeoutId = setTimeout(() => {
        scheduleAllReminders();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [medications, notificationsEnabled]);

  const fetchMedications = async () => {
    try {
      const response = await fetch("/api/medications");
      if (response.ok) {
        const data = await response.json();
        setMedications(data);
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
      console.log("🔔 Current notification permission:", permission);
      setNotificationsEnabled(permission === "granted");

      if (permission === "default") {
        console.log("ℹ Notifications not yet requested");
      } else if (permission === "denied") {
        console.log(
          " Notifications denied - user needs to enable in browser settings"
        );
      }
    } else {
      console.error(" Notifications not supported in this browser");
    }
  };

  // const testBrowserSupport = () => {
  //   console.log('Browser support check:')
  //   console.log('- Notifications supported:', 'Notification' in window)
  //   console.log('- Current permission:', Notification.permission)
  //   console.log('- Service Worker supported:', 'serviceWorker' in navigator)
  // }

  const enableNotifications = async () => {
    console.log(" Bell button clicked!");

    try {
      console.log("Current permission:", Notification.permission);
      const notificationService = NotificationService.getInstance();

      if (!notificationService) {
        console.error(" Notification service not available");
        alert("Notification service not available. Please refresh the page.");
        return;
      }

      console.log(" Requesting permission...");
      const granted = await notificationService.requestPermission();
      console.log(" Permission result:", granted);

      setNotificationsEnabled(granted);

      if (granted && medications.length > 0) {
        console.log(
          " Scheduling reminders for",
          medications.length,
          "medications"
        );
        scheduleAllReminders();

        // Test notification
        await notificationService.testNotifications();
        console.log(" Test notification sent");

        alert(
          "Notifications enabled! You should receive reminders at scheduled times."
        );
      } else if (!granted) {
        alert(
          "Please allow notifications in your browser settings to receive medication reminders."
        );
      }
    } catch (error) {
      console.error(" Error in enableNotifications:", error);
      alert("Failed to enable notifications. Please check browser settings.");
    }
  };
  const testImmediateNotification = async () => {
    console.log(" Testing immediate notification...");

    try {
      const notificationService = NotificationService.getInstance();

      if (Notification.permission !== "granted") {
        const granted = await notificationService.requestPermission();
        if (!granted) return;
      }

      // Create a test medication for right now
      const now = new Date();
      const testTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      const testMedication = {
        id: "test-immediate",
        name: "Test Medicine",
        dosage: "1 tablet",
        times: [testTime],
        scheduledTime: testTime,
      };

      await notificationService.showMedicationReminder(
        testMedication,
        testTime
      );
      console.log("✅ Immediate test notification sent");
    } catch (error) {
      console.error(" Test notification failed:", error);
      alert("Test notification failed: " + error.message);
    }
  };

  const scheduleAllReminders = async () => {
    if (isScheduling) {
      console.log("Already scheduling, skipping...");
      return;
    }

    setIsScheduling(true);
    console.log("Scheduling all reminders...");

    const notificationService = NotificationService.getInstance();
    if (!notificationService) {
      setIsScheduling(false);
      return;
    }

    notificationService.scheduleReminders(medications);
    console.log("All reminders scheduled!");

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
    console.log("Validation errors:", errors);

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const url = editingMedication
        ? `/api/medications?id=${editingMedication.id}`
        : "/api/medications";
      const method = editingMedication ? "PUT" : "POST";

      const payload = {
        ...formData,
        times: formData.times.join(","),
      };
      console.log("Sending to API:", payload);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          times: formData.times.join(","),
        }),
      });
      console.log("API Response status:", response.status);

      if (response.ok) {
        await fetchMedications();
        resetForm();

        alert(
          editingMedication
            ? "Medication updated successfully!"
            : "Medication added successfully!"
        );
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

    if (
      !confirm(
        "Are you sure you want to remove this medication? This action cannot be undone."
      )
    )
      return;

    try {
      const response = await fetch(`/api/medications?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchMedications();
        alert("Medication deleted successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to delete medication"}`);
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
    setFormData({
      name: medication.name,
      dosage: medication.dosage,
      description: medication.description || "",
      color: medication.color || "",
      shape: medication.shape || "",
      times: medication.times.split(",").map((t) => t.trim()),
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
      const scheduledDateTime = new Date();
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      console.log("Debug - Original time:", scheduledTime);
      console.log("Debug - Created datetime:", scheduledDateTime.toISOString());

      const response = await fetch("/api/medication-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicationId,
          status: "TAKEN",
          scheduledFor: scheduledDateTime.toISOString(),
        }),
      });

      if (response.ok) {
        const takenKey = `${medicationId}-${scheduledTime}`;
        console.log("Marking as taken:", takenKey);
        setTakenMedications((prev) => new Set([...prev, takenKey]));

        const notificationService = NotificationService.getInstance();
        await notificationService.medicationTaken(medicationId);
        await emergencyEscalationService?.medicationTaken(medicationId);

        console.log("Emergency escalation cancelled for:", medicationId);

        voiceInterfaceService.updateMedications(
          medications.flatMap((med) =>
            med.times.split(",").map((time) => ({
              id: `${med.id}-${time.trim()}`,
              name: med.name,
              dosage: med.dosage,
              times: [time.trim()],
              isTaken:
                takenMedications.has(`${med.id}-${time.trim()}`) ||
                takenKey === `${med.id}-${time.trim()}`,
            }))
          )
        );

        alert("Medication marked as taken! Great job staying healthy!");
      } else {
        const errorData = await response.json();
        console.error("API error:", errorData);
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error logging medication:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleTimeToggle = (time: string) => {
    setFormData((prev) => ({
      ...prev,
      times: prev.times.includes(time)
        ? prev.times.filter((t) => t !== time)
        : [...prev.times, time],
    }));
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
  // Not authenticated
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
    // <ProtectedRoute
    //   allowUnauthenticated={true}
    //   requiredRoles={["ADMIN", "SENIOR", "CAREGIVER", "DOCTOR"]}
    // >
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full opacity-30"></div>
          <div className="absolute bottom-40 left-32 w-20 h-20 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full opacity-40"></div>
        </div>

        {/* Header */}
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
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>View-Only Access:</strong> You can view medications
                    but cannot make changes. Contact an administrator or
                    caregiver to modify medications.
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
              if (time) {
                handleMarkTaken(medId, time);
              }
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10">
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
                  {medications.flatMap((med) =>
                    med.times.split(",").map((time) => {
                      const takenKey = `${med.id}-${time}`;
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
                                  {time.trim()} ({formatTimeForIST(time.trim())}
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
                                  onClick={() => handleMarkTaken(med.id, time)}
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
                    })
                  )}
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
                  {medications.map((med, index) => (
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
                            {med.times.split(",").map((time) => {
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
                        <p className="text-gray-500">Add photo of medication</p>
                        {permissions.canEdit && (
                          <button className="mt-2 text-blue-600 hover:text-blue-700 font-medium">
                            Take Photo
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add/Edit New Medication Form */}
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

                      {/* Quick Time Presets */}
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

                      {/* Custom Time Slots */}
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

                            {/* Hour Selector */}
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

                            {/* Minute Selector */}
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

                            {/* Remove Time Button */}
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

                        {/* Add Time Button */}
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
// Replace your existing window.checkAuth() function with this:
// Add this to your medications page or any page where you need auth checking

window.checkAuth = async () => {
  try {
    // Check NextAuth session (not cookies, as NextAuth uses httpOnly cookies)
    const sessionResponse = await fetch("/api/auth/session");
    const session = await sessionResponse.json();

    console.log("🔍 Session check:", session);

    if (session && session.user) {
      console.log("✅ AUTHENTICATED");
      console.log("👤 User:", session.user.name);
      console.log("📧 Email:", session.user.email);
      console.log("🛡️ Role:", session.user.role);
      console.log("⏰ Expires:", session.expires);

      // Store user info globally for easy access
      window.currentUser = session.user;
      window.userRole = session.user.role;

      return true;
    } else {
      console.log("❌ NOT AUTHENTICATED");
      window.currentUser = null;
      window.userRole = null;
      return false;
    }
  } catch (error) {
    console.error("❌ Auth check failed:", error);
    return false;
  }
};

// Helper functions for role-based access
window.isAdmin = () => window.userRole === "ADMIN";
window.isSenior = () => window.userRole === "SENIOR";
window.isFamily = () => window.userRole === "FAMILY";
window.isCaregiver = () => window.userRole === "CAREGIVER";
window.isDoctor = () => window.userRole === "DOCTOR";

// Quick role-based redirect function
window.redirectBasedOnRole = () => {
  const role = window.userRole;
  switch (role) {
    case "ADMIN":
      window.location.href = "/admin/dashboard";
      break;
    case "SENIOR":
      window.location.href = "/medications";
      break;
    case "FAMILY":
      window.location.href = "/family";
      break;
    case "CAREGIVER":
    case "DOCTOR":
      window.location.href = "/caregiver";
      break;
    default:
      window.location.href = "/auth/signin";
  }
};

// Test all functions
console.log("🔧 Updated auth functions loaded!");
console.log("📝 Available functions:");
console.log("  - window.checkAuth()");
console.log("  - window.isAdmin()");
console.log("  - window.isSenior()");
console.log("  - window.isFamily()");
console.log("  - window.redirectBasedOnRole()");

// Auto-run the check
window.checkAuth();
