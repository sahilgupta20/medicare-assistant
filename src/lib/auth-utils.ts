import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Role hierarchy for permission checking
export const ROLE_HIERARCHY = {
  ADMIN: 5,
  DOCTOR: 4,
  CAREGIVER: 3,
  SENIOR: 2,
  FAMILY: 1,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

// if user has minimum required role
export function hasMinimumRole(
  userRole: string,
  requiredRole: UserRole
): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as UserRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

export async function getCurrentSession() {
  return await getServerSession(); //
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user || null;
}

export async function requireAuth() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return session.user;
}

export async function requireRole(minimumRole: UserRole) {
  const user = await requireAuth();

  if (!hasMinimumRole(user.role, minimumRole)) {
    redirect("/unauthorized");
  }

  return user;
}

// Check permissions
export const permissions = {
  // Medication management
  canCreateMedications: (userRole: string) =>
    hasMinimumRole(userRole, "SENIOR"),

  canEditMedications: (userRole: string) => hasMinimumRole(userRole, "SENIOR"),

  canDeleteMedications: (userRole: string) =>
    hasMinimumRole(userRole, "CAREGIVER"),

  canViewMedications: (userRole: string) => hasMinimumRole(userRole, "FAMILY"),

  // Family management
  canManageFamily: (userRole: string) => hasMinimumRole(userRole, "SENIOR"),

  canViewFamily: (userRole: string) => hasMinimumRole(userRole, "FAMILY"),

  // Reports and analytics
  canViewReports: (userRole: string) => hasMinimumRole(userRole, "FAMILY"),

  canViewDetailedReports: (userRole: string) =>
    hasMinimumRole(userRole, "SENIOR"),

  canExportReports: (userRole: string) => hasMinimumRole(userRole, "CAREGIVER"),

  // Admin functions
  canManageUsers: (userRole: string) => hasMinimumRole(userRole, "ADMIN"),

  canViewSystemSettings: (userRole: string) =>
    hasMinimumRole(userRole, "ADMIN"),

  // Emergency features
  canSendEmergencyAlerts: (userRole: string) =>
    hasMinimumRole(userRole, "FAMILY"),

  canManageEmergencyContacts: (userRole: string) =>
    hasMinimumRole(userRole, "SENIOR"),
};

// Role-based route permissions
export const routePermissions = {
  "/medications": ["ADMIN", "SENIOR", "CAREGIVER"],
  "/medications/add": ["ADMIN", "SENIOR", "CAREGIVER"],
  "/medications/edit": ["ADMIN", "SENIOR", "CAREGIVER"],
  "/family-setup": ["ADMIN", "SENIOR", "CAREGIVER"],
  "/family": ["ADMIN", "SENIOR", "CAREGIVER", "FAMILY"],
  "/reports": ["ADMIN", "DOCTOR", "SENIOR", "CAREGIVER", "FAMILY"],
  "/reports/detailed": ["ADMIN", "DOCTOR", "SENIOR", "CAREGIVER"],
  "/admin": ["ADMIN"],
  "/settings": ["ADMIN", "SENIOR", "CAREGIVER"],
};

// if user can access route
export function canAccessRoute(userRole: string, route: string): boolean {
  const allowedRoles = routePermissions[route as keyof typeof routePermissions];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
}

// Get user profile with extended information
export async function getUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

// Update user role (Admin only)
export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  adminUserId: string
) {
  try {
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (adminUser?.role !== "ADMIN") {
      throw new Error("Insufficient permissions to update user role");
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return updatedUser;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}

export async function deactivateUser(userId: string, adminUserId: string) {
  try {
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (adminUser?.role !== "ADMIN") {
      throw new Error("Insufficient permissions to deactivate user");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return updatedUser;
  } catch (error) {
    console.error("Error deactivating user:", error);
    throw error;
  }
}

// Create audit log entry
export async function createAuditLog(
  action: string,
  userId: string,
  details?: any
) {
  try {
    console.log(`Audit Log: ${action} by user ${userId}`, details);
    // TODO: Implement actual audit log storage
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
}

export const roleDisplayNames = {
  ADMIN: "Administrator",
  DOCTOR: "Healthcare Provider",
  CAREGIVER: "Professional Caregiver",
  SENIOR: "Senior Patient",
  FAMILY: "Family Member",
};

export const roleDescriptions = {
  ADMIN: "Full system access and user management",
  DOCTOR: "Access to medical reports and patient data",
  CAREGIVER: "Professional care management and medication oversight",
  SENIOR: "Personal medication management and family coordination",
  FAMILY: "View medication status and receive notifications",
};

export const roleColors = {
  ADMIN: "bg-purple-100 text-purple-800",
  DOCTOR: "bg-blue-100 text-blue-800",
  CAREGIVER: "bg-green-100 text-green-800",
  SENIOR: "bg-orange-100 text-orange-800",
  FAMILY: "bg-gray-100 text-gray-800",
};
