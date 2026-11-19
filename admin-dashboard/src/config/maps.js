/** Google Maps key (VITE_GOOGLE_MAPS_API_KEY in .env.local). */
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''

/** Advanced markers need a Map ID. DEMO_MAP_ID works for development. */
export const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

/** Where maps open before any van or pin is known (Lahore). */
export const DEFAULT_MAP_CENTER = { lat: 31.5204, lng: 74.3587 }

/** Address search is limited to these countries. */
export const SEARCH_REGION_CODES = ['pk']

export const hasMapsKey = Boolean(GOOGLE_MAPS_API_KEY)

export const googleMapsLink = ({ lat, lng }) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
