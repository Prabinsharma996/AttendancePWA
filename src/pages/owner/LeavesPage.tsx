import { useState } from 'react'
import { Calendar, Filter, CheckCircle, XCircle, Plus, Trash2, Settings2 } from 'lucide-react'
import { format } from 'date-fns'
import { useLeave } from '../../hooks/useLeave'
import { StatusBadge } from '../../components/StatusBadge'
import { Button } from '../../components/Button'

export default function LeavesPage() {
  const { allRequests, reviewLeave, types, createType, deleteType, isLoading } = useLeave()
  const [activeTab, setActiveTab] = useState<'requests' | 'categories'>('requests')
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Category Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newType, setNewType] = useState({ name: '', max_days_per_year: 15, is_paid: true })

  const filteredRequests = allRequests.filter(r => filter === 'all' || r.status === filter)

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id)
    try {
      await reviewLeave({ id, status })
    } finally {
      setProcessingId(null)
    }
  }

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createType(newType)
      setIsModalOpen(false)
      setNewType({ name: '', max_days_per_year: 15, is_paid: true })
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Leave Management</h1>
          <p className="text-slate-400 text-sm">Review staff requests and manage leave categories.</p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
           <button 
             onClick={() => setActiveTab('requests')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'requests' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
           >
             Requests
           </button>
           <button 
             onClick={() => setActiveTab('categories')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'categories' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
           >
             Categories
           </button>
        </div>
      </div>

      {activeTab === 'requests' ? (
        <>
          <div className="flex gap-2 pb-2 overflow-x-auto">
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
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-sky-400" /> Leave Categories
            </h2>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
              Add New Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {types.map(t => (
              <div key={t.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative group">
                <button 
                  onClick={() => deleteType(t.id)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="mb-4">
                  <p className="text-white font-bold">{t.name}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">{t.is_paid ? 'Paid' : 'Unpaid'}</p>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-black text-sky-400">{t.max_days_per_year}</div>
                  <div className="text-xs text-slate-500 font-medium">days / yr</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
           <div className="w-full max-w-sm bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-white mb-6">New Leave Category</h3>
              <form onSubmit={handleCreateType} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category Name</label>
                  <input required type="text" placeholder="e.g. Sick Leave" value={newType.name} onChange={e => setNewType({...newType, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Max Days Per Year</label>
                  <input required type="number" value={newType.max_days_per_year} onChange={e => setNewType({...newType, max_days_per_year: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white" />
                </div>
                <div className="flex items-center gap-2 py-2">
                   <input type="checkbox" id="paid" checked={newType.is_paid} onChange={e => setNewType({...newType, is_paid: e.target.checked})} className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-sky-500" />
                   <label htmlFor="paid" className="text-sm text-slate-300">This is a Paid Leave</label>
                </div>
                <Button type="submit" className="mt-2">Create Category</Button>
              </form>
           </div>
        </div>
      )}
    </div>
  )
}
