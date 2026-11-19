import { NavLink } from 'react-router-dom'
import { Bus } from 'lucide-react'
import { navItems } from '../../config/navigation'
import UserMenu from './UserMenu'

export default function Sidebar({ open, onNavigate }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-62 flex-col bg-slate-900 text-slate-300 transition-transform duration-200 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center gap-3 px-5 pt-5 pb-6">
        <span className="grid size-9 place-items-center rounded-[10px] bg-blue-600 text-white">
          <Bus size={20} />
        </span>
        <div>
          <div className="text-[1.05rem] font-bold text-white">VanTrack</div>
          <div className="text-xs text-slate-500">Admin Console</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        {navItems.map(({ path, label, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <UserMenu />
    </aside>
  )
}
