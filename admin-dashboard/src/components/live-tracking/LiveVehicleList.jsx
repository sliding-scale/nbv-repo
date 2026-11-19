import { useState } from 'react'
import { Info, LocateFixed, Search } from 'lucide-react'
import Badge from '../common/Badge'
import { gpsStatuses } from '../../config/gpsStatus'
import { timeAgo } from '../../utils/dashboard'
import { useSpeedLimit } from '../../hooks/useSpeedLimit'
import { hasPosition, isSpeeding, movementStateFor, movementStates } from '../../utils/liveTracking'
import { inputClass } from '../common/inputClass'

/**
 * Side list of active vans. Clicking a row locates it on the map; the info button opens its details.
 * Vans with no GPS fix yet are listed but can't be located.
 */
export default function LiveVehicleList({ vehicles, highlightedId, onLocate, onOpenDetails }) {
  const speedLimit = useSpeedLimit()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const visible = q
    ? vehicles.filter((v) =>
        [v.name, v.registrationNumber, v.driverName].some((field) => field?.toLowerCase().includes(q)),
      )
    : vehicles

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search van, registration, driver"
            aria-label="Search vehicles"
            className={`${inputClass(false)} pl-8`}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">
          {vehicles.length === 0 ? 'No active vehicles. Add or reactivate vans in the Vehicles tab.' : 'No vans match your search.'}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
          {visible.map((v) => {
            const located = hasPosition(v)
            const state = movementStates[movementStateFor(v)]
            const selected = v.id === highlightedId
            return (
              <li key={v.id} className={`flex items-stretch ${selected ? 'bg-blue-50' : ''}`}>
                <button
                  type="button"
                  onClick={() => (located ? onLocate(v) : onOpenDetails(v))}
                  className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50"
                  title={located ? 'Show on map' : 'No location yet, open details'}
                >
                  <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${located ? state.dot : 'bg-slate-200'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{v.name}</span>
                      <span
                        className={`shrink-0 text-xs tabular-nums ${isSpeeding(v, speedLimit) ? 'font-semibold text-red-600' : 'text-slate-500'}`}
                      >
                        {v.speed} km/h
                      </span>
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {v.registrationNumber}
                      {v.driverName && ` · ${v.driverName}`}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      {located ? (
                        <>
                          <Badge tone={gpsStatuses[v.gpsStatus].tone}>{state.label}</Badge>
                          <span className="text-[0.7rem] text-slate-400">{timeAgo(v.lastUpdated)}</span>
                        </>
                      ) : (
                        <Badge tone="gray">No location yet</Badge>
                      )}
                    </span>
                  </span>
                  {located && <LocateFixed size={14} className="mt-1 shrink-0 text-slate-300" />}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDetails(v)}
                  aria-label={`Open details for ${v.name}`}
                  title="Vehicle details"
                  className="cursor-pointer border-l border-slate-100 px-2.5 text-slate-400 hover:bg-slate-50 hover:text-blue-600"
                >
                  <Info size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
