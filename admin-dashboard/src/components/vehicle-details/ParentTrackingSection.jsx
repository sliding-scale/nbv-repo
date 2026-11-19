import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Badge from '../common/Badge'
import Toggle from '../common/Toggle'
import { useVehicles } from '../../store/VehiclesContext'
import { readMutationError } from '../../utils/errors'
import { vehicleTrackingLabel } from '../../utils/tracking'
import { Section } from './shared'

/** Van-level switch: whether parents of this van's riders may see it in the parent app. */
export default function ParentTrackingSection({ vehicle }) {
  const { setVehicleTracking } = useVehicles()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const status = vehicleTrackingLabel(vehicle.parentTracking)

  const onChange = async (enabled) => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await setVehicleTracking(vehicle.id, enabled)
    } catch (err) {
      setError(readMutationError(err).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section
      icon={vehicle.parentTracking.visible ? Eye : EyeOff}
      title="Parent tracking"
      aside={<Badge tone={status.tone}>{status.label}</Badge>}
    >
      <div className={saving ? 'pointer-events-none opacity-60' : ''}>
        <Toggle
          id={`vd-tracking-${vehicle.id}`}
          label="Allow parents to track this van"
          description={
            vehicle.parentTracking?.scheduleEnabled === false
              ? 'Parent tracking is turned off for the whole school in Settings. This switch still controls whether the van can be tracked when it is turned back on.'
              : vehicle.parentTracking?.scheduleOpen === false
                ? 'Tracking is off outside pickup and drop-off. This switch controls whether the van can be tracked during those hours.'
                : vehicle.parentTrackingEnabled
                  ? 'Parents of students on this van can see its live location during pickup and drop-off.'
                  : 'No parent can see this van’s location in the parent app.'
          }
          checked={vehicle.parentTrackingEnabled}
          onChange={onChange}
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </Section>
  )
}
