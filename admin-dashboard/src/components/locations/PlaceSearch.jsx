import { useEffect, useRef, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { LoaderCircle, MapPin, Search } from 'lucide-react'
import { inputClass } from '../common/inputClass'
import { SEARCH_REGION_CODES } from '../../config/maps'

const MIN_QUERY_LENGTH = 3

/**
 * Custom address search on top of Google Places Autocomplete (new Places API).
 * Calls onSelect({ name, address, lat, lng, placeId }) when the admin picks a result.
 */
export default function PlaceSearch({ onSelect, biasTo }) {
  const places = useMapsLibrary('places')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const sessionToken = useRef(null)
  // Results from an earlier, longer query aren't shown once the query gets too short.
  const shown = query.trim().length >= MIN_QUERY_LENGTH ? suggestions : []

  // Fetch suggestions as the admin types (debounced).
  useEffect(() => {
    const input = query.trim()
    if (!places || input.length < MIN_QUERY_LENGTH) return

    let stale = false
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        sessionToken.current ??= new places.AutocompleteSessionToken()
        const { suggestions: results } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: sessionToken.current,
          ...(SEARCH_REGION_CODES.length && { includedRegionCodes: SEARCH_REGION_CODES }),
          ...(biasTo && { locationBias: { center: biasTo, radius: 30000 } }),
        })
        if (!stale) setSuggestions(results.filter((s) => s.placePrediction))
      } catch (err) {
        console.error(err)
        if (!stale) setError('Address search failed. Check that the Places API is enabled for your key.')
      } finally {
        if (!stale) setLoading(false)
      }
    }, 250)

    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [query, places, biasTo])

  const choose = async (suggestion) => {
    try {
      const place = suggestion.placePrediction.toPlace()
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] })
      sessionToken.current = null // a selection ends the billing session
      setQuery('')
      setSuggestions([])
      onSelect({
        name: place.displayName ?? '',
        address: place.formattedAddress ?? suggestion.placePrediction.text.toString(),
        lat: place.location.lat(),
        lng: place.location.lng(),
        placeId: place.id,
      })
    } catch (err) {
      console.error(err)
      setError('Could not load that place. Try another result.')
    }
  }

  return (
    <div>
      <label className="relative block">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={places ? 'Search for an address or place…' : 'Loading Google Maps…'}
          disabled={!places}
          className={`${inputClass()} pr-9 pl-9`}
          autoFocus
        />
        {loading && (
          <LoaderCircle size={16} className="absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </label>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {shown.length > 0 && (
        <ul className="mt-1 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {shown.map((s) => {
            const p = s.placePrediction
            return (
              <li key={p.placeId}>
                <button
                  type="button"
                  onClick={() => choose(s)}
                  className="flex w-full cursor-pointer items-start gap-2.5 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-slate-900">{p.mainText?.toString() ?? p.text.toString()}</span>
                    {p.secondaryText && (
                      <span className="block truncate text-xs text-slate-500">{p.secondaryText.toString()}</span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
