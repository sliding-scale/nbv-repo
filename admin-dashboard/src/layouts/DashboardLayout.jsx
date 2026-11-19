import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import { navItems } from '../config/navigation'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const current = navItems.find((item) => item.path === pathname)

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-slate-900/45 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="min-w-0 lg:ml-62">
        <Topbar title={current?.label ?? 'Not found'} onMenuClick={() => setSidebarOpen(true)} />
        <main className="max-w-[1400px] p-4 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
