import {
  Bus,
  CirclePower,
  CircleSlash,
  Eye,
  EyeOff,
  Gauge,
  Navigation,
  SatelliteDish,
  TriangleAlert,
} from 'lucide-react'
import StatCard from '../common/StatCard'
import { percent } from '../../utils/dashboard'

export default function SummaryCards({ summary }) {
  const total = summary.totalVehicles
  const ofFleet = (n) => `${percent(n, total)}% of fleet`

  const cards = [
    { label: 'Total registered vehicles', value: total, icon: Bus, tone: 'blue', hint: 'All vans in the system' },
    { label: 'Vehicles currently active', value: summary.activeVehicles, icon: CirclePower, tone: 'green', hint: ofFleet(summary.activeVehicles) },
    { label: 'Vehicles currently inactive', value: summary.inactiveVehicles, icon: CircleSlash, tone: 'gray', hint: ofFleet(summary.inactiveVehicles) },
    { label: 'Vehicles currently moving', value: summary.movingVehicles, icon: Gauge, tone: 'blue', hint: `${summary.activeVehicles - summary.movingVehicles} active but stationary` },
    { label: 'GPS connectivity issues', value: summary.gpsIssues, icon: SatelliteDish, tone: 'amber', hint: 'Stale or unavailable location' },
    { label: 'Parent tracking enabled', value: summary.trackingEnabled, icon: Eye, tone: 'green', hint: 'Visible to at least one parent' },
    { label: 'Parent tracking disabled', value: summary.trackingDisabled, icon: EyeOff, tone: 'gray', hint: 'Off for the van, or all its parents hidden' },
    { label: 'Active trips', value: summary.activeTrips, icon: Navigation, tone: 'violet', hint: 'Currently running' },
    { label: 'Recent speed alerts', value: summary.recentSpeedAlerts, icon: TriangleAlert, tone: 'red', hint: 'Last 2 hours' },
  ]

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}
