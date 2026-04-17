import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Settings, Save, Clock, Fingerprint, CalendarCheck } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { getAttendanceRules, saveAttendanceRules } from '../../api/attendance'
import { Button } from '../../components/Button'

export default function RulesPage() {
  const { user } = useAuthStore()
  
  const { data: dbRules, refetch } = useQuery({ 
    queryKey: ['rules', user?.org_id], 
    queryFn: () => getAttendanceRules(user!.org_id!),
    enabled: !!user?.org_id
  })

  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    max_entries_per_day: 2,
    work_start_time: '09:00',
    work_end_time: '18:00',
    grace_period_minutes: 15,
    overtime_threshold_minutes: 60,
    requires_biometric: true,
    weekend_days: [0, 6] // Sun, Sat
  })

  useEffect(() => {
    if (dbRules) {
      setFormData({
        max_entries_per_day: dbRules.max_entries_per_day,
        work_start_time: dbRules.work_start_time?.substring(0, 5) || '09:00',
        work_end_time: dbRules.work_end_time?.substring(0, 5) || '18:00',
        grace_period_minutes: dbRules.grace_period_minutes,
        overtime_threshold_minutes: dbRules.overtime_threshold_minutes,
        requires_biometric: dbRules.requires_biometric,
        weekend_days: dbRules.weekend_days
      })
    }
  }, [dbRules])

  const handleSave = async () => {
    if (!user?.org_id) return
    setSaving(true)
    try {
      await saveAttendanceRules(dbRules?.id, {
        ...formData,
        org_id: user.org_id
      })
      refetch()
    } finally {
      setSaving(false)
    }
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Attendance Rules & Policies</h1>
          <p className="text-slate-400 text-sm">Configure how attendance is tracked for your organization.</p>
        </div>
        <Button onClick={handleSave} loading={saving} icon={<Save className="w-4 h-4" />}>
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timing Configuration */}
        <div className="glass rounded-xl p-6 border border-slate-700/50 flex flex-col gap-5">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3">
            <Clock className="w-5 h-5 text-sky-400" />
            <h2 className="text-white font-semibold flex-1">Work Hours & Timings</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Start Time</label>
              <input type="time" value={formData.work_start_time} onChange={e => setFormData({...formData, work_start_time: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">End Time</label>
              <input type="time" value={formData.work_end_time} onChange={e => setFormData({...formData, work_end_time: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Grace Period (Minutes)</label>
            <p className="text-[10px] text-slate-500 mb-2">Minutes staff can be late before triggering an infraction.</p>
            <input type="number" value={formData.grace_period_minutes} onChange={e => setFormData({...formData, grace_period_minutes: +e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500" />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Overtime Threshold (Minutes)</label>
            <input type="number" value={formData.overtime_threshold_minutes} onChange={e => setFormData({...formData, overtime_threshold_minutes: +e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>

        {/* Security & Days */}
        <div className="glass rounded-xl p-6 border border-slate-700/50 flex flex-col gap-5">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3">
            <Fingerprint className="w-5 h-5 text-emerald-400" />
            <h2 className="text-white font-semibold flex-1">Security & Limits</h2>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div>
              <p className="text-sm font-medium text-white">Require Biometrics</p>
              <p className="text-xs text-slate-400">Enforce fingerprint/FaceID on check-in</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={formData.requires_biometric} onChange={e => setFormData({...formData, requires_biometric: e.target.checked})} />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Max Check-ins Per Day</label>
            <p className="text-[10px] text-slate-500 mb-2">Typically 2 (Entry + Exit)</p>
            <input type="number" value={formData.max_entries_per_day} onChange={e => setFormData({...formData, max_entries_per_day: +e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500" />
          </div>

          <div className="mt-2">
            <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
              <CalendarCheck className="w-4 h-4 text-amber-400" />
              <label className="text-sm text-white font-medium block">Weekend Configuration</label>
            </div>
            <div className="flex gap-2 flex-wrap mt-3">
              {daysOfWeek.map((day, dIdx) => (
                <button
                  key={day}
                  onClick={() => {
                    const newDays = formData.weekend_days.includes(dIdx) 
                      ? formData.weekend_days.filter(d => d !== dIdx)
                      : [...formData.weekend_days, dIdx]
                    setFormData({...formData, weekend_days: newDays})
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${formData.weekend_days.includes(dIdx) ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
