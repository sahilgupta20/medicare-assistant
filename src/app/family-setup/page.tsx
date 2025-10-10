"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Phone,
  Mail,
  Users,
  Save,
  ArrowLeft,
  Edit3,
  X,
  Bell,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

interface FamilyMember {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  role: "primary" | "secondary" | "observer";
  timezone: string;
  isEmergencyContact?: boolean;
  notificationPreferences: {
    daily_summary: boolean;
    missed_medication: boolean;
    emergency_only: boolean;
    preferred_method: "email" | "sms" | "both";
  };
}

export default function FamilySetupPage() {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [newMember, setNewMember] = useState<FamilyMember>({
    name: "",
    relationship: "",
    phone: "",
    email: "",
    role: "secondary",
    timezone: "Asia/Kolkata",
    isEmergencyContact: false,
    notificationPreferences: {
      daily_summary: true,
      missed_medication: true,
      emergency_only: false,
      preferred_method: "both",
    },
  });

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch("/api/family-members");
      if (response.ok) {
        const data = await response.json();
        setFamilyMembers(data);
      }
    } catch (error) {
      console.error("Error fetching family members:", error);
    } finally {
      setLoading(false);
    }
  };

  const familySetupPermissions = {
    canAddFamilyMembers: user?.role === "ADMIN" || user?.role === "SENIOR",
    canEditFamilyMembers: user?.role === "ADMIN" || user?.role === "SENIOR",
    canDeleteFamilyMembers: user?.role === "ADMIN",
    canViewFamilyMembers: true,

    canManageOwnFamily:
      user?.role === "ADMIN" ||
      user?.role === "SENIOR" ||
      user?.role === "CAREGIVER",
    canManageProfessionally:
      user?.role === "ADMIN" || user?.role === "CAREGIVER",
    isViewOnly: user?.role === "FAMILY" || user?.role === "DOCTOR",

    getHeaderText: () => {
      switch (user?.role) {
        case "ADMIN":
          return "Family Management";
        case "SENIOR":
          return "My Family Setup";
        case "CAREGIVER":
          return "Family Overview";
        case "FAMILY":
          return "Family Information";
        case "DOCTOR":
          return "Patient Family";
        default:
          return "Family Setup";
      }
    },
    getHeaderDescription: () => {
      switch (user?.role) {
        case "ADMIN":
          return "Manage family members for medication alerts";
        case "SENIOR":
          return "Manage your family members and care team";
        case "CAREGIVER":
          return "View family members and contact information";
        case "FAMILY":
          return "View family member information";
        case "DOCTOR":
          return "Patient's family and emergency contacts";
        default:
          return "Family member management";
      }
    },
  };
  const validateForm = (member: FamilyMember): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!member.name.trim()) errors.name = "Name is required";
    if (!member.relationship.trim())
      errors.relationship = "Relationship is required";
    if (!member.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^\+?[\d\s-()]+$/.test(member.phone))
      errors.phone = "Invalid phone number format";
    if (!member.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email))
      errors.email = "Invalid email format";

    return errors;
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add validation
    const errors = validateForm(newMember);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setSaving(true);

    try {
      const url = editingMember
        ? `/api/family-members?id=${editingMember.id}`
        : "/api/family-members";
      const method = editingMember ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });

      if (response.ok) {
        await fetchFamilyMembers();
        resetForm();
        alert(
          editingMember
            ? "Family member updated successfully!"
            : "Family member added successfully!"
        );
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to save family member"}`);
      }
    } catch (error) {
      console.error("Error saving family member:", error);
      alert("Failed to save family member");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!user || user.role !== "ADMIN") {
      alert("Only administrators can delete family members");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to remove this family member from notifications?"
      )
    )
      return;

    try {
      const response = await fetch(`/api/family-members?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchFamilyMembers();
        alert("Family member removed successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to delete family member"}`);
      }
    } catch (error) {
      console.error("Error deleting family member:", error);
      alert("Failed to delete family member");
    }
  };

  const handleEditMember = (member: FamilyMember) => {
    if (!user || (user.role !== "admin" && user.id !== member.id)) {
      alert("You can only edit your own profile");
      return;
    }

    setEditingMember(member);
    setNewMember({ ...member });
    setFormErrors({});
    setShowAddForm(true);
  };

  const resetForm = () => {
    setNewMember({
      name: "",
      relationship: "",
      phone: "",
      email: "",
      role: "secondary",
      timezone: "Asia/Kolkata",
      isEmergencyContact: false,
      notificationPreferences: {
        daily_summary: true,
        missed_medication: true,
        emergency_only: false,
        preferred_method: "both",
      },
    });
    setFormErrors({});
    setShowAddForm(false);
    setEditingMember(null);
  };

  const testNotification = async (member: FamilyMember) => {
    try {
      const response = await fetch("/api/test-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          message: "Test notification from MediCare Assistant",
        }),
      });

      if (response.ok) {
        alert(`Test notification sent to ${member.name}!`);
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      alert("Failed to send test notification");
    }
  };

  // Permission checks
  const canAddMembers = user?.role === "admin";
  const canDeleteMembers = user?.role === "admin";

  const relationshipOptions = [
    "Daughter",
    "Son",
    "Spouse",
    "Sibling",
    "Parent",
    "Grandchild",
    "Caregiver",
    "Friend",
    "Other",
  ];

  const timezoneOptions = [
    { value: "Asia/Kolkata", label: "India (IST)" },
    { value: "America/New_York", label: "New York (EST)" },
    { value: "America/Los_Angeles", label: "Los Angeles (PST)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Australia/Sydney", label: "Sydney (AEST)" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading family setup...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute
      allowUnauthenticated={true}
      requiredRoles={["ADMIN", "SENIOR", "CAREGIVER"]}
    >
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-lg border-b">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/medications"
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="h-6 w-6 text-gray-600" />
                </Link>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {familySetupPermissions.getHeaderText()}
                  </h1>
                  <p className="text-gray-600">
                    {familySetupPermissions.getHeaderDescription()}
                  </p>
                </div>
              </div>

              {familySetupPermissions.canAddFamilyMembers && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Family Member</span>
                </button>
              )}

              {!familySetupPermissions.canAddFamilyMembers && (
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                  Contact admin to add new members
                </div>
              )}
            </div>
          </div>
        </header>

        {/* {familySetupPermissions.isViewOnly && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>View-Only Access:</strong> You can view family members
                  but cannot make changes. Contact an administrator to modify
                  family settings.
                </p>
              </div>
            </div>
          </div>
        )} */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Existing Family Members */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Family Circle ({familyMembers.length} members)
            </h2>

            {familyMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No family members added yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Add family members to receive medication alerts and updates
                </p>
                {canAddMembers && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
                  >
                    Add First Family Member
                  </button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {member.name}
                        </h3>
                        <p className="text-gray-600">{member.relationship}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            member.role === "primary"
                              ? "bg-blue-100 text-blue-800"
                              : member.role === "secondary"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {member.role}
                        </span>
                        {member.isEmergencyContact && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            Emergency Contact
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{member.phone}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Bell className="h-4 w-4" />
                        <span className="text-sm">
                          Timezone: {member.timezone}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Notifications
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {member.notificationPreferences.daily_summary && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            Daily Summary
                          </span>
                        )}
                        {member.notificationPreferences.missed_medication && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            Missed Medication
                          </span>
                        )}
                        {member.notificationPreferences.emergency_only && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            Emergency Only
                          </span>
                        )}
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {member.notificationPreferences.preferred_method}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => testNotification(member)}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium"
                      >
                        Send Test Notification
                      </button>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditMember(member)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center space-x-1"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Edit</span>
                        </button>

                        {familySetupPermissions.canDeleteFamilyMembers && (
                          <button
                            onClick={() => handleDeleteMember(member.id!)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center space-x-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        )}
                        {familySetupPermissions.isViewOnly && (
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                            <div className="flex">
                              <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                  <strong>View-Only Access:</strong> You can
                                  view family members but cannot make changes.
                                  Contact an administrator to modify family
                                  settings.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add/Edit Family Member Form */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingMember
                        ? "Edit Family Member"
                        : "Add Family Member"}
                    </h2>
                    <button
                      onClick={resetForm}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>

                  <form onSubmit={handleAddMember} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newMember.name}
                          onChange={(e) =>
                            setNewMember((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className={`w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none bg-white text-gray-900 placeholder-gray-500 ${
                            formErrors.name
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="e.g., Ribhu Gupta"
                        />
                        {formErrors.name && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relationship *
                        </label>
                        <select
                          required
                          value={newMember.relationship}
                          onChange={(e) =>
                            setNewMember((prev) => ({
                              ...prev,
                              relationship: e.target.value,
                            }))
                          }
                          className={`w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none bg-white text-gray-900 ${
                            formErrors.relationship
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        >
                          <option value="">Select relationship</option>
                          {relationshipOptions.map((rel) => (
                            <option key={rel} value={rel}>
                              {rel}
                            </option>
                          ))}
                        </select>
                        {formErrors.relationship && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.relationship}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={newMember.phone}
                          onChange={(e) =>
                            setNewMember((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          className={`w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none ${
                            formErrors.phone
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="+91-9876543210"
                        />
                        {formErrors.phone && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={newMember.email}
                          onChange={(e) =>
                            setNewMember((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className={`w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none ${
                            formErrors.email
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="priya@email.com"
                        />
                        {formErrors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <select
                          value={newMember.role}
                          onChange={(e) =>
                            setNewMember((prev) => ({
                              ...prev,
                              role: e.target.value as any,
                            }))
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          // disabled={!canAddMembers}
                        >
                          <option value="primary">Primary Caregiver</option>
                          <option value="secondary">Secondary Contact</option>
                          <option value="observer">Observer Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={newMember.timezone}
                          onChange={(e) =>
                            setNewMember((prev) => ({
                              ...prev,
                              timezone: e.target.value,
                            }))
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        >
                          {timezoneOptions.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Notification Preferences
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={
                              newMember.notificationPreferences.daily_summary
                            }
                            onChange={(e) =>
                              setNewMember((prev) => ({
                                ...prev,
                                notificationPreferences: {
                                  ...prev.notificationPreferences,
                                  daily_summary: e.target.checked,
                                },
                              }))
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span
                            className="text-gray-700 font-medium"
                            style={{ color: "#374151" }}
                          >
                            Daily medication summary
                          </span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={
                              newMember.notificationPreferences
                                .missed_medication
                            }
                            onChange={(e) =>
                              setNewMember((prev) => ({
                                ...prev,
                                notificationPreferences: {
                                  ...prev.notificationPreferences,
                                  missed_medication: e.target.checked,
                                },
                              }))
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span
                            className="text-gray-700 font-medium"
                            style={{ color: "#374151" }}
                          >
                            Missed medication alerts
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred notification method
                      </label>
                      <select
                        value={
                          newMember.notificationPreferences.preferred_method
                        }
                        onChange={(e) =>
                          setNewMember((prev) => ({
                            ...prev,
                            notificationPreferences: {
                              ...prev.notificationPreferences,
                              preferred_method: e.target.value as any,
                            },
                          }))
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="both">Email + SMS</option>
                        <option value="email">Email only</option>
                        <option value="sms">SMS only</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="isEmergencyContact"
                        checked={newMember.isEmergencyContact || false}
                        onChange={(e) =>
                          setNewMember((prev) => ({
                            ...prev,
                            isEmergencyContact: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isEmergencyContact"
                        className="text-sm font-medium text-gray-700"
                      >
                        Emergency contact (receives urgent medication alerts)
                      </label>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {editingMember ? "Updating..." : "Adding..."}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {editingMember
                              ? "Update Family Member"
                              : "Add Family Member"}
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
    </ProtectedRoute>
  );
}
