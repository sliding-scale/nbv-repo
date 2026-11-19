import { useState } from 'react'
import { ExternalLink, MapPin, MapPinPlus, Pencil, Trash2 } from 'lucide-react'
import Button from '../common/Button'
import { googleMapsLink } from '../../config/maps'
import LocationPickerModal from './LocationPickerModal'

/**
 * Form control for a student's pickup or drop-off location.
 * Shows the saved location with Edit / Remove, or a button to set one.
 */
export default function LocationField({ label, value, onChange, savedLocations, tone = 'blue' }) {
  const [editing, setEditing] = useState(false)
  const iconTone = tone === 'green' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'

  return (
    <div>
      <div className="mb-1.5 text-sm font-medium text-slate-700">{label}</div>

      {value ? (
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
          <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${iconTone}`}>
            <MapPin size={18} />
          </span>
          <div className="min-w-0 flex-1">
            {value.label && <div className="text-sm font-semibold text-slate-900">{value.label}</div>}
            <div className="text-sm text-slate-700">{value.address}</div>
            {value.notes && <div className="mt-0.5 text-xs text-slate-500 italic">“{value.notes}”</div>}
            <a
              href={googleMapsLink(value)}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)} <ExternalLink size={11} />
            </a>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(true)} aria-label={`Edit ${label}`}>
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => onChange(null)} aria-label={`Remove ${label}`} className="hover:text-red-600">
              <span className="hidden sm:inline">Remove</span>
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-500 hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600"
        >
          <MapPinPlus size={18} /> Set {label.toLowerCase()}
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
    </div>
  )
}
