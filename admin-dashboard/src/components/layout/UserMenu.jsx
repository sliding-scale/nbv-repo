import { useEffect, useRef, useState } from 'react'
import { ChevronsUpDown, LogOut } from 'lucide-react'
import { useAdminAuth } from '../../auth/AuthContext'

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { user, signOut } = useAdminAuth()

  // Close when clicking outside or pressing Escape.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const email = user?.email ?? ''
  const name = user?.name || 'Admin'
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div ref={ref} className="relative border-t border-slate-800 p-3">
      {open && (
        <div
          role="menu"
          className="absolute inset-x-3 bottom-full mb-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-lg"
        >
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false)
              signOut()
            }}
            className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-red-400 hover:bg-slate-700"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-800 ${
          open ? 'bg-slate-800' : ''
        }`}
      >
        {user?.imageUrl ? (
          <img src={user.imageUrl} alt="" className="size-9 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-700 text-xs font-semibold text-white">
            {initials}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{name}</span>
          <span className="block truncate text-xs text-slate-500">{email || 'Administrator'}</span>
        </span>
        <ChevronsUpDown size={16} className="shrink-0 text-slate-500" />
      </button>
    </div>
  )
}
