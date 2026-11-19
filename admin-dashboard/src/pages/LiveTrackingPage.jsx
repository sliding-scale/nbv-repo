import { useMemo, useState } from 'react'
import PageHeading from '../components/common/PageHeading'
import FleetMap from '../components/live-tracking/FleetMap'
import LiveVehicleList from '../components/live-tracking/LiveVehicleList'
import VehicleDetailsModal from '../components/vehicle-details/VehicleDetailsModal'
import useNow from '../hooks/useNow'
import { useVehicles } from '../store/VehiclesContext'
import { indexById } from '../utils/dashboard'
import { hasPosition, isActiveVehicle, movementStateFor } from '../utils/liveTracking'

/**
 * Live map of every in-service van. Positions update in real time from the vehicles
 * subscription; clicking a van (on the map or via the list's info button) opens its details.
 */
export default function LiveTrackingPage() {
  useNow(30_000) // keeps "x min ago" labels fresh
  const { vehicles } = useVehicles()
  const vehiclesById = useMemo(() => indexById(vehicles), [vehicles])
  const active = useMemo(() => vehicles.filter(isActiveVehicle), [vehicles])
  const onMap = useMemo(() => active.filter(hasPosition), [active])

  const [detailsId, setDetailsId] = useState(null)
  const [highlightedId, setHighlightedId] = useState(null)
  const [focus, setFocus] = useState(null) // { id, at } — a new object re-focuses even the same van
  const detailsVehicle = vehiclesById[detailsId]

  const moving = onMap.filter((v) => movementStateFor(v) === 'moving').length
  const unlocated = active.length - onMap.length

  const openDetails = (v) => {
    setHighlightedId(v.id)
    setDetailsId(v.id)
  }
  const locate = (v) => {
    setHighlightedId(v.id)
    setFocus({ id: v.id, at: Date.now() })
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Live tracking"
        description={[
          `${onMap.length} of ${active.length} active vans on the map`,
          `${moving} moving`,
          unlocated > 0 && `${unlocated} with no location yet`,
        ]
          .filter(Boolean)
          .join(' · ')}
      />

      <div className="grid gap-4 lg:h-[calc(100vh-12rem)] lg:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[60vh] min-h-[360px] lg:h-full">
          <FleetMap
            vehicles={onMap}
            vehiclesById={vehiclesById}
            highlightedId={highlightedId}
            focus={focus}
            onSelectVehicle={openDetails}
          />
        </div>
        <div className="h-[420px] lg:h-full">
          <LiveVehicleList
            vehicles={active}
            highlightedId={highlightedId}
            onLocate={locate}
            onOpenDetails={openDetails}
          />
        </div>
      </div>

      {detailsVehicle && <VehicleDetailsModal vehicle={detailsVehicle} onClose={() => setDetailsId(null)} />}
    </div>
  )
}
