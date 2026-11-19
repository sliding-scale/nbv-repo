import { useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import Button from '../common/Button'
import FormField from '../common/FormField'
import Modal from '../common/Modal'
import { inputClass } from '../common/inputClass'
import { DEFAULT_MAP_CENTER, hasMapsKey } from '../../config/maps'
import { useGoogleMapsFailed } from '../../providers/MapsProvider'
import PinMap from './PinMap'
import PlaceSearch from './PlaceSearch'

const EMPTY = { label: '', address: '', lat: null, lng: null, placeId: null, notes: '' }

const hasCoords = (d) => Number.isFinite(d.lat) && Number.isFinite(d.lng)

/** Google Maps editor: search an address, then fine-tune by dragging the pin or clicking the map. */
function MapEditor({ draft, setDraft }) {
  const geocoding = useMapsLibrary('geocoding')
  const position = hasCoords(draft) ? { lat: draft.lat, lng: draft.lng } : null

  const movePin = async (latLng) => {
    setDraft((d) => ({ ...d, ...latLng, placeId: null }))
    if (!geocoding) return
    try {
      const { results } = await new geocoding.Geocoder().geocode({ location: latLng })
      if (results[0]) setDraft((d) => ({ ...d, address: results[0].formatted_address }))
    } catch {
      // Geocoding API not enabled or no result: keep the coordinates, admin can type the address.
    }
  }

  return (
    <div className="space-y-3">
      <PlaceSearch
        biasTo={DEFAULT_MAP_CENTER}
        onSelect={(place) =>
          setDraft((d) => ({
            ...d,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
            placeId: place.placeId,
            label: d.label || place.name,
          }))
        }
      />
      <PinMap position={position} onMove={movePin} className="h-72" />
      <p className="text-xs text-slate-500">
        {position
          ? `Pinned at ${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}. Drag the pin or click the map to adjust.`
          : 'Search for an address, or click the map to drop a pin.'}
      </p>
    </div>
  )
}

/** OpenStreetMap pin when Google search and geocoding are unavailable. The address is typed below. */
function BackupEditor({ draft, setDraft }) {
  const position = hasCoords(draft) ? { lat: draft.lat, lng: draft.lng } : null
  return (
    <div className="space-y-3">
      <PinMap
        position={position}
        onMove={(latLng) => setDraft((d) => ({ ...d, ...latLng, placeId: null }))}
        className="h-72"
      />
      <p className="text-xs text-slate-500">
        {position
          ? `Pinned at ${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}. Drag the pin or click the map to adjust, then type the address below.`
          : 'Click the map to drop a pin, then type the address below. Address search needs Google Maps.'}
      </p>
    </div>
  )
}

/**
 * Dialog for setting one location. `savedLocations` lets the admin reuse a location
 * already saved on another student (e.g. siblings sharing a home).
 */
export default function LocationPickerModal({ title, initial, savedLocations = [], onSave, onClose }) {
  const [draft, setDraft] = useState(initial ?? EMPTY)
  const [error, setError] = useState('')

  const update = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }))

  const handleSave = () => {
    if (!draft.address.trim()) return setError('Enter or search for an address.')
    if (!hasCoords(draft)) return setError('Place a pin on the map.')
    if (Math.abs(draft.lat) > 90 || Math.abs(draft.lng) > 180) return setError('Those coordinates are out of range.')
    onSave({ ...draft, label: draft.label.trim(), address: draft.address.trim(), notes: draft.notes.trim() })
  }

  const googleReady = hasMapsKey && !useGoogleMapsFailed()
  const Editor = googleReady ? MapEditor : BackupEditor

  return (
    <Modal
      open
      size="xl"
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save location</Button>
        </>
      }
    >
      <div className="space-y-4">
        {savedLocations.length > 0 && (
          <FormField label="Reuse a saved location" htmlFor="loc-saved" optional>
            <select
              id="loc-saved"
              className={inputClass()}
              value=""
              onChange={(e) => {
                const picked = savedLocations[Number(e.target.value)]
                if (picked) setDraft({ ...EMPTY, ...picked.location })
                setError('')
              }}
            >
              <option value="">Choose from {savedLocations.length} saved locations…</option>
              {savedLocations.map((s, i) => (
                <option key={i} value={i}>
                  {s.location.label ? `${s.location.label}: ` : ''}
                  {s.location.address} ({s.usedBy})
                </option>
              ))}
            </select>
          </FormField>
        )}

        <Editor draft={draft} setDraft={setDraft} />

        <FormField label="Address" htmlFor="loc-address" required hint="Filled from the search. You can add details such as a house number.">
          <input id="loc-address" className={inputClass(error && !draft.address.trim())} value={draft.address} onChange={update('address')} placeholder="House 12, Street 4, Model Town, Lahore" />
        </FormField>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Label" htmlFor="loc-label" optional>
            <input id="loc-label" className={inputClass()} value={draft.label} onChange={update('label')} placeholder="e.g. Home, Grandparents, Gate 2" />
          </FormField>
          <FormField label="Notes for the driver" htmlFor="loc-notes" optional>
            <input id="loc-notes" className={inputClass()} value={draft.notes} onChange={update('notes')} placeholder="e.g. Wait at the green gate" />
          </FormField>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
