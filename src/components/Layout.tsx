import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarDays, MapPin, Settings,
  ClipboardList, Home, LogOut, Bell, FileText, Activity
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '../store/authStore'
import type { ReactNode } from 'react'

interface NavItem {
  to: string
  icon: ReactNode
  label: string
}

const OWNER_NAV: NavItem[] = [
  { to: '/owner', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { to: '/owner/monitor', icon: <Activity className="w-5 h-5" />, label: 'Monitor' },
  { to: '/owner/geofence', icon: <MapPin className="w-5 h-5" />, label: 'Locations' },
  { to: '/owner/staff', icon: <Users className="w-5 h-5" />, label: 'Staff' },
  { to: '/owner/rules', icon: <Settings className="w-5 h-5" />, label: 'Rules' },
  { to: '/owner/reports', icon: <FileText className="w-5 h-5" />, label: 'Reports' },
]

const STAFF_NAV: NavItem[] = [
  { to: '/staff', icon: <Home className="w-5 h-5" />, label: 'Home' },
  { to: '/staff/check-in', icon: <MapPin className="w-5 h-5" />, label: 'Check-In' },
  { to: '/staff/history', icon: <CalendarDays className="w-5 h-5" />, label: 'History' },
  { to: '/staff/leave', icon: <ClipboardList className="w-5 h-5" />, label: 'Leave' },
  { to: '/staff/profile', icon: <Settings className="w-5 h-5" />, label: 'Profile' },
]

interface Props {
  children: ReactNode
}

export const Layout = ({ children }: Props) => {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const isOwner = user?.role === 'owner'
  const nav = isOwner ? OWNER_NAV : STAFF_NAV

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (isOwner) {
    // Sidebar layout for owner on desktop
    return (
      <div className="flex h-screen bg-slate-950 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex flex-col bg-slate-900 border-r border-slate-800">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Attendance Pro</p>
                <p className="text-xs text-slate-400">Owner Portal</p>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-4 space-y-1 px-3">
            {nav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/owner'}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Profile + Logout */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
                {user?.full_name?.charAt(0) ?? 'O'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    )
  }

  // Bottom nav for staff (mobile-first)
  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      <nav className="fixed bottom-0 inset-x-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 z-50">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/staff'}
            className={({ isActive }) => clsx(
              'flex flex-col items-center gap-1 px-4 py-1 rounded-xl text-xs font-medium transition-all',
              isActive ? 'text-sky-400' : 'text-slate-500'
            )}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
