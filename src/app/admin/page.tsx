"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield,
  Users,
  Activity,
  AlertTriangle,
  Settings,
  BarChart3,
  UserPlus,
  Trash2,
  Edit,
  Eye,
  X,
  Save,
} from "lucide-react";
import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SENIOR" | "FAMILY" | "CAREGIVER" | "DOCTOR";
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserManagement, setShowUserManagement] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "SENIOR" as const,
    status: "active" as const,
  });

  // Demo users for display
  const demoUsers: User[] = [
    {
      id: "1",
      name: "Admin User",
      email: "admin@medicare.com",
      role: "ADMIN",
      status: "active",
      lastLogin: "Just now",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Papa Singh",
      email: "senior@medicare.com",
      role: "SENIOR",
      status: "active",
      lastLogin: "2 hours ago",
      createdAt: "2024-02-01",
    },
    {
      id: "3",
      name: "Raj Singh",
      email: "family@medicare.com",
      role: "FAMILY",
      status: "active",
      lastLogin: "1 day ago",
      createdAt: "2024-02-01",
    },
    {
      id: "4",
      name: "Nurse Johnson",
      email: "caregiver@medicare.com",
      role: "CAREGIVER",
      status: "active",
      lastLogin: "3 hours ago",
      createdAt: "2024-01-20",
    },
    {
      id: "5",
      name: "Dr. Smith",
      email: "doctor@medicare.com",
      role: "DOCTOR",
      status: "inactive",
      lastLogin: "Never",
      createdAt: "2024-01-25",
    },
  ];

  useEffect(() => {
    // Simulate loading users
    setTimeout(() => {
      setUsers(demoUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const handleManageUsers = () => {
    setShowUserManagement(true);
  };

  const handleSystemReports = () => {
    alert(
      "System Reports: This would show detailed analytics and usage reports"
    );
  };

  const handleSystemSettings = () => {
    alert("System Settings: This would open system configuration options");
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setNewUser({ name: "", email: "", role: "SENIOR", status: "active" });
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === "1") {
      alert("Cannot delete the main admin user");
      return;
    }

    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((u) => u.id !== userId));
      alert("User deleted successfully");
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      // Update existing user
      setUsers(
        users.map((u) => (u.id === editingUser.id ? { ...u, ...newUser } : u))
      );
      alert("User updated successfully");
    } else {
      // Add new user
      const newUserData: User = {
        id: Date.now().toString(),
        ...newUser,
        lastLogin: "Never",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setUsers([...users, newUserData]);
      alert("User added successfully");
    }

    setShowUserModal(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "SENIOR":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "FAMILY":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "CAREGIVER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "DOCTOR":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-3xl shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-600 text-lg">
                    System management and user oversight
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-500">Welcome back,</div>
                <div className="text-xl font-bold text-gray-900">
                  {user?.name}
                </div>
                <div className="text-sm text-purple-600 font-medium">
                  System Administrator
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Admin Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {users.length}
                  </p>
                  <p className="text-sm text-gray-500">
                    {users.filter((u) => u.status === "active").length} active
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-2xl">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    System Health
                  </p>
                  <p className="text-3xl font-bold text-green-600">98%</p>
                  <p className="text-sm text-gray-500">
                    All systems operational
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-2xl">
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Alerts</p>
                  <p className="text-3xl font-bold text-red-600">3</p>
                  <p className="text-sm text-gray-500">Require attention</p>
                </div>
                <div className="bg-red-100 p-3 rounded-2xl">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Admin Actions
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={handleManageUsers}
                className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow cursor-pointer text-left hover:bg-blue-50"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Manage Users
                  </h3>
                </div>
                <p className="text-gray-600">
                  View, edit, and manage user accounts
                </p>
              </button>

              <button
                onClick={handleSystemReports}
                className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow cursor-pointer text-left hover:bg-green-50"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    System Reports
                  </h3>
                </div>
                <p className="text-gray-600">
                  View system analytics and reports
                </p>
              </button>

              <button
                onClick={handleSystemSettings}
                className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow cursor-pointer text-left hover:bg-purple-50"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-purple-100 p-2 rounded-xl">
                    <Settings className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    System Settings
                  </h3>
                </div>
                <p className="text-gray-600">Configure system preferences</p>
              </button>
            </div>
          </div>

          {/* User Management Section */}
          {showUserManagement && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  User Management
                </h2>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddUser}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add User</span>
                  </button>
                  <button
                    onClick={() => setShowUserManagement(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.lastLogin}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={user.id === "1"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingUser ? "Edit User" : "Add New User"}
                  </h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSaveUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value as any })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="SENIOR">Senior</option>
                      <option value="FAMILY">Family Member</option>
                      <option value="CAREGIVER">Caregiver</option>
                      <option value="DOCTOR">Doctor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={newUser.status}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowUserModal(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{editingUser ? "Update" : "Add"} User</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
