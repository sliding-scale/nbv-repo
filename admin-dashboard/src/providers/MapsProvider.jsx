import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { APIProvider } from '@vis.gl/react-google-maps'
import { GOOGLE_MAPS_API_KEY, hasMapsKey } from '../config/maps'

const GoogleMapsStatus = createContext({ failed: false, reportFailure() {} })

/** True when Google Maps has no key or has already failed, so screens draw OpenStreetMap. */
export function useGoogleMapsFailed() {
  return useContext(GoogleMapsStatus).failed
}

export function useReportMapFailure() {
  return useContext(GoogleMapsStatus).reportFailure
}

// Loads the Google Maps JS API once for the whole app. A missing key or a load error
// switches every map to the OpenStreetMap backup.
export default function MapsProvider({ children }) {
  const [failed, setFailed] = useState(!hasMapsKey)
  const reportFailure = useMemo(() => () => setFailed(true), [])
  const value = useMemo(() => ({ failed, reportFailure }), [failed, reportFailure])

  useEffect(() => {
    if (!hasMapsKey) return undefined
    const previous = window.gm_authFailure
    window.gm_authFailure = () => {
      setFailed(true)
      previous?.()
    }
    return () => {
      window.gm_authFailure = previous
    }
  }, [])

  const tree = <GoogleMapsStatus.Provider value={value}>{children}</GoogleMapsStatus.Provider>
  if (!hasMapsKey || failed) return tree
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} onError={reportFailure}>
      {tree}
    </APIProvider>
  )
}
