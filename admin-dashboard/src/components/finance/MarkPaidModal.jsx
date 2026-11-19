import { useState } from 'react'
import Button from '../common/Button'
import FormField from '../common/FormField'
import Modal from '../common/Modal'
import { inputClass } from '../common/inputClass'
import { readMutationError } from '../../utils/errors'
import { formatFee, formatMonth } from '../../utils/finance'

const noteClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

export default function MarkPaidModal({ row, onClose, onConfirm }) {
  const [method, setMethod] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (method !== 'cash' && method !== 'online_transfer') {
      setError('Select how this fee was paid.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onConfirm({ id: row.id, paymentMethod: method, note: note.trim() })
      onClose()
    } catch (err) {
      setError(readMutationError(err).message)
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      size="sm"
      title={`Mark ${row.studentName} as paid`}
      description={`${formatMonth(row.year, row.month)} · ${formatFee(row.amount)}`}
      onClose={saving ? () => {} : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Mark paid'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Payment method" htmlFor="fee-method" required error={error}>
          <select
            id="fee-method"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value)
              setError(null)
            }}
            className={inputClass(Boolean(error))}
          >
            <option value="">Select a method</option>
            <option value="cash">Cash</option>
            <option value="online_transfer">Online Transfer</option>
          </select>
        </FormField>
        <FormField label="Note" htmlFor="fee-note" optional hint="For example, paid to the driver.">
          <textarea
            id="fee-note"
            value={note}
            maxLength={200}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            className={noteClass}
          />
        </FormField>
      </div>
    </Modal>
  )
}
