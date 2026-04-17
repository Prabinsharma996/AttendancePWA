export type Role = 'owner' | 'manager' | 'staff'
export type EmploymentType = 'full_time' | 'part_time' | 'contract'
export type AttendanceLogType = 'entry' | 'exit'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type HolidayType = 'national' | 'company'

export interface Organization {
  id: string
  name: string
  logo_url?: string
  owner_id: string
  created_at: string
}

export interface User {
  id: string
  org_id: string | null
  email: string
  full_name: string
  role: Role
  avatar_url?: string
  phone?: string
  department?: string
  designation?: string
  employment_type: EmploymentType
  join_date?: string
  is_active: boolean
  created_at: string
  org?: Organization // Relation
}

export interface Location {
  id: string
  org_id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
  is_active: boolean
  created_at: string
}

export interface AttendanceRule {
  id: string
  org_id: string
  max_entries_per_day: number
  work_start_time: string | null
  work_end_time: string | null
  grace_period_minutes: number
  overtime_threshold_minutes: number
  weekend_days: number[]
  requires_biometric: boolean
  created_at: string
}

export interface AttendanceLog {
  id: string
  user_id: string
  org_id: string
  location_id?: string
  type: AttendanceLogType
  timestamp: string
  latitude?: number
  longitude?: number
  distance_from_zone?: number
  biometric_verified: boolean
  device_info?: string
  is_valid: boolean
  notes?: string
  created_at: string
  user?: User // Relation
  location?: Location // Relation
}

export interface LeaveType {
  id: string
  org_id: string
  name: string
  max_days_per_year: number
  is_paid: boolean
  carry_forward: boolean
  requires_approval: boolean
}

export interface LeaveBalance {
  id: string
  user_id: string
  leave_type_id: string
  year: number
  total_days: number
  used_days: number
  pending_days: number
  leave_type?: LeaveType // Relation
}

export interface LeaveRequest {
  id: string
  user_id: string
  org_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: LeaveStatus
  reviewed_by?: string
  reviewed_at?: string
  rejection_reason?: string
  created_at: string
  user?: User // Relation
  leave_type?: LeaveType // Relation
}

export interface Holiday {
  id: string
  org_id: string
  name: string
  date: string
  type: HolidayType
  is_recurring: boolean
}

export interface Notification {
  id: string
  user_id: string
  org_id: string
  title: string
  body: string
  type: string
  is_read: boolean
  created_at: string
}

export interface WebAuthnCredential {
  id: string
  user_id: string
  credential_id: string
  public_key: string
  sign_count: number
  device_name?: string
  created_at: string
}

// System states
export interface GeolocationState {
  lat: number | null
  lng: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}
