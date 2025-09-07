// src/app/family-setup/page.tsx - Family Member Registration
"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Phone, Mail, Users, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FamilyMember {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  role: 'primary' | 'secondary' | 'observer';
  timezone: string;
  notificationPreferences: {
    daily_summary: boolean;
    missed_medication: boolean;
    emergency_only: boolean;
    preferred_method: 'email' | 'sms' | 'both';
  };
}

export default function FamilySetupPage() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newMember, setNewMember] = useState<FamilyMember>({
    name: 'Ribhu gupta',
    relationship: 'Son',
    phone: '+91-8130870824',
    email: 'sahilhunkgupta@gmail.com',
    role: 'primary',
    timezone: 'Asia/Kolkata',
    notificationPreferences: {
      daily_summary: true,
      missed_medication: true,
      emergency_only: false,
      preferred_method: 'both'
    }
  });

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch('/api/family-members');
      if (response.ok) {
        const data = await response.json();
        setFamilyMembers(data);
      }
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });

      if (response.ok) {
        await fetchFamilyMembers();
        setShowAddForm(false);
        setNewMember({
          name: '',
          relationship: '',
          phone: '',
          email: '',
          role: 'secondary',
          timezone: 'Asia/Kolkata',
          notificationPreferences: {
            daily_summary: true,
            missed_medication: true,
            emergency_only: false,
            preferred_method: 'both'
          }
        });
      }
    } catch (error) {
      console.error('Error adding family member:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Remove this family member from notifications?')) return;

    try {
      const response = await fetch(`/api/family-members?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchFamilyMembers();
      }
    } catch (error) {
      console.error('Error deleting family member:', error);
    }
  };

  const testNotification = async (member: FamilyMember) => {
    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          message: 'Test notification from MediCare Assistant'
        })
      });

      if (response.ok) {
        alert(`Test notification sent to ${member.name}!`);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification');
    }
  };

  const relationshipOptions = [
    'Daughter', 'Son', 'Spouse', 'Sibling', 'Parent', 
    'Grandchild', 'Caregiver', 'Friend', 'Other'
  ];

  const timezoneOptions = [
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'America/New_York', label: 'New York (EST)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/medications" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </Link>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Family Setup</h1>
                <p className="text-gray-600">Add family members for medication alerts</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Family Member</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Existing Family Members */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Family Circle ({familyMembers.length} members)
          </h2>
          
          {familyMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No family members added yet</h3>
              <p className="text-gray-500 mb-4">Add family members to receive medication alerts and updates</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
              >
                Add First Family Member
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {familyMembers.map(member => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-gray-600">{member.relationship}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        member.role === 'primary' 
                          ? 'bg-blue-100 text-blue-800' 
                          : member.role === 'secondary'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role}
                      </span>
                      <button
                        onClick={() => handleDeleteMember(member.id!)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                    <div className="text-sm text-gray-500">
                      Timezone: {member.timezone}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Notifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {member.notificationPreferences.daily_summary && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Daily Summary</span>
                      )}
                      {member.notificationPreferences.missed_medication && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Missed Medication</span>
                      )}
                      {member.notificationPreferences.emergency_only && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Emergency Only</span>
                      )}
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {member.notificationPreferences.preferred_method}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => testNotification(member)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium"
                  >
                    Send Test Notification
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Family Member Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add Family Member</h2>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                  >
                    ×
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
                        onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., Priya Sharma"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship *
                      </label>
                      <select 
                        required
                        value={newMember.relationship}
                        onChange={(e) => setNewMember(prev => ({ ...prev, relationship: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select relationship</option>
                        {relationshipOptions.map(rel => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
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
                        onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="+91-9876543210"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input 
                        type="email" 
                        required
                        value={newMember.email}
                        onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="priya@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <select 
                        value={newMember.role}
                        onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value as any }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
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
                        onChange={(e) => setNewMember(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        {timezoneOptions.map(tz => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
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
                          checked={newMember.notificationPreferences.daily_summary}
                          onChange={(e) => setNewMember(prev => ({ 
                            ...prev, 
                            notificationPreferences: { 
                              ...prev.notificationPreferences, 
                              daily_summary: e.target.checked 
                            } 
                          }))}
                          className="w-4 h-4" 
                        />
                        <span>Daily medication summary</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input 
                          type="checkbox" 
                          checked={newMember.notificationPreferences.missed_medication}
                          onChange={(e) => setNewMember(prev => ({ 
                            ...prev, 
                            notificationPreferences: { 
                              ...prev.notificationPreferences, 
                              missed_medication: e.target.checked 
                            } 
                          }))}
                          className="w-4 h-4" 
                        />
                        <span>Missed medication alerts</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input 
                          type="checkbox" 
                          checked={newMember.notificationPreferences.emergency_only}
                          onChange={(e) => setNewMember(prev => ({ 
                            ...prev, 
                            notificationPreferences: { 
                              ...prev.notificationPreferences, 
                              emergency_only: e.target.checked 
                            } 
                          }))}
                          className="w-4 h-4" 
                        />
                        <span>Emergency situations only</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred notification method
                    </label>
                    <select 
                      value={newMember.notificationPreferences.preferred_method}
                      onChange={(e) => setNewMember(prev => ({ 
                        ...prev, 
                        notificationPreferences: { 
                          ...prev.notificationPreferences, 
                          preferred_method: e.target.value as any 
                        } 
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="both">Email + SMS</option>
                      <option value="email">Email only</option>
                      <option value="sms">SMS only</option>
                    </select>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowAddForm(false)}
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
                          Adding...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Add Family Member
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
  );
}