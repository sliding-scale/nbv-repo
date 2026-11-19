import { useMemo, useState } from 'react'
import PageHeading from '../components/common/PageHeading'
import SummaryCards from '../components/dashboard/SummaryCards'
import FleetOverview from '../components/dashboard/FleetOverview'
import ActiveTripsTable from '../components/dashboard/ActiveTripsTable'
import SpeedAlertHistory from '../components/dashboard/SpeedAlertHistory'
import VehicleStatusGrid from '../components/dashboard/VehicleStatusGrid'
import VehicleDetailsModal from '../components/vehicle-details/VehicleDetailsModal'
import { useQuery } from 'convex/react'
import { api } from '@backend/_generated/api'
import useNow from '../hooks/useNow'
import { useVehicles } from '../store/VehiclesContext'
import { formatToday, getDashboardSummary, getGpsBreakdown, indexById } from '../utils/dashboard'

const RECENT_ALERT_WINDOW_MS = 2 * 60 * 60_000

export default function DashboardPage() {
  const { vehicles } = useVehicles()

  // "Recent" = the last 2 hours. Rounded to the minute so the query isn't re-subscribed every render.
  const now = useNow(60_000)
  const alertsSince = Math.floor((now - RECENT_ALERT_WINDOW_MS) / 60_000) * 60_000
  const tripDocs = useQuery(api.admin.monitoring.activeTrips)
  const alertDocs = useQuery(api.admin.monitoring.recentSpeedAlerts, { since: alertsSince })

  const activeTrips = useMemo(
    () =>
      (tripDocs ?? []).map((t) => ({
        ...t,
        id: t._id,
      })),
    [tripDocs],
  )
  // Only the count is needed here; the full list is the paginated history card below.
  const speedAlerts = useMemo(() => alertDocs ?? [], [alertDocs])

  const summary = useMemo(() => getDashboardSummary(vehicles, activeTrips, speedAlerts), [vehicles, activeTrips, speedAlerts])
  const gpsCounts = useMemo(() => getGpsBreakdown(vehicles), [vehicles])
  const vehiclesById = useMemo(() => indexById(vehicles), [vehicles])
  const [selectedId, setSelectedId] = useState(null)
  const selected = vehiclesById[selectedId]

  return (
    <div className="flex flex-col gap-5">
      <PageHeading title="Dashboard summary" description={`Live snapshot of your fleet · ${formatToday()}`} />

      <SummaryCards summary={summary} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <ActiveTripsTable trips={activeTrips} vehiclesById={vehiclesById} />
        <FleetOverview summary={summary} gpsCounts={gpsCounts} />
      </div>

      <VehicleStatusGrid vehicles={vehicles} onSelectVehicle={(v) => setSelectedId(v.id)} />

      <SpeedAlertHistory vehicles={vehicles} vehiclesById={vehiclesById} />

      {selected && <VehicleDetailsModal vehicle={selected} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
