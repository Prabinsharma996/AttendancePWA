import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, Clock } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { getLiveLogsToday } from '../../api/attendance'
import supabase from '../../api/supabase'

export default function LiveMonitorPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const { data: liveLogs = [] } = useQuery({ 
    queryKey: ['monitor_logs', user?.org_id], 
    queryFn: () => getLiveLogsToday(user!.org_id!),
    enabled: !!user?.org_id
  })

  useEffect(() => {
    if (!user?.org_id) return
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_logs', filter: `org_id=eq.${user.org_id}` },
        (payload) => {
          console.log('Realtime log received!', payload)
          queryClient.invalidateQueries({ queryKey: ['monitor_logs'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard_live'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.org_id, queryClient])

  // Get current "In Office" staff
  // A staff is in office if their LAST log today was an "entry"
  const staffStatusMap = new Map<string, any>()
  
  // Sort ascending so the last log wins out in the map
  const sortedLogs = [...liveLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  
  sortedLogs.forEach(log => {
    if (log.user_id) {
      staffStatusMap.set(log.user_id, log)
    }
  })

  // Convert map to array and filter out people whose last log was an 'exit'
  const inOfficeStaff = Array.from(staffStatusMap.values())
    .filter(log => log.type === 'entry')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
             <Activity className="w-6 h-6 text-emerald-400" />
             Live Attendance Monitor
          </h1>
          <p className="text-slate-400 text-sm">Real-time view of staff currently checked in to the office.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-slate-700">
           <span className="relative flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
           </span>
           <span className="text-sm font-medium text-slate-300">Live Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {inOfficeStaff.length === 0 ? (
          <div className="col-span-full glass p-10 flex flex-col items-center justify-center rounded-2xl border border-slate-700/50">
            <Clock className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-slate-400 font-medium text-lg">No staff currently in the office.</p>
          </div>
        ) : (
          inOfficeStaff.map(log => (
            <div key={log.id} className="glass rounded-xl p-5 border border-slate-700/50 flex flex-col gap-3 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-50"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                 <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-lg border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    {log.user?.full_name.charAt(0).toUpperCase()}
                 </div>
                 <div>
                    <h3 className="font-semibold text-white">{log.user?.full_name}</h3>
                    <p className="text-xs text-slate-400">{log.user?.department || 'Staff'}</p>
                 </div>
              </div>

              <div className="mt-2 bg-slate-900/50 rounded-lg p-3 relative z-10 border border-slate-800">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-400">Entered At</span>
                    <span className="text-sm font-mono text-emerald-400 font-semibold shadow-emerald-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                 </div>
                 <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-medium text-slate-400">Location</span>
                    <span className="text-xs text-slate-300 truncate max-w-[120px]">{log.location?.name || 'Unknown'}</span>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
