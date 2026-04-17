import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isToday, isWeekend, parseISO, isSameDay
} from 'date-fns'
import { useAuthStore } from '../../store/authStore'
import { getAttendanceHistory } from '../../api/attendance'
import type { AttendanceLog } from '../../types'

export default function StaffHistory() {
  const { user } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const { data: logs = [], isLoading } = useQuery({ 
    // fetch larger window if paging months, but 60 days is enough for current/prev month typically
    queryKey: ['attendance', 'history', user?.id], 
    queryFn: () => getAttendanceHistory(user!.id, 90),
    enabled: !!user?.id
  })

  // Calendar calculations
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  
  // Pad beginning of month
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - startDate.getDay())
  
  // Pad end of month
  const endDate = new Date(monthEnd)
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  // Aggregate logs to calculate statuses per day
  // E.g. present if they have entry + exit. Late if entry > rules.start_time.
  // Since we don't fetch rules here, we assume Present if any valid entry exists.
  const logsByDate = logs.reduce((acc, log) => {
    const d = log.timestamp.split('T')[0]
    if (!acc[d]) acc[d] = []
    acc[d].push(log)
    return acc
  }, {} as Record<string, AttendanceLog[]>)

  const getDayColor = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd')
    const dayLogs = logsByDate[dStr]
    
    if (dayLogs && dayLogs.some(l => l.type === 'entry')) {
      // In reality we check rules for "late". We'll mock "yellow" vs "green" randomly or assume all green if valid.
      return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold'
    }
    
    if (isWeekend(date)) {
      return 'bg-slate-800/50 border-slate-700/50 text-slate-500' // Gray for weekends
    }

    // Default absent for past weekdays
    if (date < new Date() && !isToday(date)) return 'bg-red-500/10 border-red-500/20 text-red-400'
    
    return 'bg-slate-900 border-slate-800 text-slate-400' // Future/No data
  }

  // Summary Metrics (mock math for now)
  const daysPresent = Object.values(logsByDate).filter(logs => logs.some(l => l.type === 'entry')).length
  const totalLogs = logs.length // Simplistic hours logic

  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-950">
      
      {/* Header and Summary Blocks */}
      <div className="p-4 bg-slate-900 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-400" />
          My Attendance
        </h1>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-3 border border-slate-700/50">
             <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Days Present</p>
             <p className="text-xl font-bold text-white">{daysPresent}</p>
          </div>
          <div className="glass rounded-xl p-3 border border-slate-700/50">
             <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Total Hours (Est)</p>
             <p className="text-xl font-bold text-white">{totalLogs * 4}h</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1">
        
        {/* Calendar Nav */}
        <div className="flex items-center justify-between mb-4 px-2">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold">{format(currentDate, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-3 mb-4 text-[10px] font-medium text-slate-400 uppercase">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Present</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Absent</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-600"></div> Weekend</span>
        </div>

        {/* Calendar Grid */}
        <div className="glass rounded-2xl p-4 border border-slate-700/50">
          <div className="grid grid-cols-7 gap-y-4 mb-2 text-center text-xs font-semibold text-slate-500">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentDate)
              const colorClasses = getDayColor(day)
              const isSel = selectedDate && isSameDay(selectedDate, day)
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  disabled={!isCurrentMonth}
                  className={`
                    flex items-center justify-center h-10 w-full rounded-lg text-sm transition-all border
                    ${!isCurrentMonth && 'opacity-20 pointer-events-none'}
                    ${isSel ? 'ring-2 ring-sky-500 scale-110 !border-sky-500 z-10' : ''}
                    ${colorClasses}
                  `}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail View for Selected Day */}
        {selectedDate && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-white mb-3 bg-slate-800/50 py-2 px-4 rounded-lg border border-slate-700/50">
              Details for {format(selectedDate, 'MMM d, yyyy')}
            </h3>
            <div className="space-y-3">
              {logsByDate[format(selectedDate, 'yyyy-MM-dd')]?.map(log => (
                <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${log.type === 'entry' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {log.type}
                        </span>
                        <span className="text-white font-mono text-sm font-medium">
                          {format(new Date(log.timestamp), 'h:mm a')}
                        </span>
                    </div>
                    {log.is_valid ? 
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> : 
                      <XCircle className="w-4 h-4 text-red-500" />
                    }
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{log.location?.name || 'Local'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{log.distance_from_zone != null ? `${Math.round(log.distance_from_zone)}m away` : 'No GPS'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {!logsByDate[format(selectedDate, 'yyyy-MM-dd')] && (
                <p className="text-center text-slate-500 text-sm py-4 italic">No attendance records for this date.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
