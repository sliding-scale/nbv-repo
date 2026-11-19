import { useEffect, useRef, useState } from 'react'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { api } from '@backend/_generated/api'
import { Bell, CheckCheck, ExternalLink, LoaderCircle, Power, PowerOff } from 'lucide-react'
import { googleMapsLink } from '../../config/maps'
import { formatDateTime } from '../../utils/telemetry'
import { timeAgo } from '../../utils/dashboard'

const PAGE_SIZE = 15

/** One ignition ON/OFF event. */
function NotificationItem({ n }) {
  const on = n.state === 'on'
  return (
    <li className={`flex gap-3 px-4 py-3 ${n.unread ? 'bg-blue-50/50' : ''}`}>
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${on ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
        {on ? <Power size={15} /> : <PowerOff size={15} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-900">
          <span className="font-semibold">{n.vehicleName}</span>
          {n.registrationNumber && <span className="text-slate-500"> ({n.registrationNumber})</span>} ignition turned{' '}
          <span className={`font-semibold ${on ? 'text-green-700' : 'text-slate-700'}`}>{on ? 'ON' : 'OFF'}</span>
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
          <span title={formatDateTime(n.at)}>
            {formatDateTime(n.at)} · {timeAgo(n.at)}
          </span>
          {n.location && (
            <a
              href={googleMapsLink(n.location)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-blue-600 hover:underline"
            >
              {n.location.address ? 'Location' : 'View on map'} <ExternalLink size={10} />
            </a>
          )}
        </p>
        {n.location?.address && <p className="truncate text-xs text-slate-400">{n.location.address}</p>}
      </div>
      {n.unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-600" aria-label="Unread" />}
    </li>
  )
}

/** Top-bar bell: unread badge, and a dropdown of ignition ON/OFF notifications (live). */
export default function NotificationBell({ buttonClass }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const unread = useQuery(api.admin.notifications.unreadCount) ?? 0
  const markAllRead = useMutation(api.admin.notifications.markAllRead)
  const { results, status, loadMore } = usePaginatedQuery(api.admin.notifications.list, open ? {} : 'skip', {
    initialNumItems: PAGE_SIZE,
  })

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKeyDown = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={buttonClass}
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[0.65rem] leading-[18px] font-semibold text-white tabular-nums">
            {unread >= 100 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 flex max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
              <p className="text-xs text-slate-500">Vehicle ignition on / off</p>
            </div>
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => markAllRead()}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-default disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              <CheckCheck size={14} /> Mark all as read
            </button>
          </header>

          <div className="flex-1 overflow-y-auto">
            {status === 'LoadingFirstPage' ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
                <LoaderCircle size={16} className="animate-spin" /> Loading…
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                <Bell size={22} className="mx-auto mb-2 text-slate-300" />
                No notifications yet. You’ll see one here whenever a van’s ignition turns on or off.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {results.map((n) => (
                  <NotificationItem key={n._id} n={n} />
                ))}
              </ul>
            )}
          </div>

          {(status === 'CanLoadMore' || status === 'LoadingMore') && (
            <footer className="border-t border-slate-100 p-2">
              <button
                type="button"
                onClick={() => loadMore(PAGE_SIZE)}
                disabled={status === 'LoadingMore'}
                className="w-full cursor-pointer rounded-md py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:text-slate-400"
              >
                {status === 'LoadingMore' ? 'Loading…' : 'Show older notifications'}
              </button>
            </footer>
          )}
        </div>
      )}
    </div>
  )
}
