import { useMemo, useState } from 'react'
import Button from '../common/Button'
import FormField from '../common/FormField'
import { inputClass } from '../common/inputClass'
import Modal from '../common/Modal'
import Toggle from '../common/Toggle'
import { readMutationError } from '../../utils/errors'
import { validatePhone } from '../../utils/parents'
import StudentPicker from './StudentPicker'

const EMPTY_FORM = {
  name: '',
  registrationNumber: '',
  model: '',
  driverName: '',
  driverPhone: '',
  studentIds: [],
  status: 'active',
  parentTrackingEnabled: true,
}

// Same comparison as the backend: upper-case, spaces removed.
const normalise = (value) => value.replace(/\s+/g, '').toUpperCase()

function validate(form, otherVehicles) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Enter a vehicle name or identifier.'

  const reg = normalise(form.registrationNumber)
  if (!reg) errors.registrationNumber = 'Enter the registration number.'
  else if (otherVehicles.some((v) => normalise(v.registrationNumber) === reg))
    errors.registrationNumber = 'Another vehicle already has this registration number.'

  const phoneError = validatePhone(form.driverPhone)
  if (phoneError) errors.driverPhone = phoneError

  return errors
}

/**
 * Add/edit form. `vehicle` is null when adding.
 * Render it with a `key` per vehicle so the form resets when switching between vehicles.
 */
export default function VehicleFormModal({ open, vehicle, vehicles, students, onSave, onClose }) {
  const isEdit = Boolean(vehicle)
  const [form, setForm] = useState(() =>
    vehicle
      ? {
          name: vehicle.name,
          registrationNumber: vehicle.registrationNumber,
          model: vehicle.model ?? '',
          driverName: vehicle.driverName ?? '',
          driverPhone: vehicle.driverPhone ?? '',
          studentIds: vehicle.studentIds,
          status: vehicle.status,
          parentTrackingEnabled: vehicle.parentTrackingEnabled,
        }
      : EMPTY_FORM,
  )
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const otherVehicles = useMemo(() => vehicles.filter((v) => v.id !== vehicle?.id), [vehicles, vehicle])
  const ownerByStudentId = useMemo(() => {
    const map = {}
    for (const v of vehicles) for (const id of v.studentIds) map[id] = v
    return map
  }, [vehicles])

  const set = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }
  const onInput = (field) => (e) => set(field)(e.target.value)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    const found = validate(form, otherVehicles)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      // Exactly the fields the backend's create/update mutations accept.
      await onSave({
        name: form.name.trim(),
        registrationNumber: form.registrationNumber.trim().toUpperCase(),
        model: form.model.trim(),
        driverName: form.driverName.trim(),
        driverPhone: form.driverPhone.trim(),
        studentIds: form.studentIds,
        status: form.status,
        parentTrackingEnabled: form.parentTrackingEnabled,
      })
    } catch (err) {
      const { field, message } = readMutationError(err)
      setErrors(field && field in EMPTY_FORM ? { [field]: message } : { form: message })
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${vehicle.name}` : 'Add vehicle'}
      description={isEdit ? 'Update this vehicle’s details and assignments.' : 'Register a new van in the fleet.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="vehicle-form" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add vehicle'}
          </Button>
        </>
      }
    >
      <form id="vehicle-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        {errors.form && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.form}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Vehicle name / identifier" htmlFor="name" required error={errors.name}>
            <input id="name" className={inputClass(errors.name)} placeholder="e.g. Van 13" value={form.name} onChange={onInput('name')} autoFocus />
          </FormField>
          <FormField label="Registration number" htmlFor="reg" required error={errors.registrationNumber} hint="Must match the plate on your Falcon-i account for live tracking.">
            <input id="reg" className={`${inputClass(errors.registrationNumber)} uppercase`} placeholder="e.g. LEA-1234" value={form.registrationNumber} onChange={onInput('registrationNumber')} />
          </FormField>
          <FormField label="Vehicle model" htmlFor="model" optional>
            <input id="model" className={inputClass()} placeholder="e.g. Toyota Hiace" value={form.model} onChange={onInput('model')} />
          </FormField>
          <FormField label="Driver name" htmlFor="driver" optional>
            <input id="driver" className={inputClass()} placeholder="e.g. Imran Khan" value={form.driverName} onChange={onInput('driverName')} />
          </FormField>
          <FormField label="Driver contact number" htmlFor="driver-phone" optional error={errors.driverPhone}>
            <input id="driver-phone" type="tel" className={inputClass(errors.driverPhone)} placeholder="e.g. +92 300 1234567" value={form.driverPhone} onChange={onInput('driverPhone')} />
          </FormField>
          <FormField label="Current status" htmlFor="status">
            <select id="status" className={inputClass()} value={form.status} onChange={onInput('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive (out of service)</option>
            </select>
          </FormField>
        </div>

        <FormField label="Assigned students" optional error={errors.studentIds}>
          <StudentPicker
            students={students}
            selectedIds={form.studentIds}
            onChange={set('studentIds')}
            ownerByStudentId={ownerByStudentId}
            currentVehicleId={vehicle?.id}
          />
        </FormField>

        <div className="rounded-lg border border-slate-200 p-4">
          <Toggle
            id="tracking"
            label="Parent tracking"
            description="Let parents of assigned students see this van’s live location."
            checked={form.parentTrackingEnabled}
            onChange={set('parentTrackingEnabled')}
          />
        </div>
      </form>
    </Modal>
  )
}
