import { Route, Routes } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import DashboardPage from '../pages/DashboardPage'
import ComingSoonPage from '../pages/ComingSoonPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'
import FinancePage from '../pages/FinancePage'
import ParentsPage from '../pages/ParentsPage'
import SettingsPage from '../pages/SettingsPage'
import StudentsPage from '../pages/StudentsPage'
import LiveTrackingPage from '../pages/LiveTrackingPage'
import TripsPage from '../pages/TripsPage'
import VehiclesPage from '../pages/VehiclesPage'
import { navItems } from '../config/navigation'

// Sidebar paths that have a real page; the rest get a "coming soon" placeholder.
const BUILT_PAGES = ['/', '/vehicles', '/live-tracking', '/trips', '/students', '/parents', '/finance', '/settings']

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        {/* "/*" lets Clerk handle its own sub-steps, e.g. /login/factor-one */}
        <Route path="/login/*" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/live-tracking" element={<LiveTrackingPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/parents" element={<ParentsPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Other tabs are placeholders until their pages are built. */}
          {navItems
            .filter((item) => !BUILT_PAGES.includes(item.path))
            .map((item) => (
              <Route key={item.path} path={item.path} element={<ComingSoonPage title={item.label} />} />
            ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
