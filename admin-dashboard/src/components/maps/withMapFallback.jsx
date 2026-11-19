import MapErrorBoundary from './MapErrorBoundary'
import { useGoogleMapsFailed, useReportMapFailure } from '../../providers/MapsProvider'

/** Google map first. OpenStreetMap when Google has no key, fails to load, or throws. */
export function withMapFallback(GoogleMap, OsmMap) {
  return function FallbackMap(props) {
    const failed = useGoogleMapsFailed()
    const reportFailure = useReportMapFailure()
    if (failed) return <OsmMap {...props} />
    return (
      <MapErrorBoundary onError={reportFailure} fallback={<OsmMap {...props} />}>
        <GoogleMap {...props} />
      </MapErrorBoundary>
    )
  }
}
