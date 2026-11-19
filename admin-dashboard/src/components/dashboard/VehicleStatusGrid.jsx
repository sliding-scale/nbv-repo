import { useState } from 'react'
import Card from '../common/Card'
import CardLink from '../common/CardLink'
import EmptyState from '../common/EmptyState'
import VehicleStatusCard from './VehicleStatusCard'

const filters = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'moving', label: 'Moving', test: (v) => v.speed > 0 },
  { id: 'ignition_on', label: 'Ignition on', test: (v) => v.ignition === 'on' },
  { id: 'gps_issues', label: 'GPS stale / unavailable', test: (v) => v.gpsStatus !== 'online' },
  { id: 'tracking_off', label: 'Not visible to parents', test: (v) => !v.parentTracking.visible },
]

export default function VehicleStatusGrid({ vehicles, onSelectVehicle }) {
  const [filterId, setFilterId] = useState('all')
  const active = filters.find((f) => f.id === filterId)
  const visible = vehicles.filter(active.test)

  return (
    <Card
      title="Vehicle status"
      subtitle={`Showing ${visible.length} of ${vehicles.length} vehicles · click a van for its details`}
      action={<CardLink to="/vehicles">Manage vehicles</CardLink>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => {
          const count = vehicles.filter(f.test).length
          const selected = f.id === filterId
          return (
            <button
              key={f.id}
              onClick={() => setFilterId(f.id)}
              aria-pressed={selected}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium ${
                selected
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 tabular-nums ${selected ? 'text-blue-100' : 'text-slate-400'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState>
          {vehicles.length === 0 ? 'No vehicles yet. Add your vans in the Vehicles tab.' : 'No vehicles match this filter.'}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {visible.map((vehicle) => (
            <VehicleStatusCard key={vehicle.id} vehicle={vehicle} onSelect={onSelectVehicle} />
          ))}
        </div>
      )}
    </Card>
  )
}
