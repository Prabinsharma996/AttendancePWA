import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Search, Download, Upload, Plus, Edit2, UserX, X, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { useAuthStore } from '../../store/authStore'
import { getAllStaff, updateStaff, deleteStaff } from '../../api/attendance'
import { adminAuthClient } from '../../api/adminAuthClient'
import { Button } from '../../components/Button'
import type { User } from '../../types'

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

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', password: '', department: '' })
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const [editingStaff, setEditingStaff] = useState<User | null>(null)
  const [updating, setUpdating] = useState(false)

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        alert(`Parsed ${results.data.length} rows. Mass import via admin client is recommended for production.`)
      }
    })
  }

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.org_id) return
    setInviteError(null)
    setInviting(true)

    try {
      const { error } = await adminAuthClient.auth.signUp({
        email: inviteForm.email,
        password: inviteForm.password,
        options: {
          data: {
            full_name: inviteForm.full_name,
            role: 'staff',
            department: inviteForm.department,
            org_id: user.org_id
          }
        }
      })

      if (error) throw error

      setInviteForm({ full_name: '', email: '', password: '', department: '' })
      setIsInviteModalOpen(false)
      qc.invalidateQueries({ queryKey: ['staff', user.org_id] })
      alert("Staff invited successfully! They will appear in the list once they confirm their email (or immediately if auto-confirm is enabled).")
    } catch (err: any) {
      setInviteError(err.message)
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStaff) return
    setUpdating(true)
    try {
      await updateStaff(editingStaff.id, {
        full_name: editingStaff.full_name,
        department: editingStaff.department,
        designation: editingStaff.designation,
        is_active: editingStaff.is_active
      })
      qc.invalidateQueries({ queryKey: ['staff', user?.org_id] })
      setEditingStaff(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleToggleStatus = async (staffMember: User) => {
    const action = staffMember.is_active ? 'deactivate' : 'activate'
    if (!confirm(`Are you sure you want to ${action} ${staffMember.full_name}?`)) return
    
    try {
      await updateStaff(staffMember.id, { is_active: !staffMember.is_active })
      qc.invalidateQueries({ queryKey: ['staff', user?.org_id] })
    } catch (err: any) {
      alert(err.message)
    }
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
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsInviteModalOpen(true)}>
            Add Staff
          </Button>
        </div>
      </div>

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
                        <button 
                          onClick={() => setEditingStaff(s)}
                          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(s)}
                          className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setIsInviteModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-4">Add New Staff</h2>
            <form onSubmit={handleInviteStaff} className="flex flex-col gap-4">
              {inviteError && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{inviteError}
                </div>
              )}
              
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Full Name</label>
                <input required type="text" value={inviteForm.full_name} onChange={e => setInviteForm({...inviteForm, full_name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Email</label>
                <input required type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Initial Password</label>
                <input required type="text" minLength={8} value={inviteForm.password} onChange={e => setInviteForm({...inviteForm, password: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Department (Optional)</label>
                <input type="text" value={inviteForm.department} onChange={e => setInviteForm({...inviteForm, department: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full" loading={inviting}>Create Staff Account</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setEditingStaff(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-4">Edit Staff Profile</h2>
            <form onSubmit={handleUpdateStaff} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Full Name</label>
                <input required type="text" value={editingStaff.full_name} onChange={e => setEditingStaff({...editingStaff, full_name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Department</label>
                <input type="text" value={editingStaff.department || ''} onChange={e => setEditingStaff({...editingStaff, department: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Designation</label>
                <input type="text" value={editingStaff.designation || ''} onChange={e => setEditingStaff({...editingStaff, designation: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="user-active"
                  checked={editingStaff.is_active} 
                  onChange={e => setEditingStaff({...editingStaff, is_active: e.target.checked})}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500/50" 
                />
                <label htmlFor="user-active" className="text-sm font-medium text-slate-300">Staff account is active</label>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full" loading={updating}>Update Profile</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
