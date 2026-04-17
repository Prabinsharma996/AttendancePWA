import { useState } from 'react'
import { Calendar, Send, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useLeave } from '../../hooks/useLeave'
import { StatusBadge } from '../../components/StatusBadge'
import { Button } from '../../components/Button'

export default function StaffLeave() {
  const { types, myBalances, myRequests, submitLeave, isLoading } = useLeave()
  
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.leave_type_id) return
    
    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    setSubmitting(true)
    try {
      await submitLeave({
        leave_type_id: formData.leave_type_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_days: diffDays,
        reason: formData.reason,
      })
      setFormData({ leave_type_id: '', start_date: '', end_date: '', reason: '' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-950">
      
      <div className="bg-slate-900 border-b border-slate-800 p-6">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
           <Calendar className="w-5 h-5 text-emerald-400" /> Apply Leave
        </h1>
        
        {/* Balances Carousel */}
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
          {myBalances.map(bal => {
            const isLow = bal.pending_days <= 3
            return (
              <div key={bal.id} className={`snap-center glass min-w-[200px] rounded-2xl p-4 border border-slate-700/50 flex-shrink-0 relative overflow-hidden ${isLow ? 'bg-amber-500/5' : ''}`}>
                {isLow && <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-amber-400 m-3 animate-pulse"></div>}
                <p className="text-slate-400 text-xs mb-2 font-medium uppercase tracking-wider">{bal.leave_type?.name}</p>
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-bold tracking-tighter ${isLow ? 'text-amber-400' : 'text-white'}`}>{bal.pending_days}</span>
                  <span className="text-xs text-slate-500 mb-1.5 font-medium">/ {bal.total_days} days</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-4">
        {/* Apply Form */}
        <div className="glass rounded-2xl p-5 border border-slate-700/50 mb-8 box-shadow-glow">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Leave Type</label>
              <select
                required
                value={formData.leave_type_id} onChange={e => setFormData({ ...formData, leave_type_id: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-medium text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
              >
                <option value="" disabled>Select category...</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Start</label>
                <input type="date" required value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-3.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block pl-1">End</label>
                <input type="date" required min={formData.start_date} value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-3.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Reason</label>
              <textarea required placeholder="Brief explanation..." rows={2} value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-shadow" />
            </div>

            <Button type="submit" loading={submitting} size="lg" className="h-14 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" icon={!submitting && <Send className="w-4 h-4" />}>
              Submit Request
            </Button>
          </form>
        </div>

        {/* History */}
        <div>
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider pl-1">
            Recent Requests
          </h3>
          
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-slate-500 text-sm text-center py-4">Loading...</p>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-700/50 rounded-xl">
                <AlertCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No recent leave requests.</p>
              </div>
            ) : (
              myRequests.map(r => (
                <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 items-center">
                  <div className="w-12 h-12 flex-shrink-0 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700/50">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-bold text-white truncate">{r.leave_type?.name}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      {format(new Date(r.start_date), 'MMM d')} - {format(new Date(r.end_date), 'MMM d')}
                      <span className="mx-1.5 opacity-50">•</span>
                      {r.total_days} Day(s)
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
