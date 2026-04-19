import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, CalendarDays, ClipboardList, Clock, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '../../store/authStore'
import { useAttendance } from '../../hooks/useAttendance'
import { useBiometric } from '../../hooks/useBiometric'
import { ShieldAlert, Fingerprint, ChevronRight } from 'lucide-react'

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="text-center my-6">
      <h2 className="text-5xl font-bold text-white tracking-tight tabular-nums">
        {format(time, 'HH:mm:ss')}
      </h2>
      <p className="text-slate-400 font-medium mt-1">{format(time, 'EEEE, MMMM d, yyyy')}</p>
    </div>
  )
}

export default function StaffHome() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { lastLog, history } = useAttendance()
  const { isSupported, hasCredential } = useBiometric()
  const [showBioPrompt, setShowBioPrompt] = useState(false)
  
  const isCheckedIn = lastLog?.type === 'entry'

  useEffect(() => {
    if (user && isSupported()) {
      hasCredential(user.id).then(exists => {
        setShowBioPrompt(!exists)
      })
    }
  }, [user, isSupported, hasCredential])

  // Count checkins today based on history length (history is fetched for 60 days, so let's filter for today manually)
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayLogs = history.filter(log => log.timestamp.startsWith(todayStr))
  
  // Example rule assumption: max 2 entries allowed per day. We could fetch from useQuery(['rules']) if strictly needed on UI.
  const checksMade = todayLogs.length
  const maxChecks = 2 // Hardcoded for display fallback if not fetching rules

  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-950">
      {/* Header Greeting */}
      <div className="bg-slate-900 rounded-b-3xl border-b border-slate-800 p-6 pt-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-bl-full blur-2xl"></div>
        <h1 className="text-2xl font-bold text-white mb-1">
          Hello, {user?.full_name?.split(' ')[0] ?? 'Staff'} 👋
        </h1>
        <p className="text-slate-400 text-sm">Welcome back to work</p>
        
        <LiveClock />

        {/* Biometric Setup Prompt */}
        {showBioPrompt && (
          <button 
            onClick={() => navigate('/staff/profile')}
            className="w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4 text-left flex items-center gap-4 group transition-all hover:bg-amber-500/20"
          >
             <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
               <Fingerprint className="w-5 h-5" />
             </div>
             <div className="flex-1">
               <p className="text-sm font-bold text-amber-500">Enable Biometrics</p>
               <p className="text-xs text-slate-400 mt-0.5">Link your device for secure check-in</p>
             </div>
             <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
          </button>
        )}

        {/* Status Card */}
        <div className="glass rounded-2xl p-4 border border-slate-700/50 mt-4 flex items-center justify-between">
          <div>
             <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Current Status</p>
             <div className="flex items-center gap-2">
               <span className="relative flex h-2.5 w-2.5">
                 <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCheckedIn ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                 <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isCheckedIn ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
               </span>
               <span className="text-white font-semibold">{isCheckedIn ? 'Checked In' : 'Checked Out'}</span>
             </div>
          </div>
          <div className="text-right">
             <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Activity Today</p>
             <p className="text-white text-sm font-semibold">{checksMade} <span className="text-slate-500 font-normal">/ {maxChecks} uses</span></p>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6">
        {/* Massive Action Button */}
        <button
          onClick={() => navigate('/staff/check-in')}
          className="w-full relative group overflow-hidden rounded-[2rem] p-[2px] active:scale-[0.98] transition-transform"
        >
          <span className={`absolute inset-0 bg-gradient-to-r ${isCheckedIn ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-teal-500'} animate-pulse opacity-80 group-hover:opacity-100`}></span>
          <div className="relative bg-slate-900 rounded-[2rem] px-6 py-8 flex flex-col items-center justify-center gap-3 h-full w-full">
             <MapPin className={`w-10 h-10 ${isCheckedIn ? 'text-amber-400' : 'text-emerald-400'}`} />
             <span className="text-white text-xl font-bold tracking-tight">
                {isCheckedIn ? 'Mark Exit' : 'Mark Entry'}
             </span>
             <span className="text-slate-400 text-xs">Tap to open GPS Radar</span>
          </div>
        </button>

        {/* Quick Links */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => navigate('/staff/history')} className="glass rounded-xl p-4 flex flex-col items-start gap-3 border border-slate-700/50 hover:bg-slate-800 transition-colors text-left">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white text-sm font-medium">My Attendance</h4>
                  <p className="text-xs text-slate-500 mt-0.5 w-[80%]">View calendar grid</p>
                </div>
             </button>
             <button onClick={() => navigate('/staff/leave')} className="glass rounded-xl p-4 flex flex-col items-start gap-3 border border-slate-700/50 hover:bg-slate-800 transition-colors text-left">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white text-sm font-medium">Apply Leave</h4>
                  <p className="text-xs text-slate-500 mt-0.5 w-[80%]">Request time off</p>
                </div>
             </button>
             <button onClick={() => navigate('/staff/leave')} className="col-span-2 glass rounded-xl p-4 flex items-center justify-between border border-slate-700/50 hover:bg-slate-800 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium">My Balances</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Check unspent leave days</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
