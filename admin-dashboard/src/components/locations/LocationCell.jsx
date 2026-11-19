import { useState } from 'react'
import { MapPin, MapPinPlus, Pencil, X } from 'lucide-react'
import LocationPickerModal from './LocationPickerModal'

/**
 * Compact location control for lists (e.g. a student's stops): shows the saved place with
 * edit/remove, or a "Set" button. Opens the same Google Maps picker as LocationField.
 */
export default function LocationCell({ label, value, onChange, savedLocations, tone = 'blue' }) {
  const [editing, setEditing] = useState(false)
  const pin = tone === 'green' ? 'text-green-600' : 'text-blue-600'

  return (
    <>
      {value ? (
        <div className="group flex min-w-0 items-start gap-1.5">
          <MapPin size={14} className={`mt-0.5 shrink-0 ${pin}`} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-slate-900" title={value.address}>
              {value.label || value.address}
            </div>
            {value.label && <div className="truncate text-xs text-slate-500" title={value.address}>{value.address}</div>}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${label}`}
            className="grid size-6 shrink-0 cursor-pointer place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Remove ${label}`}
            className="grid size-6 shrink-0 cursor-pointer place-items-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-amber-300 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
        >
          <MapPinPlus size={13} /> Set {label.toLowerCase()}
        </button>
      )}

      {editing && (
        <LocationPickerModal
          title={value ? `Edit ${label.toLowerCase()}` : `Set ${label.toLowerCase()}`}
          initial={value}
          savedLocations={savedLocations}
          onClose={() => setEditing(false)}
          onSave={(location) => {
            onChange(location)
            setEditing(false)
          }}
        />
      )}
    </>
  )
}
