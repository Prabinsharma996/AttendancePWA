import { useEffect, type ReactElement } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/Layout'
import { useAuthStore } from './store/authStore'
import supabase from './api/supabase'

// Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import StaffListPage from './pages/owner/StaffListPage'
import LocationPage from './pages/owner/LocationPage'
import RulesPage from './pages/owner/RulesPage'
import ReportsPage from './pages/owner/ReportsPage'
import LiveMonitorPage from './pages/owner/LiveMonitorPage'
import StaffHome from './pages/staff/StaffHome'
import StaffRadar from './pages/staff/StaffRadar'
import StaffHistory from './pages/staff/StaffHistory'
import StaffLeave from './pages/staff/StaffLeave'
import StaffProfile from './pages/staff/StaffProfile'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
})

// Route guard
const PrivateRoute = ({ children, role }: { children: ReactElement; role?: 'owner' | 'staff' }) => {
  const { session, user } = useAuthStore()
  if (!session) return <Navigate to="/login" replace />
  if (role && user && user.role !== role && user.role !== 'manager') {
    return <Navigate to={user.role === 'owner' ? '/owner' : '/staff'} replace />
  }
  return children
}

function App() {
  const { setSession, loadProfile } = useAuthStore()

  useEffect(() => {
    // Bootstrap auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile()
    })

    // Sync auth changes in real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile()
    })

    return () => subscription.unsubscribe()
  }, [setSession, loadProfile])

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Owner routes */}
          <Route path="/owner" element={<PrivateRoute role="owner"><Layout><OwnerDashboard /></Layout></PrivateRoute>} />
          <Route path="/owner/monitor" element={<PrivateRoute role="owner"><Layout><LiveMonitorPage /></Layout></PrivateRoute>} />
          <Route path="/owner/staff" element={<PrivateRoute role="owner"><Layout><StaffListPage /></Layout></PrivateRoute>} />
          <Route path="/owner/geofence" element={<PrivateRoute role="owner"><Layout><LocationPage /></Layout></PrivateRoute>} />
          <Route path="/owner/rules" element={<PrivateRoute role="owner"><Layout><RulesPage /></Layout></PrivateRoute>} />
          <Route path="/owner/reports" element={<PrivateRoute role="owner"><Layout><ReportsPage /></Layout></PrivateRoute>} />

          {/* Staff routes */}
          <Route path="/staff" element={<PrivateRoute role="staff"><Layout><StaffHome /></Layout></PrivateRoute>} />
          <Route path="/staff/check-in" element={<PrivateRoute role="staff"><Layout><StaffRadar /></Layout></PrivateRoute>} />
          <Route path="/staff/history" element={<PrivateRoute role="staff"><Layout><StaffHistory /></Layout></PrivateRoute>} />
          <Route path="/staff/leave" element={<PrivateRoute role="staff"><Layout><StaffLeave /></Layout></PrivateRoute>} />
          <Route path="/staff/profile" element={<PrivateRoute role="staff"><Layout><StaffProfile /></Layout></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  )
}

export default App
