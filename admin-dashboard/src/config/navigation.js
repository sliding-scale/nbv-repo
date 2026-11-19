import {
  Bus,
  GraduationCap,
  LayoutDashboard,
  MapPinned,
  Navigation,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'

// Single source of truth for sidebar tabs and their routes.
export const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/vehicles', label: 'Vehicles', icon: Bus },
  { path: '/live-tracking', label: 'Live Tracking', icon: MapPinned },
  { path: '/trips', label: 'Trips', icon: Navigation },
  { path: '/students', label: 'Students', icon: GraduationCap },
  { path: '/parents', label: 'Parents', icon: Users },
  { path: '/finance', label: 'Finance', icon: Wallet },
  { path: '/settings', label: 'Settings', icon: Settings },
]
