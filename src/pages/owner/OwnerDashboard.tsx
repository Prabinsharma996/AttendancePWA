import { useQuery } from '@tanstack/react-query'
import { Users, UserCheck, UserX, Clock, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAuthStore } from '../../store/authStore'
import { getDashboardSummary, getWeeklyChartData, getLiveLogsToday } from '../../api/attendance'

export default function OwnerDashboard() {
  const { user, organization } = useAuthStore()
  
  const { data: stats } = useQuery({ 
    queryKey: ['dashboard_stats', user?.org_id], 
    queryFn: () => getDashboardSummary(user!.org_id!),
    enabled: !!user?.org_id
  })

  const { data: chartData } = useQuery({ 
    queryKey: ['dashboard_chart', user?.org_id], 
    queryFn: () => getWeeklyChartData(user!.org_id!),
    enabled: !!user?.org_id
  })

  const { data: liveLogs } = useQuery({
    queryKey: ['dashboard_live', user?.org_id],
    queryFn: () => getLiveLogsToday(user!.org_id!),
    refetchInterval: 10000, // Poll every 10s as a fallback to realtime
    enabled: !!user?.org_id
  })

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Welcome, {user?.full_name}</h1>
        <p className="text-slate-400 text-sm">Here's the attendance overview for {organization?.name || 'your organization'} today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: stats?.total_staff ?? '-', icon: Users, color: 'text-sky-400', bg: 'bg-sky-400/10' },
          { label: 'Present Today', value: stats?.present_today ?? '-', icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Absent', value: stats?.absent_today ?? '-', icon: UserX, color: 'text-red-400', bg: 'bg-red-400/10' },
          { label: 'On Leave', value: stats?.on_leave ?? '-', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
            <p className="text-sm text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 border border-slate-700/50 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6">Weekly Attendance</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '13px' }}
                />
                <Bar dataKey="Present" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {chartData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#38bdf8" />
                  ))}
                </Bar>
                <Bar dataKey="Absent" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Feed */}
        <div className="glass rounded-2xl p-6 border border-slate-700/50 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Feed
            </h2>
            <span className="text-xs font-mono text-slate-400">{liveLogs?.length ?? 0} logs today</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[300px]">
            {liveLogs?.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No activity yet today</p>
            ) : liveLogs?.slice(0, 8).map(log => (
              <div key={log.id} className="flex gap-4 items-start">
                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${log.type === 'entry' ? 'bg-emerald-400/10' : 'bg-amber-400/10'}`}>
                  {log.type === 'entry' ? <Clock className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{log.user?.full_name}</p>
                  <p className="text-xs text-slate-400">
                    {log.type === 'entry' ? 'Checked in' : 'Checked out'} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
