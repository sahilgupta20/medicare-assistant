// src/components/SmartMedicationScheduler.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Bell,
  AlertCircle,
  CheckCircle2,
  Coffee,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";

interface MedicationSchedule {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  time: string;
  frequency:
    | "daily"
    | "weekly"
    | "as_needed"
    | "twice_daily"
    | "three_times_daily";
  dayOfWeek?: number;
  isActive: boolean;
  reminderMinutesBefore: number;
  specialInstructions?: string;
  withFood: boolean;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
}

interface SmartSchedulerProps {
  medications: Array<{
    id: string;
    name: string;
    dosage: string;
    times: string;
    frequency?: string;
  }>;
  onScheduleUpdate: (schedules: MedicationSchedule[]) => void;
}

export default function SmartMedicationScheduler({
  medications,
  onScheduleUpdate,
}: SmartSchedulerProps) {
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<MedicationSchedule | null>(null);
  const [selectedMedication, setSelectedMedication] = useState("");
  const [schedulingConflicts, setSchedulingConflicts] = useState<
    Array<{
      time: string;
      medications: string[];
    }>
  >([]);
  const [newSchedule, setNewSchedule] = useState({
    time: "08:00",
    frequency: "daily",
    reminderMinutesBefore: 15,
    withFood: false,
    specialInstructions: "",
  });

  const timePresets = {
    morning: ["06:00", "07:00", "08:00", "09:00"],
    afternoon: ["12:00", "13:00", "14:00", "15:00"],
    evening: ["18:00", "19:00", "20:00", "21:00"],
    night: ["22:00", "23:00", "00:00"],
  };

  const frequencyOptions = [
    { value: "daily", label: "Every day", icon: Calendar },
    { value: "twice_daily", label: "Twice a day", icon: Clock },
    { value: "three_times_daily", label: "Three times a day", icon: Bell },
    { value: "weekly", label: "Once a week", icon: Calendar },
    { value: "as_needed", label: "As needed", icon: AlertCircle },
  ];

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    generateInitialSchedules();
  }, [medications]);

  useEffect(() => {
    checkForConflicts();
    onScheduleUpdate(schedules);
  }, [schedules]);

  const generateInitialSchedules = () => {
    const newSchedules: MedicationSchedule[] = [];

    medications.forEach((med) => {
      const times = med.times.split(",").map((t) => t.trim());
      times.forEach((time) => {
        const timeOfDay = getTimeOfDay(time);
        newSchedules.push({
          id: `${med.id}-${time}`,
          medicationId: med.id,
          medicationName: med.name,
          dosage: med.dosage,
          time,
          frequency: "daily",
          isActive: true,
          reminderMinutesBefore: 15,
          specialInstructions: "",
          withFood: false,
          timeOfDay,
        });
      });
    });

    setSchedules(newSchedules);
  };

  const getTimeOfDay = (
    time: string
  ): "morning" | "afternoon" | "evening" | "night" => {
    const hour = parseInt(time.split(":")[0]);
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 22) return "evening";
    return "night";
  };

  const getTimeIcon = (timeOfDay: string) => {
    switch (timeOfDay) {
      case "morning":
        return <Coffee className="h-5 w-5 text-amber-600" />;
      case "afternoon":
        return <Sun className="h-5 w-5 text-yellow-600" />;
      case "evening":
        return <Sunset className="h-5 w-5 text-orange-600" />;
      case "night":
        return <Moon className="h-5 w-5 text-indigo-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const checkForConflicts = () => {
    const timeGroups: { [key: string]: string[] } = {};

    schedules
      .filter((schedule) => schedule.isActive && schedule.frequency === "daily")
      .forEach((schedule) => {
        const timeKey = schedule.time;
        if (!timeGroups[timeKey]) {
          timeGroups[timeKey] = [];
        }
        timeGroups[timeKey].push(schedule.medicationName);
      });

    const conflicts = Object.entries(timeGroups)
      .filter(([time, medications]) => medications.length > 3) // Flag if more than 3 meds at same time
      .map(([time, medications]) => ({ time, medications }));

    setSchedulingConflicts(conflicts);
  };

  const handleAddSchedule = () => {
    if (!selectedMedication) return;

    const medication = medications.find((med) => med.id === selectedMedication);
    if (!medication) return;

    const timeOfDay = getTimeOfDay(newSchedule.time);
    const schedule: MedicationSchedule = {
      id: `${selectedMedication}-${newSchedule.time}-${Date.now()}`,
      medicationId: selectedMedication,
      medicationName: medication.name,
      dosage: medication.dosage,
      time: newSchedule.time,
      frequency: newSchedule.frequency,
      isActive: true,
      reminderMinutesBefore: newSchedule.reminderMinutesBefore,
      specialInstructions: newSchedule.specialInstructions,
      withFood: newSchedule.withFood,
      timeOfDay,
    };

    setSchedules((prev) => [...prev, schedule]);
    setShowAddModal(false);
    resetForm();
  };

  const handleEditSchedule = (schedule: MedicationSchedule) => {
    setEditingSchedule(schedule);
    setNewSchedule({
      time: schedule.time,
      frequency: schedule.frequency,
      reminderMinutesBefore: schedule.reminderMinutesBefore,
      withFood: schedule.withFood,
      specialInstructions: schedule.specialInstructions || "",
    });
    setShowAddModal(true);
  };

  const handleUpdateSchedule = () => {
    if (!editingSchedule) return;

    const timeOfDay = getTimeOfDay(newSchedule.time);
    const updatedSchedule = {
      ...editingSchedule,
      time: newSchedule.time,
      frequency: newSchedule.frequency,
      reminderMinutesBefore: newSchedule.reminderMinutesBefore,
      specialInstructions: newSchedule.specialInstructions,
      withFood: newSchedule.withFood,
      timeOfDay,
    };

    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.id === editingSchedule.id ? updatedSchedule : schedule
      )
    );
    setShowAddModal(false);
    setEditingSchedule(null);
    resetForm();
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      setSchedules((prev) =>
        prev.filter((schedule) => schedule.id !== scheduleId)
      );
    }
  };

  const toggleScheduleActive = (scheduleId: string) => {
    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.id === scheduleId
          ? { ...schedule, isActive: !schedule.isActive }
          : schedule
      )
    );
  };

  const resetForm = () => {
    setSelectedMedication("");
    setNewSchedule({
      time: "08:00",
      frequency: "daily",
      reminderMinutesBefore: 15,
      withFood: false,
      specialInstructions: "",
    });
  };

  const generateSmartSuggestions = () => {
    // Smart suggestions based on existing schedules
    const existingTimes = schedules.map((s) => s.time);
    const suggestions = [];

    // Suggest spacing medications throughout the day
    if (!existingTimes.includes("08:00")) suggestions.push("08:00 - Morning");
    if (!existingTimes.includes("12:00")) suggestions.push("12:00 - Lunch");
    if (!existingTimes.includes("18:00")) suggestions.push("18:00 - Dinner");
    if (!existingTimes.includes("22:00")) suggestions.push("22:00 - Bedtime");

    return suggestions;
  };

  const groupedSchedules = schedules.reduce((groups, schedule) => {
    const timeOfDay = schedule.timeOfDay;
    if (!groups[timeOfDay]) {
      groups[timeOfDay] = [];
    }
    groups[timeOfDay].push(schedule);
    return groups;
  }, {} as Record<string, MedicationSchedule[]>);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-blue-400 to-indigo-600 p-3 rounded-2xl">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Smart Schedule</h2>
            <p className="text-gray-600">Optimize your medication timing</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-2xl font-semibold flex items-center space-x-2 transition-all duration-300 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Add Schedule</span>
        </button>
      </div>

      {schedulingConflicts.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <AlertCircle className="h-6 w-6 text-amber-600" />
            <h3 className="text-xl font-bold text-amber-800">
              Scheduling Conflicts
            </h3>
          </div>
          {schedulingConflicts.map((conflict, index) => (
            <div key={index} className="text-amber-700">
              <strong>{conflict.time}:</strong>{" "}
              {conflict.medications.join(", ")}
              <span className="text-sm"> (Consider spacing these out)</span>
            </div>
          ))}
        </div>
      )}

      {/* Smart Suggestions */}
      {generateSmartSuggestions().length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <CheckCircle2 className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-blue-800">
              Smart Suggestions
            </h3>
          </div>
          <div className="text-blue-700">
            <p className="mb-2">
              Consider adding medications at these optimal times:
            </p>
            <div className="flex flex-wrap gap-2">
              {generateSmartSuggestions().map((suggestion, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {suggestion}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Grid by Time of Day */}
      <div className="space-y-8">
        {Object.entries(groupedSchedules).map(([timeOfDay, schedules]) => (
          <div key={timeOfDay} className="bg-gray-50 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              {getTimeIcon(timeOfDay)}
              <h3 className="text-2xl font-bold text-gray-800 capitalize">
                {timeOfDay}
              </h3>
              <span className="text-gray-500">
                ({schedules.length} medications)
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`bg-white rounded-2xl p-5 border-2 transition-all duration-300 hover:shadow-lg ${
                      schedule.isActive
                        ? "border-green-200 hover:border-green-300"
                        : "border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl font-bold text-gray-800">
                        {schedule.time}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleScheduleActive(schedule.id)}
                          className={`p-2 rounded-xl transition-colors ${
                            schedule.isActive
                              ? "text-green-600 hover:bg-green-100"
                              : "text-gray-400 hover:bg-gray-100"
                          }`}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditSchedule(schedule)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="font-semibold text-gray-800">
                        {schedule.medicationName}
                      </div>
                      <div className="text-gray-600">{schedule.dosage}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Bell className="h-4 w-4" />
                        <span>{schedule.reminderMinutesBefore} min before</span>
                      </div>
                      {schedule.withFood && (
                        <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-lg text-sm font-medium inline-block">
                          Take with food
                        </div>
                      )}
                      {schedule.specialInstructions && (
                        <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded-lg">
                          {schedule.specialInstructions}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingSchedule ? "Edit Schedule" : "Add New Schedule"}
            </h3>

            <div className="space-y-6">
              {!editingSchedule && (
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Select Medication
                  </label>
                  <select
                    value={selectedMedication}
                    onChange={(e) => setSelectedMedication(e.target.value)}
                    className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Choose a medication...</option>
                    {medications.map((med) => (
                      <option key={med.id} value={med.id}>
                        {med.name} - {med.dosage}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) =>
                    setNewSchedule((prev) => ({
                      ...prev,
                      time: e.target.value,
                    }))
                  }
                  className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {frequencyOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        newSchedule.frequency === option.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-blue-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="frequency"
                        value={option.value}
                        checked={newSchedule.frequency === option.value}
                        onChange={(e) =>
                          setNewSchedule((prev) => ({
                            ...prev,
                            frequency: e.target.value as any,
                          }))
                        }
                        className="sr-only"
                      />
                      <option.icon className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Reminder (minutes before)
                </label>
                <select
                  value={newSchedule.reminderMinutesBefore}
                  onChange={(e) =>
                    setNewSchedule((prev) => ({
                      ...prev,
                      reminderMinutesBefore: parseInt(e.target.value),
                    }))
                  }
                  className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={newSchedule.withFood}
                    onChange={(e) =>
                      setNewSchedule((prev) => ({
                        ...prev,
                        withFood: e.target.checked,
                      }))
                    }
                    className="w-5 h-5"
                  />
                  <span className="text-lg font-medium text-gray-700">
                    Take with food
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={newSchedule.specialInstructions}
                  onChange={(e) =>
                    setNewSchedule((prev) => ({
                      ...prev,
                      specialInstructions: e.target.value,
                    }))
                  }
                  className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="e.g., Avoid dairy, take on empty stomach"
                />
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSchedule(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-xl text-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    editingSchedule ? handleUpdateSchedule : handleAddSchedule
                  }
                  disabled={!editingSchedule && !selectedMedication}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {editingSchedule ? "Update Schedule" : "Add Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
