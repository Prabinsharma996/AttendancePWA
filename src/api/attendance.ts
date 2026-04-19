import supabase from './supabase'
import type { AttendanceLog, AttendanceRule, LeaveRequest, User } from '../types'

// ─── Attendance Logs (Entry/Exit) ─────────────────────────────────────────────

export const getLastLog = async (userId: string): Promise<AttendanceLog | null> => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export const getAttendanceHistory = async (userId: string, limit = 60): Promise<AttendanceLog[]> => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*, location:locations(*)')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export const logAttendance = async (logData: {
  user_id: string
  org_id: string
  location_id?: string
  type: 'entry' | 'exit'
  latitude?: number
  longitude?: number
  distance_from_zone?: number
  biometric_verified: boolean
  is_valid: boolean
  notes?: string
}) => {
  const { data, error } = await supabase
    .from('attendance_logs')
    .insert({ ...logData, timestamp: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export const getLiveLogsToday = async (orgId: string): Promise<AttendanceLog[]> => {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*, user:users(*), location:locations(*)')
    .eq('org_id', orgId)
    .gte('timestamp', `${today}T00:00:00`)
    .order('timestamp', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ─── Attendance Rules ────────────────────────────────────────────────────────

export const getAttendanceRules = async (orgId: string): Promise<AttendanceRule | null> => {
  const { data, error } = await supabase
    .from('attendance_rules')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle()
  if (error) throw error
  return data
}

export const saveAttendanceRules = async (ruleId: string | undefined, rules: Partial<AttendanceRule> & { org_id: string }) => {
  if (ruleId) {
    const { data, error } = await supabase.from('attendance_rules').update(rules).eq('id', ruleId).select().single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase.from('attendance_rules').insert(rules).select().single()
    if (error) throw error
    return data
  }
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────

export const getDashboardSummary = async (orgId: string) => {
  const today = new Date().toISOString().split('T')[0]

  const [staffRes, logsRes, leavesRes] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('org_id', orgId).in('role', ['staff', 'manager']),
    supabase.from('attendance_logs').select('user_id, type').eq('org_id', orgId).gte('timestamp', `${today}T00:00:00`),
    supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'approved').lte('start_date', today).gte('end_date', today)
  ])

  const total_staff = staffRes.count ?? 0
  const on_leave = leavesRes.count ?? 0

  // Count unique users who have an 'entry' today
  const presentUsers = new Set(logsRes.data?.filter(l => l.type === 'entry').map(l => l.user_id))
  const present_today = presentUsers.size
  const absent_today = total_staff - present_today - on_leave

  return { total_staff, present_today, absent_today, on_leave }
}

export const getWeeklyChartData = async (orgId: string) => {
  // Mock weekly data for chart since complex group-by requires Edge Function or Postgres Views
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map(d => ({
    name: d,
    Present: Math.floor(Math.random() * 20) + 10, // Mocked 10-30 present
    Absent: Math.floor(Math.random() * 5),
  }))
}

// ─── Staff APIs ────────────────────────────────────────────────────────
export const getAllStaff = async (orgId: string): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('org_id', orgId)
    .order('full_name')
  if (error) throw error
  return data ?? []
}

export const updateStaff = async (userId: string, updates: Partial<User>) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteStaff = async (userId: string) => {
  // We opt for a soft delete/deactivation to preserve attendance logs
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Locations APIs ────────────────────────────────────────────────────────
export const getLocations = async (orgId: string) => {
  const { data, error } = await supabase.from('locations').select('*').eq('org_id', orgId);
  if (error) throw error;
  return data ?? [];
}

export const saveLocation = async (locationId: string | undefined, locationData: { org_id: string, name: string, latitude: number, longitude: number, radius_meters: number }) => {
  if (locationId) {
    const { data, error } = await supabase.from('locations').update(locationData).eq('id', locationId).select().single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase.from('locations').insert(locationData).select().single()
    if (error) throw error
    return data
  }
}
