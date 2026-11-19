import { useState } from 'react'
import Button from '../common/Button'
import FormField from '../common/FormField'
import Modal from '../common/Modal'
import { inputClass } from '../common/inputClass'
import LocationField from '../locations/LocationField'
import ParentPicker from './ParentPicker'
import { readMutationError } from '../../utils/errors'
import { normaliseGsId } from '../../utils/students'

const EMPTY_FORM = {
  fullName: '',
  gsId: '',
  grade: '',
  monthlyFee: '',
  parentIds: [],
  vehicleId: '',
  pickupLocation: null,
  dropoffLocation: null,
  status: 'active',
}

function validate(form, students, editingId) {
  const errors = {}
  if (!form.fullName.trim()) errors.fullName = 'Enter the student’s full name.'
  const monthlyFee = Number(form.monthlyFee)
  if (!form.monthlyFee || !Number.isSafeInteger(monthlyFee) || monthlyFee < 1) {
    errors.monthlyFee = 'Enter a whole number greater than zero.'
  }
  const gsId = normaliseGsId(form.gsId)
  if (!gsId) errors.gsId = 'Enter the GS ID.'
  else {
    const clash = students.find((s) => s.id !== editingId && normaliseGsId(s.gsId) === gsId)
    if (clash) errors.gsId = `This GS ID already belongs to ${clash.fullName}.`
  }
  return errors
}

// Exactly the fields the backend's create/update mutations accept.
const toPayload = (form) => ({
  fullName: form.fullName.trim(),
  gsId: normaliseGsId(form.gsId),
  grade: form.grade.trim(),
  monthlyFee: Number(form.monthlyFee),
  parentIds: form.parentIds,
  vehicleId: form.vehicleId || null,
  pickupLocation: form.pickupLocation,
  dropoffLocation: form.dropoffLocation,
  status: form.status,
})

const SectionTitle = ({ children }) => (
  <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">{children}</h3>
)

/**
 * Add/edit form. `student` is null when adding.
 * Render with a `key` per student so the form resets when switching students.
 */
export default function StudentFormModal({ student, students, parents, vehicles, savedLocations, onSave, onClose }) {
  const isEdit = Boolean(student)
  const [form, setForm] = useState(() =>
    student
      ? {
          ...EMPTY_FORM,
          ...student,
          vehicleId: student.vehicleId ?? '',
          monthlyFee: student.monthlyFee == null ? '' : String(student.monthlyFee),
        }
      : EMPTY_FORM,
  )
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }
  const onInput = (field) => (e) => set(field, e.target.value)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    const found = validate(form, students, student?.id)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      await onSave(toPayload(form))
    } catch (err) {
      // The backend re-checks everything (e.g. a GS ID taken by another admin meanwhile).
      const { field, message } = readMutationError(err)
      setErrors(field && field in EMPTY_FORM ? { [field]: message } : { form: message })
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      size="xl"
      onClose={onClose}
      title={isEdit ? `Edit ${student.fullName}` : 'Add student'}
      description={isEdit ? `GS ID ${student.gsId}` : 'Create a student record and set up their transport.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="student-form" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add student'}
          </Button>
        </>
      }
    >
      <form id="student-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        {errors.form && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.form}</p>}
        <section className="space-y-4">
          <SectionTitle>Student details</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" htmlFor="st-name" required error={errors.fullName}>
              <input id="st-name" className={inputClass(errors.fullName)} value={form.fullName} onChange={onInput('fullName')} placeholder="e.g. Ayesha Khan" autoFocus />
            </FormField>
            <FormField label="GS ID number" htmlFor="st-gs" required error={errors.gsId} hint="Unique reference used to identify the student.">
              <input id="st-gs" className={`${inputClass(errors.gsId)} uppercase`} value={form.gsId} onChange={onInput('gsId')} placeholder="e.g. GS-24001" />
            </FormField>
            <FormField label="Grade / class" htmlFor="st-grade" optional>
              <input id="st-grade" className={inputClass()} value={form.grade} onChange={onInput('grade')} placeholder="e.g. Grade 4" />
            </FormField>
            <FormField
              label="Monthly fee"
              htmlFor="st-fee"
              required
              error={errors.monthlyFee}
              hint="Charged for this student each month. A paid month keeps the amount that was paid."
            >
              <input
                id="st-fee"
                inputMode="numeric"
                autoComplete="off"
                className={inputClass(errors.monthlyFee)}
                value={form.monthlyFee}
                onChange={(e) => set('monthlyFee', e.target.value.replace(/[^\d]/g, ''))}
                placeholder="8000"
              />
            </FormField>
            <FormField label="Status" htmlFor="st-status">
              <select id="st-status" className={inputClass()} value={form.status} onChange={onInput('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive (deactivated)</option>
              </select>
            </FormField>
          </div>
          <FormField label="Parents / guardians" optional hint="Associated parents can track this student’s van in the parent app.">
            <ParentPicker parents={parents} selectedIds={form.parentIds} onChange={(ids) => set('parentIds', ids)} />
          </FormField>
        </section>

        <section className="space-y-4">
          <SectionTitle>Transport</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Assigned vehicle" htmlFor="st-vehicle" optional>
              <select id="st-vehicle" className={inputClass()} value={form.vehicleId} onChange={onInput('vehicleId')}>
                <option value="">Not assigned</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · {v.registrationNumber}
                    {v.status === 'inactive' ? ' (inactive)' : ''}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <LocationField
              label="Pickup location"
              value={form.pickupLocation}
              onChange={(loc) => set('pickupLocation', loc)}
              savedLocations={savedLocations}
            />
            <LocationField
              label="Drop-off location"
              tone="green"
              value={form.dropoffLocation}
              onChange={(loc) => set('dropoffLocation', loc)}
              savedLocations={savedLocations}
            />
          </div>
        </section>
      </form>
    </Modal>
  )
}
