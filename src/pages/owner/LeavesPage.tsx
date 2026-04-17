import { useState } from 'react'
import { Calendar, Filter, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useLeave } from '../../hooks/useLeave'
import { StatusBadge } from '../../components/StatusBadge'
import { Button } from '../../components/Button'

export default function LeavesPage() {
  const { allRequests, reviewLeave, isLoading } = useLeave()
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const filteredRequests = allRequests.filter(r => filter === 'all' || r.status === filter)

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id)
    try {
      await reviewLeave({ id, status })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Leave Requests</h1>
          <p className="text-slate-400 text-sm">Review and manage staff time-off requests.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all ${
              filter === f ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="col-span-full text-center text-slate-500 py-10">Loading requests...</p>
        ) : filteredRequests.length === 0 ? (
          <p className="col-span-full text-center text-slate-500 py-10">No {filter !== 'all' ? filter : ''} requests found.</p>
        ) : (
          filteredRequests.map(request => (
            <div key={request.id} className="glass rounded-xl p-5 border border-slate-700/50 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-white">{request.user?.full_name}</h3>
                  <p className="text-xs text-slate-400">{request.leave_type?.name} • {request.total_days} day(s)</p>
                </div>
                <StatusBadge status={request.status} />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-300 mb-3 bg-slate-800/50 p-2 rounded-lg">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>{format(new Date(request.start_date), 'MMM d, yyyy')} - {format(new Date(request.end_date), 'MMM d, yyyy')}</span>
              </div>

              <p className="text-sm text-slate-400 flex-1 mb-4">"{request.reason}"</p>

              {request.status === 'pending' && (
                <div className="flex gap-2 mt-auto">
                  <Button
                    onClick={() => handleReview(request.id, 'rejected')}
                    disabled={!!processingId}
                    variant="danger"
                    className="flex-1"
                    size="sm"
                    icon={<XCircle className="w-4 h-4" />}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleReview(request.id, 'approved')}
                    disabled={!!processingId}
                    loading={processingId === request.id}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    size="sm"
                    icon={<CheckCircle className="w-4 h-4" />}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
