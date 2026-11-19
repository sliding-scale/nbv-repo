import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@backend/_generated/api'
import Card from '../components/common/Card'
import PageHeading from '../components/common/PageHeading'
import Tabs from '../components/common/Tabs'
import ActiveTripsPanel from '../components/trips/ActiveTripsPanel'
import TripHistoryPanel from '../components/trips/TripHistoryPanel'
import VehicleDetailsModal from '../components/vehicle-details/VehicleDetailsModal'
import { useVehicles } from '../store/VehiclesContext'
import { indexById } from '../utils/dashboard'

const TABS = ['active', 'history']

export default function TripsPage() {
  // The tab lives in the URL (?tab=history) so it survives a refresh and can be linked to.
  const [params, setParams] = useSearchParams()
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'active'
  const setTab = (id) => setParams(id === 'active' ? {} : { tab: id }, { replace: true })

  const { vehicles } = useVehicles()
  const vehiclesById = useMemo(() => indexById(vehicles), [vehicles])
  const activeTrips = useQuery(api.admin.monitoring.activeTrips)
  const [selectedId, setSelectedId] = useState(null)
  const selected = vehiclesById[selectedId]

  return (
    <div className="flex flex-col gap-5">
      <PageHeading title="Trips" description="A trip runs from ignition on to ignition off. Trips with no ignition-off yet stay ongoing." />

      <Card>
        <div className="-mx-5 -mt-4 -mb-5">
          <div className="px-4 pt-2">
            <Tabs
              label="Trips"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'active', label: 'Active trips', count: activeTrips?.length },
                { id: 'history', label: 'Trip history' },
              ]}
            />
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === 'active' ? (
              <ActiveTripsPanel
                trips={activeTrips}
                vehiclesById={vehiclesById}
                onSelectVehicle={(v) => setSelectedId(v.id)}
              />
            ) : (
              <TripHistoryPanel vehicles={vehicles} vehiclesById={vehiclesById} />
            )}
          </div>
        </div>
      </Card>

      {selected && <VehicleDetailsModal vehicle={selected} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
