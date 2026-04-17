import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Phone, Eye, EyeOff, Fingerprint, AlertCircle, Loader2 } from 'lucide-react'
import supabase from '../../api/supabase'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', role: 'staff' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name, phone: form.phone, role: form.role },
        },
      })
      if (authError) throw authError
      navigate('/login', { state: { message: 'Account created! Please sign in.' } })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-2xl shadow-sky-500/30 mb-4">
            <Fingerprint className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-1">Join your team on Attendance Pro</p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl border border-slate-700/50">
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
              </div>
            )}

            {[
              { key: 'full_name', label: 'Full Name', icon: User, type: 'text', placeholder: 'John Doe' },
              { key: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'you@company.com' },
              { key: 'phone', label: 'Phone', icon: Phone, type: 'tel', placeholder: '+977 98XXXXXXXX' },
            ].map(({ key, label, icon: Icon, type, placeholder }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={type} required value={(form as any)[key]}
                    onChange={handle(key)} placeholder={placeholder}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>
            ))}

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPw ? 'text' : 'password'} required minLength={8}
                  value={form.password} onChange={handle('password')} placeholder="Min 8 characters"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Role</label>
              <select value={form.role} onChange={handle('role')}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all">
                <option value="staff">Staff</option>
                <option value="owner">Owner / Manager</option>
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 active:scale-[0.98] disabled:opacity-60 mt-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Account
            </button>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} className="text-sky-400 hover:text-sky-300 font-medium">Sign in</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
