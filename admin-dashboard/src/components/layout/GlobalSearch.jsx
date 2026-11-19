import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useVehicles } from '../../store/VehiclesContext'

const LIMIT = 8

const matches = (vehicle, query) =>
  [vehicle.name, vehicle.registrationNumber, vehicle.model, vehicle.driverName, vehicle.driverPhone]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(query))

/** Top-bar search over vans and the drivers stored on them. */
export default function GlobalSearch() {
  const { vehicles } = useVehicles()
  const navigate = useNavigate()
  const rootRef = useRef(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const q = query.trim().toLowerCase()

  const matchesAll = useMemo(() => (q ? vehicles.filter((vehicle) => matches(vehicle, q)) : []), [vehicles, q])
  const shown = matchesAll.slice(0, LIMIT)
  const extra = matchesAll.length - shown.length

  useEffect(() => {
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [])

  const openVehicle = (vehicle) => {
    setQuery('')
    setOpen(false)
    navigate(`/vehicles?vehicle=${encodeURIComponent(vehicle.id)}`)
  }

  return (
    <div ref={rootRef} className="relative hidden md:block">
      <label className="flex h-[38px] w-64 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-400 focus-within:border-blue-400">
        <Search size={16} />
        <input
          type="search"
          value={query}
          placeholder="Search vehicles, drivers…"
          aria-label="Search vehicles and drivers"
          aria-expanded={open && Boolean(q)}
          aria-controls="global-vehicle-search"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
              event.currentTarget.blur()
            } else if (event.key === 'Enter' && shown[0]) {
              event.preventDefault()
              openVehicle(shown[0])
            }
          }}
        />
      </label>
      {open && q && (
        <div
          id="global-vehicle-search"
          role="listbox"
          className="absolute top-full right-0 z-20 mt-1 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {shown.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-500">No vehicles or drivers match.</p>
          ) : (
            <ul>
              {shown.map((vehicle) => (
                <li key={vehicle.id}>
                  <button
                    type="button"
                    role="option"
                    className="flex w-full cursor-pointer flex-col items-start px-3 py-2 text-left hover:bg-slate-50"
                    onClick={() => openVehicle(vehicle)}
                  >
                    <span className="text-sm font-medium text-slate-900">{vehicle.name}</span>
                    <span className="text-xs text-slate-500">
                      {vehicle.registrationNumber}
                      {vehicle.driverName ? ` · ${vehicle.driverName}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {extra > 0 && <p className="border-t border-slate-100 px-3 py-1.5 text-xs text-slate-400">{extra} more</p>}
        </div>
      )}
    </div>
  )
}
