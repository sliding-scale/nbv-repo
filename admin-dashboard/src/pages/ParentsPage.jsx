import { useCallback, useMemo, useState } from 'react'
import { LoaderCircle, Plus, Search } from 'lucide-react'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import PageHeading from '../components/common/PageHeading'
import { inputClass } from '../components/common/inputClass'
import ParentFormModal from '../components/parents/ParentFormModal'
import ParentsTable from '../components/parents/ParentsTable'
import { PARENT_STATUS_ORDER, parentStatuses } from '../config/parentStatus'
import { useParents } from '../store/ParentsContext'
import { useStudents } from '../store/StudentsContext'
import { indexById } from '../utils/dashboard'
import { readMutationError } from '../utils/errors'
import { parentTrackingLive } from '../utils/tracking'

export default function ParentsPage() {
  const { parents, isLoading, trackingSchedule, addParent, updateParent, deactivateParent, reactivateParent } = useParents()
  const { students } = useStudents()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  // { parent: null } = adding, { parent } = editing, null = closed
  const [form, setForm] = useState(null)
  const [deactivating, setDeactivating] = useState(null)
  const [trackingFilter, setTrackingFilter] = useState('all')

  const studentsById = useMemo(() => indexById(students), [students])

  const counts = useMemo(() => {
    const c = { all: parents.length, invited: 0, active: 0, deactivated: 0 }
    for (const p of parents) c[p.status] += 1
    return c
  }, [parents])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return parents.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      const trackingOn = parentTrackingLive(p, trackingSchedule)
      if (trackingFilter !== 'all' && trackingOn !== (trackingFilter === 'on')) return false
      if (!q) return true
      const childNames = p.studentIds.map((id) => studentsById[id]?.fullName ?? '')
      return [p.fullName, p.email, p.phone, ...childNames].some((f) => f.toLowerCase().includes(q))
    })
  }, [parents, query, statusFilter, trackingFilter, trackingSchedule, studentsById])

  const closeForm = useCallback(() => setForm(null), [])

  // Errors are thrown back to the form, which shows them next to the right field.
  const handleSave = async (data) => {
    if (form.parent) await updateParent(form.parent.id, data)
    else await addParent(data)
    setForm(null)
  }

  const run = async (action) => {
    try {
      await action()
    } catch (err) {
      window.alert(readMutationError(err).message)
    }
  }

  const trackingHidden = parents.filter((p) => !parentTrackingLive(p, trackingSchedule)).length

  const tabs = [{ id: 'all', label: 'All' }, ...PARENT_STATUS_ORDER.map((id) => ({ id, label: parentStatuses[id].label }))]

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Parent management"
        description={`${counts.all} parents · ${counts.active} active · ${counts.invited} invited · ${counts.deactivated} deactivated`}
      >
        <Button icon={Plus} onClick={() => setForm({ parent: null })}>
          Add parent
        </Button>
      </PageHeading>

      <Card>
        <div className="-mx-5 -mt-4 -mb-5">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by account status">
              {tabs.map((t) => {
                const selected = statusFilter === t.id
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setStatusFilter(t.id)}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium ${
                      selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                    <span className={`ml-1.5 tabular-nums ${selected ? 'text-blue-100' : 'text-slate-400'}`}>{counts[t.id]}</span>
                  </button>
                )
              })}
            </div>
            <select
              value={trackingFilter}
              onChange={(e) => setTrackingFilter(e.target.value)}
              className={`${inputClass()} lg:ml-auto lg:w-48`}
              aria-label="Filter by parent tracking"
            >
              <option value="all">Tracking: all</option>
              <option value="on">Tracking visible</option>
              <option value="off">Tracking off ({trackingHidden})</option>
            </select>
            <label className="relative flex-1 lg:max-w-sm">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, phone or child…"
                className={`${inputClass()} pl-9`}
              />
            </label>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
              <LoaderCircle size={18} className="animate-spin" /> Loading parents…
            </div>
          ) : visible.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState>{parents.length === 0 ? 'No parents yet. Add the first one to get started.' : 'No parents match these filters.'}</EmptyState>
            </div>
          ) : (
            <ParentsTable
              parents={visible}
              studentsById={studentsById}
              schedule={trackingSchedule}
              onEdit={(parent) => setForm({ parent })}
              onDeactivate={(parent) => setDeactivating(parent)}
              onReactivate={(parent) => run(() => reactivateParent(parent.id))}
            />
          )}
        </div>
      </Card>

      {form && (
        <ParentFormModal
          key={form.parent?.id ?? 'new'}
          parent={form.parent}
          parents={parents}
          students={students}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      <ConfirmDialog
        open={Boolean(deactivating)}
        onCancel={() => setDeactivating(null)}
        onConfirm={() => {
          const parent = deactivating
          setDeactivating(null)
          run(() => deactivateParent(parent.id))
        }}
        danger
        title={`Deactivate ${deactivating?.fullName}?`}
        confirmLabel="Deactivate access"
        message="They will immediately lose access to the parent app and can no longer track any van. Their record and linked students are kept, and you can reactivate them at any time."
      />
    </div>
  )
}
