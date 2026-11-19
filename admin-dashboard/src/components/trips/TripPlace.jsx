import { ExternalLink } from 'lucide-react'
import { googleMapsLink } from '../../config/maps'

/** A trip's start/end point: address (or coordinates) with an "open in Google Maps" link. */
export default function TripPlace({ point }) {
  if (!point) return <span className="text-slate-400">—</span>
  const text = point.address || `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`
  return (
    <a
      href={googleMapsLink(point)}
      target="_blank"
      rel="noreferrer"
      title={`${text} (open in Google Maps)`}
      className="inline-flex max-w-48 items-center gap-1 text-slate-700 hover:text-blue-600 hover:underline"
    >
      <span className="truncate">{text}</span>
      <ExternalLink size={11} className="shrink-0" />
    </a>
  )
}
