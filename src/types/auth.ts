// src/types/auth.ts
export type UserRole = 'ADMIN' | 'DOCTOR' | 'CAREGIVER' | 'SENIOR' | 'FAMILY'

export type FamilyRole = 'PRIMARY' | 'SECONDARY' | 'OBSERVER' | 'EMERGENCY'

export type NotificationMethod = 'EMAIL' | 'SMS' | 'BOTH'

export type LogStatus = 'PENDING' | 'TAKEN' | 'MISSED' | 'SKIPPED'

export interface UserProfile {
  id: string
  userId: string
  role: UserRole
  isActive: boolean
  timezone: string
  phone?: string
  dateOfBirth?: Date
  address?: string
  emailNotifications: boolean
  smsNotifications: boolean
  emergencyContact?: string
  medicalConditions?: string
  createdAt: Date
  updatedAt: Date
}

export interface ExtendedUser {
  id: string
  email: string
  name?: string
  image?: string
  role: UserRole
  isActive: boolean
  timezone?: string
  phone?: string
  profile?: UserProfile
}

export interface AuthSession {
  user: ExtendedUser
  expires: string
}

export interface FamilyMember {
  id: string
  userId: string
  name: string
  email: string
  phone?: string
  relationship: string
  role: FamilyRole
  receiveDaily: boolean
  receiveMissed: boolean
  receiveEmergency: boolean
  preferredMethod: NotificationMethod
  timezone: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Medication {
  id: string
  userId: string
  name: string
  dosage: string
  frequency: string
  timeSlots: string[]
  instructions?: string
  sideEffects?: string
  prescribedBy?: string
  startDate: Date
  endDate?: Date
  isActive: boolean
  reminderEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MedicationLog {
  id: string
  userId: string
  medicationId: string
  scheduledTime: Date
  takenAt?: Date
  status: LogStatus
  notes?: string
  createdAt: Date
}

export interface EmergencyContact {
  id: string
  userId: string
  name: string
  phone: string
  relationship: string
  priority: number
  createdAt: Date
}

// Permission interfaces
export interface Permission {
  action: string
  resource: string
  conditions?: Record<string, any>
}

export interface RolePermissions {
  [key: string]: Permission[]
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface SignInFormData {
  email: string
  password: string
}

export interface SignUpFormData extends SignInFormData {
  name: string
  confirmPassword: string
  role?: UserRole
  timezone?: string
}

export interface UserProfileFormData {
  name?: string
  phone?: string
  timezone?: string
  dateOfBirth?: string
  address?: string
  emergencyContact?: string
  medicalConditions?: string
  emailNotifications?: boolean
  smsNotifications?: boolean
}

export interface PasswordChangeFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Utility types
export type RequiredUserRole = UserRole
export type OptionalUserRole = UserRole | undefined

export interface RouteProtection {
  requireAuth: boolean
  allowedRoles?: UserRole[]
  redirectTo?: string
}

// Error types
export interface AuthError {
  code: string
  message: string
  details?: any
}

export interface ValidationError {
  field: string
  message: string
}

// Event types for logging
export interface AuthEvent {
  type: 'SIGN_IN' | 'SIGN_OUT' | 'SIGN_UP' | 'PASSWORD_CHANGE' | 'ROLE_CHANGE' | 'ACCOUNT_DEACTIVATED'
  userId: string
  email: string
  timestamp: Date
  metadata?: Record<string, any>
}

// Middleware types
export interface AuthMiddlewareOptions {
  requireAuth?: boolean
  allowedRoles?: UserRole[]
  redirectTo?: string
  checkIsActive?: boolean
}

// Hook return types
export interface UseAuthReturn {
  user: ExtendedUser | null
  isLoading: boolean
  isAuthenticated: boolean
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  hasPermission: (action: string, resource?: string) => boolean
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfileFormData>) => Promise<void>
}