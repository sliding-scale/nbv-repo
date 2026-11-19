import { Menu } from 'lucide-react'
import GlobalSearch from './GlobalSearch'
import NotificationBell from './NotificationBell'

const iconButton =
  'relative grid size-[38px] cursor-pointer place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'

export default function Topbar({ title, onMenuClick }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-7">
      <button className={`${iconButton} lg:hidden`} onClick={onMenuClick} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <GlobalSearch />
        <NotificationBell buttonClass={iconButton} />
      </div>
    </header>
  )
}
