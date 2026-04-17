import supabase from './supabase'
import type { LeaveType, LeaveRequest, LeaveBalance } from '../types'

export const getLeaveTypes = async (orgId: string): Promise<LeaveType[]> => {
  const { data, error } = await supabase.from('leave_types').select('*').eq('org_id', orgId)
  if (error) throw error
  return data ?? []
}

export const getMyLeaveBalances = async (userId: string, year: number): Promise<LeaveBalance[]> => {
  const { data, error } = await supabase.from('leave_balances').select('*, leave_type:leave_types(*)').eq('user_id', userId).eq('year', year)
  if (error) throw error
  return data ?? []
}

export const getMyLeaveRequests = async (userId: string): Promise<LeaveRequest[]> => {
  const { data, error } = await supabase.from('leave_requests').select('*, leave_type:leave_types(*)').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export const getAllLeaveRequestsByOrg = async (orgId: string): Promise<LeaveRequest[]> => {
  const { data, error } = await supabase.from('leave_requests').select('*, user:users(*), leave_type:leave_types(*)').eq('org_id', orgId).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export const submitLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'created_at' | 'status' | 'reviewed_by' | 'reviewed_at' | 'rejection_reason'>) => {
  const { data, error } = await supabase.from('leave_requests').insert({ ...request, status: 'pending' }).select().single()
  if (error) throw error
  return data
}

export const reviewLeaveRequest = async (id: string, status: 'approved' | 'rejected', reviewerId: string, rejectionReason?: string) => {
  const { data, error } = await supabase.from('leave_requests').update({ 
    status, 
    reviewed_by: reviewerId, 
    reviewed_at: new Date().toISOString(),
    rejection_reason: rejectionReason 
  }).eq('id', id).select().single()
  
  if (error) throw error
  return data
}
