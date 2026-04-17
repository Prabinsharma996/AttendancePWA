import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Search, Download, Upload, Plus, MoreVertical, Edit2, UserX } from 'lucide-react'
import Papa from 'papaparse'
import { useAuthStore } from '../../store/authStore'
import { getAllStaff } from '../../api/attendance'
import { Button } from '../../components/Button'

export default function StaffListPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  
  const { data: staff = [], isLoading } = useQuery({ 
    queryKey: ['staff', user?.org_id], 
    queryFn: () => getAllStaff(user!.org_id!),
    enabled: !!user?.org_id
  })

  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('All')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        console.log('Parsed CSV', results.data)
        // Here you would send results.data to a Supabase Edge Function to invite users en masse
        alert(`Parsed ${results.data.length} rows. Backend integration required to securely send invites.`)
      }
    })
  }

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
    const matchesDept = filterDept === 'All' || s.department === filterDept
    return matchesSearch && matchesDept
  })

  const departments = ['All', ...new Set(staff.map(s => s.department).filter(Boolean) as string[])]

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Staff Management</h1>
          <p className="text-slate-400 text-sm">Manage your team, invite new members, and bulk import.</p>
        </div>
        
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleCSVUpload} accept=".csv" className="hidden" />
          <Button variant="secondary" icon={<Upload className="w-4 h-4" />} onClick={() => fileInputRef.current?.click()}>
            Import CSV
          </Button>
          <Button icon={<Plus className="w-4 h-4" />}>
            Invite Staff
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 flex flex-col md:flex-row gap-4 border border-slate-700/50">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
        <select 
          value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        >
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden border border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Role & Dept</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredStaff.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No staff found.</td></tr>
              ) : (
                filteredStaff.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sky-400">
                           {s.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{s.full_name}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <p className="text-white mb-0.5">{s.designation || 'Staff'}</p>
                      <p className="text-xs text-slate-400">{s.department || '-'}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"><UserX className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
