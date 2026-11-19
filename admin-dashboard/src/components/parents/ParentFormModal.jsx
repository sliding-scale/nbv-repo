import { useState } from 'react'
import Button from '../common/Button'
import FormField from '../common/FormField'
import Modal from '../common/Modal'
import { inputClass } from '../common/inputClass'
import { PARENT_STATUS_ORDER, parentStatuses } from '../../config/parentStatus'
import { readMutationError } from '../../utils/errors'
import { normaliseEmail, validatePhone } from '../../utils/parents'
import LinkedStudentsPicker from './LinkedStudentsPicker'

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  relationship: '',
  status: 'invited',
  studentIds: [],
}

const RELATIONSHIPS = ['Mother', 'Father', 'Guardian', 'Grandparent', 'Sibling']

function validate(form, parents, editingId) {
  const errors = {}
  if (!form.fullName.trim()) errors.fullName = 'Enter the parent’s full name.'

  const email = normaliseEmail(form.email)
  if (!email) errors.email = 'Enter an email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.'
  else {
    const clash = parents.find((p) => p.id !== editingId && normaliseEmail(p.email) === email)
    if (clash) errors.email = `This email is already used by ${clash.fullName}.`
  }

  const phoneError = validatePhone(form.phone)
  if (phoneError) errors.phone = phoneError
  return errors
}

// Exactly the fields the backend's create/update mutations accept.
const toPayload = (form) => ({
  fullName: form.fullName.trim(),
  email: normaliseEmail(form.email),
  phone: form.phone.trim(),
  relationship: form.relationship.trim(),
  status: form.status,
  trackingEnabled: true,
  studentIds: form.studentIds,
})

/**
 * Add/edit form. `parent` is null when adding.
 * Render with a `key` per parent so the form resets when switching parents.
 */
export default function ParentFormModal({ parent, parents, students, onSave, onClose }) {
  const isEdit = Boolean(parent)
  const [form, setForm] = useState(() =>
    parent
      ? {
          fullName: parent.fullName,
          email: parent.email,
          phone: parent.phone,
          relationship: parent.relationship,
          status: parent.status,
          studentIds: parent.studentIds,
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
    const found = validate(form, parents, parent?.id)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      await onSave(toPayload(form))
    } catch (err) {
      const { field, message } = readMutationError(err)
      setErrors(field && field in EMPTY_FORM ? { [field]: message } : { form: message })
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={isEdit ? `Edit ${parent.fullName}` : 'Add parent'}
      description={isEdit ? parent.email : 'Create a parent account and link it to their children.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="parent-form" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add parent'}
          </Button>
        </>
      }
    >
      <form id="parent-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        {errors.form && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.form}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full name" htmlFor="pa-name" required error={errors.fullName}>
            <input id="pa-name" className={inputClass(errors.fullName)} value={form.fullName} onChange={onInput('fullName')} placeholder="e.g. Saima Khan" autoFocus />
          </FormField>
          <FormField label="Relationship" htmlFor="pa-rel" optional>
            <input id="pa-rel" list="pa-rel-options" className={inputClass()} value={form.relationship} onChange={onInput('relationship')} placeholder="e.g. Mother" />
            <datalist id="pa-rel-options">
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Email address" htmlFor="pa-email" required error={errors.email} hint="The parent signs in to the parent app with this email.">
            <input id="pa-email" type="email" className={inputClass(errors.email)} value={form.email} onChange={onInput('email')} placeholder="name@example.com" autoComplete="off" />
          </FormField>
          <FormField label="Contact number" htmlFor="pa-phone" optional error={errors.phone}>
            <input id="pa-phone" type="tel" className={inputClass(errors.phone)} value={form.phone} onChange={onInput('phone')} placeholder="+92 300 1234567" />
          </FormField>
        </div>

        <FormField label="Associated students" optional error={errors.studentIds} hint="The parent can track the vans of these students.">
          <LinkedStudentsPicker students={students} selectedIds={form.studentIds} onChange={(ids) => set('studentIds', ids)} />
        </FormField>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">Account status</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {PARENT_STATUS_ORDER.map((status) => {
              const info = parentStatuses[status]
              const checked = form.status === status
              return (
                <label
                  key={status}
                  className={`cursor-pointer rounded-lg border p-3 ${
                    checked ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <input type="radio" name="pa-status" value={status} checked={checked} onChange={() => set('status', status)} className="accent-blue-600" />
                    {info.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">{info.description}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
